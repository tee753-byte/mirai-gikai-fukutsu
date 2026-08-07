-- set_active_council_session() の権限修正
--
-- この関数は「どの定例会をトップページでアクティブ表示するか」を無条件で
-- UPDATE する。作成時（20260216180000_kawasaki_schema_changes.sql）に権限の
-- 絞り込みをしていなかったため、anonキーだけで誰でも呼び出せる状態だった。
-- 存在しないUUIDを渡すと全会期が非アクティブになり、トップページの表示が壊れる。
--
-- 【重要】anon / authenticated から REVOKE するだけでは塞がらない。
-- PostgreSQLは CREATE FUNCTION 時に EXECUTE を PUBLIC 疑似ロールへ自動付与し、
-- anon も authenticated も PUBLIC 経由でその権限を継承するため。
-- 先に実装済みの get_admin_users（20260218135246）が正しく塞がっているのは、
-- 作成時に `REVOKE ... FROM public` を書いていたから。同じ形に揃える。
--
-- なお PUBLIC を剥奪すると service_role も EXECUTE を失うため、
-- 管理画面（admin/src/features/council-sessions/...、createAdminClient経由）が
-- 動かなくなる。get_admin_users と同様に service_role へ明示的に GRANT する。
REVOKE EXECUTE ON FUNCTION public.set_active_council_session(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.set_active_council_session(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_active_council_session(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_active_council_session(uuid) TO service_role;
