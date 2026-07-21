const mysql = require('mysql2/promise');
const conn  = require('/opt/config.json');

/*
  Lambda: WCgetSurveys-prod
  Input:  {}
  Output: { data: Survey[] }
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

  let db;
  try {
    db = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname
    });

    const [rows] = await db.execute(`
      SELECT
        s.id,
        s.title,
        s.slug,
        s.description,
        s.icon,
        s.survey_type,
        s.daily_prompt,
        s.status,
        s.location_id,
        l.name        AS location_name,
        l.address     AS location_address,
        l.location_type,
        l.ward_id     AS location_ward_id,
        w.name        AS location_ward_name
      FROM surveys s
      LEFT JOIN locations l ON l.id = s.location_id
      LEFT JOIN wards     w ON w.id = l.ward_id
      ORDER BY s.id ASC
    `);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ data: rows })
    };
  } catch (err) {
    console.error('WCgetSurveys error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    if (db) await db.end();
  }
};
