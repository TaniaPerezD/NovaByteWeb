-- Fase 7b: retención legal, informes de retención y alcance, actas mensuales, archivo firmado de pistas,
-- aviso de mantenimiento y recordatorio de alertas vencidas.

-- 1) Retención legal (NB-POL-P5-13 C2, NB-POL-P6-08 C6): suspende la destrucción mientras dure un proceso
create table if not exists public.retencion_legal (
  id uuid primary key default gen_random_uuid(),
  asunto text not null check (length(trim(asunto)) between 5 and 200),
  motivo text not null check (length(trim(motivo)) >= 10),
  cuenta_id uuid,
  rango_desde timestamptz,
  rango_hasta timestamptz,
  creada_en timestamptz not null default now(),
  creada_por uuid,
  levantada_en timestamptz,
  levantada_por uuid,
  nota_levantamiento text
);
alter table public.retencion_legal enable row level security;
revoke all on public.retencion_legal from anon, authenticated;
grant select on public.retencion_legal to service_role;
drop policy if exists "osi ve retencion" on public.retencion_legal;
create policy "osi ve retencion" on public.retencion_legal for select to authenticated using ((select public.es_osi()));
grant select on public.retencion_legal to authenticated;

create or replace function public.retencion_sin_borrado() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then raise exception 'Una retención legal no se borra: se levanta con una nota' using errcode = '42501'; end if;
  if old.levantada_en is not null then raise exception 'La retención ya fue levantada' using errcode = '42501'; end if;
  if new.asunto is distinct from old.asunto or new.motivo is distinct from old.motivo or new.cuenta_id is distinct from old.cuenta_id
     or new.rango_desde is distinct from old.rango_desde or new.rango_hasta is distinct from old.rango_hasta
     or new.creada_en is distinct from old.creada_en or new.creada_por is distinct from old.creada_por then
    raise exception 'Solo se puede levantar la retención, no cambiar su contenido' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists retencion_sin_borrado on public.retencion_legal;
create trigger retencion_sin_borrado before update or delete on public.retencion_legal for each row execute function public.retencion_sin_borrado();

-- una cuenta bajo retención no se puede borrar (tampoco en cascada desde el servicio de autenticación)
create or replace function public.perfil_retenido() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.retencion_legal r where r.levantada_en is null and r.cuenta_id = old.id) then
    raise exception 'Esta cuenta está bajo retención legal: no se puede borrar' using errcode = '42501';
  end if;
  return old;
end $$;
drop trigger if exists perfil_retenido on public.perfil;
create trigger perfil_retenido before delete on public.perfil for each row execute function public.perfil_retenido();

create or replace function public.hay_retencion_activa() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.retencion_legal where levantada_en is null);
$$;
revoke all on function public.hay_retencion_activa() from public, anon, authenticated;
grant execute on function public.hay_retencion_activa() to service_role;

create or replace function public.retencion_crear(p_asunto text, p_motivo text, p_cuenta uuid default null, p_desde timestamptz default null, p_hasta timestamptz default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  perform public.exigir_osi();
  insert into public.retencion_legal (asunto, motivo, cuenta_id, rango_desde, rango_hasta, creada_por)
    values (p_asunto, p_motivo, p_cuenta, p_desde, p_hasta, auth.uid()) returning id into v_id;
  insert into public.audit_log (actor_id, actor_rol, accion, objeto, objeto_id) values (auth.uid(), public.mi_rol(), 'retencion_creada', 'retencion_legal', v_id);
  return v_id;
end $$;
create or replace function public.retencion_levantar(p_id uuid, p_nota text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.exigir_osi();
  if length(trim(coalesce(p_nota, ''))) < 10 then raise exception 'Escribe la nota formal del levantamiento (mínimo 10 caracteres)' using errcode = '22023'; end if;
  update public.retencion_legal set levantada_en = now(), levantada_por = auth.uid(), nota_levantamiento = p_nota where id = p_id and levantada_en is null;
  if not found then raise exception 'La retención no existe o ya fue levantada' using errcode = '22023'; end if;
  insert into public.audit_log (actor_id, actor_rol, accion, objeto, objeto_id) values (auth.uid(), public.mi_rol(), 'retencion_levantada', 'retencion_legal', p_id);
end $$;
revoke all on function public.retencion_crear(text, text, uuid, timestamptz, timestamptz) from public, anon;
revoke all on function public.retencion_levantar(uuid, text) from public, anon;
grant execute on function public.retencion_crear(text, text, uuid, timestamptz, timestamptz) to authenticated, service_role;
grant execute on function public.retencion_levantar(uuid, text) to authenticated, service_role;

-- 2) Informe de retención (matriz de retención + estado real)
create or replace function public.informe_retencion() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  perform public.exigir_osi();
  select jsonb_build_object(
    'generado_en', now(),
    'bitacora', (select jsonb_build_object('total', count(*), 'primera', min(ocurrido_en), 'ultima', max(ocurrido_en)) from public.audit_log),
    'respaldos', (select coalesce(jsonb_agg(jsonb_build_object('tipo', tipo, 'vigentes', n, 'ultimo', ult)), '[]') from (
        select tipo, count(*) filter (where ok and borrado_en is null) n, max(creado_en) filter (where ok) ult from public.respaldo_registro group by tipo) r),
    'retenciones_activas', (select count(*) from public.retencion_legal where levantada_en is null),
    'pistas_retenidas', (select count(*) from public.audit_log a where exists (
        select 1 from public.retencion_legal r where r.levantada_en is null
          and (r.cuenta_id is null or a.cuenta_id = r.cuenta_id or a.actor_id = r.cuenta_id)
          and (r.rango_desde is null or a.ocurrido_en >= r.rango_desde) and (r.rango_hasta is null or a.ocurrido_en <= r.rango_hasta))),
    'matriz', jsonb_build_array(
      jsonb_build_object('dato', 'Expediente clínico', 'plazo', '10 años como mínimo', 'mecanismo', 'No se borra; RLS por paciente; respaldo mensual de 10 años'),
      jsonb_build_object('dato', 'Bitácora de auditoría', 'plazo', '10 años', 'mecanismo', 'Solo escritura con huella encadenada; sin borrado manual'),
      jsonb_build_object('dato', 'Incidentes y escalamientos', 'plazo', '10 años', 'mecanismo', 'Sin borrado; incluidos en el respaldo cifrado'),
      jsonb_build_object('dato', 'Consentimientos y aceptaciones', 'plazo', 'Mientras exista la cuenta y 10 años después', 'mecanismo', 'Un registro por versión, sin borrado'),
      jsonb_build_object('dato', 'Respaldos horarios', 'plazo', '48 horas', 'mecanismo', 'Retención automática'),
      jsonb_build_object('dato', 'Respaldos diarios', 'plazo', '35 días', 'mecanismo', 'Retención automática'),
      jsonb_build_object('dato', 'Respaldos de configuración', 'plazo', '400 días', 'mecanismo', 'Retención automática'),
      jsonb_build_object('dato', 'Respaldos mensuales', 'plazo', '10 años', 'mecanismo', 'No se borran automáticamente nunca'),
      jsonb_build_object('dato', 'Cualquier dato bajo proceso legal', 'plazo', 'Hasta el levantamiento formal', 'mecanismo', 'Retención legal: detiene el borrado de respaldos y de cuentas'))
  ) into v;
  return v;
end $$;
revoke all on function public.informe_retencion() from public, anon;
grant execute on function public.informe_retencion() to authenticated, service_role;

-- 3) Informe de alcance de las políticas (NB-POL-P6-07 C8)
create or replace function public.informe_alcance() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_pac int; v_term int; v_ci1 int; v_seg int; v_per int; v_clave int;
begin
  perform public.exigir_osi();
  select count(*) into v_pac from public.perfil where rol = 'paciente' and coalesce(activo, true);
  select count(*) into v_term from public.perfil p where p.rol = 'paciente' and coalesce(p.activo, true) and exists (
    select 1 from public.aceptacion_terminos a join public.terminos t on t.version = a.version and t.vigente where a.user_id = p.id);
  select count(*) into v_ci1 from public.perfil p where p.rol = 'paciente' and coalesce(p.activo, true) and public.ci1_otorgado(p.id);
  select count(distinct user_id) into v_seg from public.seguridad_recordatorio;
  select count(*) into v_per from public.perfil where rol <> 'paciente' and coalesce(activo, true);
  select count(*) into v_clave from public.perfil where rol <> 'paciente' and coalesce(activo, true) and clave_cambiada_en >= now() - interval '90 days';
  return jsonb_build_object('generado_en', now(), 'pacientes_activas', v_pac,
    'aceptaron_terminos_vigentes', v_term, 'pct_terminos', case when v_pac = 0 then 100 else round(100.0 * v_term / v_pac, 1) end,
    'con_consentimiento_ci1', v_ci1, 'pct_ci1', case when v_pac = 0 then 100 else round(100.0 * v_ci1 / v_pac, 1) end,
    'vieron_pantalla_seguridad', v_seg, 'personal_activo', v_per, 'personal_con_clave_vigente', v_clave);
end $$;
revoke all on function public.informe_alcance() from public, anon;
grant execute on function public.informe_alcance() to authenticated, service_role;

-- la verificación de la cadena también la puede ejecutar el sistema (tareas programadas)
do $$
declare d text;
begin
  d := pg_get_functiondef('public.verificar_cadena_auditoria()'::regprocedure);
  d := replace(d, $q$if coalesce(public.mi_rol(), '') not in ('medicoAdmin', 'osi') then$q$,
                  $q$if coalesce(auth.role(), '') in ('anon', 'authenticated') and coalesce(public.mi_rol(), '') not in ('medicoAdmin', 'osi') then$q$);
  execute d;
end $$;

-- 4) Acta mensual: verificación de huecos y de la cadena, más el estado de retención (NB-POL-P6-08 C5 y C9)
create table if not exists public.acta_mensual (
  id uuid primary key default gen_random_uuid(),
  periodo text not null unique,
  cadena_valida boolean not null,
  filas_bitacora bigint not null,
  huecos bigint not null,
  informe jsonb not null,
  creada_en timestamptz not null default now()
);
alter table public.acta_mensual enable row level security;
revoke all on public.acta_mensual from anon, authenticated;
grant select on public.acta_mensual to authenticated, service_role;
drop policy if exists "osi ve actas" on public.acta_mensual;
create policy "osi ve actas" on public.acta_mensual for select to authenticated using ((select public.es_osi()));
create or replace function public.acta_sin_cambios() returns trigger language plpgsql as $$
begin raise exception 'Las actas mensuales no se modifican ni se borran' using errcode = '42501'; end $$;
drop trigger if exists acta_sin_cambios on public.acta_mensual;
create trigger acta_sin_cambios before update or delete on public.acta_mensual for each row execute function public.acta_sin_cambios();

create or replace function public.generar_acta_mensual(p_periodo text default to_char(now() at time zone 'America/La_Paz', 'YYYY-MM'))
returns uuid language plpgsql security definer set search_path = public as $$
declare v_cad jsonb; v_valida boolean; v_n bigint; v_huecos bigint; v_inf jsonb; v_id uuid;
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and coalesce(public.mi_rol(), '') not in ('medicoAdmin', 'osi') then raise exception 'No autorizado' using errcode = '42501'; end if;
  select to_jsonb(c) into v_cad from public.verificar_cadena_auditoria() c limit 1;
  v_valida := coalesce((v_cad ->> 'primer_roto') is null, true);
  v_n := coalesce((v_cad ->> 'total')::bigint, 0);
  v_huecos := v_n - coalesce((v_cad ->> 'validos')::bigint, 0); -- filas que la cadena no enlaza o cuya huella no coincide
  v_inf := jsonb_build_object('cadena', v_cad, 'respaldos', (select coalesce(jsonb_agg(jsonb_build_object('tipo', tipo, 'ultimo', ult)), '[]') from (
      select tipo, max(creado_en) filter (where ok) ult from public.respaldo_registro group by tipo) r),
    'retenciones_activas', (select count(*) from public.retencion_legal where levantada_en is null));
  insert into public.acta_mensual (periodo, cadena_valida, filas_bitacora, huecos, informe) values (p_periodo, v_valida, v_n, v_huecos, v_inf)
    on conflict (periodo) do nothing returning id into v_id;
  return v_id;
end $$;
revoke all on function public.generar_acta_mensual(text) from public, anon;
grant execute on function public.generar_acta_mensual(text) to authenticated, service_role;
select cron.schedule('acta-mensual', '30 4 1 * *', 'select public.generar_acta_mensual()')
 where not exists (select 1 from cron.job where jobname = 'acta-mensual');

-- 5) Archivo firmado de pistas (NB-POL-P6-08 C3): entrega con huella SHA-256 y firma HMAC verificable
create table if not exists public.clave_firma (id integer primary key default 1, clave text not null);
alter table public.clave_firma enable row level security;
revoke all on public.clave_firma from anon, authenticated;
insert into public.clave_firma (id, clave) values (1, encode(extensions.gen_random_bytes(32), 'hex')) on conflict (id) do nothing;

create or replace function public.exportar_pistas(p_desde timestamptz, p_hasta timestamptz)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_pistas jsonb; v_firma text; v_huella text; v_clave text;
begin
  perform public.exigir_osi();
  if p_hasta - p_desde > interval '366 days' then raise exception 'El rango máximo es de un año' using errcode = '22023'; end if;
  select coalesce(jsonb_agg(to_jsonb(a) order by a.id), '[]') into v_pistas
    from (select id, ocurrido_en, actor_id, cuenta_id, actor_rol, accion, objeto, objeto_id, ip, hash_previo, hash from public.audit_log
          where ocurrido_en >= p_desde and ocurrido_en < p_hasta order by id limit 20000) a;
  v_huella := encode(digest(v_pistas::text, 'sha256'), 'hex');
  select clave into v_clave from public.clave_firma where id = 1;
  v_firma := encode(hmac(v_huella, v_clave, 'sha256'), 'hex');
  insert into public.audit_log (actor_id, actor_rol, accion, objeto) values (auth.uid(), public.mi_rol(), 'pistas_exportadas', 'audit_log');
  return jsonb_build_object('desde', p_desde, 'hasta', p_hasta, 'generado_en', now(), 'filas', jsonb_array_length(v_pistas),
    'sha256', v_huella, 'firma_hmac', v_firma, 'pistas', v_pistas);
end $$;
create or replace function public.verificar_archivo_pistas(p_archivo jsonb)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_clave text;
begin
  perform public.exigir_osi();
  select clave into v_clave from public.clave_firma where id = 1;
  return encode(digest((p_archivo -> 'pistas')::text, 'sha256'), 'hex') = (p_archivo ->> 'sha256')
     and encode(hmac(p_archivo ->> 'sha256', v_clave, 'sha256'), 'hex') = (p_archivo ->> 'firma_hmac');
end $$;
revoke all on function public.exportar_pistas(timestamptz, timestamptz) from public, anon;
revoke all on function public.verificar_archivo_pistas(jsonb) from public, anon;
grant execute on function public.exportar_pistas(timestamptz, timestamptz) to authenticated, service_role;
grant execute on function public.verificar_archivo_pistas(jsonb) to authenticated, service_role;

-- 6) Aviso de mantenimiento dentro de la app (NB-CON-P6-03 C3)
create table if not exists public.aviso_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  mensaje text not null check (length(trim(mensaje)) between 5 and 400),
  desde timestamptz not null, hasta timestamptz not null check (hasta > desde),
  creado_por uuid, creado_en timestamptz not null default now()
);
alter table public.aviso_mantenimiento enable row level security;
revoke all on public.aviso_mantenimiento from anon, authenticated;
grant select on public.aviso_mantenimiento to service_role;
create or replace function public.avisos_vigentes() returns table(id uuid, mensaje text, desde timestamptz, hasta timestamptz)
language sql stable security definer set search_path = public as $$
  select id, mensaje, desde, hasta from public.aviso_mantenimiento where now() between desde - interval '48 hours' and hasta order by desde;
$$;
revoke all on function public.avisos_vigentes() from public;
grant execute on function public.avisos_vigentes() to anon, authenticated, service_role;
create or replace function public.crear_aviso_mantenimiento(p_mensaje text, p_desde timestamptz, p_hasta timestamptz)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  perform public.exigir_osi();
  insert into public.aviso_mantenimiento (mensaje, desde, hasta, creado_por) values (p_mensaje, p_desde, p_hasta, auth.uid()) returning id into v_id;
  insert into public.audit_log (actor_id, actor_rol, accion, objeto, objeto_id) values (auth.uid(), public.mi_rol(), 'aviso_mantenimiento', 'aviso_mantenimiento', v_id);
  return v_id;
end $$;
revoke all on function public.crear_aviso_mantenimiento(text, timestamptz, timestamptz) from public, anon;
grant execute on function public.crear_aviso_mantenimiento(text, timestamptz, timestamptz) to authenticated, service_role;

-- 7) Alertas vencidas: aviso al OSI cuando se pasa el plazo de revisión (NB-POL-P6-06 C7, NB-PRO-P3-04 C3)
alter table public.alerta_seguridad add column if not exists recordatorio_enviado boolean not null default false;
create or replace function public.recordar_alertas_vencidas() returns integer language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  for r in select id from public.alerta_seguridad where estado = 'abierta' and vence_revision < now() and not recordatorio_enviado
           and vence_revision > now() - interval '7 days' limit 20 loop
    update public.alerta_seguridad set recordatorio_enviado = true where id = r.id;
    perform net.http_post(url := 'https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/notificar-alerta',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('alerta_id', r.id, 'recordatorio', true), timeout_milliseconds := 20000);
    insert into public.audit_log (actor_rol, accion, objeto, objeto_id) values ('sistema', 'alerta_vencida', 'alerta_seguridad', r.id);
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.recordar_alertas_vencidas() from public, anon, authenticated;
grant execute on function public.recordar_alertas_vencidas() to service_role;
select cron.schedule('alertas-vencidas', '*/10 * * * *', 'select public.recordar_alertas_vencidas()')
 where not exists (select 1 from cron.job where jobname = 'alertas-vencidas');

alter table public.alerta_seguridad add column if not exists recordatorio_notificado boolean not null default false;
