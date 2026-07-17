const mysql = require('mysql2/promise');
const conn  = require('/opt/config.json');

function isValidName(name) {
  return /^[a-zA-Z0-9_]+$/.test(name);
}

// col is passed so ai_analysis (trusted internal JSON) skips string-pattern checks
function isSafeValue(value, col) {
  if (col === 'ai_analysis') return true;
  if (typeof value !== 'string') return true;

  const blacklist = [
    /xp_/i,
    /sleep\s*\(/i,
    /pg_sleep/i,
    /waitfor\s+delay/i,
    /select\s+/i,
    /drop\s+/i,
    /insert\s+/i,
    /delete\s+/i,
    /--/,
    /;/,
    /\bexec\b/i,
    /<script/i,
    /<\/script>/i,
    /\.\.\//,
    /oastify/i,
    /nslookup/i,
    /ping\s/i,
  ];

  return !blacklist.some(regex => regex.test(value));
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200 };
  }

  // Non-proxy integration: event IS the parsed body (same pattern as WCMultiplefieldupdate)
  const { table_name, insertDataArray } = event;

  if (!Array.isArray(insertDataArray) || insertDataArray.length === 0) {
    return { statusCode: 400, message: 'insertDataArray must be a non-empty array.' };
  }

  if (!isValidName(table_name)) {
    return { statusCode: 400, message: 'Invalid table name.' };
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname,
      port:     3306,
      timeout:  60000,
    });

    const columns = Object.keys(insertDataArray[0]).filter(col => isValidName(col));
    if (columns.length === 0) {
      return { statusCode: 400, message: 'No valid columns provided.' };
    }

    // MySQL supports up to 65,535 placeholders per query
    const MAX_BATCH_ROWS = Math.max(1, Math.floor(60000 / columns.length));
    const batches = chunkArray(insertDataArray, MAX_BATCH_ROWS);

    let allInsertedIds = [];

    for (const batch of batches) {
      for (const row of batch) {
        for (const col of columns) {
          if (!isSafeValue(row[col], col)) {
            throw new Error(`Unsafe input detected in column: ${col}`);
          }
        }
      }

      const fields          = columns.map(col => `\`${col}\``).join(', ');
      const rowPlaceholder  = `(${columns.map(() => '?').join(', ')})`;
      const allPlaceholders = batch.map(() => rowPlaceholder).join(', ');
      const flatValues      = batch.flatMap(row => columns.map(col => row[col]));

      const sql = `INSERT INTO \`${table_name}\` (${fields}) VALUES ${allPlaceholders}`;
      const [result] = await connection.execute(sql, flatValues);

      const firstId = result.insertId;
      for (let i = 0; i < result.affectedRows; i++) {
        allInsertedIds.push(firstId + i);
      }
    }

    return {
      statusCode:      200,
      message:         'Insert completed successfully',
      totalInserted:   allInsertedIds.length,
      insertedIds:     allInsertedIds.length > 0 ? Math.max(...allInsertedIds) : null,
      batchesProcessed: batches.length,
    };

  } catch (err) {
    console.error('WCMultipleinsert error:', err);
    return { statusCode: 500, message: 'Internal Server Error' };
  } finally {
    if (connection) await connection.end();
  }
};
