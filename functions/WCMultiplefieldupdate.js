/**
 * Lambda: WCMultiplefieldupdate-prod
 *
 * Generic UPDATE handler — updates any allowed table with arbitrary fields.
 * Angular sends a payload describing WHAT to update; this Lambda builds and
 * executes the parameterised SQL.
 *
 * Input:  { table_name, id_field_name, id_field_value, updateData }
 *   table_name     — must be in ALLOWED_TABLES (whitelist prevents SQL injection)
 *   id_field_name  — must be in ALLOWED_ID_FIELDS
 *   id_field_value — the primary key value to match in the WHERE clause
 *   updateData     — object of { column: value } pairs to SET
 *
 * Output: { statusCode, affectedRows }
 *
 * Security: table and id-field names are whitelisted; column names in updateData
 * are validated against /^\w+$/ (alphanumeric + underscore only). Values are
 * always passed as parameterised placeholders — never interpolated.
 *
 * To allow a new table, add its name to ALLOWED_TABLES below.
 *
 * Env vars required: none (DB config from /opt/config.json)
 */

const mysql = require('mysql2/promise');
const conn  = require('/opt/config.json');

// Only tables explicitly listed here can be updated through this Lambda
const ALLOWED_TABLES = new Set([
  'ROLE_PAGE_ACCESS',
]);

// Only these column names are permitted as the WHERE id field
const ALLOWED_ID_FIELDS = new Set(['id', 'RECIP_NO']);

// Column names in updateData must be word chars only (letters, digits, underscore)
const SAFE_COL = /^\w+$/;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200 };
  }

  const { table_name, id_field_name, id_field_value, updateData } = event;

  if (!ALLOWED_TABLES.has(table_name)) {
    return { statusCode: 400, message: `Table '${table_name}' is not permitted.` };
  }
  if (!ALLOWED_ID_FIELDS.has(id_field_name)) {
    return { statusCode: 400, message: `ID field '${id_field_name}' is not permitted.` };
  }
  if (!updateData || typeof updateData !== 'object' || Array.isArray(updateData)) {
    return { statusCode: 400, message: 'updateData must be a non-empty object.' };
  }

  const columns = Object.keys(updateData);
  if (columns.length === 0) {
    return { statusCode: 400, message: 'updateData has no fields to update.' };
  }

  // Validate every column name before building the SQL string
  for (const col of columns) {
    if (!SAFE_COL.test(col)) {
      return { statusCode: 400, message: `Column name '${col}' contains invalid characters.` };
    }
  }

  // Build parameterised SET clause — values are never string-interpolated
  const setClauses = columns.map(c => `\`${c}\` = ?`).join(', ');
  const values     = [...columns.map(c => updateData[c]), id_field_value];
  const sql        = `UPDATE \`${table_name}\` SET ${setClauses} WHERE \`${id_field_name}\` = ?`;

  let db;
  try {
    db = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname,
      port:     3306,
      timeout:  60000
    });

    const [result] = await db.execute(sql, values);

    return {
      statusCode:   200,
      affectedRows: result.affectedRows
    };
  } catch (err) {
    console.error('WCMultiplefieldupdate error:', err);
    return { statusCode: 500, message: err.message };
  } finally {
    if (db) await db.end();
  }
};
