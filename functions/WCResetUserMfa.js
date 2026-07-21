/**
 * Lambda: WCResetUserMfa-prod
 *
 * Forces a user to re-register their authenticator app.
 *
 * Cognito's AdminSetUserMFAPreference only toggles the MFA *preference* — it
 * does not delete the underlying verified TOTP secret, and AWS exposes no
 * API to do that directly. In practice, a user whose software token was ever
 * verified keeps getting challenged with SOFTWARE_TOKEN_MFA even after their
 * preference is fully cleared (confirmed via AdminGetUser showing a null
 * UserMFASettingList while InitiateAuth still returned SOFTWARE_TOKEN_MFA).
 *
 * The only reliable fix is deleting and recreating the Cognito user, which
 * wipes all MFA state along with it. That necessarily also wipes their
 * password (Cognito never exposes password hashes to copy forward), so this
 * generates a new temporary-but-permanent password and returns it in the
 * response for the admin to relay to the user out-of-band.
 *
 * Input:  { username }  — staff email address
 * Output: { statusCode, message, newPassword }
 *
 * Steps:
 *   1. Look up the user's current cognito_username (sub) from staff_roster.
 *   2. AdminDeleteUser — removes the account and its stuck MFA state.
 *   3. AdminCreateUser — recreates it under the same email (Cognito assigns
 *      a new sub since the pool aliases email rather than using it as the
 *      technical username).
 *   4. AdminSetUserPassword (Permanent: true) — sets a real, immediately
 *      usable password, avoiding Cognito's forced-change-on-first-login flow
 *      (which this app's login screen doesn't currently handle).
 *   5. UPDATE staff_roster.cognito_username, password_hash and
 *      password_updated_on to match — same scrypt scheme as WCUpdateUser.js /
 *      WCUserPasswordUpdate.js, so the DB record stays consistent with the
 *      password now actually set in Cognito. Name, role, status, etc. on the
 *      row are otherwise untouched.
 *
 * Env vars required:
 *   USER_POOL_ID — Cognito User Pool ID (e.g. us-east-1_XXXXXXXX)
 *   AWS_REGION   — defaults to us-east-1 if not set
 */

const mysql  = require('mysql2/promise');
const crypto = require('crypto');
const conn   = require('/opt/config.json');
const {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Generates a password that satisfies this app's own policy (see
// ChangePassword.validatePasswordPolicy): 12+ chars, upper, lower, number,
// special. Built from a shuffled fixed-category pool rather than pure
// randomness so it always satisfies every category, not just probabilistically.
function generatePassword() {
  const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower   = 'abcdefghijkmnpqrstuvwxyz';
  const digits  = '23456789';
  const special = '!@#$%^&*';
  const all     = upper + lower + digits + special;

  const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];
  const required = [pick(upper), pick(upper), pick(lower), pick(lower), pick(digits), pick(digits), pick(special)];
  while (required.length < 12) required.push(pick(all));

  // Fisher-Yates shuffle so the required chars aren't always in the same slots
  for (let i = required.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [required[i], required[j]] = [required[j], required[i]];
  }
  return required.join('');
}

// Same scheme as WCUpdateUser.js / WCUserPasswordUpdate.js — scrypt with a
// random salt, stored as "scrypt:<salt-hex>:<key-hex>".
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(`scrypt:${salt}:${key.toString('hex')}`);
    });
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  // Support both proxy (body string) and non-proxy (direct object) API Gateway
  let body;
  try {
    if (typeof event.body === 'string')                    body = JSON.parse(event.body);
    else if (event.body && typeof event.body === 'object') body = event.body;
    else                                                   body = event;
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { username } = body;
  if (!username) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'username is required' }) };
  }

  let db;
  try {
    db = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname
    });

    // Resolve email → cognito_username (sub UUID) before calling Cognito
    const [[row]] = await db.execute(
      `SELECT id, cognito_username FROM staff_roster WHERE email = ? LIMIT 1`,
      [username]
    );

    if (!row || !row.cognito_username) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'User not found or no Cognito account' }) };
    }

    // 1. Remove the old account — this is what actually clears the stuck TOTP secret.
    await cognitoClient.send(new AdminDeleteUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username:   row.cognito_username,
    }));

    // 2. Recreate it under the same email. Username in the request is the
    // sign-in alias; Cognito assigns a fresh sub as the real Username.
    const newPassword = generatePassword();
    const created = await cognitoClient.send(new AdminCreateUserCommand({
      UserPoolId:      process.env.USER_POOL_ID,
      Username:        username,
      UserAttributes:  [
        { Name: 'email', Value: username },
        { Name: 'email_verified', Value: 'true' },
      ],
      MessageAction:   'SUPPRESS',
    }));
    const newCognitoUsername = created.User.Username;

    // 3. Set a real, permanent password — skips Cognito's forced-change-on-
    // first-login challenge, which this app's login screen doesn't handle.
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username:   newCognitoUsername,
      Password:   newPassword,
      Permanent:  true,
    }));

    // 4. Re-point the DB row at the new sub and keep password_hash in sync
    // with what was actually just set in Cognito.
    const passwordHash = await hashPassword(newPassword);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.execute(
      `UPDATE staff_roster SET cognito_username = ?, password_hash = ?, password_updated_on = ? WHERE id = ?`,
      [newCognitoUsername, passwordHash, now, row.id]
    );

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        message: 'Account recreated — authenticator app and password have both been reset.',
        newPassword,
      })
    };
  } catch (err) {
    console.error('WCResetUserMfa error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  } finally {
    if (db) await db.end();
  }
};
