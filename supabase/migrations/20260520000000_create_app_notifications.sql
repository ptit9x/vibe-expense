-- In-app notifications table
CREATE TABLE IF NOT EXISTS public.app_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'budget_alert', 'debt_reminder', 'inactivity_reminder')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  link_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.app_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own notifications
CREATE POLICY "Users can insert own notifications"
  ON public.app_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.app_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.app_notifications FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON public.app_notifications TO authenticated;

-- Index for efficient unread count queries
CREATE INDEX IF NOT EXISTS app_notifications_user_unread_idx
  ON public.app_notifications (user_id, is_read)
  WHERE NOT is_read;