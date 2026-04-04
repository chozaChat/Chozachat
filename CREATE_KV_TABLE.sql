-- Run this SQL in your Supabase SQL Editor to create the required KV store table
-- Dashboard URL: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

CREATE TABLE IF NOT EXISTS kv_store_81e39e7b (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Optional: Add an index on the key for better performance
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_81e39e7b(key);

-- Grant necessary permissions
ALTER TABLE kv_store_81e39e7b ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow service role to access the table
CREATE POLICY "Service role can do everything" ON kv_store_81e39e7b
  FOR ALL
  USING (true)
  WITH CHECK (true);
