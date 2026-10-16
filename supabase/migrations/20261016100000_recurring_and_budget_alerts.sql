-- Recurring transactions + budget alerts (2026-10)
--
-- 1) recurring_transactions: template rows that a daily cron materializes
--    into real transactions when due.
-- 2) generate_recurring_transactions(): creates today's due transactions
--    (idempotent via template_id + due_date uniqueness) + optional reminder.
-- 3) check_budget_alerts(): compares period spending vs budgets and inserts
--    budget_alert notifications at >=80% (warning) and >=100% (exceeded),
--    deduped per budget per period per threshold.
-- 4) pg_cron schedules for both (guarded — extension may be absent).

-- ═══════════════════════════════════════════════════════════════════
-- recurring_transactions table
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  interval_count INT NOT NULL DEFAULT 1 CHECK (interval_count > 0),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month INT CHECK (day_of_month BETWEEN 1 AND 31),
  month_of_year INT CHECK (month_of_year BETWEEN 1 AND 12),
  next_due_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_select" ON public.recurring_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recurring_insert" ON public.recurring_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring_update" ON public.recurring_transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recurring_delete" ON public.recurring_transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recurring_user ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_due ON public.recurring_transactions(is_active, next_due_date);

-- Idempotency anchor: a template can only ever produce one transaction per due date
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS recurring_id UUID
  REFERENCES public.recurring_transactions(id) ON DELETE SET NULL;
DROP INDEX IF EXISTS idx_transactions_recurring_due;
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_due
  ON public.transactions(recurring_id, transaction_date);
-- Enforce one materialized row per template per due date.
-- (Partial unique index: NULLs never conflict.)
CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_recurring_due
  ON public.transactions(recurring_id, transaction_date)
  WHERE recurring_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════
-- Recurring engine
-- ═══════════════════════════════════════════════════════════════════

-- Advance a local date by one frequency step, honoring anchor fields.
-- Runs in a loop; each call moves exactly one step (no skipping), so
-- next_due_date walks forward step-by-step even if the cron was down.
CREATE OR REPLACE FUNCTION public.recurring_next_date(
  p_current DATE,
  p_frequency TEXT,
  p_interval INT,
  p_day_of_week INT,
  p_day_of_month INT,
  p_month_of_year INT
) RETURNS DATE
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  v_next DATE;
BEGIN
  CASE p_frequency
    WHEN 'daily' THEN
      v_next := p_current + (p_interval * 1);
    WHEN 'weekly' THEN
      v_next := p_current + (p_interval * 7);
      IF p_day_of_week IS NOT NULL THEN
        v_next := v_next + (((p_day_of_week - EXTRACT(DOW FROM v_next)::int) + 7) % 7);
      END IF;
    WHEN 'monthly' THEN
      v_next := (date_trunc('month', p_current) + make_interval(months => p_interval))::date;
      IF p_day_of_month IS NOT NULL THEN
        v_next := v_next + (LEAST(p_day_of_month, EXTRACT(DAY FROM (date_trunc('month', v_next) + interval '1 month - 1 day')))::int - 1);
      END IF;
    WHEN 'yearly' THEN
      v_next := (date_trunc('year', p_current) + make_interval(years => p_interval))::date;
      IF p_month_of_year IS NOT NULL AND p_day_of_month IS NOT NULL THEN
        DECLARE
          v_year INT := EXTRACT(YEAR FROM v_next)::int;
          v_days_in_month INT;
        BEGIN
          v_days_in_month := EXTRACT(DAY FROM (make_date(v_year, p_month_of_year, 1) + interval '1 month - 1 day'))::int;
          v_next := make_date(v_year, p_month_of_year, LEAST(p_day_of_month, v_days_in_month));
        END;
      END IF;
    ELSE
      v_next := p_current + p_interval;
  END CASE;
  RETURN v_next;
END;
$$;

-- Materialize all recurring templates due today (or overdue: walks forward).
CREATE OR REPLACE FUNCTION public.generate_recurring_transactions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_made INT := 0;
  v_today DATE := CURRENT_DATE;
  r RECORD;
  v_new_due DATE;
BEGIN
  FOR r IN
    SELECT * FROM public.recurring_transactions
    WHERE is_active = true
      AND next_due_date <= v_today
      AND (end_date IS NULL OR next_due_date <= end_date)
  LOOP
    -- materialize every step that has come due (catch-up after downtime)
    WHILE r.next_due_date <= v_today AND (r.end_date IS NULL OR r.next_due_date <= r.end_date) LOOP
      BEGIN
        INSERT INTO public.transactions
          (user_id, wallet_id, category_id, type, amount, description,
           transaction_date, recurring_id)
        VALUES
          (r.user_id, r.wallet_id, r.category_id, r.type, r.amount,
           COALESCE(r.description, ''), r.next_due_date, r.id)
        ON CONFLICT DO NOTHING;
        -- uq_transactions_recurring_due makes this idempotent;
        -- conflicting rows are skipped without advancing counters.
        IF FOUND THEN
          v_made := v_made + 1;
        END IF;
      END;

      v_new_due := public.recurring_next_date(
        r.next_due_date, r.frequency, r.interval_count,
        r.day_of_week, r.day_of_month, r.month_of_year
      );
      EXIT WHEN v_new_due <= r.next_due_date; -- safety: never loop forever
      UPDATE public.recurring_transactions
        SET next_due_date = v_new_due, updated_at = now()
        WHERE id = r.id;
      r.next_due_date := v_new_due;
    END LOOP;

    -- Deactivate templates that have passed their end date
    IF r.end_date IS NOT NULL AND r.next_due_date > r.end_date THEN
      UPDATE public.recurring_transactions
        SET is_active = false, updated_at = now()
        WHERE id = r.id;
    END IF;
  END LOOP;
  RETURN v_made;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Budget alerts engine
-- ═══════════════════════════════════════════════════════════════════

-- All descendant ids of a category (including itself).
CREATE OR REPLACE FUNCTION public.category_descendants(p_root UUID)
RETURNS TABLE(descendant_id UUID)
LANGUAGE sql STABLE
AS $$
  WITH RECURSIVE tree AS (
    SELECT id FROM public.categories WHERE id = p_root
    UNION ALL
    SELECT c2.id FROM public.categories c2
    JOIN tree t ON c2.parent_id = t.id
  )
  SELECT id FROM tree;
$$;

-- Period window (monthly = calendar month, weekly = ISO week Mon-Sun) in
-- LOCAL server date (Supabase runs UTC; CURRENT_DATE follows the DB timezone
-- setting — consistent within the server, which is what matters for dedupe).
CREATE OR REPLACE FUNCTION public.budget_period_window(
  p_period TEXT,
  p_now DATE
) RETURNS TABLE(start_date DATE, end_date DATE)
LANGUAGE sql IMMUTABLE
AS $$
  SELECT
    CASE
      WHEN p_period = 'weekly' THEN (p_now - ((EXTRACT(DOW FROM p_now)::int + 6) % 7))
      ELSE date_trunc('month', p_now)::date
    END,
    CASE
      WHEN p_period = 'weekly' THEN (p_now - ((EXTRACT(DOW FROM p_now)::int + 6) % 7) + 6)
      ELSE (date_trunc('month', p_now) + interval '1 month - 1 day')::date
    END;
$$;

-- Compare period spending against each budget; insert budget_alert
-- notifications at 80%/100% thresholds, deduped per budget+period+level.
CREATE OR REPLACE FUNCTION public.check_budget_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
  v_today DATE := CURRENT_DATE;
  v_start DATE;
  v_end DATE;
  v_spent NUMERIC;
  v_ratio NUMERIC;
  v_level TEXT;
  v_cat_name TEXT;
  r RECORD;
BEGIN
  FOR r IN
    SELECT b.*, c.name AS cat_name
    FROM public.budgets b
    JOIN public.categories c ON c.id = b.category_id
  LOOP
    SELECT start_date, end_date INTO v_start, v_end
    FROM public.budget_period_window(r.period, v_today);

    -- spend = expenses in budget category or its descendants, within window
    SELECT COALESCE(SUM(t.amount), 0) INTO v_spent
    FROM public.transactions t
    WHERE t.user_id = r.user_id
      AND t.type = 'expense'
      AND t.transaction_date BETWEEN v_start AND v_end
      AND t.category_id IN (
        SELECT descendant_id FROM public.category_descendants(r.category_id)
      );

    IF r.amount <= 0 THEN
      CONTINUE;
    END IF;
    v_ratio := v_spent / r.amount;

    IF v_ratio >= 1.0 THEN
      v_level := 'exceeded';
    ELSIF v_ratio >= 0.8 THEN
      v_level := 'warning';
    ELSE
      CONTINUE;
    END IF;

    -- dedupe: one notification per budget+period+level
    IF NOT EXISTS (
      SELECT 1 FROM public.app_notifications n
      WHERE n.user_id = r.user_id
        AND n.type = 'budget_alert'
        AND n.created_at >= v_start AND n.created_at <= v_end + interval '1 day'
        AND n.body LIKE '%' || r.id::text || '%'
        AND n.body LIKE '%' || v_level || '%'
    ) THEN
      IF v_level = 'exceeded' THEN
        INSERT INTO public.app_notifications (user_id, title, body, type, link_url)
        VALUES (
          r.user_id,
          'Đã vượt ngân sách',
          format('Ngân sách %s đã chi %s%% hạn mức. [%s|%s]',
                 r.cat_name, round(v_ratio * 100), r.id::text, v_level),
          'budget_alert',
          '/budgets'
        );
      ELSE
        INSERT INTO public.app_notifications (user_id, title, body, type, link_url)
        VALUES (
          r.user_id,
          'Ngân sách gần hết',
          format('Ngân sách %s đã chi %s%% hạn mức. [%s|%s]',
                 r.cat_name, round(v_ratio * 100), r.id::text, v_level),
          'budget_alert',
          '/budgets'
        );
      END IF;
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Cron schedules (guarded — pg_cron is a Pro-plan extension)
-- ═══════════════════════════════════════════════════════════════════
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'recurring-transactions-daily',
      '30 8 * * *',
      'SELECT public.generate_recurring_transactions()'
    );
    PERFORM cron.schedule(
      'budget-alerts-daily',
      '0 9 * * *',
      'SELECT public.check_budget_alerts()'
    );
  END IF;
END $do$;
