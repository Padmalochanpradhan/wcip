const mysql = require('mysql2/promise');
const conn  = require('/opt/config.json');

/*
  Lambda: prismGetUserByEmail-prod
  Input:  { username: string }   (username = email address)
  Output: { data: [] }           (not found — safe to create)
          { data: [row] }        (found — email already exists)

  Used by the Add User dialog to prevent duplicate accounts.
*/

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

  let body;
  try {
    if (typeof event.body === 'string')                    body = JSON.parse(event.body);
    else if (event.body && typeof event.body === 'object') body = event.body;
    else                                                   body = event;
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const email = body?.username;
  if (!email) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'username (email) is required' }) };
  }

  let db;
  try {
    db = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname
    });

    const [rows] = await db.execute(
      `SELECT id AS ID, name, email
       FROM staff_roster
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ data: rows })
    };
  } catch (err) {
    console.error('prismGetUserByEmail error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    if (db) await db.end();
  }
};
