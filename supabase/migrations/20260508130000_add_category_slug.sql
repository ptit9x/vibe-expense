-- Add slug column to categories for stable identification of system categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug 
  ON public.categories(slug) WHERE slug IS NOT NULL;

-- Update existing system categories with slugs
-- Expense categories
UPDATE public.categories SET slug = 'food' WHERE i18n_key = 'categories.food' AND is_system = true;
UPDATE public.categories SET slug = 'transport' WHERE i18n_key = 'categories.transport' AND is_system = true;
UPDATE public.categories SET slug = 'housing' WHERE i18n_key = 'categories.housing' AND is_system = true;
UPDATE public.categories SET slug = 'entertainment' WHERE i18n_key = 'categories.entertainment' AND is_system = true;
UPDATE public.categories SET slug = 'shopping' WHERE i18n_key = 'categories.shopping' AND is_system = true;
UPDATE public.categories SET slug = 'health' WHERE i18n_key = 'categories.health' AND is_system = true;
UPDATE public.categories SET slug = 'other-expense' WHERE i18n_key = 'categories.other' AND is_system = true AND type = 'expense';
UPDATE public.categories SET slug = 'lend' WHERE i18n_key = 'categories.lend' AND is_system = true;
UPDATE public.categories SET slug = 'children' WHERE i18n_key = 'categories.children' AND is_system = true;
UPDATE public.categories SET slug = 'repay-debt' WHERE i18n_key = 'categories.repayDebt' AND is_system = true;

-- Income categories
UPDATE public.categories SET slug = 'salary' WHERE i18n_key = 'categories.salary' AND is_system = true;
UPDATE public.categories SET slug = 'gift' WHERE i18n_key = 'categories.gift' AND is_system = true;
UPDATE public.categories SET slug = 'investment' WHERE i18n_key = 'categories.investment' AND is_system = true;
UPDATE public.categories SET slug = 'borrow' WHERE i18n_key = 'categories.borrow' AND is_system = true;
UPDATE public.categories SET slug = 'collect-debt' WHERE i18n_key = 'categories.collectDebt' AND is_system = true;
