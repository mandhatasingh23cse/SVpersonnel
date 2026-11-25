CREATE TABLE IF NOT EXISTS staffing_requests (
  id CHAR(36) PRIMARY KEY,
  hiring_type ENUM('permanent','corporate') NOT NULL,
  city VARCHAR(100) NOT NULL,
  requirement_text VARCHAR(1000) NOT NULL,
  contact_email VARCHAR(254) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
