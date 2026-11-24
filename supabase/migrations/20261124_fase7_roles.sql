-- Fase 7: los 10 roles de la matriz NB-MAT-P3-07 (denegación por defecto).
-- Roles nuevos: recepcion, director, osi, soporte, desarrollador, dba, infra, ml. «medicoAdmin» queda como rol heredado.
-- Los roles técnicos (soporte, desarrollador, dba, infra, ml) no tienen ninguna política sobre datos: la matriz les da X en todo.

alter table public.perfil drop constraint if exists perfil_rol_check;
alter table public.perfil add constraint perfil_rol_check check (rol in
  ('paciente','medico','recepcion','director','soporte','desarrollador','dba','infra','ml','osi','medicoAdmin'));

-- 1) La matriz como datos
create table if not exists public.matriz_permisos (
  rol text not null, modulo text not null, permiso text not null, nota text,
  primary key (rol, modulo)
);
alter table public.matriz_permisos enable row level security;
revoke all on public.matriz_permisos from anon, authenticated;
grant select on public.matriz_permisos to service_role;
create table if not exists public.matriz_roles (
  rol text primary key, nombre text not null, heredado boolean not null default false
);
alter table public.matriz_roles enable row level security;
revoke all on public.matriz_roles from anon, authenticated;
grant select on public.matriz_roles to service_role;

insert into public.matriz_roles (rol, nombre, heredado) values
 ('paciente','Paciente (App/Web)',false),('medico','Médico Tratante',false),('recepcion','Recepción / Administración',false),
 ('director','Director General',false),('soporte','Técnico de Soporte y Mantenimiento',false),('desarrollador','Desarrollador (Web/Móvil)',false),
 ('dba','Administrador de BD (DBA)',false),('infra','Administrador de Infraestructura y Servicios Cloud',false),
 ('ml','Especialista en IA y ML',false),('osi','Oficial de Seguridad (OSI)',false),
 ('medicoAdmin','Médico administrador (rol heredado, por reasignar)',true)
on conflict (rol) do nothing;

insert into public.matriz_permisos (rol, modulo, permiso) values
 ('paciente','agenda','L, E, B (propias)'),('paciente','expediente','L (propio)'),('paciente','imagenes','L (propio)'),('paciente','analitica','X'),('paciente','bd_produccion','X'),('paciente','datasets_ml','X'),
 ('medico','agenda','L, E (propias)'),('medico','expediente','L, E (pacientes asignados)'),('medico','imagenes','L, E'),('medico','analitica','L'),('medico','bd_produccion','X'),('medico','datasets_ml','X'),
 ('recepcion','agenda','L, E, B'),('recepcion','expediente','X'),('recepcion','imagenes','X'),('recepcion','analitica','X'),('recepcion','bd_produccion','X'),('recepcion','datasets_ml','X'),
 ('director','agenda','L'),('director','expediente','X'),('director','imagenes','X'),('director','analitica','L'),('director','bd_produccion','X'),('director','datasets_ml','X'),
 ('soporte','agenda','X'),('soporte','expediente','X'),('soporte','imagenes','X'),('soporte','analitica','X'),('soporte','bd_produccion','X'),('soporte','datasets_ml','X'),
 ('desarrollador','agenda','X'),('desarrollador','expediente','X'),('desarrollador','imagenes','X'),('desarrollador','analitica','X'),('desarrollador','bd_produccion','X'),('desarrollador','datasets_ml','X'),
 ('dba','agenda','X'),('dba','expediente','X'),('dba','imagenes','X'),('dba','analitica','X'),('dba','bd_produccion','L, E, B (estructural)'),('dba','datasets_ml','X'),
 ('infra','agenda','X'),('infra','expediente','X'),('infra','imagenes','X'),('infra','analitica','X'),('infra','bd_produccion','X'),('infra','datasets_ml','X'),
 ('ml','agenda','X'),('ml','expediente','X'),('ml','imagenes','X'),('ml','analitica','X'),('ml','bd_produccion','X'),('ml','datasets_ml','L, E'),
 ('osi','agenda','L (modo auditoría)'),('osi','expediente','L (modo auditoría)'),('osi','imagenes','L (modo auditoría)'),('osi','analitica','L'),('osi','bd_produccion','L (modo auditoría)'),('osi','datasets_ml','L (modo auditoría)'),
 ('medicoAdmin','agenda','L, E, B'),('medicoAdmin','expediente','L, E (heredado: todos los pacientes)'),('medicoAdmin','imagenes','L, E (heredado)'),('medicoAdmin','analitica','L'),('medicoAdmin','bd_produccion','X'),('medicoAdmin','datasets_ml','X')
on conflict (rol, modulo) do nothing;

-- 2) Ayudantes de rol
create or replace function public.es_osi() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol(), '') in ('medicoAdmin', 'osi');
$$;
revoke all on function public.es_osi() from public, anon;
grant execute on function public.es_osi() to authenticated, service_role;

create or replace function public.enmascarar_correo(p text) returns text language sql immutable as $$
  select case when p is null then null
              else left(split_part(p, '@', 1), 1) || '***@' || left(split_part(p, '@', 2), 1) || '***' end;
$$;
grant execute on function public.enmascarar_correo(text) to authenticated, service_role;

-- 3) Las funciones de seguridad aceptan también al OSI; el panel de analítica, al Director
do $$
declare r record; d text;
begin
  for r in select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prokind = 'f' and p.proname in
            ('admin_alertas','admin_alertas_resumen','admin_atender_solicitud','admin_bloquear_cuenta','admin_desbloquear_cuenta',
             'admin_revisar_alerta','admin_solicitudes_derechos','exigir_osi','auditoria_consultar','estado_respaldos','verificar_cadena_auditoria','get_dashboard_kpis','evaluar_ingreso')
  loop
    d := pg_get_functiondef(r.oid);
    d := replace(d, $q$coalesce(public.mi_rol(), '') <> 'medicoAdmin'$q$, $q$coalesce(public.mi_rol(), '') not in ('medicoAdmin', 'osi')$q$);
    d := replace(d, $q$not in ('medicoAdmin', 'auditor')$q$, $q$not in ('medicoAdmin', 'osi')$q$);
    d := replace(d, $q$not in ('medico', 'medicoAdmin')$q$, $q$not in ('medico', 'medicoAdmin', 'director')$q$);
    d := replace(d, $q$elsif v_rol in ('medico', 'medicoAdmin') then$q$, $q$elsif v_rol is not null then$q$);
    -- modo auditoría: el OSI ve la identidad enmascarada
    if r.proname = 'admin_alertas' then
      d := replace(d, 'a.titulo, p.email,', $q$a.titulo, case when public.mi_rol() = 'osi' then public.enmascarar_correo(p.email) else p.email end,$q$);
    elsif r.proname = 'admin_solicitudes_derechos' then
      d := replace(d, $q$trim(coalesce(p.nombre, '') || ' ' || coalesce(p.apellidos, '')), p.email, s.tipo, s.detalle,$q$,
        $q$case when public.mi_rol() = 'osi' then '(identidad enmascarada)' else trim(coalesce(p.nombre, '') || ' ' || coalesce(p.apellidos, '')) end, case when public.mi_rol() = 'osi' then public.enmascarar_correo(p.email) else p.email end, s.tipo, case when public.mi_rol() = 'osi' then '(detalle oculto en modo auditoría)' else s.detalle end,$q$);
    end if;
    execute d;
  end loop;
end $$;

-- 4) Tablas de seguridad: las ve el OSI y el rol heredado
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' and
           (policyname like 'osi ve %' or policyname in ('aceptacion: medicoAdmin ve todas','alertas: medicoAdmin ve todas','consentimiento: medicoAdmin ve todos','derechos: medicoAdmin ve todas'))
  loop
    execute format('alter policy %I on public.%I using ((select public.es_osi()))', r.policyname, r.tablename);
  end loop;
end $$;

-- 5) Recepción: agenda completa y nada del expediente
drop policy if exists "recepcion administra citas" on public.cita;
create policy "recepcion administra citas" on public.cita for all to authenticated
  using ((select public.mi_rol()) = 'recepcion') with check ((select public.mi_rol()) = 'recepcion');
drop policy if exists "recepcion administra horarios" on public.horarios_medico;
create policy "recepcion administra horarios" on public.horarios_medico for all to authenticated
  using ((select public.mi_rol()) = 'recepcion') with check ((select public.mi_rol()) = 'recepcion');
drop policy if exists "recepcion administra fechas" on public.fechas_sin_atencion;
create policy "recepcion administra fechas" on public.fechas_sin_atencion for all to authenticated
  using ((select public.mi_rol()) = 'recepcion') with check ((select public.mi_rol()) = 'recepcion');

-- Dirección: solo lectura de la agenda
drop policy if exists "director ve citas" on public.cita;
create policy "director ve citas" on public.cita for select to authenticated using ((select public.mi_rol()) = 'director');
drop policy if exists "director ve horarios" on public.horarios_medico;
create policy "director ve horarios" on public.horarios_medico for select to authenticated using ((select public.mi_rol()) = 'director');

-- Directorio para armar la agenda: solo nombre, sin ningún dato clínico ni de contacto
create or replace function public.recepcion_directorio()
returns table(id uuid, nombre text, rol text, especialidad text)
language plpgsql stable security definer set search_path = public as $$
begin
  if coalesce(public.mi_rol(), '') <> 'recepcion' then raise exception 'No autorizado' using errcode = '42501'; end if;
  return query select p.id, trim(coalesce(p.nombre, '') || ' ' || coalesce(p.apellidos, '')), p.rol, p.especialidad
    from public.perfil p where p.rol in ('paciente', 'medico', 'medicoAdmin') and coalesce(p.activo, true) order by 2;
end $$;
revoke all on function public.recepcion_directorio() from public, anon;
grant execute on function public.recepcion_directorio() to authenticated, service_role;

-- 6) Consulta de la matriz y su cumplimiento (indicador de NB-MAT-P3-07, sección 8)
create or replace function public.matriz_permisos()
returns table(rol text, nombre text, heredado boolean, modulo text, permiso text)
language plpgsql stable security definer set search_path = public as $$
begin
  if coalesce(public.mi_rol(), '') in ('', 'paciente') then raise exception 'No autorizado' using errcode = '42501'; end if;
  return query select r.rol, r.nombre, r.heredado, m.modulo, m.permiso
    from public.matriz_roles r join public.matriz_permisos m on m.rol = r.rol order by r.heredado, r.nombre, m.modulo;
end $$;
revoke all on function public.matriz_permisos() from public, anon;
grant execute on function public.matriz_permisos() to authenticated, service_role;

create or replace function public.matriz_estado()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_total int; v_ok int; v_her int; v_roles jsonb;
begin
  if coalesce(public.mi_rol(), '') not in ('medicoAdmin', 'osi', 'director') then raise exception 'No autorizado' using errcode = '42501'; end if;
  select count(*), count(*) filter (where p.rol in (select rol from public.matriz_roles where not heredado)),
         count(*) filter (where p.rol in (select rol from public.matriz_roles where heredado))
    into v_total, v_ok, v_her from public.perfil p where coalesce(p.activo, true);
  select coalesce(jsonb_agg(jsonb_build_object('rol', r.rol, 'nombre', r.nombre, 'heredado', r.heredado,
         'cuentas', (select count(*) from public.perfil p where p.rol = r.rol and coalesce(p.activo, true))) order by r.heredado, r.nombre), '[]')
    into v_roles from public.matriz_roles r;
  return jsonb_build_object('cuentas_activas', v_total, 'conformes', v_ok, 'con_rol_heredado', v_her,
    'porcentaje', case when v_total = 0 then 100 else round(100.0 * v_ok / v_total, 1) end, 'roles', v_roles);
end $$;
revoke all on function public.matriz_estado() from public, anon;
grant execute on function public.matriz_estado() to authenticated, service_role;

-- 7) Reasignar el rol de una cuenta (solo el rol heredado; queda en la bitácora por el disparador de perfil)
create or replace function public.reasignar_rol(p_user uuid, p_rol text, p_motivo text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'No puedes cambiar tu propio rol' using errcode = '42501'; end if;
  if p_rol not in (select rol from public.matriz_roles) or p_rol = 'paciente' then raise exception 'Rol no válido' using errcode = '22023'; end if;
  if length(trim(coalesce(p_motivo, ''))) < 5 then raise exception 'Escribe el motivo del cambio' using errcode = '22023'; end if;
  if (select rol from public.perfil where id = p_user) = 'paciente' then raise exception 'Una paciente no cambia de rol' using errcode = '22023'; end if;
  update public.perfil set rol = p_rol where id = p_user;
  perform public.cerrar_sesiones_de(p_user);
end $$;
revoke all on function public.reasignar_rol(uuid, text, text) from public, anon;
grant execute on function public.reasignar_rol(uuid, text, text) to authenticated, service_role;

-- 8) Lista del personal para reasignar roles (solo el médico administrador)
create or replace function public.personal_lista()
returns table(id uuid, nombre text, email text, rol text, activo boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
  return query select p.id, trim(coalesce(p.nombre, '') || ' ' || coalesce(p.apellidos, '')), p.email, p.rol, coalesce(p.activo, true)
    from public.perfil p where p.rol <> 'paciente' order by p.rol, 2;
end $$;
revoke all on function public.personal_lista() from public, anon;
grant execute on function public.personal_lista() to authenticated, service_role;
