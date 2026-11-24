-- Fase 5 (gobierno técnico) - NB-POL-P3-03 (claves del personal) y NB-POL-P3-05 (pistas de auditoría).
-- Contraseñas del personal: vencen a los 90 días y no se pueden repetir las últimas 5.
-- El límite de consultas de la paciente cuenta solo los resultados (las lecturas clínicas ahora se registran todas).

alter table public.perfil add column if not exists clave_cambiada_en timestamptz;
update public.perfil set clave_cambiada_en = now() where clave_cambiada_en is null;
alter table public.perfil alter column clave_cambiada_en set default now();

create table if not exists public.clave_historial (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hash text not null,
  creado_en timestamptz not null default now());
create index if not exists clave_historial_idx on public.clave_historial (user_id, creado_en desc);
alter table public.clave_historial enable row level security;
revoke all on public.clave_historial from anon, authenticated;

-- Hash actual y los 4 anteriores: las últimas 5 claves (solo las funciones del servidor)
create or replace function public.hashes_recientes(p_user uuid)
returns text[] language sql stable security definer set search_path = public, auth as $$
  select array_remove(
    array[(select encrypted_password from auth.users where id = p_user)]
    || coalesce((select array_agg(h.hash order by h.creado_en desc) from (
         select hash, creado_en from public.clave_historial where user_id = p_user order by creado_en desc limit 4) h), '{}'::text[]),
    null)
$$;
revoke all on function public.hashes_recientes(uuid) from public, anon, authenticated;
grant execute on function public.hashes_recientes(uuid) to service_role;

create or replace function public.registrar_cambio_clave(p_user uuid, p_hash_anterior text)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if p_hash_anterior is not null and length(p_hash_anterior) > 20 then
    insert into public.clave_historial(user_id, hash) values (p_user, p_hash_anterior);
  end if;
  delete from public.clave_historial where user_id = p_user and id not in (
    select id from public.clave_historial where user_id = p_user order by creado_en desc limit 5);
  update public.perfil set clave_cambiada_en = now() where id = p_user;
end $$;
revoke all on function public.registrar_cambio_clave(uuid, text) from public, anon, authenticated;
grant execute on function public.registrar_cambio_clave(uuid, text) to service_role;

-- Ingreso: el personal con la clave vencida (90 días) debe crear una nueva
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
    if exists (select 1 from public.perfil where id = p_user and clave_cambiada_en < now() - interval '90 days') then
      return jsonb_build_object('permitido', false, 'motivo', 'clave_vencida');
    end if;
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

-- Límite de consultas: 20 por hora de resultados y expediente propio (las demás lecturas se registran sin límite)
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

  if v_rol in ('medico', 'medicoAdmin') and p_cuenta is not null and p_accion in ('consulta', 'descarga', 'exportacion')
     and not exists (select 1 from public.cita where paciente_id = p_cuenta and medico_id = auth.uid()) then
    perform public.crear_alerta(p_cuenta, 'R8', 'normal', 'Acceso del personal a un expediente sin una cita asociada',
                                jsonb_build_object('actor', auth.uid(), 'rol', v_rol, 'objeto', left(p_objeto, 60)), v_ip,
                                interval '1 day', false, auth.uid()::text || ':' || p_cuenta::text);
  end if;

  if v_rol = 'paciente' and p_accion = 'consulta' and p_objeto in ('expediente_propio', 'lectura:resultado_examen', 'lectura:archivo_clinico') then
    select count(*) into n from public.audit_log
     where actor_id = auth.uid() and accion = 'consulta' and objeto in ('expediente_propio', 'lectura:resultado_examen', 'lectura:archivo_clinico')
       and ocurrido_en > now() - interval '1 hour';
    if n > 20 and not public.reauth_pendiente(auth.uid()) then
      insert into public.restriccion_cuenta(user_id, tipo, desde, motivo) values (auth.uid(), 'reauth', now(), 'LIM-CONS')
        on conflict (user_id, tipo) do update set desde = now(), motivo = 'LIM-CONS';
      perform public.crear_alerta(auth.uid(), 'LIM-CONS', 'normal', 'Consultas por encima del límite: se pidió confirmar la identidad',
                                  jsonb_build_object('consultas_en_1_hora', n), v_ip, interval '1 hour');
    end if;
  end if;
end $$;
