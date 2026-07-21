const mysql  = require('mysql2/promise');
const crypto = require('crypto');
const conn   = require('/opt/config.json');

/*
  Lambda: WCUpdateUser-prod
  Input:  { ID, FistName, LastName, Password?, role_id, member_status }
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

  const { ID, FistName, LastName, Password, role_id, member_status } = body;

  if (!ID || !FistName || !LastName) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Missing required fields: ID, FistName, LastName' })
    };
  }

  let db;
  try {
    const name = `${FistName.trim()} ${LastName.trim()}`;
    const now  = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const fields  = ['name = ?', 'role_id = ?', 'status = ?'];
    const values  = [name, role_id ?? null, member_status ?? 0];

    if (Password) {
      const hash = await hashPassword(Password);
      fields.push('password_hash = ?', 'password_updated_on = ?');
      values.push(hash, now);
    }

    values.push(ID);

    db = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname
    });

    await db.execute(
      `UPDATE staff_roster SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ message: 'User updated successfully' })
    };
  } catch (err) {
    console.error('WCUpdateUser error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    if (db) await db.end();
  }
};
