const mysql = require('mysql2/promise');
const conn  = require('/opt/config.json');

/*
  Lambda: WCgetAllSubmissions-prod
  Input:  {} (no filter — admin only)
  Output: { data: SurveySubmission[] }

  Returns ALL submissions newest-first, with survey title,
  ward name, and staff name resolved via JOIN.
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

    const [rows] = await db.execute(
      `SELECT
         ss.id,
         ss.survey_id,
         ss.user_id,
         ss.ward_id,
         ss.location_text,
         ss.status,
         ss.ai_analysis,
         ss.submitted_at,
         ss.created_at,
         s.title   AS survey_title,
         w.name    AS ward_name,
         u.name  AS staff_name,
         u.email AS staff_email
       FROM survey_submissions ss
       LEFT JOIN surveys      s  ON s.id  = ss.survey_id
       LEFT JOIN wards        w  ON w.id  = ss.ward_id
       LEFT JOIN staff_roster u  ON u.id  = ss.user_id
       ORDER BY ss.submitted_at DESC`
    );

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ data: rows })
    };
  } catch (err) {
    console.error('WCgetAllSubmissions error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    if (db) await db.end();
  }
};
