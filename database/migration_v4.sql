-- Migration v4: Client Address Storage, Usernames, & PAN Card Format Enforcements

-- 1. Add username, full street address, area, and pincode to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS username VARCHAR(80) DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS area VARCHAR(120) DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pincode VARCHAR(10) DEFAULT '';

-- 2. Ensure pan_number and gst_number exist on partners and professionals
ALTER TABLE partners ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20) DEFAULT '';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS gst_number VARCHAR(30) DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20) DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS gst_number VARCHAR(30) DEFAULT '';

-- 3. Ensure custom charges on professional_services table
ALTER TABLE professional_services ADD COLUMN IF NOT EXISTS custom_rate_inr INT DEFAULT NULL;
ALTER TABLE professional_services ADD COLUMN IF NOT EXISTS daily_rate_inr INT DEFAULT NULL;
ALTER TABLE professional_services ADD COLUMN IF NOT EXISTS project_rate_inr INT DEFAULT NULL;
