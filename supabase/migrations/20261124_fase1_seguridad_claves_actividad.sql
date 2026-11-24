-- Fase 1 (ya aplicada en Supabase): cierre de sesiones al cambiar la clave, "Mi actividad" de 12 meses,
-- search_path fijo en funciones y funciones de disparador fuera de la API.

create or replace function public.cerrar_sesiones_de(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare n integer;
begin
  delete from auth.sessions where user_id = p_user;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.cerrar_sesiones_de(uuid) from public, anon, authenticated;
grant execute on function public.cerrar_sesiones_de(uuid) to service_role;

create or replace function public.mi_actividad(p_limite integer default 200)
returns table(tipo text, nivel text, creado_en timestamptz, ip text)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  return query
    select a.tipo, a.nivel, a.creado_en, a.detalle ->> 'ip'
    from public.actividad_sospechosa a
    where a.user_id = auth.uid() and a.creado_en > now() - interval '12 months'
    order by a.creado_en desc
    limit least(coalesce(p_limite, 200), 500);
end $$;

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'fn_notificar_cita_programada','generar_recordatorio','fn_notificar_cita_creada','get_dashboard_data',
      'fn_cambiar_estado_cita','notify_cita_cancelada','set_updated_at','touch_updated_at',
      'fn_notificar_cita_cancelada','notify_alerta','hook_exigir_2fa','audit_inmutable')
      and (p.proconfig is null or not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%'))
  loop
    execute format('alter function %s set search_path = public, pg_temp', f.sig);
  end loop;
end $$;
alter function public.medico_atiende(uuid) set search_path = public, pg_temp;

revoke execute on function public.audit_encadenar() from public, anon, authenticated;
revoke execute on function public.espejo_actividad_auditoria() from public, anon, authenticated;
