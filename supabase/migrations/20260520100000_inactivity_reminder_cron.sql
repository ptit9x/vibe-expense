-- Inactivity reminder function: can be called manually or via pg_cron (if enabled)
-- Checks users with no transactions in 7 days and sends inactivity_reminder notification

-- Create the function
CREATE OR REPLACE FUNCTION check_inactive_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_user_id uuid;
  v_title text := 'Nhắc nhở hoạt động';
  v_body text := 'Bạn đã không ghi nhận giao dịch nào trong 7 ngày qua. Hãy mở app và kiểm tra tài khoản nhé!';
begin
  for v_user_id in
    select p.user_id
    from public.profiles p
    where not exists (
      select 1 from public.transactions t
      where t.user_id = p.user_id
        and t.created_at >= now() - interval '7 days'
        and t.created_at < now() - interval '1 day'
    )
    and not exists (
      select 1 from public.app_notifications n
      where n.user_id = p.user_id
        and n.type = 'inactivity_reminder'
        and n.created_at >= now() - interval '24 hours'
    )
  loop
    insert into public.app_notifications (user_id, title, body, type, link_url)
    values (v_user_id, v_title, v_body, 'inactivity_reminder', null);
  end loop;
end;
$$;

-- Schedule via pg_cron if the extension is available
-- (pg_cron must be enabled in Supabase Dashboard → Database → Extensions)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'inactivity-reminder-daily',
      '0 9 * * *',
      'SELECT check_inactive_users()'
    );
  END IF;
END
$$;
