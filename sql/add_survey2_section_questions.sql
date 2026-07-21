-- ============================================================
-- WCIP: Add questions for survey_id = 2 (Environmental Scan)
-- Sections already exist (see survey_sections WHERE survey_id=2):
--   12 = Safety & perceived risk
--   13 = Transportation & access
--   14 = Food environment
--   15 = Green space & assets
--   16 = Climate & resilience
--   17 = Lived experience
--
-- Mirrors exactly what functions/WCmanageSurveys.js (action=create_question)
-- does per question:
--   1) INSERT INTO questions_bank
--   2) INSERT INTO survey_question_map  (links question -> survey + section)
--   3) INSERT INTO question_options     (one row per chip, in display order)
--
-- Chip color_variant follows the app's existing best->worst 4-step scale:
--   1st option = positive, 2nd = neutral, 3rd = warning, 4th = critical
-- ============================================================

START TRANSACTION;

-- ============================================================
-- SECTION 12: Safety & perceived risk
-- ============================================================

-- 1. Safety perception
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('SAFETY_PERCEPTION', 'Safety perception', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 12, @qid, 1, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'High',     'high',     'positive', 1),
  (@qid, 'Moderate', 'moderate', 'neutral',  2),
  (@qid, 'Low',       'low',      'warning',  3),
  (@qid, 'Unsafe',    'unsafe',   'critical', 4);

-- 2. Vandalism / violence signs
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('VANDALISM_VIOLENCE_SIGNS', 'Vandalism / violence signs', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 12, @qid, 2, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'None',        'none',        'positive', 1),
  (@qid, 'Minor',        'minor',        'neutral',  2),
  (@qid, 'Moderate',     'moderate',     'warning',  3),
  (@qid, 'Significant',  'significant',  'critical', 4);

-- 3. Resident fear cues
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('RESIDENT_FEAR_CUES', 'Resident fear cues', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 12, @qid, 3, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'None',    'none',    'positive', 1),
  (@qid, 'Subtle',  'subtle',  'neutral',  2),
  (@qid, 'Evident', 'evident', 'warning',  3),
  (@qid, 'Strong',  'strong',  'critical', 4);

-- 4. Time of day
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('TIME_OF_DAY', 'Time of day', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 12, @qid, 4, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'Morning',   'morning',   'positive', 1),
  (@qid, 'Midday',    'midday',    'neutral',  2),
  (@qid, 'Afternoon', 'afternoon', 'warning',  3),
  (@qid, 'Evening',   'evening',   'critical', 4);

-- 5. Safety observation notes
INSERT INTO questions_bank (code, label, placeholder, question_type, default_required)
VALUES ('SAFETY_OBSERVATION_NOTES', 'Safety observation notes', 'Staff notes...', 'textarea', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 12, @qid, 5, NULL);


-- ============================================================
-- SECTION 13: Transportation & access
-- ============================================================

-- 1. Transit stop proximity
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('TRANSIT_STOP_PROXIMITY', 'Transit stop proximity', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 13, @qid, 1, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'Under 5 min',  'under_5_min',  'positive', 1),
  (@qid, '5-10 min',     '5-10_min',     'neutral',  2),
  (@qid, '10-20 min',    '10-20_min',    'warning',  3),
  (@qid, 'Over 20 min',  'over_20_min',  'critical', 4);

-- 2. Walkability
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('WALKABILITY', 'Walkability', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 13, @qid, 2, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'Good',             'good',              'positive', 1),
  (@qid, 'Fair',              'fair',              'neutral',  2),
  (@qid, 'Poor',              'poor',              'warning',  3),
  (@qid, 'Barriers present',  'barriers_present',  'critical', 4);

-- 3. ADA accessibility
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('ADA_ACCESSIBILITY', 'ADA accessibility', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 13, @qid, 3, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'Full',    'full',    'positive', 1),
  (@qid, 'Partial', 'partial', 'neutral',  2),
  (@qid, 'Limited', 'limited', 'warning',  3),
  (@qid, 'None',    'none',    'critical', 4);

-- 4. Transportation notes
INSERT INTO questions_bank (code, label, placeholder, question_type, default_required)
VALUES ('TRANSPORTATION_NOTES', 'Transportation notes', 'Staff notes...', 'textarea', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 13, @qid, 4, NULL);


-- ============================================================
-- SECTION 14: Food environment
-- ============================================================

-- 1. Fresh food / grocery
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('FRESH_FOOD_GROCERY', 'Fresh food / grocery', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 14, @qid, 1, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'Good',        'good',         'positive', 1),
  (@qid, 'Limited',     'limited',      'neutral',  2),
  (@qid, 'Poor',        'poor',         'warning',  3),
  (@qid, 'Food desert', 'food_desert',  'critical', 4);

-- 2. Fast food density
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('FAST_FOOD_DENSITY', 'Fast food density', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 14, @qid, 2, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'Low',      'low',      'positive', 1),
  (@qid, 'Moderate', 'moderate', 'neutral',  2),
  (@qid, 'High',     'high',     'warning',  3),
  (@qid, 'Dominant', 'dominant', 'critical', 4);

-- 3. Community food resources
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('COMMUNITY_FOOD_RESOURCES', 'Community food resources', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 14, @qid, 3, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'Multiple',      'multiple',      'positive', 1),
  (@qid, 'One',           'one',           'neutral',  2),
  (@qid, 'None visible',  'none_visible',  'warning',  3),
  (@qid, 'Unknown',       'unknown',       'critical', 4);

-- 4. Food environment notes
INSERT INTO questions_bank (code, label, placeholder, question_type, default_required)
VALUES ('FOOD_ENVIRONMENT_NOTES', 'Food environment notes', 'Staff notes...', 'textarea', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 14, @qid, 4, NULL);


-- ============================================================
-- SECTION 15: Green space & assets
-- ============================================================

-- 1. Green space / parks
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('GREEN_SPACE_PARKS', 'Green space / parks', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 15, @qid, 1, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'Abundant', 'abundant', 'positive', 1),
  (@qid, 'Present',  'present',  'neutral',  2),
  (@qid, 'Minimal',  'minimal',  'warning',  3),
  (@qid, 'None',     'none',     'critical', 4);

-- 2. Community centers / libraries
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('COMMUNITY_CENTERS_LIBRARIES', 'Community centers / libraries', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 15, @qid, 2, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'Multiple active', 'multiple_active', 'positive', 1),
  (@qid, 'One active',      'one_active',      'neutral',  2),
  (@qid, 'Present/closed',  'present/closed',  'warning',  3),
  (@qid, 'None',            'none',            'critical', 4);

-- 3. Maintenance quality
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('MAINTENANCE_QUALITY', 'Maintenance quality', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 15, @qid, 3, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'Well-kept',     'well-kept',     'positive', 1),
  (@qid, 'Fair',          'fair',          'neutral',  2),
  (@qid, 'Neglected',     'neglected',     'warning',  3),
  (@qid, 'Deteriorated',  'deteriorated',  'critical', 4);

-- 4. Asset notes
INSERT INTO questions_bank (code, label, placeholder, question_type, default_required)
VALUES ('ASSET_NOTES', 'Asset notes', 'Staff notes...', 'textarea', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 15, @qid, 4, NULL);


-- ============================================================
-- SECTION 16: Climate & resilience
-- ============================================================

-- 1. Flooding / drainage
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('FLOODING_DRAINAGE', 'Flooding / drainage', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 16, @qid, 1, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'None visible',  'none_visible', 'positive', 1),
  (@qid, 'Minor',         'minor',        'neutral',  2),
  (@qid, 'Moderate',      'moderate',     'warning',  3),
  (@qid, 'Significant',   'significant',  'critical', 4);

-- 2. Cooling / warming resources
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('COOLING_WARMING_RESOURCES', 'Cooling / warming resources', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 16, @qid, 2, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'Available', 'available', 'positive', 1),
  (@qid, 'Limited',   'limited',   'neutral',  2),
  (@qid, 'Absent',    'absent',    'warning',  3),
  (@qid, 'Unknown',   'unknown',   'critical', 4);

-- 3. Infrastructure condition
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('INFRASTRUCTURE_CONDITION', 'Infrastructure condition', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 16, @qid, 3, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'Good',     'good',     'positive', 1),
  (@qid, 'Fair',     'fair',     'neutral',  2),
  (@qid, 'Stressed', 'stressed', 'warning',  3),
  (@qid, 'Critical', 'critical', 'critical', 4);

-- 4. Climate / resilience notes
INSERT INTO questions_bank (code, label, placeholder, question_type, default_required)
VALUES ('CLIMATE_RESILIENCE_NOTES', 'Climate / resilience notes', 'Staff notes...', 'textarea', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 16, @qid, 4, NULL);


-- ============================================================
-- SECTION 17: Lived experience (narrative)
-- ============================================================

-- 1. What makes this place hard to live in? (required)
INSERT INTO questions_bank (code, label, placeholder, question_type, default_required)
VALUES ('WHAT_MAKES_THIS_PLACE_HARD_TO_LIVE_IN', 'What makes this place hard to live in?', 'Required — use resident''s actual words', 'textarea', 1);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 17, @qid, 1, 1);

-- 2. What helps people get by here?
INSERT INTO questions_bank (code, label, placeholder, question_type, default_required)
VALUES ('WHAT_HELPS_PEOPLE_GET_BY_HERE', 'What helps people get by here?', 'Staff notes...', 'textarea', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 17, @qid, 2, NULL);

-- 3. Emotional tone observed
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('EMOTIONAL_TONE_OBSERVED', 'Emotional tone observed', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 17, @qid, 3, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'Hopeful',     'hopeful',     'positive', 1),
  (@qid, 'Mixed',       'mixed',       'neutral',  2),
  (@qid, 'Frustrated',  'frustrated',  'warning',  3),
  (@qid, 'Distressed',  'distressed',  'critical', 4);

-- 4. Trust in institutions observed
INSERT INTO questions_bank (code, label, question_type, default_required)
VALUES ('TRUST_IN_INSTITUTIONS_OBSERVED', 'Trust in institutions observed', 'single_chip', 0);
SET @qid := LAST_INSERT_ID();
INSERT INTO survey_question_map (survey_id, section_id, question_id, display_order, is_required_override)
VALUES (2, 17, @qid, 4, NULL);
INSERT INTO question_options (question_id, label, value, color_variant, display_order) VALUES
  (@qid, 'High',     'high',     'positive', 1),
  (@qid, 'Moderate', 'moderate', 'neutral',  2),
  (@qid, 'Low',      'low',      'warning',  3),
  (@qid, 'Very low', 'very_low', 'critical', 4);


COMMIT;

-- ============================================================
-- Verify:
-- SELECT sq.section_id, s.title AS section, q.label, q.question_type, sq.display_order
-- FROM survey_question_map sq
-- JOIN questions_bank q ON q.id = sq.question_id
-- JOIN survey_sections s ON s.id = sq.section_id
-- WHERE sq.survey_id = 2
-- ORDER BY sq.section_id, sq.display_order;
-- ============================================================
