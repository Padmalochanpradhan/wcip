const mysql = require('mysql2/promise');
const conn  = require('/opt/config.json');

/*
  Lambda: WCgetLocations-prod
  Input:  {} (optional: ward_id to filter by ward)
  Output: { data: Location[] }
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

  let body = {};
  try {
    if (typeof event.body === 'string')                    body = JSON.parse(event.body);
    else if (event.body && typeof event.body === 'object') body = event.body;
    else if (event && typeof event === 'object')           body = event;
  } catch { /* empty body is fine */ }

  let db;
  try {
    db = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname
    });

    let sql = `
      SELECT
        l.id,
        l.name,
        l.address,
        l.ward_id,
        l.location_type,
        l.latitude,
        l.longitude,
        l.client_id,
        w.name AS ward_name
      FROM locations l
      LEFT JOIN wards w ON w.id = l.ward_id
      WHERE l.is_active = 1
    `;
    const params = [];

    if (body.ward_id) {
      sql += ' AND l.ward_id = ?';
      params.push(body.ward_id);
    }

    sql += ' ORDER BY l.name ASC';

    const [rows] = await db.execute(sql, params);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ data: rows })
    };
  } catch (err) {
    console.error('WCgetLocations error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    if (db) await db.end();
  }
};
