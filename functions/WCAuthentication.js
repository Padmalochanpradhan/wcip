/**
 * Lambda: WCAuthentication-prod
 *
 * Authenticates a WC staff user against the MySQL staff_roster table.
 *
 * Input:  { username, password }
 * Output: { statusCode, data: JSON.stringify([user]), pageAccess: [{role_id, page_name}] }
 *
 * IMPORTANT — Non-proxy API Gateway integration:
 *   The entire return object becomes the HTTP response body.
 *   Data must be at the TOP LEVEL (not nested under a body string).
 *   Angular reads: res.data (JSON string of user array) and res.pageAccess (array).
 *
 * Auth checks are ordered deliberately:
 *   1. DB lockout flag  — fastest rejection, no password work needed
 *   2. Account status   — inactive accounts are blocked before hashing
 *   3. scrypt password  — expensive, so done last
 *
 * Password hash format: "scrypt:{salt}:{hex64}"
 * Password policy: expires after 30 days; warns for 5 days before expiry.
 *
 * Env vars required: none (DB config from /opt/config.json)
 */

const mysql  = require('mysql2/promise');
const crypto = require('crypto');
const conn   = require('/opt/config.json');

const EXPIRY_DAYS  = 30;
const WARNING_DAYS = 5;

/**
 * Verifies a plain-text password against a stored scrypt hash.
 * Resolves false for any malformed hash rather than throwing.
 */
function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    const parts = storedHash ? storedHash.split(':') : [];
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      return resolve(false);
    }
    const [, salt, expected] = parts;
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString('hex') === expected);
    });
  });
}

/**
 * Returns password expiry fields based on the last update timestamp.
 * A null timestamp is treated as an already-expired password.
 */
function getPasswordFields(passwordUpdatedOn) {
  if (!passwordUpdatedOn) {
    return {
      password_age_days:       999,
      is_password_expired:     1,
      password_expiry_warning: 0,
      password_message:        'Your password has expired. Please reset your password.'
    };
  }

  const age      = Math.floor((Date.now() - new Date(passwordUpdatedOn).getTime()) / 86_400_000);
  const daysLeft = EXPIRY_DAYS - age;

  if (age >= EXPIRY_DAYS) {
    return {
      password_age_days:       age,
      is_password_expired:     1,
      password_expiry_warning: 0,
      password_message:        'Your password has expired. Please reset your password.'
    };
  }

  if (daysLeft <= WARNING_DAYS) {
    return {
      password_age_days:       age,
      is_password_expired:     0,
      password_expiry_warning: 1,
      password_message:        `Your password will expire in ${daysLeft} day(s). Please update it soon.`
    };
  }

  return {
    password_age_days:       age,
    is_password_expired:     0,
    password_expiry_warning: 0,
    password_message:        ''
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200 };
  }

  const { username, password } = event;

  if (!username || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Username and password are required.' })
    };
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname,
      port:     3306,
      timeout:  60000
    });

    // Fetch user with lockout status and role name in a single query.
    // Aliases (ID, FistName, EmailID, ROLE_NAME) must match Angular's user model exactly.
    const [rows] = await connection.execute(
      `SELECT sr.id                                    AS ID,
              sr.role_id,
              sr.cognito_username,
              sr.name,
              SUBSTRING_INDEX(sr.name, ' ', 1)         AS FistName,
              SUBSTRING_INDEX(sr.name, ' ', -1)        AS LastName,
              sr.email,
              sr.email                                 AS EmailID,
              sr.status,
              sr.password_hash,
              sr.password_updated_on,
              COALESCE(ula.LOCKED, 0)                  AS is_locked,
              r.name                                   AS ROLE_NAME
         FROM staff_roster sr
         LEFT JOIN roles r ON r.id = sr.role_id
         LEFT JOIN USER_LOGIN_ATTEMPTS ula ON ula.USERNAME = sr.email
        WHERE sr.email = ?
        LIMIT 1`,
      [username]
    );

    if (rows.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid login credentials.' })
      };
    }

    const user = rows[0];

    // Check DB lockout FIRST — Cognito may also be disabled, but this is
    // the definitive source of truth and avoids unnecessary password work.
    if (user.is_locked) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Account is locked due to multiple failed login attempts. Please contact the administrator.' })
      };
    }

    if (user.status !== 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Account is inactive or disabled.' })
      };
    }

    // scrypt is intentionally slow — only call after cheaper checks pass.
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid login credentials.' })
      };
    }

    // Only fetch pages where status = 0 (Active). Inactive rules are ignored.
    const [pageAccessRows] = await connection.execute(
      `SELECT rpa.role_id, p.page_name
         FROM ROLE_PAGE_ACCESS rpa
         JOIN PAGES p ON p.id = rpa.page_id
        WHERE rpa.role_id = ? AND rpa.status = 0`,
      [user.role_id]
    );

    // Strip sensitive fields before returning to the client.
    const { password_hash, password_updated_on, ...safeUser } = user;
    const expiryFields = getPasswordFields(password_updated_on);

    return {
      statusCode: 200,
      data: JSON.stringify([{ ...safeUser, ...expiryFields }]),
      pageAccess: pageAccessRows
    };

  } catch (err) {
    console.error('WCAuthentication error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: err.message })
    };
  } finally {
    if (connection) await connection.end();
  }
};
