-- Add to_wallet_id column for transfer transactions
-- Option A: single record with to_wallet_id (source in wallet_id, destination in to_wallet_id)

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS to_wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;

-- Index for querying transfers by destination wallet
CREATE INDEX IF NOT EXISTS idx_transactions_to_wallet_id
  ON transactions(to_wallet_id)
  WHERE to_wallet_id IS NOT NULL;

-- RLS: users can only see transfers where they own at least one wallet
-- (existing RLS on transactions already covers wallet_id ownership via user_id)
-- to_wallet_id is just metadata on the same user's transaction
