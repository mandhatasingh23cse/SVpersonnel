-- GigConnect Schema v2: Partners, Wallets, Payments, Usernames
-- Run in Supabase SQL Editor after schema.sql

-- Username login for all user roles
ALTER TABLE clients ADD COLUMN IF NOT EXISTS username VARCHAR(60) DEFAULT NULL;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS username VARCHAR(60) DEFAULT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS work_pass_active BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS work_pass_expires_at TIMESTAMPTZ DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_clients_username ON clients (username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_professionals_username ON professionals (username) WHERE username IS NOT NULL;

-- Verification document columns
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS aadhaar_pan_url VARCHAR(255) DEFAULT NULL;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS live_photo_url VARCHAR(255) DEFAULT NULL;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS pincode VARCHAR(12) DEFAULT NULL;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS partner_id INT DEFAULT NULL;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS is_partner_managed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- Partners (agencies / franchises)
CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  business_name VARCHAR(160) NOT NULL,
  city VARCHAR(120) NOT NULL,
  area VARCHAR(120) DEFAULT '',
  gst_number VARCHAR(30) DEFAULT NULL,
  pan_number VARCHAR(20) DEFAULT NULL,
  id_document_url VARCHAR(255) DEFAULT NULL,
  business_proof_url VARCHAR(255) DEFAULT NULL,
  live_photo_url VARCHAR(255) DEFAULT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE professionals
  ADD CONSTRAINT fk_professionals_partner
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;

-- Work requirements
CREATE TABLE IF NOT EXISTS work_requirements (
  id SERIAL PRIMARY KEY,
  client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_name VARCHAR(120) NOT NULL,
  client_contact VARCHAR(160) NOT NULL,
  category VARCHAR(120) NOT NULL,
  sub_category VARCHAR(120) DEFAULT '',
  location VARCHAR(180) NOT NULL,
  budget_inr INT NOT NULL DEFAULT 0,
  job_type VARCHAR(40) NOT NULL DEFAULT 'Full Time',
  description TEXT DEFAULT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client saved addresses
CREATE TABLE IF NOT EXISTS client_addresses (
  id SERIAL PRIMARY KEY,
  client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  label VARCHAR(80) NOT NULL,
  address_line VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL,
  pincode VARCHAR(12) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments ledger
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  txn_id VARCHAR(80) NOT NULL UNIQUE,
  booking_id INT DEFAULT NULL REFERENCES bookings(id) ON DELETE SET NULL,
  client_id INT DEFAULT NULL REFERENCES clients(id) ON DELETE SET NULL,
  amount_inr INT NOT NULL,
  payment_type VARCHAR(60) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'success',
  payu_status VARCHAR(60) DEFAULT NULL,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wallet balances (professionals + partners)
CREATE TABLE IF NOT EXISTS wallet_balances (
  id SERIAL PRIMARY KEY,
  owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('professional', 'partner', 'platform')),
  owner_id INT NOT NULL,
  available_inr INT NOT NULL DEFAULT 0,
  pending_inr INT NOT NULL DEFAULT 0,
  total_earned_inr INT NOT NULL DEFAULT 0,
  last_withdrawal_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uniq_wallet_owner UNIQUE (owner_type, owner_id)
);

-- Earnings records (with 15% platform fee)
CREATE TABLE IF NOT EXISTS earnings (
  id SERIAL PRIMARY KEY,
  booking_id INT DEFAULT NULL REFERENCES bookings(id) ON DELETE SET NULL,
  professional_id INT DEFAULT NULL REFERENCES professionals(id) ON DELETE SET NULL,
  partner_id INT DEFAULT NULL REFERENCES partners(id) ON DELETE SET NULL,
  gross_amount_inr INT NOT NULL,
  platform_fee_inr INT NOT NULL,
  net_amount_inr INT NOT NULL,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('professional', 'partner')),
  recipient_id INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Withdrawal requests (once per week)
CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('professional', 'partner')),
  owner_id INT NOT NULL,
  amount_inr INT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  bank_details TEXT DEFAULT NULL,
  processed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_professional ON earnings (professional_id);
CREATE INDEX IF NOT EXISTS idx_earnings_partner ON earnings (partner_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_owner ON withdrawals (owner_type, owner_id);

-- Platform wallet (admin revenue from 15% fee)
INSERT INTO wallet_balances (owner_type, owner_id, available_inr, total_earned_inr)
VALUES ('platform', 1, 0, 0)
ON CONFLICT (owner_type, owner_id) DO NOTHING;
