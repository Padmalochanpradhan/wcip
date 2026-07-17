/**
 * Lambda: WCLoginSuccessReset-prod
 *
 * Called by Angular immediately after a successful Cognito authentication,
 * BEFORE calling WCAuthentication. Clears the failed-attempt counter and
 * any existing lockout so a previously-locked user who was manually re-enabled
 * by an admin can log in cleanly.
 *
 * Input:  { username }  — email address
 * Output: { statusCode, message }
 *
 * Safe to call even if no row exists for the user (UPDATE affects 0 rows).
 *
 * Env vars required: none (DB config from /opt/config.json)
 */

const mysql = require('mysql2/promise');
const conn  = require('/opt/config.json');

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

    await db.execute(
      `UPDATE USER_LOGIN_ATTEMPTS
          SET FAILED_ATTEMPTS = 0,
              LOCKED          = 0,
              LOCKED_AT       = NULL,
              WINDOW_START_AT = NOW(),
              UPDATED_AT      = NOW()
        WHERE USERNAME = ?`,
      [username]
    );

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ message: 'Login counters reset successfully' })
    };
  } catch (err) {
    console.error('WCLoginSuccessReset error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  } finally {
    if (db) await db.end();
  }
};
