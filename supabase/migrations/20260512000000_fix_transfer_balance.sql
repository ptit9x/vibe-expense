-- Fix get_wallet_balance to include transfer transactions
-- Transfer: money leaves source wallet (wallet_id) and arrives at destination wallet (to_wallet_id)
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_wallet_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_initial DECIMAL;
  v_money_in DECIMAL;
  v_money_out DECIMAL;
  v_transfer_in DECIMAL;
BEGIN
  SELECT initial_balance INTO v_initial FROM public.wallets WHERE id = p_wallet_id;
  
  -- Money in: income + borrow (direct to wallet)
  SELECT COALESCE(SUM(amount), 0) INTO v_money_in 
  FROM public.transactions 
  WHERE wallet_id = p_wallet_id AND type IN ('income', 'borrow');
  
  -- Money out: expense + lend + transfer (leaving wallet)
  SELECT COALESCE(SUM(amount), 0) INTO v_money_out 
  FROM public.transactions 
  WHERE wallet_id = p_wallet_id AND type IN ('expense', 'lend', 'transfer');
  
  -- Transfer in: money arriving at this wallet via to_wallet_id
  SELECT COALESCE(SUM(amount), 0) INTO v_transfer_in 
  FROM public.transactions 
  WHERE to_wallet_id = p_wallet_id AND type = 'transfer';
  
  RETURN COALESCE(v_initial, 0) + v_money_in - v_money_out + v_transfer_in;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.get_wallet_balance(p_wallet_id UUID) SET search_path = public;
