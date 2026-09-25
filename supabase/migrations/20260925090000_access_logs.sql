-- Access history: track devices & browsers used to access the account.
-- Dedup rule: one row per unique (user_id, device_type, browser, os, ip_address).
-- Re-visits from the same device+browser+IP only bump last_seen_at / login_count.
-- NOTE: no DELETE policy on purpose — history is not deletable.

CREATE TABLE IF NOT EXISTS public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type text NOT NULL DEFAULT 'unknown',   -- mobile | tablet | desktop | unknown
  browser text NOT NULL DEFAULT 'unknown',       -- e.g. "Chrome 126", "Mobile Safari 17"
  os text NOT NULL DEFAULT 'unknown',            -- e.g. "iOS 17", "Windows 11"
  ip_address text NOT NULL DEFAULT 'unknown',
  country text,
  user_agent text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  login_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Identity for dedup: same user + same device/browser/os/ip = same row (no duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS access_logs_identity_uidx
  ON public.access_logs (user_id, device_type, browser, os, ip_address);

CREATE INDEX IF NOT EXISTS access_logs_user_last_seen_idx
  ON public.access_logs (user_id, last_seen_at DESC);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_logs_select" ON public.access_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "access_logs_insert" ON public.access_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "access_logs_update" ON public.access_logs
  FOR UPDATE USING (auth.uid() = user_id);
-- Intentionally NO delete policy: access history cannot be deleted.

-- Upsert access log. Returns the row id so the client can mark "current device".
-- login_count only increments when the last visit was > 10 minutes ago,
-- so hourly token refreshes / reloads do not inflate the count.
CREATE OR REPLACE FUNCTION public.log_access(
  p_device_type text,
  p_browser text,
  p_os text,
  p_ip text,
  p_country text,
  p_user_agent text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.access_logs AS al
    (user_id, device_type, browser, os, ip_address, country, user_agent, login_count)
  VALUES (
    auth.uid(),
    COALESCE(NULLIF(trim(p_device_type), ''), 'unknown'),
    COALESCE(NULLIF(trim(p_browser), ''), 'unknown'),
    COALESCE(NULLIF(trim(p_os), ''), 'unknown'),
    COALESCE(NULLIF(trim(p_ip), ''), 'unknown'),
    NULLIF(trim(COALESCE(p_country, '')), ''),
    LEFT(COALESCE(p_user_agent, ''), 500),
    1
  )
  ON CONFLICT (user_id, device_type, browser, os, ip_address)
  DO UPDATE SET
    last_seen_at = now(),
    login_count = al.login_count
      + CASE WHEN al.last_seen_at < now() - interval '10 minutes' THEN 1 ELSE 0 END,
    country = COALESCE(EXCLUDED.country, al.country),
    user_agent = COALESCE(NULLIF(EXCLUDED.user_agent, ''), al.user_agent)
  RETURNING al.id INTO v_id;

  RETURN v_id;
END;
$$;
