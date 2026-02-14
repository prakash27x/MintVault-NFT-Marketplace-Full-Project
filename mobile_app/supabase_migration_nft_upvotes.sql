-- Run this in Supabase SQL Editor
-- Creates nft_upvotes table for mobile app upvote feature
-- Does NOT affect originality checks or other existing tables

CREATE TABLE IF NOT EXISTS nft_upvotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id TEXT NOT NULL,
  user_principal TEXT NOT NULL,
  owner_principal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nft_id, user_principal)
);

CREATE INDEX IF NOT EXISTS idx_nft_upvotes_nft_id ON nft_upvotes(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_upvotes_user ON nft_upvotes(user_principal);

ALTER TABLE nft_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all" ON nft_upvotes
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON nft_upvotes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete for all" ON nft_upvotes
  FOR DELETE USING (true);
