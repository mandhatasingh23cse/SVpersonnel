-- Migration v6: Comprehensive Platform Overhaul Schema Updates

-- 1. Clients Table Columns
ALTER TABLE clients ADD COLUMN IF NOT EXISTS area VARCHAR(120) DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pincode VARCHAR(12) DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS username VARCHAR(60) DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS work_credits INT NOT NULL DEFAULT 1;

-- 2. Professionals Table Columns
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS partner_id INT DEFAULT NULL;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS is_partner_managed BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Partners Table Columns
ALTER TABLE partners ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Work Requirements Table
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

-- 5. Real-Time Work Messages Table
CREATE TABLE IF NOT EXISTS work_messages (
  id SERIAL PRIMARY KEY,
  work_id INT NOT NULL REFERENCES work_requirements(id) ON DELETE CASCADE,
  sender_id INT NOT NULL,
  sender_role VARCHAR(30) NOT NULL,
  sender_name VARCHAR(120) NOT NULL,
  recipient_id INT NOT NULL,
  recipient_role VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  user_role VARCHAR(30) NOT NULL,
  amount_inr INT NOT NULL,
  method VARCHAR(50) NOT NULL,
  account_details TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
