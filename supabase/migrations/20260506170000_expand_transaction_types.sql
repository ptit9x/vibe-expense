-- Update transactions type_check constraint to include 'transfer', 'lend', 'borrow'
-- These types are now supported in the application

ALTER TABLE public.transactions
  DROP CONSTRAINT transactions_type_check,
  ADD CONSTRAINT transactions_type_check
    CHECK (type IN ('income', 'expense', 'lend', 'borrow', 'transfer'));