# Supabase Upvotes Setup

NFT upvotes are stored in Supabase (mobile app only). This does **not** affect originality checks or other existing Supabase usage.

## 1. Verify Supabase anon key

The anon key is configured in `src/config/supabase.ts`. If you get API/auth errors, ensure you're using the correct key from:

**Supabase Dashboard → Settings → API → Project API keys → anon public**

(Standard Supabase keys are long JWT strings starting with `eyJ...`)

## 2. Create the upvotes table

In Supabase SQL Editor, run:

```sql
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

-- Allow public read (for counts) and insert/delete (authenticated via app logic)
ALTER TABLE nft_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all" ON nft_upvotes
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON nft_upvotes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete for all" ON nft_upvotes
  FOR DELETE USING (true);
```

## 3. Verify

Upvote an NFT in the app. Check Supabase Table Editor → `nft_upvotes` to see the row.
