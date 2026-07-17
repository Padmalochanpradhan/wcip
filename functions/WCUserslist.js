/**
 * Lambda: WCUserslist-prod
 *
 * Returns all staff users with their roles and lockout status for the
 * Manage Users admin page.
 *
 * Input:  {} (no parameters required)
 * Output: { statusCode, body: JSON.stringify({ data, roles, departments }) }
 *   data        — staff_roster rows with lockout fields joined in
 *   roles       — all roles for the Add/Edit user dialog dropdown
 *   departments — always [] (not used in WC, kept for API compatibility)
 *
 * Lockout fields (is_locked, failed_login_attempts) come from USER_LOGIN_ATTEMPTS
 * via LEFT JOIN — both default to 0 if no attempt row exists yet for the user.
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

  let db;
  try {
    db = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname
    });

    // Aliases (ID, FistName, EmailID, ROLE_NAME) must match Angular's user model
    const [users] = await db.execute(
      `SELECT
         sr.id                                        AS ID,
         sr.name,
         SUBSTRING_INDEX(sr.name, ' ', 1)             AS FistName,
         SUBSTRING_INDEX(sr.name, ' ', -1)            AS LastName,
         sr.email                                     AS EmailID,
         sr.email,
         sr.role_id,
         sr.role_id                                   AS roleId,
         sr.cognito_username,
         sr.status                                    AS member_status,
         COALESCE(ula.LOCKED, 0)                      AS is_locked,
         COALESCE(ula.FAILED_ATTEMPTS, 0)             AS failed_login_attempts,
         sr.added_on,
         r.name                                       AS ROLE_NAME
       FROM staff_roster sr
       LEFT JOIN roles r ON r.id = sr.role_id
       LEFT JOIN USER_LOGIN_ATTEMPTS ula ON ula.USERNAME = sr.email
       ORDER BY sr.name`
    );

    const [roles] = await db.execute(
      `SELECT id AS ID, name AS ROLE_NAME FROM roles ORDER BY name`
    );

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ data: users, roles, departments: [] })
    };
  } catch (err) {
    console.error('WCUserslist error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    if (db) await db.end();
  }
};
