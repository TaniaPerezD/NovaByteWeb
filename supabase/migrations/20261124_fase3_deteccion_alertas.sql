-- Fase 3 (detección y alertas) - NB-POL-P6-06 y NB-PRO-P3-04.
-- Alertas de seguridad para el OSI, región, bloqueo por origen, dispositivos, límites de uso y reglas R1 a R8.

create or replace function public.red_ip(p_ip text)
returns text language sql immutable set search_path = public, pg_temp as $$
  select case
    when p_ip like '%:%' then split_part(p_ip, ':', 1) || ':' || split_part(p_ip, ':', 2) || ':' || split_part(p_ip, ':', 3)
    when p_ip like '%.%' then split_part(p_ip, '.', 1) || '.' || split_part(p_ip, '.', 2)
    else coalesce(p_ip, '') end
$$;

-- 1) Alertas de seguridad (NB-POL-P6-06, 6.4): crítica = revisión en 1 hora; normal = 1 día hábil
create table if not exists public.alerta_seguridad (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  regla text not null,
  nivel text not null check (nivel in ('normal', 'critica')),
  titulo text not null,
  detalle jsonb not null default '{}'::jsonb,
  ip text,
  clave text,
  avisar_paciente boolean not null default true,
  creada_en timestamptz not null default now(),
  vence_revision timestamptz not null,
  estado text not null default 'abierta' check (estado in ('abierta', 'revisada', 'falso_positivo', 'confirmada')),
  revisada_por uuid,
  revisada_en timestamptz,
  nota text check (nota is null or length(nota) <= 1000),
  notificada_osi boolean not null default false,
  notificada_paciente boolean not null default false
);
create index if not exists alerta_seguridad_estado_idx on public.alerta_seguridad (estado, vence_revision);
create index if not exists alerta_seguridad_dedupe_idx on public.alerta_seguridad (regla, clave, creada_en desc);
alter table public.alerta_seguridad enable row level security;
drop policy if exists "alertas: medicoAdmin ve todas" on public.alerta_seguridad;
create policy "alertas: medicoAdmin ve todas" on public.alerta_seguridad for select to authenticated
  using ((select public.mi_rol()) = 'medicoAdmin');
revoke all on public.alerta_seguridad from anon, authenticated;
grant select on public.alerta_seguridad to authenticated;

-- 2) Tablas de apoyo (solo las usan las funciones del servidor)
create table if not exists public.bloqueo_origen (
  ip text primary key, hasta timestamptz not null, motivo text not null, creado_en timestamptz not null default now());
create table if not exists public.intento_ingreso_fallido (
  id bigint generated always as identity primary key, ip text, email text, creado_en timestamptz not null default now());
create index if not exists intento_fallido_ip_idx on public.intento_ingreso_fallido (ip, creado_en desc);
create table if not exists public.geoip_cache (
  ip text primary key, pais text, consultado_en timestamptz not null default now());
create table if not exists public.dispositivo_conocido (
  user_id uuid not null references auth.users(id) on delete cascade,
  huella text not null, ip text, user_agent text,
  primera_vez timestamptz not null default now(), ultima_vez timestamptz not null default now(),
  primary key (user_id, huella));
create table if not exists public.habilitacion_exterior (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hasta timestamptz not null, creada_en timestamptz not null default now());
create table if not exists public.restriccion_cuenta (
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('descargas', 'reauth')),
  desde timestamptz not null default now(), hasta timestamptz, motivo text,
  primary key (user_id, tipo));
do $$ declare t text; begin
  foreach t in array array['bloqueo_origen', 'intento_ingreso_fallido', 'geoip_cache', 'dispositivo_conocido', 'habilitacion_exterior', 'restriccion_cuenta'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- 3) Crear una alerta (con control de repetidos) y avisar por correo
create or replace function public.crear_alerta(
  p_user uuid, p_regla text, p_nivel text, p_titulo text, p_detalle jsonb default '{}'::jsonb,
  p_ip text default null, p_ventana interval default '1 hour', p_avisar_paciente boolean default true, p_clave text default null)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_clave text := coalesce(p_clave, p_user::text, p_ip, 'general');
begin
  select a.id into v_id from public.alerta_seguridad a
   where a.regla = p_regla and a.clave = v_clave and a.creada_en > now() - p_ventana limit 1;
  if v_id is not null then return v_id; end if;
  insert into public.alerta_seguridad(user_id, regla, nivel, titulo, detalle, ip, clave, avisar_paciente, vence_revision)
    values (p_user, p_regla, p_nivel, p_titulo, coalesce(p_detalle, '{}'::jsonb), left(p_ip, 60), v_clave, p_avisar_paciente,
            case when p_nivel = 'critica' then now() + interval '1 hour' else public.dias_habiles(now(), 1) end)
    returning id into v_id;
  if p_user is not null and p_avisar_paciente then
    insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
      values (p_user, 'alerta_' || lower(replace(p_regla, '-', '_')), case when p_nivel = 'critica' then 'alto' else 'medio' end,
              jsonb_build_object('regla', p_regla, 'ip', left(p_ip, 60)));
  end if;
  begin
    perform net.http_post(url := 'https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/notificar-alerta',
                          headers := jsonb_build_object('Content-Type', 'application/json'),
                          body := jsonb_build_object('alerta_id', v_id));
  exception when others then raise notice 'no se pudo avisar la alerta: %', sqlerrm; end;
  return v_id;
end $$;
revoke all on function public.crear_alerta(uuid, text, text, text, jsonb, text, interval, boolean, text) from public, anon, authenticated;
grant execute on function public.crear_alerta(uuid, text, text, text, jsonb, text, interval, boolean, text) to service_role;

-- 4) Evaluación del ingreso (después de verificar la contraseña): origen bloqueado, región (R3), dispositivo nuevo, horario del personal
create or replace function public.evaluar_ingreso(p_user uuid, p_ip text, p_pais text, p_huella text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_rol text; v_hora integer; v_conoce boolean; v_otros boolean;
begin
  select rol into v_rol from public.perfil where id = p_user;
  if exists (select 1 from public.bloqueo_origen where ip = p_ip and hasta > now()) then
    return jsonb_build_object('permitido', false, 'motivo', 'origen_bloqueado');
  end if;
  if v_rol = 'paciente' then
    if p_pais is not null and p_pais <> 'BO'
       and not exists (select 1 from public.habilitacion_exterior h where h.user_id = p_user and h.hasta > now()) then
      perform public.crear_alerta(p_user, 'R3', 'normal', 'Ingreso rechazado desde un país no habilitado',
                                  jsonb_build_object('pais', p_pais), p_ip);
      return jsonb_build_object('permitido', false, 'motivo', 'region', 'pais', p_pais);
    end if;
    select exists (select 1 from public.dispositivo_conocido where user_id = p_user and huella = p_huella) into v_conoce;
    select exists (select 1 from public.dispositivo_conocido where user_id = p_user) into v_otros;
    if not v_conoce and v_otros then
      perform public.crear_alerta(p_user, 'DISP', 'normal', 'Ingreso desde un dispositivo nuevo',
                                  jsonb_build_object('pais', p_pais), p_ip, interval '1 day');
    end if;
  elsif v_rol in ('medico', 'medicoAdmin') then
    v_hora := extract(hour from now() at time zone 'America/La_Paz');
    if v_hora >= 22 or v_hora < 6 then
      perform public.crear_alerta(p_user, 'P3-04', 'normal', 'Ingreso del personal fuera de horario',
                                  jsonb_build_object('hora_local', v_hora), p_ip, interval '1 day', false);
    end if;
  end if;
  return jsonb_build_object('permitido', true);
end $$;
revoke all on function public.evaluar_ingreso(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.evaluar_ingreso(uuid, text, text, text) to service_role;

-- 5) R2: fallos en 5 o más cuentas desde el mismo origen en 10 minutos -> se bloquea el origen 1 hora
create or replace function public.registrar_fallo_ingreso(p_ip text, p_email text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare n integer;
begin
  if p_ip is null or p_ip = '' then return; end if;
  insert into public.intento_ingreso_fallido(ip, email) values (left(p_ip, 60), left(lower(coalesce(p_email, '')), 200));
  select count(distinct email) into n from public.intento_ingreso_fallido where ip = left(p_ip, 60) and creado_en > now() - interval '10 minutes';
  if n >= 5 then
    insert into public.bloqueo_origen(ip, hasta, motivo) values (left(p_ip, 60), now() + interval '1 hour', 'R2')
      on conflict (ip) do update set hasta = now() + interval '1 hour', motivo = 'R2';
    perform public.crear_alerta(null, 'R2', 'critica', 'Intentos fallidos en 5 o más cuentas desde el mismo origen',
                                jsonb_build_object('cuentas', n, 'bloqueo', '1 hora'), p_ip, interval '1 hour', false, p_ip);
  end if;
end $$;
revoke all on function public.registrar_fallo_ingreso(text, text) from public, anon, authenticated;
grant execute on function public.registrar_fallo_ingreso(text, text) to service_role;

create or replace function public.registrar_dispositivo(p_user uuid, p_huella text, p_ip text, p_ua text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.dispositivo_conocido(user_id, huella, ip, user_agent) values (p_user, p_huella, left(p_ip, 60), left(p_ua, 300))
    on conflict (user_id, huella) do update set ultima_vez = now(), ip = excluded.ip;
end $$;
revoke all on function public.registrar_dispositivo(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.registrar_dispositivo(uuid, text, text, text) to service_role;

-- 6) R1: tres bloqueos de la cuenta en 24 horas generan alerta
create or replace function public.bloquear_por_codigos()
returns trigger language plpgsql security definer set search_path = public, auth as $function$
declare intentos int; existe_perfil boolean; ultimo_desbloqueo timestamptz; bloqueos int;
begin
  select max(creado_en) into ultimo_desbloqueo from public.actividad_sospechosa where user_id = new.user_id and tipo = 'desbloqueo';
  select count(*) into intentos from public.actividad_sospechosa
   where user_id = new.user_id and tipo in ('codigo_incorrecto', 'contrasena_incorrecta')
     and creado_en > now() - interval '15 minutes' and creado_en > coalesce(ultimo_desbloqueo, '-infinity'::timestamptz);
  select exists (select 1 from public.perfil where id = new.user_id) into existe_perfil;
  if not existe_perfil then return new; end if;
  if intentos >= 3 then
    perform set_config('nb.permitir_bloqueo', 'on', true);
    update public.perfil set bloqueado = true, motivo_bloqueo = 'intentos', bloqueado_en = now()
     where id = new.user_id and bloqueado is distinct from true;
    if found then
      begin
        insert into public.actividad_sospechosa (user_id, tipo, nivel, detalle, procesado)
        values (new.user_id, 'bloqueo', 'alto',
                jsonb_build_object('razon', 'demasiados intentos fallidos (contrasena o 2FA) en 15m', 'intentos', intentos, 'fecha', now()), false);
      exception when others then raise notice 'no se pudo insertar evento de bloqueo: %', sqlerrm; end;
      begin
        select count(*) into bloqueos from public.actividad_sospechosa where user_id = new.user_id and tipo = 'bloqueo' and creado_en > now() - interval '24 hours';
        if bloqueos >= 3 then
          perform public.crear_alerta(new.user_id, 'R1', 'normal', 'Tres bloqueos de la cuenta en 24 horas',
                                      jsonb_build_object('bloqueos', bloqueos), null, interval '1 day');
        end if;
      exception when others then raise notice 'no se pudo crear la alerta R1: %', sqlerrm; end;
    end if;
  end if;
  return new;
end $function$;

-- 7) Reautenticación reforzada y restricciones
create or replace function public.reauth_pendiente(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.restriccion_cuenta r
    where r.user_id = p_user and r.tipo = 'reauth'
      and not exists (select 1 from public.codigo_verificacion c where c.user_id = p_user and c.usado and c.creado_en > r.desde))
$$;
revoke all on function public.reauth_pendiente(uuid) from public, anon, authenticated;

create or replace function public.sesion_vigente()
returns boolean language sql stable security definer set search_path = public, auth as $$
  select public.sesion_existe() and (
    coalesce((select p.rol from public.perfil p where p.id = auth.uid()), '') <> 'paciente'
    or (
      exists (
        select 1 from public.aceptacion_terminos a
        join public.terminos t on t.version = a.version and t.vigente
        where a.user_id = auth.uid())
      and public.ci1_otorgado(auth.uid())
      and not public.reauth_pendiente(auth.uid())
    )
  )
$$;

create or replace function public.estado_sesion()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare p record; pend boolean := false; pend_ci boolean := false; reauth boolean := false;
begin
  if not public.sesion_existe() then return jsonb_build_object('valida', false); end if;
  select rol, bloqueado, activo into p from public.perfil where id = auth.uid();
  if not found then return jsonb_build_object('valida', false); end if;
  if p.rol = 'paciente' then
    pend := not exists (
      select 1 from public.aceptacion_terminos a
      join public.terminos t on t.version = a.version and t.vigente
      where a.user_id = auth.uid());
    pend_ci := not public.ci1_otorgado(auth.uid());
    reauth := public.reauth_pendiente(auth.uid());
  end if;
  return jsonb_build_object('valida', true, 'rol', p.rol, 'bloqueado', coalesce(p.bloqueado, false),
                            'activo', coalesce(p.activo, true), 'terminos_pendientes', pend,
                            'consentimiento_pendiente', pend_ci, 'reauth_pendiente', reauth);
end $$;

-- 8) R6: sesiones simultáneas desde lugares distintos -> se cierran todas las sesiones y se alerta
create or replace function public.latido()
returns void language plpgsql security definer set search_path = public, auth as $$
declare sid uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid; hdr json; v_ip text; v_rol text; v_otra record;
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  begin hdr := current_setting('request.headers', true)::json; exception when others then hdr := null; end;
  v_ip := left(coalesce(nullif(split_part(coalesce(hdr->>'x-forwarded-for', ''), ',', 1), ''), hdr->>'cf-connecting-ip'), 60);
  insert into public.sesion_actividad(session_id, user_id, ultima_actividad, ip, user_agent)
    values (sid, auth.uid(), now(), v_ip, left(hdr->>'user-agent', 300))
    on conflict (session_id) do update set ultima_actividad = now();
  select rol into v_rol from public.perfil where id = auth.uid();
  if v_rol = 'paciente' and v_ip is not null then
    select a.ip into v_otra from public.sesion_actividad a
     where a.user_id = auth.uid() and a.session_id <> sid and a.ultima_actividad > now() - interval '2 minutes'
       and a.ip is not null and public.red_ip(a.ip) <> public.red_ip(v_ip) limit 1;
    if found then
      perform public.crear_alerta(auth.uid(), 'R6', 'critica', 'Sesiones simultáneas desde lugares distintos',
                                  jsonb_build_object('accion', 'se cerraron todas las sesiones'), v_ip, interval '10 minutes');
      delete from auth.sessions where user_id = auth.uid();
    end if;
  end if;
end $$;

-- 9) Acceso a expedientes: R8 (personal sin cita) y límite de consultas de la paciente (20 por hora -> reautenticación)
create or replace function public.registrar_acceso(p_objeto text, p_objeto_id uuid default null, p_cuenta uuid default null, p_accion text default 'consulta')
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_rol text; hdr json; v_ip text; n integer;
begin
  if not public.sesion_vigente() then raise exception 'Sesion no valida' using errcode = '42501'; end if;
  select rol into v_rol from public.perfil where id = auth.uid();
  if v_rol is null then raise exception 'Sin perfil' using errcode = '42501'; end if;
  if p_accion not in ('consulta', 'descarga', 'envio', 'exportacion') then raise exception 'Accion no valida' using errcode = '22023'; end if;
  if v_rol = 'paciente' then p_cuenta := auth.uid(); end if;
  begin hdr := current_setting('request.headers', true)::json; exception when others then hdr := null; end;
  v_ip := left(coalesce(nullif(split_part(coalesce(hdr ->> 'x-forwarded-for', ''), ',', 1), ''), hdr ->> 'cf-connecting-ip'), 60);
  insert into public.audit_log(actor_id, actor_rol, cuenta_id, accion, objeto, objeto_id, ip, user_agent)
  values (auth.uid(), v_rol, p_cuenta, p_accion, left(p_objeto, 60), p_objeto_id, v_ip, left(hdr ->> 'user-agent', 300));

  -- R8: el personal abre un expediente sin una cita asociada -> alerta al OSI, sin bloqueo
  if v_rol in ('medico', 'medicoAdmin') and p_cuenta is not null and p_accion in ('consulta', 'descarga', 'exportacion')
     and not exists (select 1 from public.cita where paciente_id = p_cuenta and medico_id = auth.uid()) then
    perform public.crear_alerta(p_cuenta, 'R8', 'normal', 'Acceso del personal a un expediente sin una cita asociada',
                                jsonb_build_object('actor', auth.uid(), 'rol', v_rol, 'objeto', left(p_objeto, 60)), v_ip,
                                interval '1 day', false, auth.uid()::text || ':' || p_cuenta::text);
  end if;

  -- Límite de consulta de resultados: 20 por hora; al superarlo se pide confirmar la identidad de nuevo
  if v_rol = 'paciente' and p_accion = 'consulta' then
    select count(*) into n from public.audit_log where actor_id = auth.uid() and accion = 'consulta' and ocurrido_en > now() - interval '1 hour';
    if n > 20 and not public.reauth_pendiente(auth.uid()) then
      insert into public.restriccion_cuenta(user_id, tipo, desde, motivo) values (auth.uid(), 'reauth', now(), 'LIM-CONS')
        on conflict (user_id, tipo) do update set desde = now(), motivo = 'LIM-CONS';
      perform public.crear_alerta(auth.uid(), 'LIM-CONS', 'normal', 'Consultas por encima del límite: se pidió confirmar la identidad',
                                  jsonb_build_object('consultas_en_1_hora', n), v_ip, interval '1 hour');
    end if;
  end if;
end $$;

-- 10) "Ver mis datos": límite de 10 descargas por hora (R5) y dispositivo nuevo (R4); los bloqueos se guardan y se informan
create or replace function public.mis_datos()
returns jsonb language plpgsql security definer set search_path = public, auth, extensions as $$
declare v jsonb; r jsonb; t text; me uuid := auth.uid(); v_consultas uuid[]; n integer; hdr json; v_huella text; v_prim timestamptz; v_ip text;
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  if (select rol from public.perfil where id = me) is distinct from 'paciente' then
    raise exception 'La exportacion es para pacientes' using errcode = '42501';
  end if;
  begin hdr := current_setting('request.headers', true)::json; exception when others then hdr := null; end;
  v_ip := left(coalesce(nullif(split_part(coalesce(hdr->>'x-forwarded-for', ''), ',', 1), ''), hdr->>'cf-connecting-ip'), 60);

  if exists (select 1 from public.restriccion_cuenta where user_id = me and tipo = 'descargas' and hasta > now()) then
    return jsonb_build_object('bloqueado', true, 'mensaje', 'Las descargas están bloqueadas temporalmente por seguridad. Intenta más tarde o comunícate con el consultorio.');
  end if;

  -- R4: descarga desde un dispositivo nuevo durante sus primeras 24 horas (la cuenta ya tenía dispositivos de confianza)
  v_huella := encode(digest(coalesce(hdr->>'user-agent', ''), 'sha256'), 'hex');
  select primera_vez into v_prim from public.dispositivo_conocido where user_id = me and huella = v_huella;
  if v_prim is not null and v_prim > now() - interval '24 hours'
     and exists (select 1 from public.dispositivo_conocido where user_id = me and huella <> v_huella and primera_vez < now() - interval '7 days') then
    insert into public.restriccion_cuenta(user_id, tipo, desde, hasta, motivo) values (me, 'descargas', now(), now() + interval '24 hours', 'R4')
      on conflict (user_id, tipo) do update set desde = now(), hasta = now() + interval '24 hours', motivo = 'R4';
    perform public.crear_alerta(me, 'R4', 'critica', 'Descarga de datos desde un dispositivo nuevo en sus primeras 24 horas',
                                jsonb_build_object('bloqueo', '24 horas'), v_ip, interval '1 hour');
    return jsonb_build_object('bloqueado', true, 'mensaje', 'Por seguridad, las descargas se habilitan 24 horas después de ingresar desde un dispositivo nuevo.');
  end if;

  -- R5: más de 10 descargas por hora
  select count(*) into n from public.actividad_sospechosa where user_id = me and tipo = 'descarga_datos_propios' and creado_en > now() - interval '1 hour';
  if n >= 10 then
    insert into public.restriccion_cuenta(user_id, tipo, desde, hasta, motivo) values (me, 'descargas', now(), now() + interval '1 hour', 'R5')
      on conflict (user_id, tipo) do update set desde = now(), hasta = now() + interval '1 hour', motivo = 'R5';
    perform public.crear_alerta(me, 'R5', 'normal', 'Descargas por encima del límite (10 por hora)',
                                jsonb_build_object('descargas_en_1_hora', n, 'bloqueo', '1 hora'), v_ip, interval '1 hour');
    return jsonb_build_object('bloqueado', true, 'mensaje', 'Llegaste al límite de 10 descargas por hora. Las descargas se bloquean por 1 hora.');
  end if;

  v := jsonb_build_object(
    'generado_en', now(),
    'perfil', (select jsonb_build_object('nombre', nombre, 'apellidos', apellidos, 'email', email,
                                         'fecha_nacimiento', fecha_nacimiento, 'cuenta_creada', created_at)
               from public.perfil where id = me));
  foreach t in array array['cita', 'consulta', 'alergia', 'antecedente', 'archivo_clinico', 'respuesta_encuesta'] loop
    execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) from public.%I x where x.paciente_id = $1', t) into r using me;
    v := v || jsonb_build_object(t, r);
  end loop;
  select coalesce(array_agg(id), '{}') into v_consultas from public.consulta where paciente_id = me;
  foreach t in array array['diagnostico', 'signos_vitales', 'receta', 'examen'] loop
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'consulta_id') then
      execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) from public.%I x where x.consulta_id = any($1)', t) into r using v_consultas;
      v := v || jsonb_build_object(t, r);
    end if;
  end loop;
  v := v || jsonb_build_object(
    'consentimientos', coalesce((select jsonb_agg(jsonb_build_object('codigo', codigo, 'version', version, 'otorgado', otorgado, 'fecha', registrado_en) order by registrado_en)
                                 from public.consentimiento where user_id = me), '[]'::jsonb),
    'solicitudes_derechos', coalesce((select jsonb_agg(jsonb_build_object('tipo', tipo, 'estado', estado, 'creada_en', creada_en, 'respuesta', respuesta) order by creada_en)
                                      from public.solicitud_derechos where user_id = me), '[]'::jsonb));
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (me, 'descarga_datos_propios', 'bajo', jsonb_build_object('fecha', now()));
  return v;
end $$;

-- 11) Acceso desde el extranjero: la paciente lo habilita hasta 30 días con reautenticación reforzada (código de los últimos 10 minutos)
create or replace function public.mi_acceso_exterior()
returns timestamptz language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  return (select hasta from public.habilitacion_exterior where user_id = auth.uid() and hasta > now());
end $$;

create or replace function public.habilitar_acceso_exterior(p_dias integer default 30)
returns timestamptz language plpgsql security definer set search_path = public, auth as $$
declare v_hasta timestamptz;
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  if (select rol from public.perfil where id = auth.uid()) is distinct from 'paciente' then
    raise exception 'Solo las pacientes habilitan el acceso desde el extranjero' using errcode = '42501';
  end if;
  if p_dias is null or p_dias < 1 or p_dias > 30 then raise exception 'Elige entre 1 y 30 dias' using errcode = '22023'; end if;
  if not exists (select 1 from public.codigo_verificacion c where c.user_id = auth.uid() and c.usado and c.creado_en > now() - interval '10 minutes') then
    raise exception 'REAUTH: confirma tu identidad con un codigo reciente' using errcode = '42501';
  end if;
  v_hasta := now() + make_interval(days => p_dias);
  insert into public.habilitacion_exterior(user_id, hasta) values (auth.uid(), v_hasta)
    on conflict (user_id) do update set hasta = excluded.hasta, creada_en = now();
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (auth.uid(), 'acceso_exterior_habilitado', 'medio', jsonb_build_object('hasta', v_hasta));
  return v_hasta;
end $$;

create or replace function public.quitar_acceso_exterior()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  delete from public.habilitacion_exterior where user_id = auth.uid();
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (auth.uid(), 'acceso_exterior_quitado', 'bajo', '{}'::jsonb);
end $$;

-- 12) Panel del OSI: alertas y su revisión (NB-POL-P6-06, 6.4 y 6.5)
create or replace function public.admin_alertas(p_estado text default null)
returns table(id uuid, regla text, nivel text, titulo text, cuenta text, ip text, detalle jsonb, creada_en timestamptz,
              vence_revision timestamptz, minutos_restantes integer, estado text, revisada_en timestamptz, nota text)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
  return query
    select a.id, a.regla, a.nivel, a.titulo, p.email, a.ip, a.detalle, a.creada_en, a.vence_revision,
           floor(extract(epoch from (a.vence_revision - now())) / 60)::integer, a.estado, a.revisada_en, a.nota
    from public.alerta_seguridad a left join public.perfil p on p.id = a.user_id
    where p_estado is null or a.estado = p_estado
    order by (a.estado <> 'abierta'), a.vence_revision
    limit 300;
end $$;

create or replace function public.admin_revisar_alerta(p_id uuid, p_estado text, p_nota text default null)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
  if p_estado not in ('revisada', 'falso_positivo', 'confirmada') then raise exception 'Estado no valido' using errcode = '22023'; end if;
  if length(trim(coalesce(p_nota, ''))) < 3 then raise exception 'Escribe una nota de la revision' using errcode = '22023'; end if;
  update public.alerta_seguridad set estado = p_estado, nota = trim(p_nota), revisada_por = auth.uid(), revisada_en = now()
   where id = p_id and estado = 'abierta';
  if not found then raise exception 'La alerta no existe o ya fue revisada' using errcode = 'P0002'; end if;
end $$;

create or replace function public.admin_alertas_resumen()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
  return jsonb_build_object(
    'abiertas', (select count(*) from public.alerta_seguridad where estado = 'abierta'),
    'vencidas', (select count(*) from public.alerta_seguridad where estado = 'abierta' and vence_revision < now()),
    'criticas_abiertas', (select count(*) from public.alerta_seguridad where estado = 'abierta' and nivel = 'critica'),
    'falsos_positivos_90d', (select count(*) from public.alerta_seguridad where estado = 'falso_positivo' and creada_en > now() - interval '90 days'),
    'confirmadas_90d', (select count(*) from public.alerta_seguridad where estado = 'confirmada' and creada_en > now() - interval '90 days'),
    'total_90d', (select count(*) from public.alerta_seguridad where creada_en > now() - interval '90 days'));
end $$;

revoke all on function public.mi_acceso_exterior() from public, anon;
revoke all on function public.habilitar_acceso_exterior(integer) from public, anon;
revoke all on function public.quitar_acceso_exterior() from public, anon;
revoke all on function public.admin_alertas(text) from public, anon;
revoke all on function public.admin_revisar_alerta(uuid, text, text) from public, anon;
revoke all on function public.admin_alertas_resumen() from public, anon;
grant execute on function public.mi_acceso_exterior() to authenticated;
grant execute on function public.habilitar_acceso_exterior(integer) to authenticated;
grant execute on function public.quitar_acceso_exterior() to authenticated;
grant execute on function public.admin_alertas(text) to authenticated;
grant execute on function public.admin_revisar_alerta(uuid, text, text) to authenticated;
grant execute on function public.admin_alertas_resumen() to authenticated;

-- 13) Limpieza diaria de datos de apoyo
select cron.schedule('limpiar-deteccion', '25 3 * * *', $cron$
  delete from public.intento_ingreso_fallido where creado_en < now() - interval '7 days';
  delete from public.geoip_cache where consultado_en < now() - interval '30 days';
  delete from public.bloqueo_origen where hasta < now() - interval '1 day';
$cron$);
