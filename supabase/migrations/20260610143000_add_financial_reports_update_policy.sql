-- Add UPDATE policy for financial_reports (required for upsert)
-- Existing policies: SELECT, INSERT, DELETE — missing UPDATE

CREATE POLICY "Users can update own financial reports"
  ON public.financial_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
