-- ============================================================================
-- Fix category icon conflicts, missing slugs, duplicate i18n_key, emoji names
-- ============================================================================
-- Problems found in production DB (2026-09-08 audit):
--   1. 21 icons used by multiple system categories (🛡️ x3, 🚗 x3, 🏠 x3, ...)
--      → looks like "duplicate categories" in the UI.
--   2. i18n_key 'categories.insurance' used by BOTH the parent "Bảo hiểm"
--      and the health subcategory "Bảo hiểm sức khỏe".
--   3. 92 system subcategories have slug = NULL → seed migrations are still
--      not idempotent for subs; no unique protection exists for sub rows.
--   4. 5 system parents have slug = NULL (utilities, education, social,
--      other-income, business).
--   5. 7 newer parents store an emoji prefix in `name` ("🐕 Thú cưng") while
--      the icon column already carries the emoji → double emoji in pickers.
--
-- This migration is idempotent and safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Defensive dedupe of system subcategories by (parent_id, i18n_key).
--    (No duplicates exist in prod today, but local/staging DBs that re-ran
--    the non-idempotent seed 20260704220000 may have them.)
--    Keep the smallest id; reassign transactions + budgets first.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  v_keep_id UUID;
BEGIN
  FOR r IN
    SELECT parent_id, i18n_key
    FROM public.categories
    WHERE is_system = true AND parent_id IS NOT NULL AND i18n_key IS NOT NULL
    GROUP BY parent_id, i18n_key
    HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO v_keep_id
    FROM public.categories
    WHERE parent_id = r.parent_id AND i18n_key = r.i18n_key AND is_system = true
    ORDER BY id
    LIMIT 1;

    UPDATE public.transactions
    SET category_id = v_keep_id
    WHERE category_id IN (
      SELECT id FROM public.categories
      WHERE parent_id = r.parent_id AND i18n_key = r.i18n_key
        AND is_system = true AND id != v_keep_id
    );

    UPDATE public.budgets
    SET category_id = v_keep_id
    WHERE category_id IN (
      SELECT id FROM public.categories
      WHERE parent_id = r.parent_id AND i18n_key = r.i18n_key
        AND is_system = true AND id != v_keep_id
    );

    DELETE FROM public.categories
    WHERE parent_id = r.parent_id AND i18n_key = r.i18n_key
      AND is_system = true AND id != v_keep_id;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Fix duplicate i18n_key: the health subcategory currently shares
--    'categories.insurance' with the insurance parent.
-- ----------------------------------------------------------------------------
UPDATE public.categories
SET i18n_key = 'categories.healthInsurance'
WHERE is_system = true
  AND parent_id IS NOT NULL
  AND i18n_key = 'categories.insurance'
  AND slug IS NULL;

-- ----------------------------------------------------------------------------
-- 3. Resolve icon conflicts. Parent categories keep their icon; the 25
--    colliding rows below get unique replacements (verified: all 116 system
--    categories end up with 116 distinct icons).
-- ----------------------------------------------------------------------------
UPDATE public.categories
SET icon = CASE i18n_key
      WHEN 'categories.carInsurance'     THEN '🛞'  -- sub Đi lại: Bảo hiểm xe        (was 🛡️)
      WHEN 'categories.insuranceVehicle' THEN '🏍️' -- sub Bảo hiểm: Bảo hiểm xe      (was 🚗)
      WHEN 'categories.rentalVehicle'    THEN '🚙' -- sub Cho thuê: Cho thuê xe      (was 🚗)
      WHEN 'categories.fee'              THEN '🤲' -- sub Lương: Thù lao             (was 🤝)
      WHEN 'categories.socialWelfare'    THEN '🏛️' -- sub Hưu trí: Trợ cấp xã hội   (was 🤝)
      WHEN 'categories.insuranceHome'    THEN '🧯' -- sub Bảo hiểm: Bảo hiểm nhà     (was 🏠)
      WHEN 'categories.rentalHouse'      THEN '🗝️' -- sub Cho thuê: Cho thuê nhà     (was 🏠)
      WHEN 'categories.techLaptop'       THEN '🖥️' -- sub Công nghệ: Laptop          (was 💻)
      WHEN 'categories.licenseFee'       THEN '🪪' -- sub Thuế & Phí: Phí giấy phép  (was 📋)
      WHEN 'categories.books'            THEN '📖' -- sub Giáo dục: Sách vở           (was 📚)
      WHEN 'categories.gaming'           THEN '🕹️' -- sub Hưởng thụ: Đồ chơi/Game    (was 🎮)
      WHEN 'categories.incomeTax'        THEN '📊' -- sub Thuế & Phí: Thuế thu nhập  (was 💰)
      WHEN 'categories.collectDebt'      THEN '↩️' -- parent income: Thu nợ          (was 💵)
      WHEN 'categories.medicine'         THEN '💉' -- sub Sức khỏe: Thuốc men        (was 💊)
      WHEN 'categories.subscription'     THEN '🎟️' -- sub Hưởng thụ: Netflix/Spotify (was 📺)
      WHEN 'categories.insuranceTravel'  THEN '🧳' -- sub Bảo hiểm: BH du lịch       (was ✈️)
      WHEN 'categories.giftMoney'        THEN '🎉' -- sub Khác: Tiền được tặng       (was 🎁)
      WHEN 'categories.pensionPay'       THEN '🧓' -- sub Hưu trí: Lương hưu         (was 🏦)
      WHEN 'categories.phone'            THEN '📞' -- sub Sinh hoạt: ĐT di động      (was 📱)
      WHEN 'categories.courses'          THEN '🧠' -- sub Giáo dục: Khóa học         (was 💡)
      WHEN 'categories.petVet'           THEN '🐾' -- sub Thú cưng: Khám thú y       (was 🏥)
      WHEN 'categories.fines'            THEN '⚠️' -- sub Thuế & Phí: Phạt vi phạm   (was 🚨)
      WHEN 'categories.techRepair'       THEN '🔨' -- sub Công nghệ: Sửa chữa        (was 🔧)
      WHEN 'categories.salaryOvertime'   THEN '⏰' -- sub Lương: Lương làm thêm      (was 🌙)
      ELSE icon
    END
WHERE is_system = true
  AND i18n_key IN (
    'categories.carInsurance', 'categories.insuranceVehicle', 'categories.rentalVehicle',
    'categories.fee', 'categories.socialWelfare', 'categories.insuranceHome',
    'categories.rentalHouse', 'categories.techLaptop', 'categories.licenseFee',
    'categories.books', 'categories.gaming', 'categories.incomeTax',
    'categories.collectDebt', 'categories.medicine', 'categories.subscription',
    'categories.insuranceTravel', 'categories.giftMoney', 'categories.pensionPay',
    'categories.phone', 'categories.courses', 'categories.petVet',
    'categories.fines', 'categories.techRepair', 'categories.salaryOvertime'
  );

-- The renamed health sub gets its own icon (was 🛡️, shared with the parent).
UPDATE public.categories
SET icon = '🩹'
WHERE is_system = true AND i18n_key = 'categories.healthInsurance';

-- ----------------------------------------------------------------------------
-- 4. Normalize names: strip leading emoji prefix (icon column already has it).
--    "🐕 Thú cưng" → "Thú cưng", etc.
--    Emoji/symbols live at codepoints >= U+2100 (8448); Vietnamese letters
--    max out at U+1EFF (7935) and ASCII at U+007F, so peeling every leading
--    char >= 8448 removes emoji + variation selector + ZWJ safely. Covers
--    low-codepoint emoji too (⚽ = U+26BD, missed by simple range checks).
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  v_name TEXT;
BEGIN
  FOR r IN SELECT id, name FROM public.categories WHERE is_system = true LOOP
    v_name := r.name;
    WHILE v_name <> '' AND ascii(left(v_name, 1)) >= 8448 LOOP
      v_name := substr(v_name, 2);
    END LOOP;
    v_name := ltrim(v_name, ' ');
    IF v_name <> r.name THEN
      UPDATE public.categories SET name = v_name WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 5. Backfill slug for every system category missing one (kebab-case of the
--    i18n_key tail). Makes the whole category tree idempotent-protected.
-- ----------------------------------------------------------------------------
UPDATE public.categories
SET slug = lower(regexp_replace(
             regexp_replace(i18n_key, '^categories\.', ''),
             '([A-Z])', '-\1', 'g'))
WHERE is_system = true
  AND slug IS NULL
  AND i18n_key IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 6. Unique protection (both are safe only AFTER the fixes above):
--    a) system slug uniqueness (extends 20260706010000, now covers subs)
--    b) system i18n_key uniqueness — blocks duplicate subcategory seeds
--       from ever being inserted again.
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_system_slug
  ON public.categories (slug)
  WHERE is_system = true AND slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_system_i18n_key
  ON public.categories (i18n_key)
  WHERE is_system = true AND i18n_key IS NOT NULL;
