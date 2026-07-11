-- Migration v3: Full Onboarding Fields and Disputes Table
-- Run this in the Supabase SQL Editor.

-- Add new professional columns for prices, radius, languages, banking, and docs
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS daily_rate_inr INT DEFAULT 0;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS project_rate_inr INT DEFAULT 0;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS languages VARCHAR(255) DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS working_radius_km INT DEFAULT 10;

-- Financial details
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS bank_name VARCHAR(160) DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS bank_account_no VARCHAR(60) DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(30) DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS upi_handle VARCHAR(120) DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS pan_number VARCHAR(30) DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS gst_number VARCHAR(30) DEFAULT '';

-- Portfolio & Certificates (Stored as JSON arrays or URLs list)
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS portfolio_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS portfolio_videos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS certificates_urls JSONB DEFAULT '[]'::jsonb;

-- Disputes Table
CREATE TABLE IF NOT EXISTS disputes (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending, resolved_refunded, dismissed
  refund_amount_inr INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for disputes lookup
CREATE INDEX IF NOT EXISTS idx_disputes_booking ON disputes (booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_client ON disputes (client_id);
CREATE INDEX IF NOT EXISTS idx_disputes_professional ON disputes (professional_id);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('client', 'professional')),
  sender_id INT NOT NULL,
  receiver_role VARCHAR(20) NOT NULL CHECK (receiver_role IN ('client', 'professional')),
  receiver_id INT NOT NULL,
  message TEXT NOT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages (sender_role, sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON chat_messages (receiver_role, receiver_id);

