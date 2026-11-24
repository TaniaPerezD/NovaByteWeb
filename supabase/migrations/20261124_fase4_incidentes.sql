-- Fase 4 (incidentes y escalamiento) - NB-PRO-P6-11, NB-FOR-P6-12 y NB-PRO-P6-13.
-- Registro de incidentes (20 campos, 16 categorías), escalamiento directo al Director General con acuse,
-- comunicación a pacientes en 72 horas, informes mensual y anual, y simulacro de escalamiento.

create or replace function public.exigir_osi()
returns void language plpgsql stable security definer set search_path = public, auth as $$
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
end $$;
revoke all on function public.exigir_osi() from public, anon, authenticated;

create or replace function public.sin_borrado()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception 'Nadie borra filas de este registro: agrega una nota con fecha' using errcode = '42501';
end $$;

-- 1) Categorías (NB-PRO-P6-11, 6.4)
create table if not exists public.incidente_categoria (
  numero integer primary key check (numero between 1 and 16),
  nombre text not null, ejemplo text not null, responde text not null);
insert into public.incidente_categoria values
 (1, 'Pérdida de servicio', 'La app o el sistema web no responden', 'Administrador de Infraestructura y Servicios Cloud'),
 (2, 'Pérdida de equipo o instalaciones', 'Robo de un equipo con datos', 'Responsable de Seguridad Física'),
 (3, 'Sobrecarga o mal funcionamiento del sistema', 'Lentitud por exceso de uso', 'Administrador de Infraestructura y Servicios Cloud'),
 (4, 'Errores humanos', 'Resultado enviado a la paciente equivocada', 'Jefe del Área de TI'),
 (5, 'Incumplimiento de políticas o procedimientos', 'Envío de imágenes por mensajería personal', 'OSI'),
 (6, 'Deficiencias de controles de seguridad física', 'Sala de servidores sin cerrar', 'Responsable de Seguridad Física'),
 (7, 'Cambios incontrolables en el sistema', 'Cambio en producción sin control de cambios', 'Jefe del Área de TI'),
 (8, 'Mal funcionamiento del software', 'Error de la app que muestra datos de otra paciente', 'Desarrollador de Aplicaciones Móviles y Desarrollador Web'),
 (9, 'Mal funcionamiento del hardware', 'Falla de disco de un servidor', 'Administrador de Infraestructura y Servicios Cloud'),
 (10, 'Código malicioso', 'Virus en una estación de trabajo', 'Técnico de Soporte y Mantenimiento'),
 (11, 'Negación de servicio', 'Ataque que satura el servicio', 'Administrador de Infraestructura y Servicios Cloud'),
 (12, 'Errores resultantes de datos incompletos o no actualizados', 'Resultado ligado a un expediente desactualizado', 'Administrador de Bases de Datos'),
 (13, 'Violaciones en la confidencialidad e integridad de la información', 'Filtración o alteración de expedientes', 'OSI'),
 (14, 'Mal uso de los sistemas de información', 'Acceso del personal a un expediente sin motivo clínico', 'OSI'),
 (15, 'Accesos no autorizados exitosos, sin perjuicios visibles a componentes tecnológicos', 'Ingreso a la cuenta de una paciente con clave robada', 'OSI'),
 (16, 'Intentos recurrentes y no recurrentes de acceso no autorizado', 'Intentos fallidos repetidos contra una cuenta', 'Administrador de Infraestructura y Servicios Cloud')
on conflict (numero) do nothing;

-- 2) Registro de incidentes (NB-FOR-P6-12, 6.2): una fila por incidente; nadie borra filas
create sequence if not exists public.incidente_numero_seq;
create table if not exists public.incidente (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default ('INC-' || lpad(nextval('public.incidente_numero_seq')::text, 4, '0')),
  detectado_en timestamptz not null,
  reportado_en timestamptz not null,
  reportado_por text not null check (length(reportado_por) between 2 and 120),
  categoria integer not null references public.incidente_categoria(numero),
  severidad text not null check (severidad in ('menor', 'mayor', 'critica')),
  sistemas_afectados text not null check (length(sistemas_afectados) between 2 and 500),
  descripcion text not null check (length(descripcion) between 5 and 2000),
  datos_restringidos boolean not null default false,
  datos_restringidos_tipo text check (datos_restringidos_tipo is null or length(datos_restringidos_tipo) <= 300),
  horas_interrupcion numeric check (horas_interrupcion is null or horas_interrupcion >= 0),
  pacientes_afectadas integer check (pacientes_afectadas is null or pacientes_afectadas >= 0),
  registros_afectados integer check (registros_afectados is null or registros_afectados >= 0),
  horas_respuesta numeric check (horas_respuesta is null or horas_respuesta >= 0),
  mitigacion text check (mitigacion is null or length(mitigacion) <= 2000),
  comunicaciones text check (comunicaciones is null or length(comunicaciones) <= 2000),
  causa text check (causa is null or length(causa) <= 2000),
  acciones jsonb not null default '[]'::jsonb,
  estado text not null default 'abierto' check (estado in ('abierto', 'en_seguimiento', 'cerrado')),
  cierre_tecnico_en timestamptz,
  cerrado_en timestamptz,
  filtracion_confirmada_en timestamptz,
  comunicado_pacientes_en timestamptz,
  registro_tardio boolean not null default false,
  alerta_id uuid,
  reporte_id uuid,
  acciones_vencidas_escaladas_en timestamptz,
  abierto_por uuid not null,
  abierto_en timestamptz not null default now()
);
create index if not exists incidente_estado_idx on public.incidente (estado, severidad, reportado_en desc);

create table if not exists public.incidente_nota (
  id uuid primary key default gen_random_uuid(),
  incidente_id uuid not null references public.incidente(id),
  nota text not null check (length(nota) between 3 and 1000),
  autor uuid,
  creada_en timestamptz not null default now());
create index if not exists incidente_nota_idx on public.incidente_nota (incidente_id, creada_en);

create table if not exists public.incidente_afectada (
  incidente_id uuid not null references public.incidente(id),
  paciente_id uuid not null,
  primary key (incidente_id, paciente_id));

create table if not exists public.incidente_comunicacion (
  id uuid primary key default gen_random_uuid(),
  incidente_id uuid not null references public.incidente(id),
  tipo text not null check (tipo in ('pacientes', 'personal', 'autoridades')),
  mensaje text not null check (length(mensaje) between 20 and 1500),
  destinatarios integer not null default 0,
  creada_en timestamptz not null default now(),
  enviada_en timestamptz,
  creada_por uuid);

create table if not exists public.reporte_evento (
  id uuid primary key default gen_random_uuid(),
  reportado_por uuid not null,
  cargo text not null,
  descripcion text not null check (length(descripcion) between 5 and 1000),
  sistemas text check (sistemas is null or length(sistemas) <= 300),
  reportado_en timestamptz not null default now(),
  estado text not null default 'nuevo' check (estado in ('nuevo', 'convertido', 'descartado')),
  incidente_id uuid,
  nota text,
  notificado boolean not null default false);

-- 3) Escalamiento al Director General (NB-PRO-P6-13)
create table if not exists public.escalamiento (
  id uuid primary key default gen_random_uuid(),
  incidente_id uuid references public.incidente(id),
  es_simulacro boolean not null default false,
  disparador text not null,
  severidad text not null check (severidad in ('menor', 'mayor', 'critica')),
  plazo_horas integer not null,
  creado_en timestamptz not null default now(),
  token_hash text,
  token_expira timestamptz,
  aviso_enviado_en timestamptz,
  reintentos integer not null default 0,
  acuse_en timestamptz,
  acuse_por text,
  segundo_aviso_en timestamptz,
  decision text check (decision is null or decision in ('trata', 'acepta', 'transfiere')),
  activa_pcn boolean,
  declara_crisis boolean,
  autoriza_comunicar boolean,
  decision_en timestamptz,
  informe_vence timestamptz,
  informe_entregado_en timestamptz,
  informe_texto text check (informe_texto is null or length(informe_texto) <= 4000),
  informe_correo_en timestamptz);
create index if not exists escalamiento_pend_idx on public.escalamiento (acuse_en, creado_en);

create table if not exists public.informe_incidentes (
  id uuid primary key default gen_random_uuid(),
  periodo date not null unique,
  generado_en timestamptz not null default now(),
  enviado_en timestamptz,
  generado_por uuid);

do $$ declare t text; begin
  foreach t in array array['incidente_categoria', 'incidente', 'incidente_nota', 'incidente_afectada', 'incidente_comunicacion', 'reporte_evento', 'escalamiento', 'informe_incidentes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    if t <> 'incidente_categoria' then
      execute format('drop policy if exists "osi ve %s" on public.%I', t, t);
      execute format('create policy "osi ve %s" on public.%I for select to authenticated using ((select public.mi_rol()) = ''medicoAdmin'')', t, t);
      execute format('grant select on public.%I to authenticated', t);
    end if;
  end loop;
end $$;
drop policy if exists "categorias para quien ingresa" on public.incidente_categoria;
create policy "categorias para quien ingresa" on public.incidente_categoria for select to authenticated using (true);
grant select on public.incidente_categoria to authenticated;

-- Solo escritura / sin borrado y auditoría
drop trigger if exists incidente_sin_borrado on public.incidente;
create trigger incidente_sin_borrado before delete on public.incidente for each row execute function public.sin_borrado();
drop trigger if exists incidente_nota_solo_agregar on public.incidente_nota;
create trigger incidente_nota_solo_agregar before update or delete on public.incidente_nota for each row execute function public.solo_agregar();
drop trigger if exists escalamiento_sin_borrado on public.escalamiento;
create trigger escalamiento_sin_borrado before delete on public.escalamiento for each row execute function public.sin_borrado();
drop trigger if exists reporte_evento_sin_borrado on public.reporte_evento;
create trigger reporte_evento_sin_borrado before delete on public.reporte_evento for each row execute function public.sin_borrado();
drop trigger if exists comunicacion_sin_borrado on public.incidente_comunicacion;
create trigger comunicacion_sin_borrado before delete on public.incidente_comunicacion for each row execute function public.sin_borrado();
do $$ declare t text; begin
  foreach t in array array['incidente', 'escalamiento', 'reporte_evento', 'incidente_comunicacion'] loop
    execute format('drop trigger if exists trg_audit_%s on public.%I', t, t);
    execute format('create trigger trg_audit_%s after insert or update on public.%I for each row execute function public.fn_audit()', t, t);
  end loop;
end $$;

-- 4) Escalamiento: crea la fila y manda el aviso directo al Director General (sin pasar por el Área de TI)
create or replace function public.crear_escalamiento(p_incidente uuid, p_disparador text, p_simulacro boolean default false)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_sev text; v_id uuid;
begin
  if p_simulacro then v_sev := 'critica';
  else select severidad into v_sev from public.incidente where id = p_incidente; end if;
  insert into public.escalamiento(incidente_id, es_simulacro, disparador, severidad, plazo_horas, informe_vence)
    values (case when p_simulacro then null else p_incidente end, p_simulacro, p_disparador, v_sev,
            case when v_sev = 'mayor' then 4 else 1 end, public.dias_habiles(now(), 5))
    returning id into v_id;
  begin
    perform net.http_post(url := 'https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/incidentes-correo',
                          headers := jsonb_build_object('Content-Type', 'application/json'),
                          body := jsonb_build_object('tipo', 'escalamiento_aviso', 'id', v_id));
  exception when others then raise notice 'no se pudo avisar el escalamiento: %', sqlerrm; end;
  return v_id;
end $$;
revoke all on function public.crear_escalamiento(uuid, text, boolean) from public, anon, authenticated;

create or replace function public.avisar_correo(p_tipo text, p_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(url := 'https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/incidentes-correo',
                        headers := jsonb_build_object('Content-Type', 'application/json'),
                        body := jsonb_build_object('tipo', p_tipo, 'id', p_id));
exception when others then raise notice 'no se pudo avisar (%): %', p_tipo, sqlerrm;
end $$;
revoke all on function public.avisar_correo(text, uuid) from public, anon, authenticated;

-- 5) Crear, actualizar y cerrar incidentes (solo el OSI)
create or replace function public.crear_incidente(p jsonb)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare v_id uuid; v_num text; v_sev text; v_det timestamptz; v_rep timestamptz; v_dr boolean; v_cat integer; v_disp text;
begin
  perform public.exigir_osi();
  v_det := coalesce(nullif(p->>'detectado_en', '')::timestamptz, now());
  v_rep := coalesce(nullif(p->>'reportado_en', '')::timestamptz, now());
  if v_det > now() + interval '5 minutes' or v_rep > now() + interval '5 minutes' then raise exception 'Las fechas no pueden ser futuras' using errcode = '22023'; end if;
  if v_rep < v_det then raise exception 'El reporte no puede ser anterior a la detección' using errcode = '22023'; end if;
  v_cat := nullif(p->>'categoria', '')::integer;
  if v_cat is null or not exists (select 1 from public.incidente_categoria where numero = v_cat) then raise exception 'Elige una de las 16 categorías' using errcode = '22023'; end if;
  v_sev := p->>'severidad';
  if v_sev is null or v_sev not in ('menor', 'mayor', 'critica') then raise exception 'La severidad es menor, mayor o crítica' using errcode = '22023'; end if;
  v_dr := coalesce((p->>'datos_restringidos')::boolean, false);
  if v_dr then v_sev := 'critica'; end if;
  insert into public.incidente(detectado_en, reportado_en, reportado_por, categoria, severidad, sistemas_afectados, descripcion,
      datos_restringidos, datos_restringidos_tipo, horas_interrupcion, pacientes_afectadas, registros_afectados, horas_respuesta,
      mitigacion, alerta_id, reporte_id, registro_tardio, abierto_por)
    values (v_det, v_rep, trim(coalesce(p->>'reportado_por', '')), v_cat, v_sev, trim(coalesce(p->>'sistemas_afectados', '')), trim(coalesce(p->>'descripcion', '')),
      v_dr, nullif(trim(coalesce(p->>'datos_restringidos_tipo', '')), ''), nullif(p->>'horas_interrupcion', '')::numeric,
      nullif(p->>'pacientes_afectadas', '')::integer, nullif(p->>'registros_afectados', '')::integer, nullif(p->>'horas_respuesta', '')::numeric,
      nullif(trim(coalesce(p->>'mitigacion', '')), ''), nullif(p->>'alerta_id', '')::uuid, nullif(p->>'reporte_id', '')::uuid,
      (v_rep + interval '2 hours') < now(), auth.uid())
    returning id, numero into v_id, v_num;
  if nullif(p->>'reporte_id', '') is not null then
    update public.reporte_evento set estado = 'convertido', incidente_id = v_id where id = (p->>'reporte_id')::uuid and estado = 'nuevo';
  end if;
  if v_sev in ('critica', 'mayor') then
    v_disp := case when v_dr then 'Datos Restringidos expuestos, alterados o con sospecha fundada'
                   when v_sev = 'critica' then 'Incidente de severidad crítica' else 'Incidente de severidad mayor' end;
    perform public.crear_escalamiento(v_id, v_disp);
  end if;
  return jsonb_build_object('id', v_id, 'numero', v_num, 'severidad', v_sev);
end $$;

create or replace function public.actualizar_incidente(p_id uuid, p jsonb)
returns void language plpgsql security definer set search_path = public, auth as $$
declare i public.incidente%rowtype; v_sev text; v_dr boolean; v_cierre boolean; v_disp text;
begin
  perform public.exigir_osi();
  select * into i from public.incidente where id = p_id for update;
  if not found then raise exception 'Incidente no encontrado' using errcode = 'P0002'; end if;
  if i.estado = 'cerrado' then raise exception 'El incidente está cerrado: agrega una nota con fecha' using errcode = '22023'; end if;
  v_sev := coalesce(nullif(p->>'severidad', ''), i.severidad);
  if v_sev not in ('menor', 'mayor', 'critica') then raise exception 'La severidad es menor, mayor o crítica' using errcode = '22023'; end if;
  v_dr := coalesce((p->>'datos_restringidos')::boolean, i.datos_restringidos);
  if v_dr then v_sev := 'critica'; end if;
  v_cierre := coalesce((p->>'cierre_tecnico')::boolean, false);
  update public.incidente set
    categoria = coalesce(nullif(p->>'categoria', '')::integer, categoria),
    severidad = v_sev,
    sistemas_afectados = coalesce(nullif(trim(coalesce(p->>'sistemas_afectados', '')), ''), sistemas_afectados),
    descripcion = coalesce(nullif(trim(coalesce(p->>'descripcion', '')), ''), descripcion),
    datos_restringidos = v_dr,
    datos_restringidos_tipo = case when p ? 'datos_restringidos_tipo' then nullif(trim(coalesce(p->>'datos_restringidos_tipo', '')), '') else datos_restringidos_tipo end,
    horas_interrupcion = case when p ? 'horas_interrupcion' then nullif(p->>'horas_interrupcion', '')::numeric else horas_interrupcion end,
    pacientes_afectadas = case when p ? 'pacientes_afectadas' then nullif(p->>'pacientes_afectadas', '')::integer else pacientes_afectadas end,
    registros_afectados = case when p ? 'registros_afectados' then nullif(p->>'registros_afectados', '')::integer else registros_afectados end,
    horas_respuesta = case when p ? 'horas_respuesta' then nullif(p->>'horas_respuesta', '')::numeric else horas_respuesta end,
    mitigacion = case when p ? 'mitigacion' then nullif(trim(coalesce(p->>'mitigacion', '')), '') else mitigacion end,
    comunicaciones = case when p ? 'comunicaciones' then nullif(trim(coalesce(p->>'comunicaciones', '')), '') else comunicaciones end,
    filtracion_confirmada_en = case when coalesce((p->>'filtracion_confirmada')::boolean, false) and filtracion_confirmada_en is null then now() else filtracion_confirmada_en end,
    cierre_tecnico_en = case when v_cierre and cierre_tecnico_en is null then now() else cierre_tecnico_en end,
    estado = case when v_cierre or coalesce((p->>'en_seguimiento')::boolean, false) then 'en_seguimiento' else estado end
  where id = p_id;
  if (v_sev = 'critica' and i.severidad <> 'critica') or (v_sev = 'mayor' and i.severidad = 'menor') then
    v_disp := case when v_dr then 'Datos Restringidos expuestos, alterados o con sospecha fundada' else 'Cambio de severidad a ' || v_sev end;
    perform public.crear_escalamiento(p_id, v_disp);
  end if;
end $$;

create or replace function public.cerrar_incidente(p_id uuid, p_causa text, p_acciones jsonb)
returns void language plpgsql security definer set search_path = public, auth as $$
declare a jsonb; norm jsonb := '[]'::jsonb; i public.incidente%rowtype;
begin
  perform public.exigir_osi();
  select * into i from public.incidente where id = p_id for update;
  if not found then raise exception 'Incidente no encontrado' using errcode = 'P0002'; end if;
  if i.estado = 'cerrado' then raise exception 'El incidente ya está cerrado' using errcode = '22023'; end if;
  if length(trim(coalesce(p_causa, ''))) < 5 then raise exception 'Anota la causa identificada' using errcode = '22023'; end if;
  if jsonb_typeof(p_acciones) <> 'array' or jsonb_array_length(p_acciones) = 0 then raise exception 'Anota al menos una acción correctiva' using errcode = '22023'; end if;
  for a in select * from jsonb_array_elements(p_acciones) loop
    if length(trim(coalesce(a->>'accion', ''))) < 3 or length(trim(coalesce(a->>'responsable', ''))) < 2 or nullif(a->>'fecha', '') is null then
      raise exception 'Cada acción necesita descripción, responsable y fecha' using errcode = '22023';
    end if;
    norm := norm || jsonb_build_array(jsonb_build_object('accion', trim(a->>'accion'), 'responsable', trim(a->>'responsable'),
                                       'fecha', (a->>'fecha')::date, 'cumplida', false));
  end loop;
  update public.incidente set causa = trim(p_causa), acciones = norm, estado = 'cerrado', cerrado_en = now(),
         cierre_tecnico_en = coalesce(cierre_tecnico_en, now()) where id = p_id;
end $$;

create or replace function public.marcar_accion(p_id uuid, p_indice integer, p_cumplida boolean)
returns void language plpgsql security definer set search_path = public, auth as $$
declare i public.incidente%rowtype;
begin
  perform public.exigir_osi();
  select * into i from public.incidente where id = p_id for update;
  if not found then raise exception 'Incidente no encontrado' using errcode = 'P0002'; end if;
  if p_indice < 0 or p_indice >= jsonb_array_length(i.acciones) then raise exception 'La acción no existe' using errcode = '22023'; end if;
  update public.incidente set acciones = jsonb_set(acciones, array[p_indice::text, 'cumplida'], to_jsonb(coalesce(p_cumplida, false))) where id = p_id;
end $$;

create or replace function public.agregar_nota_incidente(p_id uuid, p_nota text)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  perform public.exigir_osi();
  if not exists (select 1 from public.incidente where id = p_id) then raise exception 'Incidente no encontrado' using errcode = 'P0002'; end if;
  if length(trim(coalesce(p_nota, ''))) < 3 then raise exception 'Escribe la nota' using errcode = '22023'; end if;
  insert into public.incidente_nota(incidente_id, nota, autor) values (p_id, trim(p_nota), auth.uid());
end $$;

-- 6) Consultas del OSI
create or replace function public.listar_incidentes(p_estado text default null)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
begin
  perform public.exigir_osi();
  return coalesce((
    select jsonb_agg(x.fila order by x.cerrado, x.rango, x.rep desc) from (
      select (i.estado = 'cerrado') as cerrado, case i.severidad when 'critica' then 0 when 'mayor' then 1 else 2 end as rango, i.reportado_en as rep,
        jsonb_build_object(
          'id', i.id, 'numero', i.numero, 'detectado_en', i.detectado_en, 'reportado_en', i.reportado_en, 'reportado_por', i.reportado_por,
          'categoria', i.categoria, 'categoria_nombre', c.nombre, 'severidad', i.severidad, 'sistemas_afectados', i.sistemas_afectados,
          'descripcion', i.descripcion, 'datos_restringidos', i.datos_restringidos, 'datos_restringidos_tipo', i.datos_restringidos_tipo,
          'horas_interrupcion', i.horas_interrupcion, 'pacientes_afectadas', i.pacientes_afectadas, 'registros_afectados', i.registros_afectados,
          'horas_respuesta', i.horas_respuesta, 'mitigacion', i.mitigacion, 'comunicaciones', i.comunicaciones, 'causa', i.causa,
          'acciones', i.acciones, 'estado', i.estado, 'cierre_tecnico_en', i.cierre_tecnico_en, 'cerrado_en', i.cerrado_en,
          'filtracion_confirmada_en', i.filtracion_confirmada_en, 'comunicado_pacientes_en', i.comunicado_pacientes_en,
          'registro_tardio', i.registro_tardio, 'abierto_en', i.abierto_en,
          'lecciones_vence', case when i.cierre_tecnico_en is not null and i.estado <> 'cerrado' then public.dias_habiles(i.cierre_tecnico_en, 10) end,
          'comunicar_vence', case when i.filtracion_confirmada_en is not null and i.comunicado_pacientes_en is null then i.filtracion_confirmada_en + interval '72 hours' end,
          'acciones_vencidas', (select count(*) from jsonb_array_elements(i.acciones) a where coalesce((a->>'cumplida')::boolean, false) = false and (a->>'fecha')::date < (now() at time zone 'America/La_Paz')::date),
          'afectadas', (select count(*) from public.incidente_afectada f where f.incidente_id = i.id),
          'notas', (select count(*) from public.incidente_nota n where n.incidente_id = i.id),
          'esc', (select jsonb_build_object('id', e.id, 'severidad', e.severidad, 'creado_en', e.creado_en, 'plazo_horas', e.plazo_horas,
                    'aviso_enviado_en', e.aviso_enviado_en, 'acuse_en', e.acuse_en, 'acuse_por', e.acuse_por, 'segundo_aviso_en', e.segundo_aviso_en,
                    'decision', e.decision, 'activa_pcn', e.activa_pcn, 'declara_crisis', e.declara_crisis, 'autoriza_comunicar', e.autoriza_comunicar,
                    'informe_vence', e.informe_vence, 'informe_entregado_en', e.informe_entregado_en)
                  from public.escalamiento e where e.incidente_id = i.id and not e.es_simulacro order by e.creado_en desc limit 1)
        ) as fila
      from public.incidente i join public.incidente_categoria c on c.numero = i.categoria
      where p_estado is null or i.estado = p_estado
      limit 300) x), '[]'::jsonb);
end $$;

create or replace function public.obtener_incidente(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
begin
  perform public.exigir_osi();
  return jsonb_build_object(
    'notas', coalesce((select jsonb_agg(jsonb_build_object('nota', n.nota, 'creada_en', n.creada_en, 'automatica', n.autor is null) order by n.creada_en) from public.incidente_nota n where n.incidente_id = p_id), '[]'::jsonb),
    'comunicaciones', coalesce((select jsonb_agg(jsonb_build_object('tipo', c.tipo, 'mensaje', c.mensaje, 'destinatarios', c.destinatarios, 'enviada_en', c.enviada_en) order by c.creada_en) from public.incidente_comunicacion c where c.incidente_id = p_id), '[]'::jsonb),
    'afectadas', coalesce((select jsonb_agg(substr(p.id::text, 1, 8) order by p.id) from public.incidente_afectada f join public.perfil p on p.id = f.paciente_id where f.incidente_id = p_id), '[]'::jsonb));
end $$;

-- 7) Reporte de eventos sospechosos (NB-PRO-P6-11, 6.1): cualquier persona con sesión; el OSI abre el incidente
create or replace function public.reportar_evento(p_descripcion text, p_sistemas text default null)
returns uuid language plpgsql security definer set search_path = public, auth as $$
declare v_rol text; v_cargo text; v_id uuid;
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  select rol into v_rol from public.perfil where id = auth.uid();
  if v_rol is null then raise exception 'Sin perfil' using errcode = '42501'; end if;
  if length(trim(coalesce(p_descripcion, ''))) < 5 or length(p_descripcion) > 1000 then raise exception 'Describe lo que viste (entre 5 y 1000 caracteres)' using errcode = '22023'; end if;
  if (select count(*) from public.reporte_evento where reportado_por = auth.uid() and reportado_en > now() - interval '1 hour') >= 10 then
    raise exception 'Enviaste demasiados reportes en una hora' using errcode = '22023';
  end if;
  v_cargo := case v_rol when 'paciente' then 'Paciente (cuenta ' || substr(auth.uid()::text, 1, 8) || ')' when 'medico' then 'Médico' else 'Administración / OSI' end;
  insert into public.reporte_evento(reportado_por, cargo, descripcion, sistemas) values (auth.uid(), v_cargo, trim(p_descripcion), nullif(trim(coalesce(p_sistemas, '')), '')) returning id into v_id;
  perform public.avisar_correo('reporte_evento', v_id);
  return v_id;
end $$;

create or replace function public.admin_reportes_evento(p_estado text default null)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
begin
  perform public.exigir_osi();
  return coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'cargo', r.cargo, 'descripcion', r.descripcion, 'sistemas', r.sistemas,
            'reportado_en', r.reportado_en, 'estado', r.estado, 'incidente_id', r.incidente_id, 'nota', r.nota,
            'registro_vence', r.reportado_en + interval '2 hours') order by (r.estado <> 'nuevo'), r.reportado_en desc)
          from public.reporte_evento r where p_estado is null or r.estado = p_estado), '[]'::jsonb);
end $$;

create or replace function public.admin_descartar_reporte(p_id uuid, p_nota text)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  perform public.exigir_osi();
  if length(trim(coalesce(p_nota, ''))) < 3 then raise exception 'Escribe por qué se descarta' using errcode = '22023'; end if;
  update public.reporte_evento set estado = 'descartado', nota = trim(p_nota) where id = p_id and estado = 'nuevo';
  if not found then raise exception 'El reporte no existe o ya fue atendido' using errcode = 'P0002'; end if;
end $$;

create or replace function public.incidente_desde_alerta(p_alerta uuid)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare a public.alerta_seguridad%rowtype; v_cat integer; r jsonb;
begin
  perform public.exigir_osi();
  select * into a from public.alerta_seguridad where id = p_alerta;
  if not found then raise exception 'Alerta no encontrada' using errcode = 'P0002'; end if;
  if exists (select 1 from public.incidente where alerta_id = p_alerta) then raise exception 'Esta alerta ya tiene un incidente' using errcode = '22023'; end if;
  v_cat := case a.regla when 'R4' then 13 when 'R5' then 13 when 'R6' then 15 when 'R8' then 14 when 'P3-04' then 14 else 16 end;
  r := public.crear_incidente(jsonb_build_object(
        'detectado_en', a.creada_en, 'reportado_en', now(), 'reportado_por', 'Sistema de detección (regla ' || a.regla || ')',
        'categoria', v_cat, 'severidad', case when a.nivel = 'critica' then 'mayor' else 'menor' end,
        'sistemas_afectados', 'App y sistema web', 'descripcion', a.titulo || '. Origen de la alerta: ' || a.regla || '.',
        'datos_restringidos', false, 'alerta_id', a.id));
  update public.alerta_seguridad set estado = 'confirmada', nota = 'Convertida en el incidente ' || (r->>'numero'), revisada_por = auth.uid(), revisada_en = now()
   where id = p_alerta and estado = 'abierta';
  return r;
end $$;

-- 8) Pacientes afectadas y comunicación (72 horas, con autorización del Director General)
create or replace function public.registrar_afectadas(p_id uuid, p_emails text[])
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare e text; v_pac uuid; ok integer := 0; desconocidos text[] := '{}';
begin
  perform public.exigir_osi();
  if not exists (select 1 from public.incidente where id = p_id) then raise exception 'Incidente no encontrado' using errcode = 'P0002'; end if;
  foreach e in array coalesce(p_emails, '{}') loop
    select id into v_pac from public.perfil where lower(email) = lower(trim(e)) and rol = 'paciente';
    if v_pac is null then desconocidos := desconocidos || trim(e);
    else insert into public.incidente_afectada(incidente_id, paciente_id) values (p_id, v_pac) on conflict do nothing; ok := ok + 1; end if;
  end loop;
  update public.incidente set pacientes_afectadas = greatest(coalesce(pacientes_afectadas, 0), (select count(*) from public.incidente_afectada where incidente_id = p_id)) where id = p_id and estado <> 'cerrado';
  return jsonb_build_object('agregadas', ok, 'no_encontradas', to_jsonb(desconocidos));
end $$;

create or replace function public.comunicar_pacientes(p_id uuid, p_mensaje text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare n integer; v_com uuid;
begin
  perform public.exigir_osi();
  if not exists (select 1 from public.incidente where id = p_id) then raise exception 'Incidente no encontrado' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.escalamiento where incidente_id = p_id and not es_simulacro and autoriza_comunicar is true) then
    raise exception 'El Director General todavía no autorizó comunicar a las pacientes' using errcode = '42501';
  end if;
  select count(*) into n from public.incidente_afectada where incidente_id = p_id;
  if n = 0 then raise exception 'Registra primero las pacientes afectadas' using errcode = '22023'; end if;
  if length(trim(coalesce(p_mensaje, ''))) < 20 or length(p_mensaje) > 1500 then raise exception 'El mensaje debe tener entre 20 y 1500 caracteres' using errcode = '22023'; end if;
  insert into public.incidente_comunicacion(incidente_id, tipo, mensaje, destinatarios, creada_por) values (p_id, 'pacientes', trim(p_mensaje), n, auth.uid()) returning id into v_com;
  update public.incidente set comunicado_pacientes_en = coalesce(comunicado_pacientes_en, now()) where id = p_id;
  perform public.avisar_correo('comunicar_pacientes', v_com);
  return jsonb_build_object('destinatarios', n);
end $$;

-- 9) Informe posterior, informes mensual y anual, simulacro
create or replace function public.entregar_informe_posterior(p_escalamiento uuid, p_texto text)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  perform public.exigir_osi();
  if length(trim(coalesce(p_texto, ''))) < 20 then raise exception 'El informe debe explicar causa, impacto y acciones (mínimo 20 caracteres)' using errcode = '22023'; end if;
  update public.escalamiento set informe_entregado_en = now(), informe_texto = trim(p_texto) where id = p_escalamiento and informe_entregado_en is null and not es_simulacro;
  if not found then raise exception 'El escalamiento no existe o el informe ya fue entregado' using errcode = 'P0002'; end if;
  perform public.avisar_correo('informe_posterior', p_escalamiento);
end $$;

create or replace function public.informe_mensual(p_anio integer, p_mes integer)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare v_desde timestamptz; v_hasta timestamptz;
begin
  perform public.exigir_osi();
  if p_mes < 1 or p_mes > 12 or p_anio < 2020 or p_anio > 2100 then raise exception 'Periodo no válido' using errcode = '22023'; end if;
  v_desde := make_timestamptz(p_anio, p_mes, 1, 0, 0, 0, 'America/La_Paz');
  v_hasta := v_desde + interval '1 month';
  return jsonb_build_object(
    'periodo', to_char(v_desde at time zone 'America/La_Paz', 'YYYY-MM'),
    'total', (select count(*) from public.incidente where reportado_en >= v_desde and reportado_en < v_hasta),
    'por_severidad', (select jsonb_build_object('menor', count(*) filter (where severidad = 'menor'), 'mayor', count(*) filter (where severidad = 'mayor'), 'critica', count(*) filter (where severidad = 'critica'))
                      from public.incidente where reportado_en >= v_desde and reportado_en < v_hasta),
    'por_categoria', (select jsonb_agg(jsonb_build_object('numero', c.numero, 'nombre', c.nombre,
                        'total', (select count(*) from public.incidente i where i.categoria = c.numero and i.reportado_en >= v_desde and i.reportado_en < v_hasta),
                        'criticos', (select count(*) from public.incidente i where i.categoria = c.numero and i.severidad = 'critica' and i.reportado_en >= v_desde and i.reportado_en < v_hasta))
                        order by c.numero) from public.incidente_categoria c),
    'impacto', (select jsonb_build_object('horas_interrupcion', coalesce(sum(horas_interrupcion), 0), 'pacientes_afectadas', coalesce(sum(pacientes_afectadas), 0),
                  'registros_afectados', coalesce(sum(registros_afectados), 0), 'horas_respuesta', coalesce(sum(horas_respuesta), 0),
                  'con_datos_restringidos', count(*) filter (where datos_restringidos))
                from public.incidente where reportado_en >= v_desde and reportado_en < v_hasta),
    'mitigaciones', coalesce((select jsonb_agg(jsonb_build_object('numero', numero, 'mitigacion', mitigacion) order by reportado_en)
                     from public.incidente where reportado_en >= v_desde and reportado_en < v_hasta and mitigacion is not null), '[]'::jsonb),
    'acciones', (select jsonb_build_object('total', count(*), 'cumplidas', count(*) filter (where coalesce((a->>'cumplida')::boolean, false)),
                   'vencidas', count(*) filter (where not coalesce((a->>'cumplida')::boolean, false) and (a->>'fecha')::date < (now() at time zone 'America/La_Paz')::date))
                 from public.incidente i, jsonb_array_elements(i.acciones) a where i.reportado_en >= v_desde and i.reportado_en < v_hasta));
end $$;

create or replace function public.informe_anual(p_anio integer)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
begin
  perform public.exigir_osi();
  return jsonb_build_object('anio', p_anio, 'meses', (
    select jsonb_agg(jsonb_build_object('mes', m, 'total', t.total, 'criticos', t.criticos, 'horas_interrupcion', t.horas, 'pacientes_afectadas', t.pac) order by m)
    from generate_series(1, 12) m
    left join lateral (
      select count(*) as total, count(*) filter (where severidad = 'critica') as criticos, coalesce(sum(horas_interrupcion), 0) as horas, coalesce(sum(pacientes_afectadas), 0) as pac
      from public.incidente
      where reportado_en >= make_timestamptz(p_anio, m, 1, 0, 0, 0, 'America/La_Paz') and reportado_en < make_timestamptz(p_anio, m, 1, 0, 0, 0, 'America/La_Paz') + interval '1 month') t on true));
end $$;

create or replace function public.enviar_informe_mensual(p_anio integer, p_mes integer)
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_per date := make_date(p_anio, p_mes, 1); v_id uuid;
begin
  perform public.exigir_osi();
  insert into public.informe_incidentes(periodo, generado_por) values (v_per, auth.uid())
    on conflict (periodo) do update set enviado_en = null, generado_por = auth.uid(), generado_en = now() returning id into v_id;
  perform public.avisar_correo('informe_mensual', v_id);
end $$;

create or replace function public.enviar_informe_mensual_auto()
returns void language plpgsql security definer set search_path = public as $$
declare v_per date := (date_trunc('month', (now() at time zone 'America/La_Paz') - interval '1 month'))::date; v_id uuid;
begin
  insert into public.informe_incidentes(periodo) values (v_per) on conflict (periodo) do nothing returning id into v_id;
  if v_id is not null then perform public.avisar_correo('informe_mensual', v_id); end if;
end $$;
revoke all on function public.enviar_informe_mensual_auto() from public, anon, authenticated;

create or replace function public.iniciar_simulacro()
returns uuid language plpgsql security definer set search_path = public, auth as $$
begin
  perform public.exigir_osi();
  return public.crear_escalamiento(null, 'Simulacro anual de escalamiento', true);
end $$;

create or replace function public.listar_simulacros()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
begin
  perform public.exigir_osi();
  return coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'creado_en', e.creado_en, 'aviso_enviado_en', e.aviso_enviado_en, 'acuse_en', e.acuse_en, 'acuse_por', e.acuse_por,
            'minutos_hasta_acuse', case when e.acuse_en is not null then round(extract(epoch from (e.acuse_en - e.creado_en)) / 60.0, 1) end,
            'plazo_minutos', e.plazo_horas * 60) order by e.creado_en desc)
          from public.escalamiento e where e.es_simulacro), '[]'::jsonb);
end $$;

create or replace function public.incidentes_resumen()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
begin
  perform public.exigir_osi();
  return jsonb_build_object(
    'abiertos', (select count(*) from public.incidente where estado <> 'cerrado'),
    'criticos_abiertos', (select count(*) from public.incidente where estado <> 'cerrado' and severidad = 'critica'),
    'sin_acuse', (select count(*) from public.escalamiento where acuse_en is null and not es_simulacro),
    'eventos_nuevos', (select count(*) from public.reporte_evento where estado = 'nuevo'),
    'acciones_vencidas', (select count(*) from public.incidente i, jsonb_array_elements(i.acciones) a where not coalesce((a->>'cumplida')::boolean, false) and (a->>'fecha')::date < (now() at time zone 'America/La_Paz')::date),
    'informes_pendientes', (select count(*) from public.escalamiento where informe_entregado_en is null and not es_simulacro and acuse_en is not null));
end $$;

-- 10) Acuse y decisión del Director General por enlace seguro (sin sesión; el enlace es secreto, de un solo destinatario y vence en 72 horas)
create or replace function public.escalamiento_por_token(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare e public.escalamiento%rowtype; i public.incidente%rowtype; c text;
begin
  select * into e from public.escalamiento where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') and token_expira > now();
  if not found then return jsonb_build_object('valido', false); end if;
  if e.incidente_id is not null then
    select * into i from public.incidente where id = e.incidente_id;
    select nombre into c from public.incidente_categoria where numero = i.categoria;
  end if;
  return jsonb_build_object('valido', true, 'simulacro', e.es_simulacro, 'severidad', e.severidad, 'disparador', e.disparador, 'creado_en', e.creado_en,
    'plazo_horas', e.plazo_horas, 'acuse_en', e.acuse_en, 'decision', e.decision, 'decision_en', e.decision_en,
    'numero', i.numero, 'categoria', c, 'descripcion', i.descripcion, 'sistemas', i.sistemas_afectados, 'datos_restringidos', i.datos_restringidos,
    'datos_restringidos_tipo', i.datos_restringidos_tipo, 'pacientes_afectadas', i.pacientes_afectadas, 'mitigacion', i.mitigacion, 'detectado_en', i.detectado_en);
end $$;

create or replace function public.acusar_escalamiento(p_token text, p_nombre text, p_decision text default null,
    p_activa_pcn boolean default false, p_declara_crisis boolean default false, p_autoriza_comunicar boolean default false)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare e public.escalamiento%rowtype; v_min numeric;
begin
  select * into e from public.escalamiento where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') and token_expira > now() for update;
  if not found then raise exception 'El enlace no es válido o venció' using errcode = '42501'; end if;
  if length(trim(coalesce(p_nombre, ''))) < 3 or length(p_nombre) > 100 then raise exception 'Escribe tu nombre completo para el acuse' using errcode = '22023'; end if;
  if p_decision is not null and p_decision not in ('trata', 'acepta', 'transfiere') then raise exception 'La decisión no es válida' using errcode = '22023'; end if;
  if e.acuse_en is null then
    update public.escalamiento set acuse_en = now(), acuse_por = trim(p_nombre) where id = e.id;
    v_min := round(extract(epoch from (now() - e.creado_en)) / 60.0, 1);
    if e.incidente_id is not null then
      insert into public.incidente_nota(incidente_id, nota, autor) values (e.incidente_id, 'Acuse del escalamiento por ' || trim(p_nombre) || ' a los ' || v_min || ' minutos del aviso.', null);
    end if;
  end if;
  if p_decision is not null and e.decision is null and not e.es_simulacro then
    update public.escalamiento set decision = p_decision, activa_pcn = coalesce(p_activa_pcn, false), declara_crisis = coalesce(p_declara_crisis, false),
           autoriza_comunicar = coalesce(p_autoriza_comunicar, false), decision_en = now() where id = e.id;
    if e.incidente_id is not null then
      insert into public.incidente_nota(incidente_id, nota, autor) values (e.incidente_id,
        'Decisión del Director General: ' || p_decision || case when p_activa_pcn then '; activa el plan de continuidad' else '' end
        || case when p_declara_crisis then '; declara la crisis' else '' end || case when p_autoriza_comunicar then '; autoriza comunicar a las pacientes' else '' end || '.', null);
    end if;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- 11) Seguimiento automático: sin acuse en 30 minutos (segundo aviso y suplente), reintentos de envío y acciones vencidas
create or replace function public.vigilar_escalamientos()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id from public.escalamiento where aviso_enviado_en is null and acuse_en is null and creado_en < now() - interval '3 minutes' and reintentos < 3 loop
    update public.escalamiento set reintentos = reintentos + 1 where id = r.id;
    perform public.avisar_correo('escalamiento_aviso', r.id);
  end loop;
  for r in select id from public.escalamiento where aviso_enviado_en is not null and acuse_en is null and segundo_aviso_en is null and aviso_enviado_en < now() - interval '30 minutes' loop
    update public.escalamiento set segundo_aviso_en = now() where id = r.id;
    perform public.avisar_correo('escalamiento_segundo', r.id);
  end loop;
end $$;
revoke all on function public.vigilar_escalamientos() from public, anon, authenticated;

create or replace function public.vigilar_incidentes_diario()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select i.id from public.incidente i
           where i.acciones_vencidas_escaladas_en is null and exists (
             select 1 from jsonb_array_elements(i.acciones) a
             where not coalesce((a->>'cumplida')::boolean, false) and (a->>'fecha')::date < (now() at time zone 'America/La_Paz')::date) loop
    update public.incidente set acciones_vencidas_escaladas_en = now() where id = r.id;
    perform public.avisar_correo('acciones_vencidas', r.id);
  end loop;
end $$;
revoke all on function public.vigilar_incidentes_diario() from public, anon, authenticated;

select cron.schedule('escalamiento-vigilancia', '*/5 * * * *', 'select public.vigilar_escalamientos()');
select cron.schedule('incidentes-diario', '0 12 * * *', 'select public.vigilar_incidentes_diario()');
select cron.schedule('informe-incidentes-mensual', '0 13 1 * *', 'select public.enviar_informe_mensual_auto()');

-- 12) Permisos de las funciones
do $$ declare f text; begin
  foreach f in array array[
    'crear_incidente(jsonb)', 'actualizar_incidente(uuid,jsonb)', 'cerrar_incidente(uuid,text,jsonb)', 'marcar_accion(uuid,integer,boolean)',
    'agregar_nota_incidente(uuid,text)', 'listar_incidentes(text)', 'obtener_incidente(uuid)', 'reportar_evento(text,text)',
    'admin_reportes_evento(text)', 'admin_descartar_reporte(uuid,text)', 'incidente_desde_alerta(uuid)', 'registrar_afectadas(uuid,text[])',
    'comunicar_pacientes(uuid,text)', 'entregar_informe_posterior(uuid,text)', 'informe_mensual(integer,integer)', 'informe_anual(integer)',
    'enviar_informe_mensual(integer,integer)', 'iniciar_simulacro()', 'listar_simulacros()', 'incidentes_resumen()'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public.escalamiento_por_token(text) from public;
revoke all on function public.acusar_escalamiento(text, text, text, boolean, boolean, boolean) from public;
grant execute on function public.escalamiento_por_token(text) to anon, authenticated;
grant execute on function public.acusar_escalamiento(text, text, text, boolean, boolean, boolean) to anon, authenticated;
