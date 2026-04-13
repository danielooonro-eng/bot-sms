-- Create admins table with role-based access control
CREATE TABLE IF NOT EXISTS admins (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'helper')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_admins_created_at ON admins(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_updated_at_trigger
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION update_admins_updated_at();

-- Insert default owner admin (you should change the password hash)
-- Password hash example: $2a$10$... (bcrypt hash of "dansms@r")
-- Uncomment and update the hash below:
-- INSERT INTO admins (email, password_hash, name, role) 
-- VALUES ('danielooonro@gmail.com', '$2a$10$...', 'Daniel Adair', 'owner')
-- ON CONFLICT (email) DO NOTHING;
