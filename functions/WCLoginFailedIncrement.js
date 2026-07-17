/**
 * Lambda: WCLoginFailedIncrement-prod
 *
 * Called by Angular after every failed Cognito login attempt.
 * Upserts a row in USER_LOGIN_ATTEMPTS and permanently locks the account
 * once FAILED_ATTEMPTS reaches MAX_ATTEMPTS.
 *
 * Input:  { username }  — email address used at login
 * Output: { statusCode, is_locked, attempts, max_attempts }
 *
 * Lockout is PERMANENT — an admin must manually unlock via WCAdminUnLockedCognitoUser.
 * LOCKED_AT is stamped only once (on the transition to locked) using IF() in SQL.
 *
 * Env vars required: none (DB config from /opt/config.json)
 */

const mysql = require('mysql2/promise');
const conn  = require('/opt/config.json');

const MAX_ATTEMPTS = 5;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

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

    const [[existing]] = await db.execute(
      `SELECT ID, FAILED_ATTEMPTS, LOCKED FROM USER_LOGIN_ATTEMPTS WHERE USERNAME = ? LIMIT 1`,
      [username]
    );

    let newAttempts;
    let isLocked;

    if (existing) {
      newAttempts = existing.FAILED_ATTEMPTS + 1;
      // Once locked, stay locked — admin must unlock manually
      isLocked    = existing.LOCKED || (newAttempts >= MAX_ATTEMPTS ? 1 : 0);

      // LOCKED_AT uses IF() so it is only stamped on the first lock transition,
      // not overwritten on subsequent failed attempts against an already-locked account.
      await db.execute(
        `UPDATE USER_LOGIN_ATTEMPTS
            SET FAILED_ATTEMPTS = ?,
                LOCKED          = ?,
                LOCKED_AT       = IF(? = 1 AND LOCKED_AT IS NULL, NOW(), LOCKED_AT),
                LAST_FAILED_AT  = NOW(),
                UPDATED_AT      = NOW()
          WHERE USERNAME = ?`,
        [newAttempts, isLocked, isLocked, username]
      );
    } else {
      // First failed attempt for this user — INSERT a new row
      newAttempts = 1;
      isLocked    = 0;

      // Look up staff_id so the FK column is populated
      const [[staff]] = await db.execute(
        `SELECT id FROM staff_roster WHERE email = ? LIMIT 1`,
        [username]
      );

      await db.execute(
        `INSERT INTO USER_LOGIN_ATTEMPTS
           (USERNAME, FAILED_ATTEMPTS, LAST_FAILED_AT, WINDOW_START_AT, LOCKED, staff_id, CREATED_AT, UPDATED_AT)
         VALUES (?, 1, NOW(), NOW(), 0, ?, NOW(), NOW())`,
        [username, staff?.id ?? null]
      );
    }

    // Return at top level — non-proxy API Gateway: entire object becomes response body
    return {
      statusCode:   200,
      is_locked:    isLocked === 1,
      attempts:     newAttempts,
      max_attempts: MAX_ATTEMPTS
    };
  } catch (err) {
    console.error('WCLoginFailedIncrement error:', err);
    return { statusCode: 500, error: err.message };
  } finally {
    if (db) await db.end();
  }
};
