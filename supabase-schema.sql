-- Supabase schema for PraxionHub Business Advertising System

-- 1. Enable extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables to ensure a clean start (CAUTION: This deletes existing data)
DROP TABLE IF EXISTS request_attachments CASCADE;
DROP TABLE IF EXISTS client_requests CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS advertisements CASCADE;
DROP TABLE IF EXISTS advertisers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- 3. Category table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Advertiser profile table
CREATE TABLE advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  whatsapp_number TEXT,
  website_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Advertisement listing table
CREATE TABLE advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID REFERENCES advertisers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ad_title TEXT NOT NULL,
  ad_description TEXT NOT NULL,
  location TEXT,
  logo_url TEXT,
  banner_url TEXT,
  ad_package TEXT NOT NULL,
  duration_days INT NOT NULL DEFAULT 30,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_reference TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  expiration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Client Requests table (Project Form)
CREATE TABLE client_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  company TEXT,
  phone TEXT,
  subject TEXT,
  project_description TEXT NOT NULL,
  voice_note_url TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Attachments table for project requests
CREATE TABLE request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES client_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Seed categories
INSERT INTO categories (name) VALUES
  ('Technology'), ('Retail'), ('Food & Beverage'), ('Health'), ('Events'),
  ('Education'), ('Travel'), ('Finance'), ('Creative'), ('Services')
ON CONFLICT (name) DO NOTHING;

-- 9. Row Level Security (RLS) Configuration
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;

-- Policies: Categories
CREATE POLICY "Allow public select on categories" ON categories FOR SELECT USING (true);

-- Policies: Advertisers
CREATE POLICY "Allow public insert on advertisers" ON advertisers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on advertisers" ON advertisers FOR SELECT USING (true);

-- Policies: Advertisements
CREATE POLICY "Allow public select on approved ads" ON advertisements FOR SELECT USING (status = 'approved' OR status = 'pending');
CREATE POLICY "Allow public insert on advertisements" ON advertisements FOR INSERT WITH CHECK (true);

-- Policies: Client Requests
CREATE POLICY "Allow public insert on client_requests" ON client_requests FOR INSERT WITH CHECK (true);

-- 10. Storage Configuration
INSERT INTO storage.buckets (id, name, public) 
VALUES ('advertisement-media', 'advertisement-media', true),
       ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Allow Public Uploads" ON storage.objects;
CREATE POLICY "Allow Public Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'advertisement-media' OR bucket_id = 'attachments');

DROP POLICY IF EXISTS "Allow Public View" ON storage.objects;
CREATE POLICY "Allow Public View" ON storage.objects FOR SELECT USING (bucket_id = 'advertisement-media' OR bucket_id = 'attachments');
