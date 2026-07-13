-- ============================================================================
-- Fix categories seed idempotency (migration 20260704220000 was not idempotent)
-- ============================================================================
-- Problem: 20260704220000 generated parent category UUIDs via gen_random_uuid()
-- on every run and used ON CONFLICT DO NOTHING without a target column. Since
-- the UUIDs differ each run, re-running the migration creates DUPLICATE parents
-- and subcategories (7 parents + 37 subs duplicated per run).
--
-- Fix: add a unique constraint on (slug, is_system) so system categories are
-- identifiable by slug, and make the seed INSERTs use ON CONFLICT (slug).
--
-- This migration also cleans up duplicates that may already exist from prior
-- re-runs: keeps the lowest-id row per (slug, is_system) and removes the rest
-- (re-parenting subcategories to the kept parent first).
--
-- MUST be run manually on Supabase SQL Editor — migrations are NOT auto-applied.
-- ============================================================================

-- 1. Add unique constraint on (slug, is_system) for system categories.
--    Allow user categories to have NULL slug or duplicate slugs.
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_system_slug
  ON public.categories (slug)
  WHERE is_system = true AND slug IS NOT NULL;

-- 2. Clean up duplicate system categories created by re-running 20260704220000.
--    Keep the row with the smallest id per slug; reparent subcategories first.
--    (Guarded — only runs if duplicates exist.)
DO $$
DECLARE
  r RECORD;
  v_keep_id UUID;
BEGIN
  FOR r IN
    SELECT slug
    FROM public.categories
    WHERE is_system = true AND slug IS NOT NULL
    GROUP BY slug
    HAVING COUNT(*) > 1
  LOOP
    -- The row to keep (deterministic: smallest id)
    SELECT id INTO v_keep_id
    FROM public.categories
    WHERE slug = r.slug AND is_system = true
    ORDER BY id
    LIMIT 1;

    -- Reparent subcategories whose parent is a duplicate onto the kept row
    UPDATE public.categories
    SET parent_id = v_keep_id
    WHERE parent_id IN (
      SELECT id FROM public.categories
      WHERE slug = r.slug AND is_system = true AND id != v_keep_id
    );

    -- Reassign transactions referencing a duplicate category to the kept row
    UPDATE public.transactions
    SET category_id = v_keep_id
    WHERE category_id IN (
      SELECT id FROM public.categories
      WHERE slug = r.slug AND is_system = true AND id != v_keep_id
    );

    -- Delete the duplicates
    DELETE FROM public.categories
    WHERE slug = r.slug AND is_system = true AND id != v_keep_id;
  END LOOP;
END $$;

-- 3. Re-seed the 7 new parents idempotently using ON CONFLICT (slug).
--    These mirror 20260704220000 but are safe to re-run.
INSERT INTO public.categories (user_id, name, type, icon, color, is_system, i18n_key, slug)
VALUES
  (NULL, '🐕 Thú cưng', 'expense', '🐕', '#D4A574', true, 'categories.pets', 'pets'),
  (NULL, '⚽ Thể thao & Fitness', 'expense', '⚽', '#22C55E', true, 'categories.sports', 'sports'),
  (NULL, '🛡️ Bảo hiểm', 'expense', '🛡️', '#1E40AF', true, 'categories.insurance', 'insurance'),
  (NULL, '🧾 Thuế & Phí', 'expense', '🧾', '#78716C', true, 'categories.taxes', 'taxes'),
  (NULL, '💻 Công nghệ', 'expense', '💻', '#0EA5E9', true, 'categories.technology', 'technology'),
  (NULL, '🏘️ Cho thuê', 'income', '🏘️', '#8B5CF6', true, 'categories.rental', 'rental'),
  (NULL, '👴 Hưu trí & Trợ cấp', 'income', '👴', '#F59E0B', true, 'categories.pension', 'pension')
ON CONFLICT (slug) WHERE is_system = true DO NOTHING;
