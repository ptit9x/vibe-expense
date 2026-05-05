-- Financial Health Reports table
-- Stores AI-generated financial health analysis reports for users

CREATE TABLE IF NOT EXISTS public.financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  health_data JSONB NOT NULL DEFAULT '{}',
  ai_analysis JSONB NOT NULL DEFAULT '{}',
  overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  grade TEXT NOT NULL DEFAULT 'C',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_financial_reports_user_id ON public.financial_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_created_at ON public.financial_reports(user_id, created_at DESC);

-- One report per user per period type per period start
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_reports_unique_period ON public.financial_reports(user_id, period_type, period_start);

-- RLS: Users can only see/manage their own reports
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial reports"
  ON public.financial_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial reports"
  ON public.financial_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial reports"
  ON public.financial_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access
GRANT ALL ON public.financial_reports TO authenticated;

-- Add financial_health notification type to app_notifications if enum exists
-- (Skip if using TEXT type for notification type)

-- Auto-notification trigger: send notification when new report is created
CREATE OR REPLACE FUNCTION public.handle_new_financial_report()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_notifications (user_id, title, body, type, link_url, is_read)
  VALUES (
    NEW.user_id,
    '🏥 Báo cáo sức khỏe tài chính mới',
    'Điểm của bạn: ' || NEW.overall_score || '/100 (Hạng ' || NEW.grade || '). Xem chi tiết!',
    'financial_health',
    '/financial-health?report=' || NEW.id,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_financial_report_created ON public.financial_reports;
CREATE TRIGGER on_financial_report_created
  AFTER INSERT ON public.financial_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_financial_report();

