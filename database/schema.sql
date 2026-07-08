-- GigConnect schema for Supabase (PostgreSQL)
-- Run this in the Supabase SQL Editor after creating your project.

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  icon_path VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  base_price_inr INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uniq_services_name UNIQUE (name),
  CONSTRAINT uniq_services_slug UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  supabase_uid VARCHAR(255) DEFAULT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uniq_clients_email UNIQUE (email),
  CONSTRAINT uniq_clients_phone UNIQUE (phone)
);

CREATE TABLE IF NOT EXISTS professionals (
  id SERIAL PRIMARY KEY,
  supabase_uid VARCHAR(255) DEFAULT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL,
  area VARCHAR(120) NOT NULL,
  years_experience INT NOT NULL DEFAULT 0,
  hourly_rate_inr INT NOT NULL DEFAULT 0,
  distance_km DECIMAL(6,2) NOT NULL DEFAULT 0,
  photo_url VARCHAR(255) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  rating_avg DECIMAL(4,2) NOT NULL DEFAULT 0,
  total_reviews INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uniq_professionals_email UNIQUE (email),
  CONSTRAINT uniq_professionals_phone UNIQUE (phone)
);

CREATE TABLE IF NOT EXISTS professional_services (
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  custom_rate_inr INT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (professional_id, service_id)
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  subject VARCHAR(120) DEFAULT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  booking_code VARCHAR(30) NOT NULL,
  client_id INT DEFAULT NULL REFERENCES clients(id) ON DELETE SET NULL,
  guest_name VARCHAR(120) DEFAULT NULL,
  guest_email VARCHAR(160) DEFAULT NULL,
  guest_phone VARCHAR(20) DEFAULT NULL,
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time_slot VARCHAR(80) NOT NULL,
  address_area VARCHAR(180) NOT NULL,
  budget_inr INT NOT NULL,
  details TEXT DEFAULT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uniq_bookings_code UNIQUE (booking_code)
);

CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings (client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_professional ON bookings (professional_id);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  booking_id INT DEFAULT NULL REFERENCES bookings(id) ON DELETE SET NULL,
  client_id INT DEFAULT NULL REFERENCES clients(id) ON DELETE SET NULL,
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT DEFAULT NULL,
  reviewer_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_professional ON reviews (professional_id);

DROP VIEW IF EXISTS professional_directory_vw;
CREATE VIEW professional_directory_vw AS
SELECT
  p.id AS id,
  p.full_name AS name,
  p.email AS email,
  p.phone AS phone,
  p.phone AS contact,
  p.city AS city,
  p.area AS area,
  p.years_experience AS experience,
  p.hourly_rate_inr AS "hourlyRateInr",
  p.distance_km AS distance,
  COALESCE(p.photo_url, '/assets/gigconnect.logo.png') AS photo,
  COALESCE(p.bio, '') AS description,
  p.is_verified AS "isVerified",
  ROUND(p.rating_avg::numeric, 1) AS ratings,
  p.total_reviews AS "totalReviews",
  MIN(COALESCE(ps.custom_rate_inr, s.base_price_inr)) AS "startingPriceInr",
  STRING_AGG(DISTINCT s.name, ', ' ORDER BY s.name) AS skills,
  p.created_at AS "createdAt"
FROM professionals p
JOIN professional_services ps ON ps.professional_id = p.id
JOIN services s ON s.id = ps.service_id
GROUP BY
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.city,
  p.area,
  p.years_experience,
  p.hourly_rate_inr,
  p.distance_km,
  p.photo_url,
  p.bio,
  p.is_verified,
  p.rating_avg,
  p.total_reviews,
  p.created_at;

DROP VIEW IF EXISTS client_booking_summary_vw;
CREATE VIEW client_booking_summary_vw AS
SELECT
  b.id,
  b.booking_code,
  b.client_id,
  b.guest_name,
  b.guest_email,
  b.guest_phone,
  b.preferred_date,
  b.preferred_time_slot,
  b.address_area,
  b.budget_inr,
  b.details,
  b.status,
  b.created_at,
  p.full_name AS professional_name,
  p.city AS professional_city,
  p.area AS professional_area,
  s.name AS service_name
FROM bookings b
JOIN professionals p ON p.id = b.professional_id
JOIN services s ON s.id = b.service_id;

DROP VIEW IF EXISTS professional_booking_summary_vw;
CREATE VIEW professional_booking_summary_vw AS
SELECT
  b.id,
  b.booking_code,
  b.professional_id,
  COALESCE(c.full_name, b.guest_name) AS client_name,
  COALESCE(c.email, b.guest_email) AS client_email,
  COALESCE(c.phone, b.guest_phone) AS client_phone,
  b.preferred_date,
  b.preferred_time_slot,
  b.address_area,
  b.budget_inr,
  b.details,
  b.status,
  b.created_at,
  s.name AS service_name
FROM bookings b
LEFT JOIN clients c ON c.id = b.client_id
JOIN services s ON s.id = b.service_id;

CREATE OR REPLACE FUNCTION refresh_professional_rating(p_professional_id INT)
RETURNS VOID AS $$
BEGIN
  UPDATE professionals
  SET
    rating_avg = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE professional_id = p_professional_id
    ), 0),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE professional_id = p_professional_id
    )
  WHERE id = p_professional_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_reviews_refresh_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM refresh_professional_rating(OLD.professional_id);
    RETURN OLD;
  END IF;

  PERFORM refresh_professional_rating(NEW.professional_id);

  IF TG_OP = 'UPDATE' AND OLD.professional_id <> NEW.professional_id THEN
    PERFORM refresh_professional_rating(OLD.professional_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_after_insert ON reviews;
CREATE TRIGGER trg_reviews_after_insert
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION trg_reviews_refresh_rating();

DROP TRIGGER IF EXISTS trg_reviews_after_update ON reviews;
CREATE TRIGGER trg_reviews_after_update
AFTER UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION trg_reviews_refresh_rating();

DROP TRIGGER IF EXISTS trg_reviews_after_delete ON reviews;
CREATE TRIGGER trg_reviews_after_delete
AFTER DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION trg_reviews_refresh_rating();

-- --- SUPER ADMIN INTEGRATION ---

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'pending';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS admin_reply TEXT DEFAULT NULL;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS supabase_uid VARCHAR(255) DEFAULT NULL;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS supabase_uid VARCHAR(255) DEFAULT NULL;

