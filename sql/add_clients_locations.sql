-- ============================================================
-- WCIP: Add clients and locations tables
-- Run in order: CREATE tables first, then ALTER existing tables
-- ============================================================

-- wards.id confirmed INT — all FK columns use INT.
-- ============================================================


-- ── 1. CLIENTS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clients (
    id            INT           AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(200)  NOT NULL,
    short_name    VARCHAR(60),
    contact_name  VARCHAR(150),
    contact_email VARCHAR(150),
    contact_phone VARCHAR(30),
    address       TEXT,
    logo_url      VARCHAR(500),
    status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ── 2. LOCATIONS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS locations (
    id            INT            AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(200)   NOT NULL,
    address       VARCHAR(255),
    ward_id       INT,                   -- type must match wards.id — adjust if needed
    latitude      DECIMAL(10,7),
    longitude     DECIMAL(10,7),
    location_type ENUM(
                    'school',
                    'community_center',
                    'clinic',
                    'pharmacy',
                    'shelter',
                    'park',
                    'intersection',
                    'building',
                    'other'
                  ) NOT NULL DEFAULT 'other',
    is_active     TINYINT(1)     NOT NULL DEFAULT 1,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    -- FK added below after type check
);


-- ── 3. ADD client_id + location_id TO surveys ──────────────

ALTER TABLE surveys
    ADD COLUMN client_id   INT AFTER id,
    ADD COLUMN location_id INT AFTER client_id;


-- ── 4. ADD location_id TO survey_submissions ───────────────

ALTER TABLE survey_submissions
    ADD COLUMN location_id INT AFTER location_text;


-- ── 5. SEED: example clients ───────────────────────────────

INSERT INTO clients (name, short_name, contact_email, status) VALUES
    ('DC Department of Health',           'DC Health',   'info@dchealth.dc.gov',    'active'),
    ('WellCentric Health Group DC',       'WellCentric', 'admin@wellcentric.org',   'active'),
    ('DC Office of Neighborhood Safety',  'ONS',         'info@ons.dc.gov',         'active');


-- ── 6. SEED: example locations ─────────────────────────────

INSERT INTO locations (name, address, ward_id, location_type) VALUES
    ('Ballou High School',            '3401 4th St SE, Washington DC',       4, 'school'),
    ('Anacostia Community Center',    '1800 Anacostia Dr SE, Washington DC', 8, 'community_center'),
    ('Congress Heights Health Clinic','4000 Southern Ave SE, Washington DC', 8, 'clinic'),
    ('Alabama Ave & 14th St SE',      'Alabama Ave & 14th St SE',            8, 'intersection'),
    ('Ward 4 Community Center',       '5901 13th St NW, Washington DC',      4, 'community_center');


-- ── 7. ADD FOREIGN KEYS (wards.id confirmed INT) ──────────

ALTER TABLE locations
    ADD CONSTRAINT fk_locations_ward
        FOREIGN KEY (ward_id) REFERENCES wards(id);

ALTER TABLE surveys
    ADD CONSTRAINT fk_surveys_client
        FOREIGN KEY (client_id) REFERENCES clients(id),
    ADD CONSTRAINT fk_surveys_location
        FOREIGN KEY (location_id) REFERENCES locations(id);

ALTER TABLE survey_submissions
    ADD CONSTRAINT fk_submissions_location
        FOREIGN KEY (location_id) REFERENCES locations(id);
