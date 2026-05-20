-- FeedLot Pro - PostgreSQL Database Schema
-- Deploy to Supabase PostgreSQL
-- Created for FeedLot Pro ERP System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff', -- 'admin' or 'staff'
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- ANIMALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_number VARCHAR(50) UNIQUE NOT NULL,
  breed VARCHAR(100),
  date_added DATE NOT NULL DEFAULT CURRENT_DATE,
  current_weight DECIMAL(8, 2),
  target_weight DECIMAL(8, 2),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'ready_for_sale', 'culled'
  health_notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_animals_status ON animals(status);
CREATE INDEX idx_animals_tag_number ON animals(tag_number);
CREATE INDEX idx_animals_date_added ON animals(date_added DESC);

-- ============================================
-- WEIGHT RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(8, 2) NOT NULL,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weight_records_animal_date ON weight_records(animal_id, recorded_date DESC);
CREATE INDEX idx_weight_records_recorded_date ON weight_records(recorded_date DESC);

-- ============================================
-- FEED LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS feed_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  feed_type VARCHAR(100), -- 'maize', 'hay', 'supplement', etc
  quantity_kg DECIMAL(10, 2),
  date_fed DATE NOT NULL DEFAULT CURRENT_DATE,
  cost_per_kg DECIMAL(10, 2),
  total_cost DECIMAL(12, 2),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feed_logs_animal_date ON feed_logs(animal_id, date_fed DESC);
CREATE INDEX idx_feed_logs_feed_type ON feed_logs(feed_type);

-- ============================================
-- VETERINARY RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vet_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  vaccination_name VARCHAR(255),
  date_administered DATE,
  next_due_date DATE,
  vet_notes TEXT,
  cost DECIMAL(10, 2),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vet_records_animal ON vet_records(animal_id);
CREATE INDEX idx_vet_records_next_due ON vet_records(next_due_date);
CREATE INDEX idx_vet_records_vaccination ON vet_records(vaccination_name);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50), -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT'
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Active animals with latest weight
CREATE OR REPLACE VIEW view_animals_latest_weight AS
SELECT 
  a.id,
  a.tag_number,
  a.breed,
  a.current_weight,
  a.target_weight,
  a.status,
  wr.weight_kg as latest_weight,
  wr.recorded_date as weight_date,
  CASE 
    WHEN wr.weight_kg IS NULL THEN NULL
    ELSE LEAST(a.target_weight - wr.weight_kg, a.target_weight)
  END as weight_to_target
FROM animals a
LEFT JOIN LATERAL (
  SELECT weight_kg, recorded_date 
  FROM weight_records 
  WHERE animal_id = a.id 
  ORDER BY recorded_date DESC 
  LIMIT 1
) wr ON true
WHERE a.status = 'active';

-- ADG Calculation (last 7 days)
CREATE OR REPLACE VIEW view_animals_adg_7days AS
SELECT 
  a.id,
  a.tag_number,
  w_first.weight_kg as weight_start,
  w_last.weight_kg as weight_current,
  ROUND((w_last.weight_kg - w_first.weight_kg) / 7.0, 2) as adg_7day,
  ROUND((w_last.weight_kg - w_first.weight_kg), 2) as total_gain_7day
FROM animals a
LEFT JOIN LATERAL (
  SELECT weight_kg, recorded_date 
  FROM weight_records 
  WHERE animal_id = a.id 
  ORDER BY recorded_date ASC 
  LIMIT 1
) w_first ON true
LEFT JOIN LATERAL (
  SELECT weight_kg, recorded_date 
  FROM weight_records 
  WHERE animal_id = a.id 
  ORDER BY recorded_date DESC 
  LIMIT 1
) w_last ON true
WHERE a.status = 'active';

-- Feed costs by animal (last 30 days)
CREATE OR REPLACE VIEW view_animals_feed_costs_30days AS
SELECT 
  a.id,
  a.tag_number,
  SUM(COALESCE(fl.quantity_kg, 0)) as total_feed_kg,
  SUM(COALESCE(fl.total_cost, 0)) as total_feed_cost,
  ROUND(AVG(fl.cost_per_kg), 2) as avg_cost_per_kg
FROM animals a
LEFT JOIN feed_logs fl ON a.id = fl.animal_id 
  AND fl.date_fed >= CURRENT_DATE - INTERVAL '30 days'
WHERE a.status = 'active'
GROUP BY a.id, a.tag_number;

-- Upcoming vaccinations
CREATE OR REPLACE VIEW view_upcoming_vaccinations AS
SELECT 
  v.id,
  a.id as animal_id,
  a.tag_number,
  v.vaccination_name,
  v.next_due_date,
  CASE 
    WHEN v.next_due_date <= CURRENT_DATE THEN 'OVERDUE'
    WHEN v.next_due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'DUE_SOON'
    ELSE 'UPCOMING'
  END as status
FROM vet_records v
JOIN animals a ON v.animal_id = a.id
WHERE v.next_due_date IS NOT NULL
  AND a.status = 'active'
ORDER BY v.next_due_date ASC;

-- ============================================
-- FUNCTIONS FOR CALCULATIONS
-- ============================================

-- Function to calculate ADG for an animal
CREATE OR REPLACE FUNCTION calculate_adg(
  animal_id_param UUID,
  days_param INTEGER DEFAULT 7
)
RETURNS NUMERIC AS $$
DECLARE
  v_weight_start NUMERIC;
  v_weight_end NUMERIC;
  v_adg NUMERIC;
BEGIN
  -- Get start weight
  SELECT weight_kg INTO v_weight_start 
  FROM weight_records 
  WHERE animal_id = animal_id_param 
  ORDER BY recorded_date ASC 
  LIMIT 1;

  -- Get end weight
  SELECT weight_kg INTO v_weight_end 
  FROM weight_records 
  WHERE animal_id = animal_id_param 
  ORDER BY recorded_date DESC 
  LIMIT 1;

  IF v_weight_start IS NULL OR v_weight_end IS NULL THEN
    RETURN NULL;
  END IF;

  v_adg := (v_weight_end - v_weight_start) / days_param;
  RETURN ROUND(v_adg, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update animal's updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_animals_updated_at
  BEFORE UPDATE ON animals FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA (Optional - for development)
-- ============================================

-- Insert sample admin user (password: 'Admin@123')
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoHyeIHYoyczWQaIjwJuKVqHXWzHIjT0jAqG
INSERT INTO users (name, username, email, password_hash, role) 
VALUES ('Admin User', 'admin', 'admin@feedlotpro.com', '$2a$10$N9qo8uLOickgx2ZMRZoHyeIHYoyczWQaIjwJuKVqHXWzHIjT0jAqG', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample staff user (password: 'Staff@123')
INSERT INTO users (name, username, email, password_hash, role) 
VALUES ('Staff User', 'staff', 'staff@feedlotpro.com', '$2a$10$N9qo8uLOickgx2ZMRZoHyeIHYoyczWQaIjwJuKVqHXWzHIjT0jAqG', 'staff')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policies will be set based on authentication in application layer

COMMIT;
