-- set_active_council_session() の権限修正
-- Supabase の ALTER DEFAULT PRIVILEGES により、SECURITY DEFINER関数であっても
-- anon/authenticated ロールに EXECUTE 権限が自動付与されてしまう。
-- この関数は「どの定例会をトップページでアクティブ表示するか」を無条件で
-- UPDATE するため、anonキーだけで誰でも呼び出せる状態は公開に危険。
-- 管理画面（admin/src/features/council-sessions/...）は service_role の
-- createAdminClient() 経由で呼んでおり、service_roleはこのREVOKEの影響を受けない。
--
-- 同種の問題を修正した 20260219054600_fix_get_admin_users_permissions.sql と同じ対応。
REVOKE EXECUTE ON FUNCTION public.set_active_council_session(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_active_council_session(uuid) FROM authenticated;
