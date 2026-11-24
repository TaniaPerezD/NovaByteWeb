-- Fase 2 (privacidad de la paciente) - NB-POL-P6-04, NB-POL-P6-07, NB-CON-P6-03.
-- Consentimientos CI-1 a CI-4 con versión, fecha y hora; solicitudes de derechos con plazo de 10 días hábiles;
-- exportación de los datos propios; recordatorio anual de la guía de seguridad.

-- 0) La auditoría reconoce la cuenta en las tablas nuevas
create or replace function public.fn_audit()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare n jsonb; o jsonb; v_cuenta uuid; v_cols text[]; v_id uuid; hdr json; v_ip text; v_ua text; v_rol text;
begin
  if tg_op = 'DELETE' then o := to_jsonb(old); n := o; else n := to_jsonb(new); end if;
  if tg_op = 'UPDATE' then
    o := to_jsonb(old);
    select array_agg(k order by k) into v_cols from jsonb_object_keys(n) as k where (n -> k) is distinct from (o -> k);
  end if;
  v_id := nullif(n ->> 'id', '')::uuid;
  v_cuenta := nullif(n ->> 'paciente_id', '')::uuid;
  if v_cuenta is null and tg_table_name in ('aceptacion_terminos', 'consentimiento', 'solicitud_derechos') then
    v_cuenta := nullif(n ->> 'user_id', '')::uuid;
  end if;
  if v_cuenta is null and tg_table_name = 'perfil' and n ->> 'rol' = 'paciente' then v_cuenta := v_id; end if;
  if v_cuenta is null and n ? 'consulta_id' then
    select c.paciente_id into v_cuenta from public.consulta c where c.id = (n ->> 'consulta_id')::uuid; end if;
  if v_cuenta is null and n ? 'receta_id' then
    select c.paciente_id into v_cuenta from public.receta r join public.consulta c on c.id = r.consulta_id where r.id = (n ->> 'receta_id')::uuid; end if;
  if v_cuenta is null and n ? 'examen_id' then
    select c.paciente_id into v_cuenta from public.examen e join public.consulta c on c.id = e.consulta_id where e.id = (n ->> 'examen_id')::uuid; end if;
  begin hdr := current_setting('request.headers', true)::json; exception when others then hdr := null; end;
  v_ip := left(coalesce(nullif(split_part(coalesce(hdr ->> 'x-forwarded-for', ''), ',', 1), ''), hdr ->> 'cf-connecting-ip'), 60);
  v_ua := left(hdr ->> 'user-agent', 300);
  select p.rol into v_rol from public.perfil p where p.id = auth.uid();
  insert into public.audit_log(actor_id, actor_rol, cuenta_id, accion, objeto, objeto_id, columnas, ip, user_agent)
  values (auth.uid(), coalesce(v_rol, 'sistema'), v_cuenta,
          case tg_op when 'INSERT' then 'crear' when 'UPDATE' then 'modificar' else 'eliminar' end,
          tg_table_name, v_id, v_cols, v_ip, v_ua);
  return null;
end $function$;

-- 1) Borrar una cuenta ya no falla por tablas sin borrado en cascada (la evidencia queda en audit_log)
alter table public.codigo_verificacion drop constraint if exists codigo_verificacion_user_id_fkey;
alter table public.codigo_verificacion add constraint codigo_verificacion_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.actividad_sospechosa drop constraint if exists actividad_sospechosa_user_id_fkey;
alter table public.actividad_sospechosa add constraint actividad_sospechosa_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- 2) Registro de solo escritura (no se edita ni se borra)
create or replace function public.solo_agregar()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception 'Registro de solo escritura: no se puede modificar ni borrar' using errcode = '42501';
end $$;

-- 3) Catálogo de consentimientos (NB-POL-P6-04, 6.3)
create table if not exists public.consentimiento_catalogo (
  codigo text not null,
  version text not null,
  titulo text not null,
  que_autoriza text not null,
  datos_y_uso text not null,
  quien_ve text not null,
  conservacion text not null,
  si_se_retira text not null,
  obligatorio boolean not null default false,
  vigente boolean not null default true,
  creado_en timestamptz not null default now(),
  primary key (codigo, version)
);
alter table public.consentimiento_catalogo enable row level security;
drop policy if exists "catalogo publico" on public.consentimiento_catalogo;
create policy "catalogo publico" on public.consentimiento_catalogo for select to anon, authenticated using (true);
revoke all on public.consentimiento_catalogo from anon, authenticated;
grant select on public.consentimiento_catalogo to anon, authenticated;

insert into public.consentimiento_catalogo (codigo, version, titulo, que_autoriza, datos_y_uso, quien_ve, conservacion, si_se_retira, obligatorio) values
('CI-1', '1.0', 'Datos de salud para la atención',
 'Guardar y consultar su expediente clínico: historia, citas, diagnósticos, recetas y resultados.',
 'Sus datos de identificación y contacto y los de su atención médica. Se usan solo para atenderla y darle seguimiento.',
 'Su médica o médico tratante y el personal del consultorio que lo necesite para atenderla. Nadie más.',
 'El expediente se conserva como mínimo 10 años por norma (NB-POL-P5-13), aunque retire este consentimiento.',
 'La atención continúa en el consultorio y usted deja de usar la app. Su cuenta se bloquea; el consultorio puede reactivarla si cambia de decisión.',
 true),
('CI-2', '1.0', 'Imágenes de autoexploración',
 'Enviar y guardar sus fotografías de autoexploración.',
 'Las fotografías que usted envíe, para que su médica o médico las revise.',
 'Solo el personal médico que la atiende.',
 'Mientras sea paciente del consultorio, según los plazos de NB-POL-P5-13.',
 'Se deja de recibir imágenes y se eliminan las ya enviadas, según la ley y los plazos de conservación.',
 false),
('CI-3', '1.0', 'Apoyo de aprendizaje automático (ML)',
 'Que el módulo de ML analice sus imágenes como apoyo a su médica o médico.',
 'Sus imágenes de estudios y de autoexploración, para generar una sugerencia de apoyo. La herramienta no reemplaza el criterio médico: ninguna decisión clínica la toma la IA sola.',
 'Su médica o médico, que decide siempre.',
 'El resultado forma parte de su expediente clínico.',
 'Sus imágenes solo las revisa el personal médico. La atención no cambia.',
 false),
('CI-4', '1.0', 'Mejora del modelo y analítica',
 'Usar sus datos anonimizados para mejorar el modelo y la analítica del consultorio.',
 'Imágenes y datos sin su nombre ni identificadores, solo para mejorar el modelo y las estadísticas.',
 'El equipo técnico, únicamente con datos anonimizados.',
 'Mientras se use para mejorar el modelo. Los datos ya anonimizados no se pueden vincular con usted.',
 'Sus datos dejan de usarse en nuevos análisis.',
 false)
on conflict (codigo, version) do nothing;

-- 4) Registro de consentimientos (Anexo B): una fila por decisión, solo escritura
create table if not exists public.consentimiento (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,            -- sin vínculo: es evidencia que se conserva aunque se cierre la cuenta
  codigo text not null,
  version text not null,
  otorgado boolean not null,
  registrado_en timestamptz not null default now(),
  dispositivo text,
  ip text,
  user_agent text,
  foreign key (codigo, version) references public.consentimiento_catalogo (codigo, version)
);
create index if not exists consentimiento_user_idx on public.consentimiento (user_id, codigo, registrado_en desc);
alter table public.consentimiento enable row level security;
drop policy if exists "consentimiento: la paciente ve los suyos" on public.consentimiento;
create policy "consentimiento: la paciente ve los suyos" on public.consentimiento for select to authenticated
  using (user_id = (select auth.uid()) and (select public.sesion_existe()));
drop policy if exists "consentimiento: medicoAdmin ve todos" on public.consentimiento;
create policy "consentimiento: medicoAdmin ve todos" on public.consentimiento for select to authenticated
  using ((select public.mi_rol()) = 'medicoAdmin');
revoke all on public.consentimiento from anon, authenticated;
grant select on public.consentimiento to authenticated;
drop trigger if exists consentimiento_solo_agregar on public.consentimiento;
create trigger consentimiento_solo_agregar before update or delete on public.consentimiento
  for each row execute function public.solo_agregar();
drop trigger if exists consentimiento_no_truncate on public.consentimiento;
create trigger consentimiento_no_truncate before truncate on public.consentimiento
  for each statement execute function public.solo_agregar();
drop trigger if exists trg_audit_consentimiento on public.consentimiento;
create trigger trg_audit_consentimiento after insert on public.consentimiento
  for each row execute function public.fn_audit();

-- 5) ¿Dio la paciente el CI-1 de la versión vigente? (sin CI-1 no se abre la cuenta)
create or replace function public.ci1_otorgado(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((
    select c.otorgado
    from public.consentimiento c
    join public.consentimiento_catalogo k on k.codigo = c.codigo and k.version = c.version and k.vigente
    where c.user_id = p_user and c.codigo = 'CI-1'
    order by c.registrado_en desc limit 1), false)
$$;
revoke all on function public.ci1_otorgado(uuid) from public, anon, authenticated;

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
    )
  )
$$;

create or replace function public.estado_sesion()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare p record; pend boolean := false; pend_ci boolean := false;
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
  end if;
  return jsonb_build_object('valida', true, 'rol', p.rol, 'bloqueado', coalesce(p.bloqueado, false),
                            'activo', coalesce(p.activo, true), 'terminos_pendientes', pend,
                            'consentimiento_pendiente', pend_ci);
end $$;

-- 6) Consultar y registrar consentimientos
create or replace function public.consentimientos_estado()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'codigo', k.codigo, 'version', k.version, 'titulo', k.titulo, 'que_autoriza', k.que_autoriza,
      'datos_y_uso', k.datos_y_uso, 'quien_ve', k.quien_ve, 'conservacion', k.conservacion,
      'si_se_retira', k.si_se_retira, 'obligatorio', k.obligatorio,
      'otorgado', coalesce(u.otorgado, false), 'decidido', u.registrado_en is not null, 'fecha', u.registrado_en)
      order by k.codigo)
    from public.consentimiento_catalogo k
    left join lateral (
      select c.otorgado, c.registrado_en from public.consentimiento c
      where c.user_id = auth.uid() and c.codigo = k.codigo and c.version = k.version
      order by c.registrado_en desc limit 1) u on true
    where k.vigente), '[]'::jsonb);
end $$;

create or replace function public.registrar_consentimiento(p_codigo text, p_otorgado boolean, p_dispositivo text default null)
returns void language plpgsql security definer set search_path = public, auth as $$
declare k record; hdr json; v_ip text; v_ua text; ultimo boolean;
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  if (select rol from public.perfil where id = auth.uid()) is distinct from 'paciente' then
    raise exception 'Los consentimientos aplican a pacientes' using errcode = '42501';
  end if;
  select * into k from public.consentimiento_catalogo where codigo = p_codigo and vigente;
  if not found then raise exception 'Consentimiento no vigente' using errcode = '22023'; end if;
  if p_otorgado is null then raise exception 'Falta la decision' using errcode = '22023'; end if;

  select c.otorgado into ultimo from public.consentimiento c
   where c.user_id = auth.uid() and c.codigo = k.codigo and c.version = k.version
   order by c.registrado_en desc limit 1;
  if ultimo is not null and ultimo = p_otorgado then return; end if;   -- sin cambios

  begin hdr := current_setting('request.headers', true)::json; exception when others then hdr := null; end;
  v_ip := left(coalesce(nullif(split_part(coalesce(hdr->>'x-forwarded-for', ''), ',', 1), ''), hdr->>'cf-connecting-ip'), 60);
  v_ua := left(hdr->>'user-agent', 300);
  insert into public.consentimiento(user_id, codigo, version, otorgado, dispositivo, ip, user_agent)
    values (auth.uid(), k.codigo, k.version, p_otorgado, left(p_dispositivo, 200), v_ip, v_ua);
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (auth.uid(), case when p_otorgado then 'consentimiento_otorgado' else 'consentimiento_retirado' end,
            case when k.obligatorio and not p_otorgado then 'alto' else 'bajo' end,
            jsonb_build_object('codigo', k.codigo, 'version', k.version, 'ip', v_ip));

  -- Retirar el CI-1 equivale a dejar de usar la app: la cuenta se bloquea y se cierran las sesiones
  if k.obligatorio and not p_otorgado then
    perform set_config('nb.permitir_bloqueo', 'on', true);
    update public.perfil set bloqueado = true, motivo_bloqueo = 'paciente', bloqueado_en = now() where id = auth.uid();
    delete from auth.sessions where user_id = auth.uid();
  end if;
end $$;
revoke all on function public.consentimientos_estado() from public, anon;
revoke all on function public.registrar_consentimiento(text, boolean, text) from public, anon;
grant execute on function public.consentimientos_estado() to authenticated;
grant execute on function public.registrar_consentimiento(text, boolean, text) to authenticated;

-- 7) Derechos de la paciente (NB-POL-P6-04, 6.4 y Anexo C)
create or replace function public.dias_habiles(p_desde timestamptz, p_n integer)
returns timestamptz language plpgsql stable set search_path = public, pg_temp as $$
declare f timestamptz := p_desde; c integer := 0;
begin
  while c < p_n loop
    f := f + interval '1 day';
    if extract(isodow from f at time zone 'America/La_Paz') < 6 then c := c + 1; end if;
  end loop;
  return f;
end $$;

create table if not exists public.solicitud_derechos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tipo text not null check (tipo in ('acceso', 'rectificacion', 'retiro_consentimiento', 'eliminacion')),
  detalle text check (detalle is null or length(detalle) <= 1000),
  estado text not null default 'recibida' check (estado in ('recibida', 'en_proceso', 'atendida', 'rechazada')),
  creada_en timestamptz not null default now(),
  vence_en timestamptz not null,
  atendida_en timestamptz,
  atendida_por uuid,
  respuesta text check (respuesta is null or length(respuesta) <= 2000)
);
create index if not exists solicitud_derechos_user_idx on public.solicitud_derechos (user_id, creada_en desc);
create index if not exists solicitud_derechos_estado_idx on public.solicitud_derechos (estado, vence_en);
alter table public.solicitud_derechos enable row level security;
drop policy if exists "derechos: la paciente ve las suyas" on public.solicitud_derechos;
create policy "derechos: la paciente ve las suyas" on public.solicitud_derechos for select to authenticated
  using (user_id = (select auth.uid()) and (select public.sesion_existe()));
drop policy if exists "derechos: medicoAdmin ve todas" on public.solicitud_derechos;
create policy "derechos: medicoAdmin ve todas" on public.solicitud_derechos for select to authenticated
  using ((select public.mi_rol()) = 'medicoAdmin');
revoke all on public.solicitud_derechos from anon, authenticated;
grant select on public.solicitud_derechos to authenticated;
drop trigger if exists trg_audit_solicitud_derechos on public.solicitud_derechos;
create trigger trg_audit_solicitud_derechos after insert or update on public.solicitud_derechos
  for each row execute function public.fn_audit();

create or replace function public.crear_solicitud_derechos(p_tipo text, p_detalle text default null)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare v_id uuid; v_vence timestamptz; v_abiertas integer;
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  if (select rol from public.perfil where id = auth.uid()) is distinct from 'paciente' then
    raise exception 'Las solicitudes de derechos las hacen las pacientes' using errcode = '42501';
  end if;
  if p_tipo not in ('acceso', 'rectificacion', 'retiro_consentimiento', 'eliminacion') then
    raise exception 'Tipo de solicitud no valido' using errcode = '22023';
  end if;
  if length(coalesce(p_detalle, '')) > 1000 then raise exception 'El detalle es demasiado largo' using errcode = '22023'; end if;
  select count(*) into v_abiertas from public.solicitud_derechos where user_id = auth.uid() and estado in ('recibida', 'en_proceso');
  if v_abiertas >= 5 then raise exception 'Ya tienes 5 solicitudes abiertas; espera a que se atiendan' using errcode = '22023'; end if;
  v_vence := public.dias_habiles(now(), 10);
  insert into public.solicitud_derechos(user_id, tipo, detalle, vence_en)
    values (auth.uid(), p_tipo, nullif(trim(p_detalle), ''), v_vence) returning id into v_id;
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (auth.uid(), 'solicitud_derechos', 'bajo', jsonb_build_object('tipo', p_tipo));
  return jsonb_build_object('id', v_id, 'vence_en', v_vence);
end $$;

create or replace function public.mis_solicitudes_derechos()
returns table(id uuid, tipo text, detalle text, estado text, creada_en timestamptz, vence_en timestamptz, atendida_en timestamptz, respuesta text)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  return query select s.id, s.tipo, s.detalle, s.estado, s.creada_en, s.vence_en, s.atendida_en, s.respuesta
    from public.solicitud_derechos s where s.user_id = auth.uid() order by s.creada_en desc limit 100;
end $$;

create or replace function public.admin_solicitudes_derechos(p_estado text default null)
returns table(id uuid, paciente_id uuid, paciente text, email text, tipo text, detalle text, estado text,
              creada_en timestamptz, vence_en timestamptz, dias_restantes integer, atendida_en timestamptz, respuesta text)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
  return query
    select s.id, s.user_id, trim(coalesce(p.nombre, '') || ' ' || coalesce(p.apellidos, '')), p.email, s.tipo, s.detalle, s.estado,
           s.creada_en, s.vence_en, ceil(extract(epoch from (s.vence_en - now())) / 86400)::integer, s.atendida_en, s.respuesta
    from public.solicitud_derechos s left join public.perfil p on p.id = s.user_id
    where p_estado is null or s.estado = p_estado
    order by (s.estado in ('atendida', 'rechazada')), s.vence_en
    limit 300;
end $$;

create or replace function public.admin_atender_solicitud(p_id uuid, p_estado text, p_respuesta text default null)
returns void language plpgsql security definer set search_path = public, auth as $$
declare s record;
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
  if p_estado not in ('en_proceso', 'atendida', 'rechazada') then raise exception 'Estado no valido' using errcode = '22023'; end if;
  if p_estado in ('atendida', 'rechazada') and length(trim(coalesce(p_respuesta, ''))) < 5 then
    raise exception 'Escribe la respuesta para la paciente' using errcode = '22023';
  end if;
  select * into s from public.solicitud_derechos where id = p_id for update;
  if not found then raise exception 'Solicitud no encontrada' using errcode = 'P0002'; end if;
  if s.estado in ('atendida', 'rechazada') then raise exception 'La solicitud ya fue cerrada' using errcode = '22023'; end if;
  update public.solicitud_derechos
     set estado = p_estado, respuesta = nullif(trim(p_respuesta), ''), atendida_por = auth.uid(),
         atendida_en = case when p_estado in ('atendida', 'rechazada') then now() else null end
   where id = p_id;
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (s.user_id, 'solicitud_derechos_' || p_estado, 'bajo', jsonb_build_object('tipo', s.tipo));
  -- Eliminación atendida: la cuenta se cierra; el expediente se conserva por el plazo legal (NB-POL-P5-13)
  if s.tipo = 'eliminacion' and p_estado = 'atendida' then
    perform set_config('nb.permitir_bloqueo', 'on', true);
    update public.perfil set activo = false, bloqueado = true, motivo_bloqueo = 'paciente', bloqueado_en = now(),
           telegram_chat_id = null where id = s.user_id;
    delete from auth.sessions where user_id = s.user_id;
  end if;
end $$;

revoke all on function public.crear_solicitud_derechos(text, text) from public, anon;
revoke all on function public.mis_solicitudes_derechos() from public, anon;
revoke all on function public.admin_solicitudes_derechos(text) from public, anon;
revoke all on function public.admin_atender_solicitud(uuid, text, text) from public, anon;
grant execute on function public.crear_solicitud_derechos(text, text) to authenticated;
grant execute on function public.mis_solicitudes_derechos() to authenticated;
grant execute on function public.admin_solicitudes_derechos(text) to authenticated;
grant execute on function public.admin_atender_solicitud(uuid, text, text) to authenticated;

-- 8) "Ver mis datos": exportación de la información propia
create or replace function public.mis_datos()
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare v jsonb; r jsonb; t text; me uuid := auth.uid(); v_consultas uuid[];
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  if (select rol from public.perfil where id = me) is distinct from 'paciente' then
    raise exception 'La exportacion es para pacientes' using errcode = '42501';
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
revoke all on function public.mis_datos() from public, anon;
grant execute on function public.mis_datos() to authenticated;

-- 9) Guía de seguridad: aceptación en el primer ingreso y recordatorio una vez al año (NB-POL-P6-07)
create table if not exists public.seguridad_recordatorio (
  user_id uuid primary key,
  version text not null default '1.0',
  visto_en timestamptz not null default now()
);
alter table public.seguridad_recordatorio enable row level security;
revoke all on public.seguridad_recordatorio from anon, authenticated;

create or replace function public.seguridad_recordatorio_pendiente()
returns boolean language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.sesion_existe() then return false; end if;
  if (select rol from public.perfil where id = auth.uid()) is distinct from 'paciente' then return false; end if;
  return not exists (select 1 from public.seguridad_recordatorio s where s.user_id = auth.uid() and s.visto_en > now() - interval '1 year');
end $$;

create or replace function public.marcar_seguridad_vista(p_version text default '1.0')
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  insert into public.seguridad_recordatorio(user_id, version, visto_en) values (auth.uid(), left(coalesce(p_version, '1.0'), 20), now())
    on conflict (user_id) do update set version = excluded.version, visto_en = now();
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (auth.uid(), 'guia_seguridad_vista', 'bajo', jsonb_build_object('version', p_version));
end $$;
revoke all on function public.seguridad_recordatorio_pendiente() from public, anon;
revoke all on function public.marcar_seguridad_vista(text) from public, anon;
grant execute on function public.seguridad_recordatorio_pendiente() to authenticated;
grant execute on function public.marcar_seguridad_vista(text) to authenticated;
