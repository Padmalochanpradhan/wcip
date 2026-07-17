const mysql  = require('mysql2/promise');
const crypto = require('crypto');          // built-in — no layer needed
const conn   = require('/opt/config.json');

/*
  Lambda: WCCreateUser-prod
  Input:  { FistName, LastName, EmailID, Password, role_id, member_status, cognito_username }
  Table:  staff_roster
*/

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

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

  let body;
  try {
    if (typeof event.body === 'string')                    body = JSON.parse(event.body);
    else if (event.body && typeof event.body === 'object') body = event.body;
    else                                                   body = event;
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { FistName, LastName, EmailID, Password, role_id, member_status, cognito_username } = body;

  if (!FistName || !LastName || !EmailID || !Password) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Missing required fields: FistName, LastName, EmailID, Password' })
    };
  }

  let db;
  try {
    const passwordHash = await hashPassword(Password);
    const name         = `${FistName.trim()} ${LastName.trim()}`;
    const now          = new Date().toISOString().slice(0, 19).replace('T', ' ');

    db = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname
    });

    const [result] = await db.execute(
      `INSERT INTO staff_roster
         (role_id, cognito_username, name, email, password_hash, status, added_on, password_updated_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        role_id        ?? null,
        cognito_username ?? null,
        name,
        EmailID.trim().toLowerCase(),
        passwordHash,
        member_status  ?? 0,
        now,
        now
      ]
    );

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ message: 'User created successfully', id: result.insertId })
    };
  } catch (err) {
    console.error('WCCreateUser error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    if (db) await db.end();
  }
};
