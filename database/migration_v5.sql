-- Migration v5: Service Categories and Subskills Cleanup & Upgrade
-- 1. Add subskills column to services table to store JSON array of subskill strings
ALTER TABLE services ADD COLUMN IF NOT EXISTS subskills TEXT DEFAULT '[]';

-- 2. Delete outdated legacy category names from services table
DELETE FROM services WHERE name IN (
  'Guard & Security',
  'Hospital Staff',
  'Hotel Staff',
  'Outsourcing & Office',
  'Pandit Ji',
  'Interior Designing',
  'Plumbing',
  'Electricians'
);
