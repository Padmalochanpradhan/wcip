/**
 * Lambda: WCLockedCognitoUser-prod
 *
 * Disables the AWS Cognito user after the DB lockout flag is set,
 * providing a second layer of enforcement (dual lockout):
 *   - DB flag  → blocked by WCAuthentication on every login attempt
 *   - Cognito  → blocked at the MFA/token layer before WCAuthentication is reached
 *
 * Input:  { username }  — staff email address
 *   Looks up cognito_username (sub UUID) from staff_roster by email,
 *   then calls AdminDisableUser on that sub.
 *
 * Output: { statusCode, message }
 *
 * Env vars required:
 *   USER_POOL_ID — Cognito User Pool ID (e.g. us-east-1_XXXXXXXX)
 *   AWS_REGION   — defaults to us-east-1 if not set
 */

const mysql  = require('mysql2/promise');
const conn   = require('/opt/config.json');
const { CognitoIdentityProviderClient, AdminDisableUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

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
      `SELECT cognito_username FROM staff_roster WHERE email = ? LIMIT 1`,
      [username]
    );

    if (!row || !row.cognito_username) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'User not found or no Cognito account' }) };
    }

    await cognitoClient.send(new AdminDisableUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username:   row.cognito_username
    }));

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ message: 'User locked in Cognito' })
    };
  } catch (err) {
    console.error('WCLockedCognitoUser error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  } finally {
    if (db) await db.end();
  }
};
