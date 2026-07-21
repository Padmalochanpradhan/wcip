const mysql = require('mysql2/promise');
const conn  = require('/opt/config.json');

/*
  Lambda: WCupdateSubmissionStatus-prod
  Input:  { id: number, status: 'submitted' | 'flagged' | 'reviewed' | 'draft' }
  Output: { success: true }
*/

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const VALID_STATUSES = ['submitted', 'flagged', 'reviewed', 'draft'];

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

  const { id, status } = body ?? {};

  if (!id || !status) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'id and status are required' }) };
  }

  if (!VALID_STATUSES.includes(status)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }) };
  }

  let db;
  try {
    db = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname
    });

    const [result] = await db.execute(
      'UPDATE survey_submissions SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Submission not found' }) };
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, id, status })
    };
  } catch (err) {
    console.error('WCupdateSubmissionStatus error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    if (db) await db.end();
  }
};
