-- Seed debt-related categories into the categories table
-- These are system categories (user_id = NULL)

-- Expense: "Cho vay" (Lend)
INSERT INTO public.categories (name, type, icon, color, is_system, user_id, i18n_key)
VALUES ('Cho vay', 'expense', '🤝', '#E74C3C', true, NULL, 'categories.lend')
ON CONFLICT DO NOTHING;

-- Expense: "Trả nợ" (Repay Debt)
INSERT INTO public.categories (name, type, icon, color, is_system, user_id, i18n_key)
VALUES ('Trả nợ', 'expense', '💳', '#C0392B', true, NULL, 'categories.repayDebt')
ON CONFLICT DO NOTHING;

-- Income: "Đi vay" (Borrow)
INSERT INTO public.categories (name, type, icon, color, is_system, user_id, i18n_key)
VALUES ('Đi vay', 'income', '📋', '#8E44AD', true, NULL, 'categories.borrow')
ON CONFLICT DO NOTHING;

-- Income: "Thu nợ" (Collect Debt)
INSERT INTO public.categories (name, type, icon, color, is_system, user_id, i18n_key)
VALUES ('Thu nợ', 'income', '💵', '#27AE60', true, NULL, 'categories.collectDebt')
ON CONFLICT DO NOTHING;
