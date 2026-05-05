-- Add 'financial_health' to app_notifications type check constraint

ALTER TABLE public.app_notifications
  DROP CONSTRAINT IF EXISTS app_notifications_type_check;

ALTER TABLE public.app_notifications
  ADD CONSTRAINT app_notifications_type_check
  CHECK (type IN ('info', 'warning', 'success', 'budget_alert', 'debt_reminder', 'inactivity_reminder', 'financial_health'));
