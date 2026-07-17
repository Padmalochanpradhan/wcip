const mysql = require('mysql2/promise');
const conn  = require('/opt/config.json');

/*
  Lambda: WCmanageSurveys-prod
  Handles all survey CRUD via the action field:

  action: 'create_survey'    { title, slug, description, survey_type, icon, daily_prompt, status }
  action: 'update_survey'    { id, title, description, survey_type, icon, daily_prompt, status }
  action: 'create_section'   { survey_id, title, subtitle, icon, badge_label, is_collapsible, is_required, display_order }
  action: 'update_section'   { id, title, subtitle, icon, badge_label, is_collapsible, is_required, display_order }
  action: 'create_question'  { survey_id, section_id, label, question_type, helper_text, placeholder, is_required, display_order, options[] }
  action: 'update_question'  { id, map_id, label, question_type, helper_text, placeholder, is_required, display_order, options[] }
  action: 'delete_question'  { id }
*/

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function ok(data)  { return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, ...data }) }; }
function err(msg)  { return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: msg }) }; }
function bad(msg)  { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: msg }) }; }

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  let body;
  try {
    if (typeof event.body === 'string')                    body = JSON.parse(event.body);
    else if (event.body && typeof event.body === 'object') body = event.body;
    else                                                   body = event;
  } catch { return bad('Invalid JSON'); }

  const { action } = body;
  if (!action) return bad('action is required');

  let db;
  try {
    db = await mysql.createConnection({
      host: conn.dbhost, user: conn.dbuser,
      password: conn.dbpassword, database: conn.dbname
    });

    // ── CREATE SURVEY ────────────────────────────────────────────
    if (action === 'create_survey') {
      const { title, slug, description, survey_type, icon, daily_prompt, status, location_id } = body;
      if (!title) return bad('title is required');
      const [res] = await db.execute(
        `INSERT INTO surveys (title, slug, description, survey_type, icon, daily_prompt, status, location_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, slug || title.toLowerCase().replace(/\s+/g,'-'), description||null, survey_type||'general', icon||'pencil', daily_prompt||null, status||'draft', location_id||null]
      );
      return ok({ id: res.insertId });
    }

    // ── UPDATE SURVEY ────────────────────────────────────────────
    if (action === 'update_survey') {
      const { id, title, description, survey_type, icon, daily_prompt, status, location_id } = body;
      if (!id) return bad('id is required');
      await db.execute(
        `UPDATE surveys SET title=?, description=?, survey_type=?, icon=?, daily_prompt=?, status=?, location_id=?, updated_at=NOW()
         WHERE id=?`,
        [title, description||null, survey_type, icon, daily_prompt||null, status, location_id||null, id]
      );
      return ok({});
    }

    // ── CREATE SECTION ───────────────────────────────────────────
    if (action === 'create_section') {
      const { survey_id, title, subtitle, icon, badge_label, is_collapsible, is_required, display_order } = body;
      if (!survey_id || !title) return bad('survey_id and title are required');
      const [res] = await db.execute(
        `INSERT INTO survey_sections (survey_id, title, subtitle, icon, badge_label, is_collapsible, is_required, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [survey_id, title, subtitle||null, icon||null, badge_label||null, is_collapsible?1:0, is_required?1:0, display_order||1]
      );
      return ok({ id: res.insertId });
    }

    // ── UPDATE SECTION ───────────────────────────────────────────
    if (action === 'update_section') {
      const { id, title, subtitle, icon, badge_label, is_collapsible, is_required, display_order } = body;
      if (!id) return bad('id is required');
      await db.execute(
        `UPDATE survey_sections SET title=?, subtitle=?, icon=?, badge_label=?, is_collapsible=?, is_required=?, display_order=?
         WHERE id=?`,
        [title, subtitle||null, icon||null, badge_label||null, is_collapsible?1:0, is_required?1:0, display_order||1, id]
      );
      return ok({});
    }

    // ── CREATE QUESTION ──────────────────────────────────────────
    if (action === 'create_question') {
      const { survey_id, section_id, label, question_type, helper_text, placeholder, is_required, display_order, options = [] } = body;
      if (!section_id || !label) return bad('section_id and label are required');

      // 1. Insert into questions_bank
      const code = label.toUpperCase().replace(/\s+/g,'_').replace(/[^A-Z0-9_]/g,'').slice(0,60) + '_' + Date.now();
      const [qRes] = await db.execute(
        `INSERT INTO questions_bank (code, label, helper_text, placeholder, question_type, default_required)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [code, label, helper_text||null, placeholder||null, question_type, is_required?1:0]
      );
      const questionId = qRes.insertId;

      // 2. Insert into survey_question_map
      const [mRes] = await db.execute(
        `INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
         VALUES (?, ?, ?, ?, ?)`,
        [survey_id, section_id, questionId, display_order||1, is_required?1:null]
      );

      // 3. Insert options
      for (const [i, opt] of options.entries()) {
        await db.execute(
          `INSERT INTO question_options (question_id, label, value, color_variant, display_order)
           VALUES (?, ?, ?, ?, ?)`,
          [questionId, opt.label, opt.value||opt.label.toLowerCase().replace(/\s+/g,'_'), opt.color_variant||'neutral', i+1]
        );
      }
      return ok({ question_id: questionId, map_id: mRes.insertId });
    }

    // ── UPDATE QUESTION ──────────────────────────────────────────
    if (action === 'update_question') {
      const { id, map_id, label, question_type, helper_text, placeholder, is_required, display_order, options = [] } = body;
      if (!id) return bad('id is required');

      // 1. Update questions_bank
      await db.execute(
        `UPDATE questions_bank SET label=?, helper_text=?, placeholder=?, question_type=?, default_required=?
         WHERE id=?`,
        [label, helper_text||null, placeholder||null, question_type, is_required?1:0, id]
      );

      // 2. Update display_order in map
      if (map_id) {
        await db.execute(`UPDATE survey_question_map SET display_order=? WHERE id=?`, [display_order||1, map_id]);
      }

      // 3. Sync options — delete all, re-insert
      await db.execute(`DELETE FROM question_options WHERE question_id=?`, [id]);
      for (const [i, opt] of options.entries()) {
        await db.execute(
          `INSERT INTO question_options (question_id, label, value, color_variant, display_order)
           VALUES (?, ?, ?, ?, ?)`,
          [id, opt.label, opt.value||opt.label.toLowerCase().replace(/\s+/g,'_'), opt.color_variant||'neutral', i+1]
        );
      }
      return ok({});
    }

    // ── DELETE QUESTION ──────────────────────────────────────────
    if (action === 'delete_question') {
      const { id } = body;
      if (!id) return bad('id is required');
      await db.execute(`DELETE FROM question_options     WHERE question_id=?`, [id]);
      await db.execute(`DELETE FROM survey_question_map  WHERE question_id=?`, [id]);
      await db.execute(`DELETE FROM questions_bank       WHERE id=?`,          [id]);
      return ok({});
    }

    return bad(`Unknown action: ${action}`);

  } catch (e) {
    console.error('WCmanageSurveys error:', e);
    return err(e.message);
  } finally {
    if (db) await db.end();
  }
};
