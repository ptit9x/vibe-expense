-- Fix: notification_settings trigger runs as SECURITY DEFINER (postgres role)
-- but RLS uses auth.uid() which returns NULL in trigger context
-- Solution: Allow authenticated users to INSERT their own settings (for trigger + upsert)

-- Drop the blanket ALL policy
DROP POLICY IF EXISTS "Users can manage their own notification settings" ON public.notification_settings;

-- Separate policies: INSERT for trigger + user upsert, rest for user operations
CREATE POLICY "Users can insert own notification settings"
  ON public.notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own notification settings"
  ON public.notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON public.notification_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Same fix for push_subscriptions
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can insert own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access to authenticated role
GRANT ALL ON public.notification_settings TO authenticated;
GRANT ALL ON public.push_subscriptions TO authenticated;
