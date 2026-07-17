const mysql = require('mysql2/promise');
const conn  = require('/opt/config.json');

/*
  Lambda: WCgetSubmissionDetail-prod
  Input:  { id: number }
  Output: { data: SurveySubmission }

  Returns a single submission by id, with survey title and ward name.
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
    if (typeof event.body === 'string')                  body = JSON.parse(event.body);
    else if (event.body && typeof event.body === 'object') body = event.body;
    else                                                 body = event;
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const id = body?.id;
  if (!id) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'id is required' }) };
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
         ss.latitude,
         ss.longitude,
         ss.status,
         ss.ai_analysis,
         ss.submitted_at,
         ss.reviewed_at,
         ss.reviewed_by,
         ss.created_at,
         ss.updated_at,
         s.title  AS survey_title,
         w.name   AS ward_name
       FROM survey_submissions ss
       LEFT JOIN surveys s ON s.id = ss.survey_id
       LEFT JOIN wards   w ON w.id = ss.ward_id
       WHERE ss.id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Submission not found' }) };
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ data: rows[0] })
    };
  } catch (err) {
    console.error('WCgetSubmissionDetail error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    if (db) await db.end();
  }
};
