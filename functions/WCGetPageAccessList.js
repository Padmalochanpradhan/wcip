/**
 * Lambda: WCGetPageAccessList-prod
 *
 * Returns all data needed by the Page Access admin page in one call:
 *   list     — every ROLE_PAGE_ACCESS row joined with PAGES and roles (the table rows)
 *   roles    — all roles for the Add/Edit dialog role dropdown
 *   pagelist — all PAGES for the Add/Edit dialog page dropdown
 *
 * Input:  {} (no parameters required)
 * Output: { statusCode, list, roles, pagelist }
 *
 * Note — Non-proxy API Gateway: data is returned at the top level,
 * not nested under a body string. Angular reads res.list, res.roles, res.pagelist.
 *
 * All three queries run in parallel via Promise.all for performance.
 *
 * Env vars required: none (DB config from /opt/config.json)
 */

const mysql = require('mysql2/promise');
const conn  = require('/opt/config.json');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200 };
  }

  let db;
  try {
    db = await mysql.createConnection({
      host:     conn.dbhost,
      user:     conn.dbuser,
      password: conn.dbpassword,
      database: conn.dbname
    });

    // Run all three lookups in parallel — they are independent queries
    const [[list], [roles], [pagelist]] = await Promise.all([
      db.execute(
        `SELECT rpa.id, rpa.role_id, rpa.page_id, rpa.status, rpa.added_on,
                r.name  AS role_name,
                p.page_name
           FROM ROLE_PAGE_ACCESS rpa
           JOIN roles r ON r.id  = rpa.role_id
           JOIN PAGES p ON p.id  = rpa.page_id
          ORDER BY r.name, p.page_name`
      ),
      db.execute(
        `SELECT id AS ID, name AS ROLE_NAME FROM roles ORDER BY name`
      ),
      db.execute(
        `SELECT id, page_name FROM PAGES ORDER BY page_name`
      )
    ]);

    return {
      statusCode: 200,
      list,
      roles,
      pagelist
    };
  } catch (err) {
    console.error('WCGetPageAccessList error:', err);
    return { statusCode: 500, error: err.message };
  } finally {
    if (db) await db.end();
  }
};
