const mysql  = require('mysql2/promise');
const crypto = require('crypto');
const conn   = require('/opt/config.json');

/*
  Lambda: WCUserPasswordUpdate-prod
  Input:  { ID, Password }
  Updates password_hash and password_updated_on in staff_roster
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

  const { ID, Password } = body;

  if (!ID || !Password) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'ID and Password are required' })
    };
  }

  let db;
  try {
    const hash = await hashPassword(Password);
    const now  = new Date().toISOString().slice(0, 19).replace('T', ' ');

    db = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname
    });

    await db.execute(
      `UPDATE staff_roster SET password_hash = ?, password_updated_on = ? WHERE id = ?`,
      [hash, now, ID]
    );

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ message: 'Password updated successfully' })
    };
  } catch (err) {
    console.error('WCUserPasswordUpdate error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    if (db) await db.end();
  }
};
