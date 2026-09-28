-- In-app feedback: replaces the external Google Form link in Profile.
-- Insert-only by design: users submit feedback; rows are read by the owner
-- via the Supabase dashboard (service role). No UPDATE/DELETE — immutable.

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) > 0 AND char_length(content) <= 5000),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_user_created_idx
  ON public.feedback (user_id, created_at DESC);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Signed-in users can only insert their own feedback.
CREATE POLICY "feedback_insert" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Intentionally NO select/update/delete policies for clients:
-- feedback is write-only from the app; reads go through the dashboard.

-- Tables created by the CI migration runner do NOT inherit default
-- privileges for authenticated — explicit grant is this repo's convention.
-- INSERT only (no return=representation) keeps SELECT unnecessary.
GRANT INSERT ON TABLE public.feedback TO authenticated;
