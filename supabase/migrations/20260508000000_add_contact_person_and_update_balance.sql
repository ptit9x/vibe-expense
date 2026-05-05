-- Add contact_person column to transactions for lend/borrow tracking
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS contact_person TEXT;

-- Update get_wallet_balance to include lend/borrow types
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_wallet_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_initial DECIMAL;
  v_income DECIMAL;
  v_expense DECIMAL;
BEGIN
  SELECT initial_balance INTO v_initial FROM public.wallets WHERE id = p_wallet_id;
  
  -- Money in: income + borrow (money received from loans)
  SELECT COALESCE(SUM(amount), 0) INTO v_income 
  FROM public.transactions 
  WHERE wallet_id = p_wallet_id AND type IN ('income', 'borrow');
  
  -- Money out: expense + lend (money given as loans)
  SELECT COALESCE(SUM(amount), 0) INTO v_expense 
  FROM public.transactions 
  WHERE wallet_id = p_wallet_id AND type IN ('expense', 'lend');
  
  RETURN COALESCE(v_initial, 0) + v_income - v_expense;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.get_wallet_balance(p_wallet_id UUID) SET search_path = public;
