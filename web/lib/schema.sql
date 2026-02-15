-- OpenFAM Database Schema
-- Run this in your Supabase SQL Editor or via migration

-- Profiles: Child profiles with schedules and rules
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices: Network devices linked to profiles
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  mac_address TEXT NOT NULL UNIQUE,
  hostname TEXT,
  profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule rules for profiles
CREATE TABLE IF NOT EXISTS schedule_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  time_range TEXT NOT NULL, -- Format: "HH:MM-HH:MM"
  mode TEXT NOT NULL, -- 'homework', 'free_time', 'sleep'
  apps JSONB, -- Array of app rules like ["tiktok:block", "roblox:block"]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster device lookups by MAC
CREATE INDEX IF NOT EXISTS idx_devices_mac ON devices(mac_address);

-- Index for schedule lookups
CREATE INDEX IF NOT EXISTS idx_schedule_profile ON schedule_rules(profile_id);
