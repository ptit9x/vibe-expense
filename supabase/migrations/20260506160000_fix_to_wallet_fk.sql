-- Fix: Add named constraint for to_wallet_id FK
-- The previous migration used inline REFERENCES without a named constraint,
-- causing PostgREST to see multiple paths to wallets table

DROP INDEX IF EXISTS idx_transactions_to_wallet_id;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_to_wallet_id_fkey,
  ADD CONSTRAINT transactions_to_wallet_id_fkey
    FOREIGN KEY (to_wallet_id)
    REFERENCES public.wallets(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_to_wallet_id
  ON public.transactions(to_wallet_id)
  WHERE to_wallet_id IS NOT NULL;