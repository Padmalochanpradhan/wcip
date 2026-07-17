-- ============================================================
-- WCIP: Add Ward 5-8 to wards table
-- Matches the existing Ward 1-4 rows (id = ward number, W# code,
-- is_active=1, location_id=1). Adjust description text as needed —
-- placeholders below just follow the "<Direction> district" pattern
-- used for Ward 1-4; edit before running if you have real values.
-- ============================================================

INSERT INTO wards (id, name, code, description, is_active, location_id) VALUES
  (5, 'Ward 5', 'W5', 'Ward 5 district', 1, 1),
  (6, 'Ward 6', 'W6', 'Ward 6 district', 1, 1),
  (7, 'Ward 7', 'W7', 'Ward 7 district', 1, 1),
  (8, 'Ward 8', 'W8', 'Ward 8 district', 1, 1);

-- Verify:
-- SELECT * FROM wards ORDER BY id;
