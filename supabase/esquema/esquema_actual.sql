-- Esquema actual de la base de datos de NovaByte / FemCare (esquema public, funciones, reglas de acceso por fila,
-- disparadores, permisos, tareas programadas y el depósito de respaldos).
-- Generado el 24/11/2026 desde el proyecto de producción. Sirve para reconstruir el sistema en otro proyecto de Supabase
-- (por ejemplo, el de desarrollo). No contiene datos ni secretos: el token de las tareas de respaldo es un marcador
-- (__TOKEN_DE_RESPALDO__) que se reemplaza por el valor de la tabla respaldo_config del proyecto nuevo.
-- Las migraciones incrementales posteriores están en supabase/migrations.
set check_function_bodies = false;

create extension if not exists "http" with schema extensions;

create extension if not exists "pg_cron" with schema pg_catalog;

create extension if not exists "pg_net" with schema public;

create extension if not exists "pg_stat_statements" with schema extensions;

create extension if not exists "pgcrypto" with schema extensions;

create extension if not exists "supabase_vault" with schema vault;

create extension if not exists "uuid-ossp" with schema extensions;

create type public.estado_cita as enum ('programada', 'cancelada', 'completada', 'no_asistio', 'reprogramada');

create type public.tipo_cita as enum ('primera_vez', 'control', 'emergencia', 'teleconsulta', 'otros');

create sequence if not exists public.alertas_enviadas_id_seq;

create sequence if not exists public.audit_log_id_seq;

create sequence if not exists public.incidente_numero_seq;

create sequence if not exists public.recordatorio_queue_id_seq;

create table if not exists public.aceptacion_terminos (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  version text not null,
  aceptado_en timestamp with time zone not null default now(),
  factor_verificado_en timestamp with time zone not null,
  dispositivo text,
  user_agent text,
  ip text
);

create table if not exists public.actividad_sospechosa (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  tipo text not null,
  detalle jsonb,
  nivel text not null default 'medio'::text,
  procesado boolean not null default false,
  creado_en timestamp with time zone not null default now()
);

create table if not exists public.alergia (
  id uuid not null default gen_random_uuid(),
  paciente_id uuid not null,
  sustancia text not null,
  severidad text,
  observacion text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.alerta_seguridad (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  regla text not null,
  nivel text not null,
  titulo text not null,
  detalle jsonb not null default '{}'::jsonb,
  ip text,
  clave text,
  avisar_paciente boolean not null default true,
  creada_en timestamp with time zone not null default now(),
  vence_revision timestamp with time zone not null,
  estado text not null default 'abierta'::text,
  revisada_por uuid,
  revisada_en timestamp with time zone,
  nota text,
  notificada_osi boolean not null default false,
  notificada_paciente boolean not null default false
);

create table if not exists public.alertas_enviadas (
  id bigint not null default nextval('alertas_enviadas_id_seq'::regclass),
  user_id uuid not null,
  tipo text not null,
  nivel text not null,
  detalle jsonb,
  enviado_en timestamp with time zone default now(),
  exito boolean default false,
  respuesta text
);

create table if not exists public.antecedente (
  id uuid not null default gen_random_uuid(),
  paciente_id uuid not null,
  tipo text not null,
  descripcion text not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.archivo_clinico (
  id uuid not null default gen_random_uuid(),
  paciente_id uuid not null,
  tipo text,
  url text,
  descripcion text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.audit_cabeza (
  id integer not null default 1,
  hash text
);

create table if not exists public.audit_log (
  id bigint not null default nextval('audit_log_id_seq'::regclass),
  actor_id uuid,
  ocurrido_en timestamp with time zone not null default now(),
  cuenta_id uuid,
  actor_rol text,
  accion text not null,
  objeto text not null,
  objeto_id uuid,
  columnas text[],
  ip text,
  user_agent text,
  hash_previo text,
  hash text not null
);

create table if not exists public.bloqueo_origen (
  ip text not null,
  hasta timestamp with time zone not null,
  motivo text not null,
  creado_en timestamp with time zone not null default now()
);

create table if not exists public.cita (
  id uuid not null default gen_random_uuid(),
  paciente_id uuid not null,
  medico_id uuid,
  fecha_hora timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  estado estado_cita default 'programada'::estado_cita,
  tipo_cita tipo_cita default 'control'::tipo_cita,
  recordatorio boolean default false
);

create table if not exists public.clave_historial (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  hash text not null,
  creado_en timestamp with time zone not null default now()
);

create table if not exists public.codigo_verificacion (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  codigo text not null,
  expiracion timestamp with time zone not null default (now() + '00:05:00'::interval),
  usado boolean default false,
  creado_en timestamp with time zone default now()
);

create table if not exists public.consentimiento (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  codigo text not null,
  version text not null,
  otorgado boolean not null,
  registrado_en timestamp with time zone not null default now(),
  dispositivo text,
  ip text,
  user_agent text
);

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
  creado_en timestamp with time zone not null default now()
);

create table if not exists public.consulta (
  id uuid not null default gen_random_uuid(),
  cita_id uuid,
  paciente_id uuid not null,
  medico_id uuid not null,
  motivo text,
  anamnesis text,
  examen_fisico text,
  plan text,
  observaciones text,
  created_at timestamp with time zone not null default now(),
  archivo_clinico_id uuid not null
);

create table if not exists public.desbloqueo_tokens (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  token text not null,
  expiracion timestamp with time zone not null,
  usado boolean not null default false,
  creado_en timestamp with time zone not null default now()
);

create table if not exists public.diagnostico (
  id uuid not null default gen_random_uuid(),
  consulta_id uuid not null,
  codigo text,
  descripcion text not null,
  principal boolean not null default false
);

create table if not exists public.dispositivo_conocido (
  user_id uuid not null,
  huella text not null,
  ip text,
  user_agent text,
  primera_vez timestamp with time zone not null default now(),
  ultima_vez timestamp with time zone not null default now()
);

create table if not exists public.encuesta (
  id uuid not null default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  activa boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.escalamiento (
  id uuid not null default gen_random_uuid(),
  incidente_id uuid,
  es_simulacro boolean not null default false,
  disparador text not null,
  severidad text not null,
  plazo_horas integer not null,
  creado_en timestamp with time zone not null default now(),
  token_hash text,
  token_expira timestamp with time zone,
  aviso_enviado_en timestamp with time zone,
  reintentos integer not null default 0,
  acuse_en timestamp with time zone,
  acuse_por text,
  segundo_aviso_en timestamp with time zone,
  decision text,
  activa_pcn boolean,
  declara_crisis boolean,
  autoriza_comunicar boolean,
  decision_en timestamp with time zone,
  informe_vence timestamp with time zone,
  informe_entregado_en timestamp with time zone,
  informe_texto text,
  informe_correo_en timestamp with time zone,
  segundo_correo_en timestamp with time zone
);

create table if not exists public.examen (
  id uuid not null default gen_random_uuid(),
  consulta_id uuid not null,
  tipo text not null,
  indicacion text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.fechas_sin_atencion (
  id uuid not null default gen_random_uuid(),
  perfil_id uuid not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  creado_en timestamp without time zone default now(),
  actualizado_en timestamp without time zone default now()
);

create table if not exists public.geoip_cache (
  ip text not null,
  pais text,
  consultado_en timestamp with time zone not null default now()
);

create table if not exists public.habilitacion_exterior (
  user_id uuid not null,
  hasta timestamp with time zone not null,
  creada_en timestamp with time zone not null default now()
);

create table if not exists public.horarios_medico (
  id uuid not null default gen_random_uuid(),
  perfil_id uuid not null,
  dia_semana smallint not null,
  hora_inicio time without time zone not null,
  hora_fin time without time zone not null,
  creado_en timestamp without time zone default now(),
  actualizado_en timestamp without time zone default now(),
  activo boolean default false
);

create table if not exists public.incidente (
  id uuid not null default gen_random_uuid(),
  numero text not null default ('INC-'::text || lpad((nextval('incidente_numero_seq'::regclass))::text, 4, '0'::text)),
  detectado_en timestamp with time zone not null,
  reportado_en timestamp with time zone not null,
  reportado_por text not null,
  categoria integer not null,
  severidad text not null,
  sistemas_afectados text not null,
  descripcion text not null,
  datos_restringidos boolean not null default false,
  datos_restringidos_tipo text,
  horas_interrupcion numeric,
  pacientes_afectadas integer,
  registros_afectados integer,
  horas_respuesta numeric,
  mitigacion text,
  comunicaciones text,
  causa text,
  acciones jsonb not null default '[]'::jsonb,
  estado text not null default 'abierto'::text,
  cierre_tecnico_en timestamp with time zone,
  cerrado_en timestamp with time zone,
  filtracion_confirmada_en timestamp with time zone,
  comunicado_pacientes_en timestamp with time zone,
  registro_tardio boolean not null default false,
  alerta_id uuid,
  reporte_id uuid,
  acciones_vencidas_escaladas_en timestamp with time zone,
  abierto_por uuid not null,
  abierto_en timestamp with time zone not null default now(),
  acciones_correo_en timestamp with time zone
);

create table if not exists public.incidente_afectada (
  incidente_id uuid not null,
  paciente_id uuid not null
);

create table if not exists public.incidente_categoria (
  numero integer not null,
  nombre text not null,
  ejemplo text not null,
  responde text not null
);

create table if not exists public.incidente_comunicacion (
  id uuid not null default gen_random_uuid(),
  incidente_id uuid not null,
  tipo text not null,
  mensaje text not null,
  destinatarios integer not null default 0,
  creada_en timestamp with time zone not null default now(),
  enviada_en timestamp with time zone,
  creada_por uuid
);

create table if not exists public.incidente_nota (
  id uuid not null default gen_random_uuid(),
  incidente_id uuid not null,
  nota text not null,
  autor uuid,
  creada_en timestamp with time zone not null default now()
);

create table if not exists public.informe_incidentes (
  id uuid not null default gen_random_uuid(),
  periodo date not null,
  generado_en timestamp with time zone not null default now(),
  enviado_en timestamp with time zone,
  generado_por uuid
);

create table if not exists public.intento_ingreso_fallido (
  id bigint generated always as identity not null,
  ip text,
  email text,
  creado_en timestamp with time zone not null default now()
);

create table if not exists public.perfil (
  id uuid not null default gen_random_uuid(),
  rol text not null,
  nombre text,
  email text,
  fecha_nacimiento date,
  especialidad text,
  created_at timestamp with time zone not null default now(),
  bloqueado boolean,
  primer_login boolean not null default false,
  apellidos text,
  activo boolean,
  telegram_chat_id text,
  motivo_bloqueo text,
  bloqueado_en timestamp with time zone,
  clave_cambiada_en timestamp with time zone default now()
);

create table if not exists public.pregunta (
  id uuid not null default gen_random_uuid(),
  encuesta_id uuid not null,
  enunciado text not null,
  tipo text not null,
  orden integer not null,
  opciones text
);

create table if not exists public.receta (
  id uuid not null default gen_random_uuid(),
  consulta_id uuid not null,
  indicaciones_generales text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.receta_item (
  id uuid not null default gen_random_uuid(),
  receta_id uuid not null,
  medicamento text not null,
  via text,
  dosis text,
  frecuencia text,
  duracion text
);

create table if not exists public.recordatorio_queue (
  id integer not null default nextval('recordatorio_queue_id_seq'::regclass),
  created_at timestamp with time zone default now()
);

create table if not exists public.reporte_evento (
  id uuid not null default gen_random_uuid(),
  reportado_por uuid not null,
  cargo text not null,
  descripcion text not null,
  sistemas text,
  reportado_en timestamp with time zone not null default now(),
  estado text not null default 'nuevo'::text,
  incidente_id uuid,
  nota text,
  notificado boolean not null default false
);

create table if not exists public.reset_tokens (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  token text not null,
  expiracion timestamp with time zone not null,
  usado boolean default false
);

create table if not exists public.respaldo_config (
  id integer not null default 1,
  token text not null
);

create table if not exists public.respaldo_incidente (
  id bigint generated always as identity not null,
  tipo text not null,
  detalle text,
  creado_en timestamp with time zone not null default now(),
  cerrado_en timestamp with time zone
);

create table if not exists public.respaldo_prueba_restauracion (
  id bigint generated always as identity not null,
  respaldo_ruta text,
  ok boolean not null,
  detalle jsonb,
  creado_en timestamp with time zone not null default now()
);

create table if not exists public.respaldo_registro (
  id bigint generated always as identity not null,
  tipo text not null,
  ruta text,
  bytes bigint,
  tablas integer,
  filas bigint,
  sha256 text,
  cifrado boolean not null default false,
  ok boolean not null,
  error text,
  creado_en timestamp with time zone not null default now(),
  borrado_en timestamp with time zone
);

create table if not exists public.respuesta_encuesta (
  id uuid not null default gen_random_uuid(),
  encuesta_id uuid not null,
  cita_id uuid not null,
  paciente_id uuid not null,
  creada_en timestamp with time zone not null default now()
);

create table if not exists public.respuesta_pregunta (
  id uuid not null default gen_random_uuid(),
  respuesta_encuesta_id uuid not null,
  pregunta_id uuid not null,
  valor_num numeric,
  valor_bool boolean,
  valor_texto text
);

create table if not exists public.restriccion_cuenta (
  user_id uuid not null,
  tipo text not null,
  desde timestamp with time zone not null default now(),
  hasta timestamp with time zone,
  motivo text
);

create table if not exists public.resultado_examen (
  id uuid not null default gen_random_uuid(),
  examen_id uuid not null,
  informe text,
  hallazgos jsonb,
  fecha_resultado date,
  adjunto_url text
);

create table if not exists public.seguridad_recordatorio (
  user_id uuid not null,
  version text not null default '1.0'::text,
  visto_en timestamp with time zone not null default now()
);

create table if not exists public.sesion_actividad (
  session_id uuid not null,
  user_id uuid not null,
  ultima_actividad timestamp with time zone not null default now(),
  ip text,
  user_agent text
);

create table if not exists public.signos_vitales (
  id uuid not null default gen_random_uuid(),
  consulta_id uuid not null,
  presion_sistolica integer,
  presion_diastolica integer,
  frecuencia_cardiaca integer,
  temperatura numeric(4,1),
  saturacion_oxigeno integer,
  peso_kg numeric(5,2),
  talla_cm numeric(5,1),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.solicitud_derechos (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  tipo text not null,
  detalle text,
  estado text not null default 'recibida'::text,
  creada_en timestamp with time zone not null default now(),
  vence_en timestamp with time zone not null,
  atendida_en timestamp with time zone,
  atendida_por uuid,
  respuesta text
);

create table if not exists public.terminos (
  version text not null,
  titulo text not null,
  contenido text not null,
  vigente boolean not null default false,
  creado_en timestamp with time zone not null default now()
);

alter table public.aceptacion_terminos add constraint aceptacion_terminos_pkey PRIMARY KEY (id);

alter table public.aceptacion_terminos add constraint aceptacion_terminos_user_id_version_key UNIQUE (user_id, version);

alter table public.actividad_sospechosa add constraint actividad_sospechosa_pkey PRIMARY KEY (id);

alter table public.alergia add constraint alergia_pkey PRIMARY KEY (id);

alter table public.alerta_seguridad add constraint alerta_seguridad_pkey PRIMARY KEY (id);

alter table public.alertas_enviadas add constraint alertas_enviadas_pkey PRIMARY KEY (id);

alter table public.antecedente add constraint antecedente_pkey PRIMARY KEY (id);

alter table public.archivo_clinico add constraint archivo_clinico_pkey PRIMARY KEY (id);

alter table public.audit_cabeza add constraint audit_cabeza_pkey PRIMARY KEY (id);

alter table public.audit_log add constraint audit_log_pkey PRIMARY KEY (id);

alter table public.bloqueo_origen add constraint bloqueo_origen_pkey PRIMARY KEY (ip);

alter table public.cita add constraint cita_pkey PRIMARY KEY (id);

alter table public.clave_historial add constraint clave_historial_pkey PRIMARY KEY (id);

alter table public.codigo_verificacion add constraint codigo_verificacion_pkey PRIMARY KEY (id);

alter table public.consentimiento add constraint consentimiento_pkey PRIMARY KEY (id);

alter table public.consentimiento_catalogo add constraint consentimiento_catalogo_pkey PRIMARY KEY (codigo, version);

alter table public.consulta add constraint consulta_cita_id_key UNIQUE (cita_id);

alter table public.consulta add constraint consulta_pkey PRIMARY KEY (id);

alter table public.desbloqueo_tokens add constraint desbloqueo_tokens_pkey PRIMARY KEY (id);

alter table public.desbloqueo_tokens add constraint desbloqueo_tokens_token_key UNIQUE (token);

alter table public.diagnostico add constraint diagnostico_pkey PRIMARY KEY (id);

alter table public.dispositivo_conocido add constraint dispositivo_conocido_pkey PRIMARY KEY (user_id, huella);

alter table public.encuesta add constraint encuesta_pkey PRIMARY KEY (id);

alter table public.escalamiento add constraint escalamiento_pkey PRIMARY KEY (id);

alter table public.examen add constraint examen_pkey PRIMARY KEY (id);

alter table public.fechas_sin_atencion add constraint fechas_sin_atencion_pkey PRIMARY KEY (id);

alter table public.geoip_cache add constraint geoip_cache_pkey PRIMARY KEY (ip);

alter table public.habilitacion_exterior add constraint habilitacion_exterior_pkey PRIMARY KEY (user_id);

alter table public.horarios_medico add constraint horarios_medico_pkey PRIMARY KEY (id);

alter table public.incidente add constraint incidente_numero_key UNIQUE (numero);

alter table public.incidente add constraint incidente_pkey PRIMARY KEY (id);

alter table public.incidente_afectada add constraint incidente_afectada_pkey PRIMARY KEY (incidente_id, paciente_id);

alter table public.incidente_categoria add constraint incidente_categoria_pkey PRIMARY KEY (numero);

alter table public.incidente_comunicacion add constraint incidente_comunicacion_pkey PRIMARY KEY (id);

alter table public.incidente_nota add constraint incidente_nota_pkey PRIMARY KEY (id);

alter table public.informe_incidentes add constraint informe_incidentes_periodo_key UNIQUE (periodo);

alter table public.informe_incidentes add constraint informe_incidentes_pkey PRIMARY KEY (id);

alter table public.intento_ingreso_fallido add constraint intento_ingreso_fallido_pkey PRIMARY KEY (id);

alter table public.perfil add constraint perfil_email_key UNIQUE (email);

alter table public.perfil add constraint perfil_pkey PRIMARY KEY (id);

alter table public.pregunta add constraint pregunta_encuesta_id_orden_key UNIQUE (encuesta_id, orden);

alter table public.pregunta add constraint pregunta_pkey PRIMARY KEY (id);

alter table public.receta add constraint receta_pkey PRIMARY KEY (id);

alter table public.receta_item add constraint receta_item_pkey PRIMARY KEY (id);

alter table public.recordatorio_queue add constraint recordatorio_queue_pkey PRIMARY KEY (id);

alter table public.reporte_evento add constraint reporte_evento_pkey PRIMARY KEY (id);

alter table public.reset_tokens add constraint reset_tokens_pkey PRIMARY KEY (id);

alter table public.respaldo_config add constraint respaldo_config_pkey PRIMARY KEY (id);

alter table public.respaldo_incidente add constraint respaldo_incidente_pkey PRIMARY KEY (id);

alter table public.respaldo_prueba_restauracion add constraint respaldo_prueba_restauracion_pkey PRIMARY KEY (id);

alter table public.respaldo_registro add constraint respaldo_registro_pkey PRIMARY KEY (id);

alter table public.respuesta_encuesta add constraint respuesta_encuesta_pkey PRIMARY KEY (id);

alter table public.respuesta_pregunta add constraint respuesta_pregunta_pkey PRIMARY KEY (id);

alter table public.respuesta_pregunta add constraint respuesta_pregunta_respuesta_encuesta_id_pregunta_id_key UNIQUE (respuesta_encuesta_id, pregunta_id);

alter table public.restriccion_cuenta add constraint restriccion_cuenta_pkey PRIMARY KEY (user_id, tipo);

alter table public.resultado_examen add constraint resultado_examen_pkey PRIMARY KEY (id);

alter table public.seguridad_recordatorio add constraint seguridad_recordatorio_pkey PRIMARY KEY (user_id);

alter table public.sesion_actividad add constraint sesion_actividad_pkey PRIMARY KEY (session_id);

alter table public.signos_vitales add constraint signos_vitales_pkey PRIMARY KEY (id);

alter table public.solicitud_derechos add constraint solicitud_derechos_pkey PRIMARY KEY (id);

alter table public.terminos add constraint terminos_pkey PRIMARY KEY (version);

CREATE INDEX alerta_seguridad_dedupe_idx ON public.alerta_seguridad USING btree (regla, clave, creada_en DESC);

CREATE INDEX alerta_seguridad_estado_idx ON public.alerta_seguridad USING btree (estado, vence_revision);

CREATE INDEX audit_log_actor_idx ON public.audit_log USING btree (actor_id, ocurrido_en DESC);

CREATE INDEX audit_log_cuenta_idx ON public.audit_log USING btree (cuenta_id, ocurrido_en DESC);

CREATE INDEX clave_historial_idx ON public.clave_historial USING btree (user_id, creado_en DESC);

CREATE INDEX consentimiento_user_idx ON public.consentimiento USING btree (user_id, codigo, registrado_en DESC);

CREATE INDEX desbloqueo_tokens_user_idx ON public.desbloqueo_tokens USING btree (user_id, creado_en DESC);

CREATE INDEX escalamiento_pend_idx ON public.escalamiento USING btree (acuse_en, creado_en);

CREATE INDEX idx_cita_fecha ON public.cita USING btree (fecha_hora);

CREATE INDEX idx_cita_medico ON public.cita USING btree (medico_id);

CREATE INDEX idx_cita_paciente ON public.cita USING btree (paciente_id);

CREATE INDEX idx_diag_consulta ON public.diagnostico USING btree (consulta_id);

CREATE INDEX idx_pregunta_encuesta ON public.pregunta USING btree (encuesta_id, orden);

CREATE INDEX idx_respenc_cita ON public.respuesta_encuesta USING btree (cita_id);

CREATE INDEX idx_respenc_encuesta ON public.respuesta_encuesta USING btree (encuesta_id);

CREATE INDEX idx_respenc_paciente ON public.respuesta_encuesta USING btree (paciente_id);

CREATE INDEX idx_resppreg_preg ON public.respuesta_pregunta USING btree (pregunta_id);

CREATE INDEX idx_resppreg_resphdr ON public.respuesta_pregunta USING btree (respuesta_encuesta_id);

CREATE INDEX incidente_estado_idx ON public.incidente USING btree (estado, severidad, reportado_en DESC);

CREATE INDEX incidente_nota_idx ON public.incidente_nota USING btree (incidente_id, creada_en);

CREATE INDEX intento_fallido_ip_idx ON public.intento_ingreso_fallido USING btree (ip, creado_en DESC);

CREATE INDEX solicitud_derechos_estado_idx ON public.solicitud_derechos USING btree (estado, vence_en);

CREATE INDEX solicitud_derechos_user_idx ON public.solicitud_derechos USING btree (user_id, creada_en DESC);

CREATE UNIQUE INDEX cita_sin_doble_reserva ON public.cita USING btree (medico_id, fecha_hora) WHERE (estado = ANY (ARRAY['programada'::estado_cita, 'reprogramada'::estado_cita]));

CREATE UNIQUE INDEX terminos_una_vigente ON public.terminos USING btree ((true)) WHERE vigente;

CREATE OR REPLACE FUNCTION public.aceptar_terminos(p_version text, p_dispositivo text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare hdr json; v_ip text; v_ua text; v_fact timestamptz;
begin
  if not public.sesion_existe() then raise exception 'Sesion no valida' using errcode = '42501'; end if;
  if (select rol from public.perfil where id = auth.uid()) is distinct from 'paciente' then
    raise exception 'Los terminos aplican a pacientes' using errcode = '42501';
  end if;
  if not exists (select 1 from public.terminos where version = p_version and vigente) then
    raise exception 'La version de los terminos no esta vigente' using errcode = '22023';
  end if;
  -- La aceptacion exige el segundo factor: un codigo de verificacion usado en los ultimos 15 minutos.
  select max(c.creado_en) into v_fact from public.codigo_verificacion c
   where c.user_id = auth.uid() and c.usado and c.creado_en > now() - interval '15 minutes';
  if v_fact is null then raise exception 'Confirma con tu segundo factor (vuelve a iniciar sesion)' using errcode = '42501'; end if;
  begin hdr := current_setting('request.headers', true)::json; exception when others then hdr := null; end;
  v_ip := coalesce(nullif(split_part(coalesce(hdr->>'x-forwarded-for', ''), ',', 1), ''), hdr->>'cf-connecting-ip');
  v_ua := hdr->>'user-agent';
  insert into public.aceptacion_terminos(user_id, version, factor_verificado_en, dispositivo, user_agent, ip)
    values (auth.uid(), p_version, v_fact, left(p_dispositivo, 200), left(v_ua, 300), left(v_ip, 60))
    on conflict (user_id, version) do nothing;
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (auth.uid(), 'aceptacion_terminos', 'bajo', jsonb_build_object('version', p_version, 'ip', v_ip));
end $function$
;

CREATE OR REPLACE FUNCTION public.activar_respaldos()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'cron', 'net'
AS $function$
declare tok text; url text := 'https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/respaldo';
begin
  select token into tok from public.respaldo_config where id = 1;
  perform cron.schedule('respaldo-horario', '5 * * * *', format($c$select net.http_post(url := %L, headers := jsonb_build_object('Content-Type','application/json','x-cron-token', %L), body := jsonb_build_object('accion','respaldar','tipo','horario'), timeout_milliseconds := 120000)$c$, url, tok));
  perform cron.schedule('respaldo-diario', '30 2 * * *', format($c$select net.http_post(url := %L, headers := jsonb_build_object('Content-Type','application/json','x-cron-token', %L), body := jsonb_build_object('accion','respaldar','tipo','diario'), timeout_milliseconds := 120000)$c$, url, tok));
  perform cron.schedule('respaldo-config-semanal', '20 3 * * 0', format($c$select net.http_post(url := %L, headers := jsonb_build_object('Content-Type','application/json','x-cron-token', %L), body := jsonb_build_object('accion','respaldar','tipo','config'), timeout_milliseconds := 120000)$c$, url, tok));
  perform cron.schedule('respaldo-prueba-restauracion', '40 3 * * 0', format($c$select net.http_post(url := %L, headers := jsonb_build_object('Content-Type','application/json','x-cron-token', %L), body := jsonb_build_object('accion','probar_restauracion'), timeout_milliseconds := 120000)$c$, url, tok));
  perform cron.schedule('respaldo-vigilancia', '*/30 * * * *', 'select public.vigilar_respaldos()');
  return 'tareas de respaldo activadas';
end $function$
;

CREATE OR REPLACE FUNCTION public.actualizar_incidente(p_id uuid, p jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.acusar_escalamiento(p_token text, p_nombre text, p_decision text DEFAULT NULL::text, p_activa_pcn boolean DEFAULT false, p_declara_crisis boolean DEFAULT false, p_autoriza_comunicar boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_alertas(p_estado text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, regla text, nivel text, titulo text, cuenta text, ip text, detalle jsonb, creada_en timestamp with time zone, vence_revision timestamp with time zone, minutos_restantes integer, estado text, revisada_en timestamp with time zone, nota text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
  return query
    select a.id, a.regla, a.nivel, a.titulo, p.email, a.ip, a.detalle, a.creada_en, a.vence_revision,
           floor(extract(epoch from (a.vence_revision - now())) / 60)::integer, a.estado, a.revisada_en, a.nota
    from public.alerta_seguridad a left join public.perfil p on p.id = a.user_id
    where p_estado is null or a.estado = p_estado
    order by (a.estado <> 'abierta'), a.vence_revision
    limit 300;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_alertas_resumen()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
  return jsonb_build_object(
    'abiertas', (select count(*) from public.alerta_seguridad where estado = 'abierta'),
    'vencidas', (select count(*) from public.alerta_seguridad where estado = 'abierta' and vence_revision < now()),
    'criticas_abiertas', (select count(*) from public.alerta_seguridad where estado = 'abierta' and nivel = 'critica'),
    'falsos_positivos_90d', (select count(*) from public.alerta_seguridad where estado = 'falso_positivo' and creada_en > now() - interval '90 days'),
    'confirmadas_90d', (select count(*) from public.alerta_seguridad where estado = 'confirmada' and creada_en > now() - interval '90 days'),
    'total_90d', (select count(*) from public.alerta_seguridad where creada_en > now() - interval '90 days'));
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_atender_solicitud(p_id uuid, p_estado text, p_respuesta text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
  if s.tipo = 'eliminacion' and p_estado = 'atendida' then
    perform set_config('nb.permitir_bloqueo', 'on', true);
    update public.perfil set activo = false, bloqueado = true, motivo_bloqueo = 'paciente', bloqueado_en = now(),
           telegram_chat_id = null where id = s.user_id;
    delete from auth.sessions where user_id = s.user_id;
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_bloquear_cuenta(p_user uuid, p_motivo text DEFAULT 'admin'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
  perform set_config('nb.permitir_bloqueo', 'on', true);
  update public.perfil set bloqueado = true, motivo_bloqueo = coalesce(p_motivo, 'admin'), bloqueado_en = now() where id = p_user;
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (p_user, 'bloqueo', 'alto', jsonb_build_object('razon', 'bloqueo ordenado por administrador', 'por', auth.uid()));
  delete from auth.sessions where user_id = p_user;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_desbloquear_cuenta(p_user uuid, p_identidad_verificada boolean, p_nota text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
  if p_identidad_verificada is not true then raise exception 'Debe verificar la identidad antes de desbloquear' using errcode = '22023'; end if;
  perform set_config('nb.permitir_bloqueo', 'on', true);
  update public.perfil set bloqueado = false, motivo_bloqueo = null where id = p_user;
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (p_user, 'desbloqueo', 'bajo', jsonb_build_object('metodo', 'verificacion_identidad', 'por', auth.uid(), 'nota', left(p_nota, 300)));
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_descartar_reporte(p_id uuid, p_nota text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  perform public.exigir_osi();
  if length(trim(coalesce(p_nota, ''))) < 3 then raise exception 'Escribe por qué se descarta' using errcode = '22023'; end if;
  update public.reporte_evento set estado = 'descartado', nota = trim(p_nota) where id = p_id and estado = 'nuevo';
  if not found then raise exception 'El reporte no existe o ya fue atendido' using errcode = 'P0002'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_reportes_evento(p_estado text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  perform public.exigir_osi();
  return coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'cargo', r.cargo, 'descripcion', r.descripcion, 'sistemas', r.sistemas,
            'reportado_en', r.reportado_en, 'estado', r.estado, 'incidente_id', r.incidente_id, 'nota', r.nota,
            'registro_vence', r.reportado_en + interval '2 hours') order by (r.estado <> 'nuevo'), r.reportado_en desc)
          from public.reporte_evento r where p_estado is null or r.estado = p_estado), '[]'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_revisar_alerta(p_id uuid, p_estado text, p_nota text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
  if p_estado not in ('revisada', 'falso_positivo', 'confirmada') then raise exception 'Estado no valido' using errcode = '22023'; end if;
  if length(trim(coalesce(p_nota, ''))) < 3 then raise exception 'Escribe una nota de la revision' using errcode = '22023'; end if;
  update public.alerta_seguridad set estado = p_estado, nota = trim(p_nota), revisada_por = auth.uid(), revisada_en = now()
   where id = p_id and estado = 'abierta';
  if not found then raise exception 'La alerta no existe o ya fue revisada' using errcode = 'P0002'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_solicitudes_derechos(p_estado text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, paciente_id uuid, paciente text, email text, tipo text, detalle text, estado text, creada_en timestamp with time zone, vence_en timestamp with time zone, dias_restantes integer, atendida_en timestamp with time zone, respuesta text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
  return query
    select s.id, s.user_id, trim(coalesce(p.nombre, '') || ' ' || coalesce(p.apellidos, '')), p.email, s.tipo, s.detalle, s.estado,
           s.creada_en, s.vence_en, ceil(extract(epoch from (s.vence_en - now())) / 86400)::integer, s.atendida_en, s.respuesta
    from public.solicitud_derechos s left join public.perfil p on p.id = s.user_id
    where p_estado is null or s.estado = p_estado
    order by (s.estado in ('atendida', 'rechazada')), s.vence_en
    limit 300;
end $function$
;

CREATE OR REPLACE FUNCTION public.agregar_nota_incidente(p_id uuid, p_nota text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  perform public.exigir_osi();
  if not exists (select 1 from public.incidente where id = p_id) then raise exception 'Incidente no encontrado' using errcode = 'P0002'; end if;
  if length(trim(coalesce(p_nota, ''))) < 3 then raise exception 'Escribe la nota' using errcode = '22023'; end if;
  insert into public.incidente_nota(incidente_id, nota, autor) values (p_id, trim(p_nota), auth.uid());
end $function$
;

CREATE OR REPLACE FUNCTION public.audit_calcular_hash(p_id bigint, p_ocurrido timestamp with time zone, p_cuenta uuid, p_actor uuid, p_accion text, p_objeto text, p_objeto_id uuid, p_columnas text[], p_ip text, p_previo text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  select encode(extensions.digest(concat_ws('|', p_id::text,
    to_char(p_ocurrido at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
    coalesce(p_cuenta::text, ''), coalesce(p_actor::text, ''), coalesce(p_accion, ''), coalesce(p_objeto, ''),
    coalesce(p_objeto_id::text, ''), coalesce(array_to_string(p_columnas, ','), ''), coalesce(p_ip, ''), coalesce(p_previo, '')),
    'sha256'), 'hex')
$function$
;

CREATE OR REPLACE FUNCTION public.audit_encadenar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare prev text;
begin
  select hash into prev from public.audit_cabeza where id = 1 for update;
  new.ocurrido_en := coalesce(new.ocurrido_en, now());
  new.hash_previo := prev;
  new.hash := public.audit_calcular_hash(new.id, new.ocurrido_en, new.cuenta_id, new.actor_id, new.accion, new.objeto,
                                          new.objeto_id, new.columnas, new.ip, prev);
  update public.audit_cabeza set hash = new.hash where id = 1;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.audit_inmutable()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  raise exception 'La bitacora de auditoria es de solo escritura' using errcode = '42501';
end $function$
;

CREATE OR REPLACE FUNCTION public.auditoria_consultar(p_desde timestamp with time zone DEFAULT (now() - '7 days'::interval), p_hasta timestamp with time zone DEFAULT now(), p_limite integer DEFAULT 200)
 RETURNS TABLE(id bigint, ocurrido_en timestamp with time zone, accion text, objeto text, actor_rol text, actor_ref text, cuenta_ref text, ip text, hash text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if coalesce(public.mi_rol(), '') not in ('medicoAdmin', 'auditor') then raise exception 'No autorizado' using errcode = '42501'; end if;
  return query
    select a.id, a.ocurrido_en, a.accion, a.objeto, a.actor_rol,
           case when a.actor_id is null then null else left(encode(extensions.digest(a.actor_id::text, 'sha256'), 'hex'), 8) end,
           case when a.cuenta_id is null then null else left(encode(extensions.digest(a.cuenta_id::text, 'sha256'), 'hex'), 8) end,
           a.ip, left(a.hash, 12)
    from public.audit_log a where a.ocurrido_en between p_desde and p_hasta
    order by a.id desc limit least(coalesce(p_limite, 200), 1000);
end $function$
;

CREATE OR REPLACE FUNCTION public.avisar_correo(p_tipo text, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  perform net.http_post(url := 'https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/incidentes-correo',
                        headers := jsonb_build_object('Content-Type', 'application/json'),
                        body := jsonb_build_object('tipo', p_tipo, 'id', p_id));
exception when others then raise notice 'no se pudo avisar (%): %', p_tipo, sqlerrm;
end $function$
;

CREATE OR REPLACE FUNCTION public.bloquear_mi_cuenta()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  perform set_config('nb.permitir_bloqueo', 'on', true);
  update public.perfil set bloqueado = true, motivo_bloqueo = 'paciente', bloqueado_en = now() where id = auth.uid();
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (auth.uid(), 'bloqueo', 'alto', jsonb_build_object('razon', 'bloqueo a pedido de la paciente', 'fecha', now()));
  delete from auth.sessions where user_id = auth.uid();
end $function$
;

CREATE OR REPLACE FUNCTION public.bloquear_por_codigos()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.cerrar_incidente(p_id uuid, p_causa text, p_acciones jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.cerrar_otras_sesiones()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare n integer;
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  delete from auth.sessions where user_id = auth.uid() and id <> nullif(auth.jwt() ->> 'session_id', '')::uuid;
  get diagnostics n = row_count;
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (auth.uid(), 'cierre_remoto_sesion', 'bajo', jsonb_build_object('otras_sesiones', n));
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.cerrar_sesion(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  delete from auth.sessions where id = p_id and user_id = auth.uid();
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (auth.uid(), 'cierre_remoto_sesion', 'bajo', jsonb_build_object('sesion', p_id));
end $function$
;

CREATE OR REPLACE FUNCTION public.cerrar_sesiones_de(p_user uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare n integer;
begin
  delete from auth.sessions where user_id = p_user;
  get diagnostics n = row_count;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.ci1_otorgado(p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select coalesce((
    select c.otorgado
    from public.consentimiento c
    join public.consentimiento_catalogo k on k.codigo = c.codigo and k.version = c.version and k.vigente
    where c.user_id = p_user and c.codigo = 'CI-1'
    order by c.registrado_en desc limit 1), false)
$function$
;

CREATE OR REPLACE FUNCTION public.citas_ocupadas(p_medico uuid, p_desde timestamp with time zone, p_hasta timestamp with time zone)
 RETURNS TABLE(fecha_hora timestamp with time zone, estado text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.sesion_vigente() then raise exception 'Sesion no valida' using errcode = '42501'; end if;
  return query
    select c.fecha_hora, c.estado::text from public.cita c
    where c.medico_id = p_medico and c.fecha_hora between p_desde and p_hasta
      and c.estado in ('programada', 'reprogramada');
end $function$
;

CREATE OR REPLACE FUNCTION public.comunicar_pacientes(p_id uuid, p_mensaje text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.consentimientos_estado()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.crear_alerta(p_user uuid, p_regla text, p_nivel text, p_titulo text, p_detalle jsonb DEFAULT '{}'::jsonb, p_ip text DEFAULT NULL::text, p_ventana interval DEFAULT '01:00:00'::interval, p_avisar_paciente boolean DEFAULT true, p_clave text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.crear_escalamiento(p_incidente uuid, p_disparador text, p_simulacro boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.crear_incidente(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.crear_solicitud_derechos(p_tipo text, p_detalle text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.dias_habiles(p_desde timestamp with time zone, p_n integer)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare f timestamptz := p_desde; c integer := 0;
begin
  while c < p_n loop
    f := f + interval '1 day';
    if extract(isodow from f at time zone 'America/La_Paz') < 6 then c := c + 1; end if;
  end loop;
  return f;
end $function$
;

CREATE OR REPLACE FUNCTION public.entregar_informe_posterior(p_escalamiento uuid, p_texto text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  perform public.exigir_osi();
  if length(trim(coalesce(p_texto, ''))) < 20 then raise exception 'El informe debe explicar causa, impacto y acciones (mínimo 20 caracteres)' using errcode = '22023'; end if;
  update public.escalamiento set informe_entregado_en = now(), informe_texto = trim(p_texto) where id = p_escalamiento and informe_entregado_en is null and not es_simulacro;
  if not found then raise exception 'El escalamiento no existe o el informe ya fue entregado' using errcode = 'P0002'; end if;
  perform public.avisar_correo('informe_posterior', p_escalamiento);
end $function$
;

CREATE OR REPLACE FUNCTION public.enviar_alerta_bloqueo()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  perform net.http_post(
    url := 'https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/enviar-alerta',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('user_id', new.user_id, 'tipo', new.tipo, 'nivel', new.nivel, 'detalle', new.detalle)
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enviar_informe_mensual(p_anio integer, p_mes integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare v_per date := make_date(p_anio, p_mes, 1); v_id uuid;
begin
  perform public.exigir_osi();
  insert into public.informe_incidentes(periodo, generado_por) values (v_per, auth.uid())
    on conflict (periodo) do update set enviado_en = null, generado_por = auth.uid(), generado_en = now() returning id into v_id;
  perform public.avisar_correo('informe_mensual', v_id);
end $function$
;

CREATE OR REPLACE FUNCTION public.enviar_informe_mensual_auto()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_per date := (date_trunc('month', (now() at time zone 'America/La_Paz') - interval '1 month'))::date; v_id uuid;
begin
  insert into public.informe_incidentes(periodo) values (v_per) on conflict (periodo) do nothing returning id into v_id;
  if v_id is not null then perform public.avisar_correo('informe_mensual', v_id); end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.escalamiento_por_token(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.espejo_actividad_auditoria()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  insert into public.audit_log(actor_id, actor_rol, cuenta_id, accion, objeto, ip, user_agent)
  values (new.user_id, null, new.user_id, new.tipo, 'sesion', left(new.detalle ->> 'ip', 60), left(new.detalle ->> 'userAgent', 300));
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.estado_respaldos()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if coalesce(public.mi_rol(), '') not in ('medicoAdmin', 'auditor') then raise exception 'No autorizado' using errcode = '42501'; end if;
  return jsonb_build_object(
    'ultimo_horario', (select max(creado_en) from public.respaldo_registro where tipo = 'horario' and ok),
    'ultimo_diario', (select max(creado_en) from public.respaldo_registro where tipo = 'diario' and ok),
    'ultimo_mensual', (select max(creado_en) from public.respaldo_registro where tipo = 'mensual' and ok),
    'ultima_configuracion', (select max(creado_en) from public.respaldo_registro where tipo = 'config' and ok),
    'minutos_desde_ultimo_horario', (select round(extract(epoch from now() - max(creado_en)) / 60) from public.respaldo_registro where tipo = 'horario' and ok),
    'rpo_1h_cumplido', (select coalesce(max(creado_en) > now() - interval '70 minutes', false) from public.respaldo_registro where tipo = 'horario' and ok),
    'fallos_consecutivos', (select count(*) from public.respaldo_registro r where not r.ok and r.id > coalesce((select max(id) from public.respaldo_registro where ok), 0)),
    'incidentes_abiertos', (select count(*) from public.respaldo_incidente where cerrado_en is null),
    'respaldos_vigentes', (select count(*) from public.respaldo_registro where ok and borrado_en is null),
    'cifrado_ultimo', (select cifrado from public.respaldo_registro where ok order by id desc limit 1),
    'ultima_prueba_restauracion', (select jsonb_build_object('fecha', creado_en, 'ok', ok) from public.respaldo_prueba_restauracion order by id desc limit 1)
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.estado_sesion()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.evaluar_ingreso(p_user uuid, p_ip text, p_pais text, p_huella text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.exigir_osi()
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if coalesce(auth.role(), '') = 'service_role' then return; end if;
  if coalesce(public.mi_rol(), '') <> 'medicoAdmin' then raise exception 'No autorizado' using errcode = '42501'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.exportar_configuracion()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'cron', 'pg_catalog'
AS $function$
  select jsonb_build_object(
    'generado_en', now(),
    'columnas', (select jsonb_agg(jsonb_build_object('tabla', table_name, 'columna', column_name, 'tipo', data_type, 'nulo', is_nullable, 'defecto', column_default) order by table_name, ordinal_position)
                   from information_schema.columns where table_schema = 'public'),
    'politicas', (select jsonb_agg(to_jsonb(p)) from pg_policies p where p.schemaname = 'public'),
    'triggers', (select jsonb_agg(pg_get_triggerdef(t.oid)) from pg_trigger t join pg_class c on c.oid = t.tgrelid
                   where c.relnamespace = 'public'::regnamespace and not t.tgisinternal),
    'funciones', (select jsonb_agg(jsonb_build_object('nombre', p.proname, 'definicion', pg_get_functiondef(p.oid)))
                   from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'),
    'tareas_programadas', (select jsonb_agg(jsonb_build_object('nombre', jobname, 'horario', schedule, 'activa', active)) from cron.job),
    'extensiones', (select jsonb_agg(extname) from pg_extension)
  )
$function$
;

CREATE OR REPLACE FUNCTION public.fn_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.fn_cambiar_estado_cita(p_cita uuid, p_nuevo estado_cita, p_actor uuid, p_motivo text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_anterior estado_cita;
begin
  select estado into v_anterior from cita where id = p_cita for update;

  update cita 
     set estado = p_nuevo
   where id = p_cita;

  insert into cita_estado_log(cita_id, estado_anterior, estado_nuevo, actor_id, motivo)
  values (p_cita, v_anterior, p_nuevo, p_actor, p_motivo);
end $function$
;

CREATE OR REPLACE FUNCTION public.fn_notificar_cita_cancelada()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.estado = 'cancelada' AND OLD.estado IS DISTINCT FROM 'cancelada' THEN
    PERFORM net.http_post(
      url := 'https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/notificar_cita_cancelada',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'cita_id', NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_notificar_cita_creada()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/notificar_cita_programada',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'cita_id', NEW.id
    )
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_notificar_cita_programada()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/notificar_cita_programada',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'cita_id', NEW.id
    )
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generar_recordatorio()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into recordatorio_queue default values;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_dashboard_data(from_date timestamp with time zone, to_date timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'totalRespuestas', (
      SELECT count(*)
      FROM respuesta_encuesta re
      WHERE re.creada_en BETWEEN from_date AND to_date
    ),
    'totalCitas', (
      SELECT count(*)
      FROM cita c
      WHERE c.fecha_hora BETWEEN from_date AND to_date
    ),
    'primeraVez', (
      SELECT count(*)
      FROM respuesta_pregunta rp
      JOIN respuesta_encuesta re ON re.id = rp.respuesta_encuesta_id
      WHERE rp.valor_bool = true
        AND re.creada_en BETWEEN from_date AND to_date
    ),
    'preguntasDetalle', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'preguntaId', pregunta_id,
          'enunciado', enunciado,
          'tipo', tipo,
          'distribucion', distribucion
        )
      ), '[]'::json)
      FROM (
        SELECT 
          p.id as pregunta_id,
          p.enunciado,
          p.tipo,
          json_object_agg(
            respuesta_valor, 
            cantidad
          ) AS distribucion
        FROM pregunta p
        JOIN (
          SELECT 
            rp.pregunta_id,
            CASE
              WHEN rp.valor_num IS NOT NULL THEN rp.valor_num::text
              WHEN rp.valor_bool IS NOT NULL THEN rp.valor_bool::text
              WHEN rp.valor_texto IS NOT NULL THEN rp.valor_texto
            END AS respuesta_valor,
            COUNT(*) AS cantidad
          FROM respuesta_pregunta rp
          JOIN respuesta_encuesta re ON re.id = rp.respuesta_encuesta_id
          WHERE re.creada_en BETWEEN from_date AND to_date
            AND (rp.valor_num IS NOT NULL OR rp.valor_bool IS NOT NULL OR rp.valor_texto IS NOT NULL)
          GROUP BY rp.pregunta_id, respuesta_valor
        ) respuestas ON respuestas.pregunta_id = p.id
        GROUP BY p.id, p.enunciado, p.tipo
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(fecha_inicio_param date, fecha_fin_param date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if coalesce(public.mi_rol(), '') not in ('medico', 'medicoAdmin') then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  return public.get_dashboard_kpis_impl(fecha_inicio_param, fecha_fin_param);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_dashboard_kpis_impl(fecha_inicio_param date, fecha_fin_param date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  resultado jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo', jsonb_build_object(
      'fecha_inicio', fecha_inicio_param,
      'fecha_fin', fecha_fin_param
    ),

    -- KPIs Generales
    'kpis_generales', jsonb_build_object(
      'total_citas', (
        SELECT COUNT(*) 
        FROM cita 
        WHERE fecha_hora::date BETWEEN fecha_inicio_param AND fecha_fin_param
      ),
      'total_consultas', (
        SELECT COUNT(*) 
        FROM consulta 
        WHERE created_at::date BETWEEN fecha_inicio_param AND fecha_fin_param
      ),
      'total_pacientes_activos', (
        SELECT COUNT(DISTINCT paciente_id) 
        FROM cita 
        WHERE fecha_hora::date BETWEEN fecha_inicio_param AND fecha_fin_param
      ),
      'total_medicos_activos', (
        SELECT COUNT(DISTINCT medico_id) 
        FROM cita 
        WHERE fecha_hora::date BETWEEN fecha_inicio_param AND fecha_fin_param 
          AND medico_id IS NOT NULL
      ),
      'tasa_completitud_citas', COALESCE((
        SELECT ROUND(
          (COUNT(*) FILTER (WHERE estado = 'completada')::numeric / NULLIF(COUNT(*), 0) * 100), 0
        )
        FROM cita
        WHERE fecha_hora::date BETWEEN fecha_inicio_param AND fecha_fin_param
      ), 0)
    ),

    -- Distribución de citas por estado
    'citas_por_estado', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('estado', estado::text, 'cantidad', cantidad))
      FROM (
        SELECT estado, COUNT(*) AS cantidad
        FROM cita
        WHERE fecha_hora::date BETWEEN fecha_inicio_param AND fecha_fin_param
        GROUP BY estado
        ORDER BY cantidad DESC
      ) t
    ), '[]'::jsonb),

    -- Distribución de citas por tipo
    'citas_por_tipo', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('tipo', tipo, 'cantidad', cantidad))
      FROM (
        SELECT tipo_cita::text AS tipo, COUNT(*) AS cantidad
        FROM cita
        WHERE fecha_hora::date BETWEEN fecha_inicio_param AND fecha_fin_param
        GROUP BY tipo_cita
        ORDER BY cantidad DESC
      ) t
    ), '[]'::jsonb),

    -- Tendencia diaria de citas
    'tendencia_citas', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'fecha', fecha,
        'total', total,
        'completadas', completadas,
        'canceladas', canceladas
      ) ORDER BY fecha)
      FROM (
        SELECT 
          fecha_hora::date AS fecha,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE estado = 'completada') AS completadas,
          COUNT(*) FILTER (WHERE estado = 'cancelada') AS canceladas
        FROM cita
        WHERE fecha_hora::date BETWEEN fecha_inicio_param AND fecha_fin_param
        GROUP BY fecha_hora::date
      ) t
    ), '[]'::jsonb),

    -- Comentarios recientes
    'comentarios_recientes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'fecha', fecha,
        'comentario', comentario,
        'cita_id', cita_id
      ))
      FROM (
        SELECT 
          re.creada_en AS fecha, 
          rp.valor_texto AS comentario, 
          re.cita_id
        FROM respuesta_pregunta rp
        JOIN respuesta_encuesta re ON rp.respuesta_encuesta_id = re.id
        JOIN pregunta p ON rp.pregunta_id = p.id
        WHERE p.enunciado = 'Comentarios adicionales'
          AND re.creada_en::date BETWEEN fecha_inicio_param AND fecha_fin_param
          AND rp.valor_texto IS NOT NULL
          AND LENGTH(rp.valor_texto) > 0
        ORDER BY re.creada_en DESC
        LIMIT 20
      ) t
    ), '[]'::jsonb),

    -- Métricas de satisfacción
    'metricas_satisfaccion', jsonb_build_object(
      'total_encuestas', (
        SELECT COUNT(*) 
        FROM respuesta_encuesta re 
        WHERE re.creada_en::date BETWEEN fecha_inicio_param AND fecha_fin_param
      ),
      
      -- Satisfacción general
      'satisfaccion_general', jsonb_build_object(
        'promedio', COALESCE((
          SELECT ROUND(AVG(rp.valor_num)::numeric, 2)
          FROM respuesta_pregunta rp
          JOIN respuesta_encuesta re ON rp.respuesta_encuesta_id = re.id
          JOIN pregunta p ON rp.pregunta_id = p.id
          WHERE p.enunciado = 'Nivel de satisfacción general (0–100)'
            AND re.creada_en::date BETWEEN fecha_inicio_param AND fecha_fin_param
        ), 0),
        'total_respuestas', (
          SELECT COUNT(*)
          FROM respuesta_pregunta rp
          JOIN respuesta_encuesta re ON rp.respuesta_encuesta_id = re.id
          JOIN pregunta p ON rp.pregunta_id = p.id
          WHERE p.enunciado = 'Nivel de satisfacción general (0–100)'
            AND re.creada_en::date BETWEEN fecha_inicio_param AND fecha_fin_param
        ),
        'distribucion', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('rango', rango, 'cantidad', cantidad))
          FROM (
            SELECT
              CASE
                WHEN rp.valor_num < 20 THEN '0-20'
                WHEN rp.valor_num < 40 THEN '20-40'
                WHEN rp.valor_num < 60 THEN '40-60'
                WHEN rp.valor_num < 80 THEN '60-80'
                ELSE '80-100'
              END AS rango,
              COUNT(*) AS cantidad
            FROM respuesta_pregunta rp
            JOIN respuesta_encuesta re ON rp.respuesta_encuesta_id = re.id
            JOIN pregunta p ON rp.pregunta_id = p.id
            WHERE p.enunciado = 'Nivel de satisfacción general (0–100)'
              AND re.creada_en::date BETWEEN fecha_inicio_param AND fecha_fin_param
            GROUP BY rango
            ORDER BY rango
          ) t
        ), '[]'::jsonb)
      ),
      
      -- Actitud del médico
      'actitud_medico', jsonb_build_object(
        'promedio', COALESCE((
          SELECT ROUND(AVG(rp.valor_num)::numeric, 2)
          FROM respuesta_pregunta rp
          JOIN respuesta_encuesta re ON rp.respuesta_encuesta_id = re.id
          JOIN pregunta p ON rp.pregunta_id = p.id
          WHERE p.enunciado = 'Actitud del médico (0–10)'
            AND re.creada_en::date BETWEEN fecha_inicio_param AND fecha_fin_param
        ), 0),
        'total_respuestas', (
          SELECT COUNT(*)
          FROM respuesta_pregunta rp
          JOIN respuesta_encuesta re ON rp.respuesta_encuesta_id = re.id
          JOIN pregunta p ON rp.pregunta_id = p.id
          WHERE p.enunciado = 'Actitud del médico (0–10)'
            AND re.creada_en::date BETWEEN fecha_inicio_param AND fecha_fin_param
        ),
        'distribucion', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('puntuacion', puntuacion, 'cantidad', cantidad))
          FROM (
            SELECT rp.valor_num AS puntuacion, COUNT(*) AS cantidad
            FROM respuesta_pregunta rp
            JOIN respuesta_encuesta re ON rp.respuesta_encuesta_id = re.id
            JOIN pregunta p ON rp.pregunta_id = p.id
            WHERE p.enunciado = 'Actitud del médico (0–10)'
              AND re.creada_en::date BETWEEN fecha_inicio_param AND fecha_fin_param
            GROUP BY rp.valor_num
            ORDER BY puntuacion
          ) t
        ), '[]'::jsonb)
      ),
      
      -- Primera visita
      'primera_visita', (
        SELECT jsonb_build_object(
          'total', COALESCE(COUNT(*), 0),
          'si', COALESCE(COUNT(*) FILTER (WHERE rp.valor_bool = true), 0),
          'no', COALESCE(COUNT(*) FILTER (WHERE rp.valor_bool = false), 0),
          'porcentaje_nuevos', COALESCE(
            ROUND((COUNT(*) FILTER (WHERE rp.valor_bool = true)::numeric / NULLIF(COUNT(*), 0) * 100), 2), 
            0
          )
        )
        FROM respuesta_pregunta rp
        JOIN respuesta_encuesta re ON rp.respuesta_encuesta_id = re.id
        JOIN pregunta p ON rp.pregunta_id = p.id
        WHERE p.enunciado = '¿Es su primera visita?'
          AND re.creada_en::date BETWEEN fecha_inicio_param AND fecha_fin_param
      ),
      
      -- Tiempo de espera
      'tiempo_espera', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('rango', rango, 'cantidad', cantidad))
        FROM (
          SELECT rp.valor_texto AS rango, COUNT(*) AS cantidad
          FROM respuesta_pregunta rp
          JOIN respuesta_encuesta re ON rp.respuesta_encuesta_id = re.id
          JOIN pregunta p ON rp.pregunta_id = p.id
          WHERE p.enunciado = 'Tiempo de espera en minutos'
            AND re.creada_en::date BETWEEN fecha_inicio_param AND fecha_fin_param
          GROUP BY rp.valor_texto
          ORDER BY cantidad DESC
        ) t
      ), '[]'::jsonb),
      
      -- Tiempo de consulta
      'tiempo_consulta', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('rango', rango, 'cantidad', cantidad))
        FROM (
          SELECT rp.valor_texto AS rango, COUNT(*) AS cantidad
          FROM respuesta_pregunta rp
          JOIN respuesta_encuesta re ON rp.respuesta_encuesta_id = re.id
          JOIN pregunta p ON rp.pregunta_id = p.id
          WHERE p.enunciado = 'Tiempo de la consulta en minutos'
            AND re.creada_en::date BETWEEN fecha_inicio_param AND fecha_fin_param
          GROUP BY rp.valor_texto
          ORDER BY cantidad DESC
        ) t
      ), '[]'::jsonb),
      
      -- Comprensión de explicación
      'comprension_explicacion', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('nivel', nivel, 'cantidad', cantidad))
        FROM (
          SELECT rp.valor_texto AS nivel, COUNT(*) AS cantidad
          FROM respuesta_pregunta rp
          JOIN respuesta_encuesta re ON rp.respuesta_encuesta_id = re.id
          JOIN pregunta p ON rp.pregunta_id = p.id
          WHERE p.enunciado = 'Comprensión de la explicación recibida'
            AND re.creada_en::date BETWEEN fecha_inicio_param AND fecha_fin_param
          GROUP BY rp.valor_texto
          ORDER BY cantidad DESC
        ) t
      ), '[]'::jsonb)
    )
  ) INTO resultado;

  RETURN resultado;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.habilitar_acceso_exterior(p_dias integer DEFAULT 30)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.hashes_recientes(p_user uuid)
 RETURNS text[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select array_remove(
    array[(select encrypted_password from auth.users where id = p_user)]
    || coalesce((select array_agg(h.hash order by h.creado_en desc) from (
         select hash, creado_en from public.clave_historial where user_id = p_user order by creado_en desc limit 4) h), '{}'::text[]),
    null)
$function$
;

CREATE OR REPLACE FUNCTION public.hook_exigir_2fa(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if event->>'authentication_method' = 'password' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Inicio de sesion directo no permitido: se requiere verificacion en dos pasos.'
      )
    );
  end if;
  return event;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.incidente_desde_alerta(p_alerta uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.incidentes_resumen()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  perform public.exigir_osi();
  return jsonb_build_object(
    'abiertos', (select count(*) from public.incidente where estado <> 'cerrado'),
    'criticos_abiertos', (select count(*) from public.incidente where estado <> 'cerrado' and severidad = 'critica'),
    'sin_acuse', (select count(*) from public.escalamiento where acuse_en is null and not es_simulacro),
    'eventos_nuevos', (select count(*) from public.reporte_evento where estado = 'nuevo'),
    'acciones_vencidas', (select count(*) from public.incidente i, jsonb_array_elements(i.acciones) a where not coalesce((a->>'cumplida')::boolean, false) and (a->>'fecha')::date < (now() at time zone 'America/La_Paz')::date),
    'informes_pendientes', (select count(*) from public.escalamiento where informe_entregado_en is null and not es_simulacro and acuse_en is not null));
end $function$
;

CREATE OR REPLACE FUNCTION public.informe_anual(p_anio integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  perform public.exigir_osi();
  return jsonb_build_object('anio', p_anio, 'meses', (
    select jsonb_agg(jsonb_build_object('mes', m, 'total', t.total, 'criticos', t.criticos, 'horas_interrupcion', t.horas, 'pacientes_afectadas', t.pac) order by m)
    from generate_series(1, 12) m
    left join lateral (
      select count(*) as total, count(*) filter (where severidad = 'critica') as criticos, coalesce(sum(horas_interrupcion), 0) as horas, coalesce(sum(pacientes_afectadas), 0) as pac
      from public.incidente
      where reportado_en >= make_timestamptz(p_anio, m, 1, 0, 0, 0, 'America/La_Paz') and reportado_en < make_timestamptz(p_anio, m, 1, 0, 0, 0, 'America/La_Paz') + interval '1 month') t on true));
end $function$
;

CREATE OR REPLACE FUNCTION public.informe_mensual(p_anio integer, p_mes integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.iniciar_simulacro()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  perform public.exigir_osi();
  return public.crear_escalamiento(null, 'Simulacro anual de escalamiento', true);
end $function$
;

CREATE OR REPLACE FUNCTION public.latido()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.listar_incidentes(p_estado text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.listar_medicos()
 RETURNS TABLE(id uuid, nombre text, apellidos text, especialidad text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.sesion_vigente() then raise exception 'Sesion no valida' using errcode = '42501'; end if;
  return query
    select p.id, p.nombre, p.apellidos, p.especialidad from public.perfil p
    where p.especialidad is not null and p.rol in ('medico', 'medicoAdmin')
      and p.activo is not false and p.bloqueado is not true
    order by p.nombre;
end $function$
;

CREATE OR REPLACE FUNCTION public.listar_simulacros()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  perform public.exigir_osi();
  return coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'creado_en', e.creado_en, 'aviso_enviado_en', e.aviso_enviado_en, 'acuse_en', e.acuse_en, 'acuse_por', e.acuse_por,
            'minutos_hasta_acuse', case when e.acuse_en is not null then round(extract(epoch from (e.acuse_en - e.creado_en)) / 60.0, 1) end,
            'plazo_minutos', e.plazo_horas * 60) order by e.creado_en desc)
          from public.escalamiento e where e.es_simulacro), '[]'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.listar_tablas_respaldo()
 RETURNS text[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  select coalesce(array_agg(c.relname order by c.relname), '{}')
  from pg_class c
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
    and c.relname not in ('codigo_verificacion', 'reset_tokens', 'desbloqueo_tokens', 'sesion_actividad', 'respaldo_config')
$function$
;

CREATE OR REPLACE FUNCTION public.marcar_accion(p_id uuid, p_indice integer, p_cumplida boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare i public.incidente%rowtype;
begin
  perform public.exigir_osi();
  select * into i from public.incidente where id = p_id for update;
  if not found then raise exception 'Incidente no encontrado' using errcode = 'P0002'; end if;
  if p_indice < 0 or p_indice >= jsonb_array_length(i.acciones) then raise exception 'La acción no existe' using errcode = '22023'; end if;
  update public.incidente set acciones = jsonb_set(acciones, array[p_indice::text, 'cumplida'], to_jsonb(coalesce(p_cumplida, false))) where id = p_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.marcar_seguridad_vista(p_version text DEFAULT '1.0'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  insert into public.seguridad_recordatorio(user_id, version, visto_en) values (auth.uid(), left(coalesce(p_version, '1.0'), 20), now())
    on conflict (user_id) do update set version = excluded.version, visto_en = now();
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (auth.uid(), 'guia_seguridad_vista', 'bajo', jsonb_build_object('version', p_version));
end $function$
;

CREATE OR REPLACE FUNCTION public.medico_atiende(p_paciente_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1 from public.cita
    where paciente_id = p_paciente_id and medico_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.mi_acceso_exterior()
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  return (select hasta from public.habilitacion_exterior where user_id = auth.uid() and hasta > now());
end $function$
;

CREATE OR REPLACE FUNCTION public.mi_actividad(p_limite integer DEFAULT 200)
 RETURNS TABLE(tipo text, nivel text, creado_en timestamp with time zone, ip text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  return query
    select a.tipo, a.nivel, a.creado_en, a.detalle ->> 'ip'
    from public.actividad_sospechosa a
    where a.user_id = auth.uid() and a.creado_en > now() - interval '12 months'
    order by a.creado_en desc
    limit least(coalesce(p_limite, 200), 500);
end $function$
;

CREATE OR REPLACE FUNCTION public.mi_rol()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select rol from public.perfil where id = auth.uid() and public.sesion_vigente();
$function$
;

CREATE OR REPLACE FUNCTION public.mis_citas()
 RETURNS TABLE(id uuid, fecha_hora timestamp with time zone, estado text, medico_id uuid, medico_nombre text, medico_apellidos text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.sesion_vigente() then raise exception 'Sesion no valida' using errcode = '42501'; end if;
  return query
    select c.id, c.fecha_hora, c.estado::text, c.medico_id, m.nombre, m.apellidos
    from public.cita c left join public.perfil m on m.id = c.medico_id
    where c.paciente_id = auth.uid()
    order by c.fecha_hora;
end $function$
;

CREATE OR REPLACE FUNCTION public.mis_datos()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.mis_sesiones()
 RETURNS TABLE(id uuid, creada_en timestamp with time zone, ultima_actividad timestamp with time zone, ip text, dispositivo text, actual boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  return query
    select s.id, s.created_at, coalesce(a.ultima_actividad, s.created_at),
           coalesce(a.ip, host(s.ip)), coalesce(a.user_agent, s.user_agent),
           s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
    from auth.sessions s left join public.sesion_actividad a on a.session_id = s.id
    where s.user_id = auth.uid() and (s.not_after is null or s.not_after > now())
      and s.created_at > now() - interval '12 hours'
    order by s.created_at desc;
end $function$
;

CREATE OR REPLACE FUNCTION public.mis_solicitudes_derechos()
 RETURNS TABLE(id uuid, tipo text, detalle text, estado text, creada_en timestamp with time zone, vence_en timestamp with time zone, atendida_en timestamp with time zone, respuesta text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  return query select s.id, s.tipo, s.detalle, s.estado, s.creada_en, s.vence_en, s.atendida_en, s.respuesta
    from public.solicitud_derechos s where s.user_id = auth.uid() order by s.creada_en desc limit 100;
end $function$
;

CREATE OR REPLACE FUNCTION public.notify_alerta()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  res json;
begin
  -- Solo enviar si el nivel es medio o alto
  if (new.nivel in ('medio', 'alto')) then
    begin
      -- Llamada HTTP POST a tu Edge Function
      perform extensions.http_post(
        'https://nvfhmlfbocdiczpxgidu.supabase.co/functions.supabase.co/enviar-alerta',
        json_build_object(
          'user_id', new.user_id,
          'tipo', new.tipo,
          'nivel', new.nivel,
          'detalle', new.detalle
        )::text,
        json_build_object('Content-Type', 'application/json')
      );
    exception when others then
      -- No detiene la transacción si falla el envío
      raise notice 'Error al enviar alerta: %', sqlerrm;
    end;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_cita_cancelada()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if old.estado <> 'cancelada' and new.estado = 'cancelada' then
    perform
      net.http_post(
        url := 'https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/notificar-cita-cancelada',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'cita_id', new.id
        )
      );
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.obtener_hash_password(p_email text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select u.encrypted_password
  from auth.users u
  where lower(u.email) = lower(p_email)
    and u.encrypted_password is not null
    and u.email_confirmed_at is not null
    and u.deleted_at is null
    and (u.banned_until is null or u.banned_until < now())
  limit 1
$function$
;

CREATE OR REPLACE FUNCTION public.obtener_incidente(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  perform public.exigir_osi();
  return jsonb_build_object(
    'notas', coalesce((select jsonb_agg(jsonb_build_object('nota', n.nota, 'creada_en', n.creada_en, 'automatica', n.autor is null) order by n.creada_en) from public.incidente_nota n where n.incidente_id = p_id), '[]'::jsonb),
    'comunicaciones', coalesce((select jsonb_agg(jsonb_build_object('tipo', c.tipo, 'mensaje', c.mensaje, 'destinatarios', c.destinatarios, 'enviada_en', c.enviada_en) order by c.creada_en) from public.incidente_comunicacion c where c.incidente_id = p_id), '[]'::jsonb),
    'afectadas', coalesce((select jsonb_agg(substr(p.id::text, 1, 8) order by p.id) from public.incidente_afectada f join public.perfil p on p.id = f.paciente_id where f.incidente_id = p_id), '[]'::jsonb));
end $function$
;

CREATE OR REPLACE FUNCTION public.perfil_proteger_columnas()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if coalesce(current_setting('nb.permitir_bloqueo', true), '') = 'on' then return new; end if;
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and coalesce(public.mi_rol(), '') <> 'medicoAdmin' then
    if new.id is distinct from old.id or new.rol is distinct from old.rol or new.activo is distinct from old.activo
       or new.bloqueado is distinct from old.bloqueado or new.primer_login is distinct from old.primer_login
       or new.email is distinct from old.email or new.motivo_bloqueo is distinct from old.motivo_bloqueo
       or new.bloqueado_en is distinct from old.bloqueado_en then
      raise exception 'No autorizado a modificar campos de seguridad del perfil' using errcode = '42501';
    end if;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.quitar_acceso_exterior()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if not public.sesion_existe() then raise exception 'Sesion expirada' using errcode = '42501'; end if;
  delete from public.habilitacion_exterior where user_id = auth.uid();
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (auth.uid(), 'acceso_exterior_quitado', 'bajo', '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.reauth_pendiente(p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1 from public.restriccion_cuenta r
    where r.user_id = p_user and r.tipo = 'reauth'
      and not exists (select 1 from public.codigo_verificacion c where c.user_id = p_user and c.usado and c.creado_en > r.desde))
$function$
;

CREATE OR REPLACE FUNCTION public.red_ip(p_ip text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select case
    when p_ip like '%:%' then split_part(p_ip, ':', 1) || ':' || split_part(p_ip, ':', 2) || ':' || split_part(p_ip, ':', 3)
    when p_ip like '%.%' then split_part(p_ip, '.', 1) || '.' || split_part(p_ip, '.', 2)
    else coalesce(p_ip, '') end
$function$
;

CREATE OR REPLACE FUNCTION public.registrar_acceso(p_objeto text, p_objeto_id uuid DEFAULT NULL::uuid, p_cuenta uuid DEFAULT NULL::uuid, p_accion text DEFAULT 'consulta'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.registrar_afectadas(p_id uuid, p_emails text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare e text; v_pac uuid; ok integer := 0; desconocidos text[] := '{}';
begin
  perform public.exigir_osi();
  if not exists (select 1 from public.incidente where id = p_id) then raise exception 'Incidente no encontrado' using errcode = 'P0002'; end if;
  foreach e in array coalesce(p_emails, '{}') loop
    v_pac := null;
    select id into v_pac from public.perfil where lower(email) = lower(trim(e)) and rol = 'paciente';
    if v_pac is null then desconocidos := desconocidos || trim(e);
    else insert into public.incidente_afectada(incidente_id, paciente_id) values (p_id, v_pac) on conflict do nothing; ok := ok + 1; end if;
  end loop;
  update public.incidente set pacientes_afectadas = greatest(coalesce(pacientes_afectadas, 0), (select count(*) from public.incidente_afectada where incidente_id = p_id)) where id = p_id and estado <> 'cerrado';
  return jsonb_build_object('agregadas', ok, 'no_encontradas', to_jsonb(desconocidos));
end $function$
;

CREATE OR REPLACE FUNCTION public.registrar_cambio_clave(p_user uuid, p_hash_anterior text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if p_hash_anterior is not null and length(p_hash_anterior) > 20 then
    insert into public.clave_historial(user_id, hash) values (p_user, p_hash_anterior);
  end if;
  delete from public.clave_historial where user_id = p_user and id not in (
    select id from public.clave_historial where user_id = p_user order by creado_en desc limit 5);
  update public.perfil set clave_cambiada_en = now() where id = p_user;
end $function$
;

CREATE OR REPLACE FUNCTION public.registrar_consentimiento(p_codigo text, p_otorgado boolean, p_dispositivo text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
  if ultimo is not null and ultimo = p_otorgado then return; end if;

  begin hdr := current_setting('request.headers', true)::json; exception when others then hdr := null; end;
  v_ip := left(coalesce(nullif(split_part(coalesce(hdr->>'x-forwarded-for', ''), ',', 1), ''), hdr->>'cf-connecting-ip'), 60);
  v_ua := left(hdr->>'user-agent', 300);
  insert into public.consentimiento(user_id, codigo, version, otorgado, dispositivo, ip, user_agent)
    values (auth.uid(), k.codigo, k.version, p_otorgado, left(p_dispositivo, 200), v_ip, v_ua);
  insert into public.actividad_sospechosa(user_id, tipo, nivel, detalle)
    values (auth.uid(), case when p_otorgado then 'consentimiento_otorgado' else 'consentimiento_retirado' end,
            case when k.obligatorio and not p_otorgado then 'alto' else 'bajo' end,
            jsonb_build_object('codigo', k.codigo, 'version', k.version, 'ip', v_ip));

  if k.obligatorio and not p_otorgado then
    perform set_config('nb.permitir_bloqueo', 'on', true);
    update public.perfil set bloqueado = true, motivo_bloqueo = 'paciente', bloqueado_en = now() where id = auth.uid();
    delete from auth.sessions where user_id = auth.uid();
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.registrar_dispositivo(p_user uuid, p_huella text, p_ip text, p_ua text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  insert into public.dispositivo_conocido(user_id, huella, ip, user_agent) values (p_user, p_huella, left(p_ip, 60), left(p_ua, 300))
    on conflict (user_id, huella) do update set ultima_vez = now(), ip = excluded.ip;
end $function$
;

CREATE OR REPLACE FUNCTION public.registrar_fallo_ingreso(p_ip text, p_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.reportar_evento(p_descripcion text, p_sistemas text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.seguridad_recordatorio_pendiente()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if not public.sesion_existe() then return false; end if;
  if (select rol from public.perfil where id = auth.uid()) is distinct from 'paciente' then return false; end if;
  return not exists (select 1 from public.seguridad_recordatorio s where s.user_id = auth.uid() and s.visto_en > now() - interval '1 year');
end $function$
;

CREATE OR REPLACE FUNCTION public.sesion_existe()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select exists (
    select 1
    from auth.sessions s
    left join public.sesion_actividad a on a.session_id = s.id
    where s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
      and (s.not_after is null or s.not_after > now())
      and s.created_at > now() - interval '12 hours'
      and coalesce(a.ultima_actividad, s.created_at) > now() - interval '10 minutes'
  )
$function$
;

CREATE OR REPLACE FUNCTION public.sesion_vigente()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  new.updated_at = now();
  return new;
end$function$
;

CREATE OR REPLACE FUNCTION public.sin_borrado()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  raise exception 'Nadie borra filas de este registro: agrega una nota con fecha' using errcode = '42501';
end $function$
;

CREATE OR REPLACE FUNCTION public.solo_agregar()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  raise exception 'Registro de solo escritura: no se puede modificar ni borrar' using errcode = '42501';
end $function$
;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  new.created_at = coalesce(old.created_at, now());
  return new;
end$function$
;

CREATE OR REPLACE FUNCTION public.validar_token_respaldo(p_token text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.respaldo_config where id = 1 and token = p_token and p_token <> '')
$function$
;

CREATE OR REPLACE FUNCTION public.verificar_cadena_auditoria()
 RETURNS TABLE(total bigint, validos bigint, primer_roto bigint, cabeza_coincide boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_total bigint; v_validos bigint; v_roto bigint; v_ultimo text; v_cabeza text;
begin
  if coalesce(public.mi_rol(), '') not in ('medicoAdmin', 'auditor') then raise exception 'No autorizado' using errcode = '42501'; end if;
  select count(*) into v_total from public.audit_log;
  with recursive cadena as (
    select a.*, 1 as n from public.audit_log a where a.hash_previo is null
    union all
    select b.*, c.n + 1 from public.audit_log b join cadena c on b.hash_previo = c.hash
  ), chequeo as (
    select c.id, c.hash, c.n,
           (c.hash = public.audit_calcular_hash(c.id, c.ocurrido_en, c.cuenta_id, c.actor_id, c.accion, c.objeto, c.objeto_id, c.columnas, c.ip, c.hash_previo)) as ok
    from cadena c
  )
  select count(*) filter (where ok), min(id) filter (where not ok), (array_agg(hash order by n desc))[1]
    into v_validos, v_roto, v_ultimo from chequeo;
  select hash into v_cabeza from public.audit_cabeza where id = 1;
  return query select v_total, coalesce(v_validos, 0), v_roto, (v_ultimo is not distinct from v_cabeza);
end $function$
;

CREATE OR REPLACE FUNCTION public.verificar_password(p_email text, p_password text)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
  select u.id
  from auth.users u
  where lower(u.email) = lower(p_email)
    and u.encrypted_password is not null
    and u.encrypted_password = crypt(p_password, u.encrypted_password)
    and u.email_confirmed_at is not null
    and u.deleted_at is null
    and (u.banned_until is null or u.banned_until < now())
  limit 1
$function$
;

CREATE OR REPLACE FUNCTION public.verificar_restauracion(p_snapshot jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare t text; n bigint; esperado int; total bigint := 0; res jsonb := '{}'::jsonb; huer jsonb := '{}'::jsonb; c bigint; ok boolean := true;
begin
  for t in select jsonb_object_keys(p_snapshot -> 'tablas') loop
    execute format('create temp table %I (like public.%I including defaults) on commit drop', 'r_' || t, t);
    execute format('insert into %I select * from jsonb_populate_recordset(null::public.%I, $1)', 'r_' || t, t) using (p_snapshot -> 'tablas' -> t);
    execute format('select count(*) from %I', 'r_' || t) into n;
    esperado := jsonb_array_length(p_snapshot -> 'tablas' -> t);
    res := res || jsonb_build_object(t, jsonb_build_object('esperadas', esperado, 'restauradas', n));
    if n <> esperado then ok := false; end if;
    total := total + n;
  end loop;

  -- Criterio clinico de recuperacion: ningun dato clinico queda huerfano.
  if to_regclass('pg_temp.r_consulta') is not null and to_regclass('pg_temp.r_perfil') is not null then
    select count(*) into c from r_consulta x where not exists (select 1 from r_perfil p where p.id = x.paciente_id);
    huer := huer || jsonb_build_object('consulta_sin_paciente', c); if c > 0 then ok := false; end if;
    select count(*) into c from r_cita x where not exists (select 1 from r_perfil p where p.id = x.paciente_id);
    huer := huer || jsonb_build_object('cita_sin_paciente', c); if c > 0 then ok := false; end if;
    select count(*) into c from r_archivo_clinico x where not exists (select 1 from r_perfil p where p.id = x.paciente_id);
    huer := huer || jsonb_build_object('archivo_sin_paciente', c); if c > 0 then ok := false; end if;
    select count(*) into c from r_signos_vitales x where not exists (select 1 from r_consulta k where k.id = x.consulta_id);
    huer := huer || jsonb_build_object('signos_sin_consulta', c); if c > 0 then ok := false; end if;
    select count(*) into c from r_diagnostico x where not exists (select 1 from r_consulta k where k.id = x.consulta_id);
    huer := huer || jsonb_build_object('diagnostico_sin_consulta', c); if c > 0 then ok := false; end if;
    select count(*) into c from r_receta x where not exists (select 1 from r_consulta k where k.id = x.consulta_id);
    huer := huer || jsonb_build_object('receta_sin_consulta', c); if c > 0 then ok := false; end if;
    select count(*) into c from r_receta_item x where not exists (select 1 from r_receta k where k.id = x.receta_id);
    huer := huer || jsonb_build_object('receta_item_sin_receta', c); if c > 0 then ok := false; end if;
    select count(*) into c from r_examen x where not exists (select 1 from r_consulta k where k.id = x.consulta_id);
    huer := huer || jsonb_build_object('examen_sin_consulta', c); if c > 0 then ok := false; end if;
    select count(*) into c from r_resultado_examen x where not exists (select 1 from r_examen k where k.id = x.examen_id);
    huer := huer || jsonb_build_object('resultado_sin_examen', c); if c > 0 then ok := false; end if;
  end if;

  return jsonb_build_object('ok', ok, 'tablas', (select count(*) from jsonb_object_keys(res)), 'filas', total, 'detalle', res, 'huerfanos', huer);
end $function$
;

CREATE OR REPLACE FUNCTION public.vigilar_escalamientos()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.vigilar_incidentes_diario()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record;
begin
  for r in select i.id from public.incidente i
           where i.acciones_vencidas_escaladas_en is null and exists (
             select 1 from jsonb_array_elements(i.acciones) a
             where not coalesce((a->>'cumplida')::boolean, false) and (a->>'fecha')::date < (now() at time zone 'America/La_Paz')::date) loop
    update public.incidente set acciones_vencidas_escaladas_en = now() where id = r.id;
    perform public.avisar_correo('acciones_vencidas', r.id);
  end loop;
end $function$
;

CREATE OR REPLACE FUNCTION public.vigilar_respaldos()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare ult timestamptz;
begin
  select max(creado_en) into ult from public.respaldo_registro where tipo = 'horario' and ok;
  if ult is null or ult < now() - interval '90 minutes' then
    if not exists (select 1 from public.respaldo_incidente where tipo = 'rpo_excedido' and cerrado_en is null) then
      insert into public.respaldo_incidente(tipo, detalle) values ('rpo_excedido', 'Sin respaldo horario correcto en mas de 90 minutos');
      insert into public.audit_log(actor_rol, accion, objeto) values ('sistema', 'respaldo_atrasado', 'respaldos');
    end if;
  else
    update public.respaldo_incidente set cerrado_en = now() where tipo = 'rpo_excedido' and cerrado_en is null;
  end if;
end $function$
;

grant execute on function aceptar_terminos(text,text) to authenticated;

grant execute on function aceptar_terminos(text,text) to service_role;

grant execute on function activar_respaldos() to service_role;

grant execute on function actualizar_incidente(uuid,jsonb) to authenticated;

grant execute on function actualizar_incidente(uuid,jsonb) to service_role;

grant execute on function acusar_escalamiento(text,text,text,boolean,boolean,boolean) to anon;

grant execute on function acusar_escalamiento(text,text,text,boolean,boolean,boolean) to authenticated;

grant execute on function acusar_escalamiento(text,text,text,boolean,boolean,boolean) to service_role;

grant execute on function admin_alertas(text) to authenticated;

grant execute on function admin_alertas(text) to service_role;

grant execute on function admin_alertas_resumen() to authenticated;

grant execute on function admin_alertas_resumen() to service_role;

grant execute on function admin_atender_solicitud(uuid,text,text) to authenticated;

grant execute on function admin_atender_solicitud(uuid,text,text) to service_role;

grant execute on function admin_bloquear_cuenta(uuid,text) to authenticated;

grant execute on function admin_bloquear_cuenta(uuid,text) to service_role;

grant execute on function admin_desbloquear_cuenta(uuid,boolean,text) to authenticated;

grant execute on function admin_desbloquear_cuenta(uuid,boolean,text) to service_role;

grant execute on function admin_descartar_reporte(uuid,text) to authenticated;

grant execute on function admin_descartar_reporte(uuid,text) to service_role;

grant execute on function admin_reportes_evento(text) to authenticated;

grant execute on function admin_reportes_evento(text) to service_role;

grant execute on function admin_revisar_alerta(uuid,text,text) to authenticated;

grant execute on function admin_revisar_alerta(uuid,text,text) to service_role;

grant execute on function admin_solicitudes_derechos(text) to authenticated;

grant execute on function admin_solicitudes_derechos(text) to service_role;

grant execute on function agregar_nota_incidente(uuid,text) to authenticated;

grant execute on function agregar_nota_incidente(uuid,text) to service_role;

grant execute on function audit_calcular_hash(bigint,timestamp with time zone,uuid,uuid,text,text,uuid,text[],text,text) to anon;

grant execute on function audit_calcular_hash(bigint,timestamp with time zone,uuid,uuid,text,text,uuid,text[],text,text) to authenticated;

grant execute on function audit_calcular_hash(bigint,timestamp with time zone,uuid,uuid,text,text,uuid,text[],text,text) to service_role;

grant execute on function audit_encadenar() to service_role;

grant execute on function audit_inmutable() to anon;

grant execute on function audit_inmutable() to authenticated;

grant execute on function audit_inmutable() to service_role;

grant execute on function auditoria_consultar(timestamp with time zone,timestamp with time zone,integer) to authenticated;

grant execute on function auditoria_consultar(timestamp with time zone,timestamp with time zone,integer) to service_role;

grant execute on function avisar_correo(text,uuid) to service_role;

grant execute on function bloquear_mi_cuenta() to authenticated;

grant execute on function bloquear_mi_cuenta() to service_role;

grant execute on function bloquear_por_codigos() to service_role;

grant execute on function cerrar_incidente(uuid,text,jsonb) to authenticated;

grant execute on function cerrar_incidente(uuid,text,jsonb) to service_role;

grant execute on function cerrar_otras_sesiones() to authenticated;

grant execute on function cerrar_otras_sesiones() to service_role;

grant execute on function cerrar_sesion(uuid) to authenticated;

grant execute on function cerrar_sesion(uuid) to service_role;

grant execute on function cerrar_sesiones_de(uuid) to service_role;

grant execute on function ci1_otorgado(uuid) to service_role;

grant execute on function citas_ocupadas(uuid,timestamp with time zone,timestamp with time zone) to authenticated;

grant execute on function citas_ocupadas(uuid,timestamp with time zone,timestamp with time zone) to service_role;

grant execute on function comunicar_pacientes(uuid,text) to authenticated;

grant execute on function comunicar_pacientes(uuid,text) to service_role;

grant execute on function consentimientos_estado() to authenticated;

grant execute on function consentimientos_estado() to service_role;

grant execute on function crear_alerta(uuid,text,text,text,jsonb,text,interval,boolean,text) to service_role;

grant execute on function crear_escalamiento(uuid,text,boolean) to service_role;

grant execute on function crear_incidente(jsonb) to authenticated;

grant execute on function crear_incidente(jsonb) to service_role;

grant execute on function crear_solicitud_derechos(text,text) to authenticated;

grant execute on function crear_solicitud_derechos(text,text) to service_role;

grant execute on function dias_habiles(timestamp with time zone,integer) to anon;

grant execute on function dias_habiles(timestamp with time zone,integer) to authenticated;

grant execute on function dias_habiles(timestamp with time zone,integer) to service_role;

grant execute on function entregar_informe_posterior(uuid,text) to authenticated;

grant execute on function entregar_informe_posterior(uuid,text) to service_role;

grant execute on function enviar_alerta_bloqueo() to anon;

grant execute on function enviar_alerta_bloqueo() to authenticated;

grant execute on function enviar_alerta_bloqueo() to service_role;

grant execute on function enviar_informe_mensual(integer,integer) to authenticated;

grant execute on function enviar_informe_mensual(integer,integer) to service_role;

grant execute on function enviar_informe_mensual_auto() to service_role;

grant execute on function escalamiento_por_token(text) to anon;

grant execute on function escalamiento_por_token(text) to authenticated;

grant execute on function escalamiento_por_token(text) to service_role;

grant execute on function espejo_actividad_auditoria() to service_role;

grant execute on function estado_respaldos() to authenticated;

grant execute on function estado_respaldos() to service_role;

grant execute on function estado_sesion() to authenticated;

grant execute on function estado_sesion() to service_role;

grant execute on function evaluar_ingreso(uuid,text,text,text) to service_role;

grant execute on function exigir_osi() to service_role;

grant execute on function exportar_configuracion() to service_role;

grant execute on function fn_audit() to service_role;

grant execute on function fn_cambiar_estado_cita(uuid,estado_cita,uuid,text) to service_role;

grant execute on function fn_notificar_cita_cancelada() to anon;

grant execute on function fn_notificar_cita_cancelada() to authenticated;

grant execute on function fn_notificar_cita_cancelada() to service_role;

grant execute on function fn_notificar_cita_creada() to anon;

grant execute on function fn_notificar_cita_creada() to authenticated;

grant execute on function fn_notificar_cita_creada() to service_role;

grant execute on function fn_notificar_cita_programada() to anon;

grant execute on function fn_notificar_cita_programada() to authenticated;

grant execute on function fn_notificar_cita_programada() to service_role;

grant execute on function generar_recordatorio() to anon;

grant execute on function generar_recordatorio() to authenticated;

grant execute on function generar_recordatorio() to service_role;

grant execute on function get_dashboard_data(timestamp with time zone,timestamp with time zone) to anon;

grant execute on function get_dashboard_data(timestamp with time zone,timestamp with time zone) to authenticated;

grant execute on function get_dashboard_data(timestamp with time zone,timestamp with time zone) to service_role;

grant execute on function get_dashboard_kpis(date,date) to authenticated;

grant execute on function get_dashboard_kpis(date,date) to service_role;

grant execute on function get_dashboard_kpis_impl(date,date) to service_role;

grant execute on function habilitar_acceso_exterior(integer) to authenticated;

grant execute on function habilitar_acceso_exterior(integer) to service_role;

grant execute on function hashes_recientes(uuid) to service_role;

grant execute on function hook_exigir_2fa(jsonb) to service_role;

grant execute on function incidente_desde_alerta(uuid) to authenticated;

grant execute on function incidente_desde_alerta(uuid) to service_role;

grant execute on function incidentes_resumen() to authenticated;

grant execute on function incidentes_resumen() to service_role;

grant execute on function informe_anual(integer) to authenticated;

grant execute on function informe_anual(integer) to service_role;

grant execute on function informe_mensual(integer,integer) to authenticated;

grant execute on function informe_mensual(integer,integer) to service_role;

grant execute on function iniciar_simulacro() to authenticated;

grant execute on function iniciar_simulacro() to service_role;

grant execute on function latido() to authenticated;

grant execute on function latido() to service_role;

grant execute on function listar_incidentes(text) to authenticated;

grant execute on function listar_incidentes(text) to service_role;

grant execute on function listar_medicos() to authenticated;

grant execute on function listar_medicos() to service_role;

grant execute on function listar_simulacros() to authenticated;

grant execute on function listar_simulacros() to service_role;

grant execute on function listar_tablas_respaldo() to service_role;

grant execute on function marcar_accion(uuid,integer,boolean) to authenticated;

grant execute on function marcar_accion(uuid,integer,boolean) to service_role;

grant execute on function marcar_seguridad_vista(text) to authenticated;

grant execute on function marcar_seguridad_vista(text) to service_role;

grant execute on function medico_atiende(uuid) to anon;

grant execute on function medico_atiende(uuid) to authenticated;

grant execute on function medico_atiende(uuid) to service_role;

grant execute on function mi_acceso_exterior() to authenticated;

grant execute on function mi_acceso_exterior() to service_role;

grant execute on function mi_actividad(integer) to authenticated;

grant execute on function mi_actividad(integer) to service_role;

grant execute on function mi_rol() to anon;

grant execute on function mi_rol() to authenticated;

grant execute on function mi_rol() to service_role;

grant execute on function mis_citas() to authenticated;

grant execute on function mis_citas() to service_role;

grant execute on function mis_datos() to authenticated;

grant execute on function mis_datos() to service_role;

grant execute on function mis_sesiones() to authenticated;

grant execute on function mis_sesiones() to service_role;

grant execute on function mis_solicitudes_derechos() to authenticated;

grant execute on function mis_solicitudes_derechos() to service_role;

grant execute on function notify_alerta() to service_role;

grant execute on function notify_cita_cancelada() to anon;

grant execute on function notify_cita_cancelada() to authenticated;

grant execute on function notify_cita_cancelada() to service_role;

grant execute on function obtener_hash_password(text) to service_role;

grant execute on function obtener_incidente(uuid) to authenticated;

grant execute on function obtener_incidente(uuid) to service_role;

grant execute on function perfil_proteger_columnas() to anon;

grant execute on function perfil_proteger_columnas() to authenticated;

grant execute on function perfil_proteger_columnas() to service_role;

grant execute on function quitar_acceso_exterior() to authenticated;

grant execute on function quitar_acceso_exterior() to service_role;

grant execute on function reauth_pendiente(uuid) to service_role;

grant execute on function red_ip(text) to anon;

grant execute on function red_ip(text) to authenticated;

grant execute on function red_ip(text) to service_role;

grant execute on function registrar_acceso(text,uuid,uuid,text) to authenticated;

grant execute on function registrar_acceso(text,uuid,uuid,text) to service_role;

grant execute on function registrar_afectadas(uuid,text[]) to authenticated;

grant execute on function registrar_afectadas(uuid,text[]) to service_role;

grant execute on function registrar_cambio_clave(uuid,text) to service_role;

grant execute on function registrar_consentimiento(text,boolean,text) to authenticated;

grant execute on function registrar_consentimiento(text,boolean,text) to service_role;

grant execute on function registrar_dispositivo(uuid,text,text,text) to service_role;

grant execute on function registrar_fallo_ingreso(text,text) to service_role;

grant execute on function reportar_evento(text,text) to authenticated;

grant execute on function reportar_evento(text,text) to service_role;

grant execute on function seguridad_recordatorio_pendiente() to authenticated;

grant execute on function seguridad_recordatorio_pendiente() to service_role;

grant execute on function sesion_existe() to authenticated;

grant execute on function sesion_existe() to service_role;

grant execute on function sesion_vigente() to authenticated;

grant execute on function sesion_vigente() to service_role;

grant execute on function set_updated_at() to anon;

grant execute on function set_updated_at() to authenticated;

grant execute on function set_updated_at() to service_role;

grant execute on function sin_borrado() to anon;

grant execute on function sin_borrado() to authenticated;

grant execute on function sin_borrado() to service_role;

grant execute on function solo_agregar() to anon;

grant execute on function solo_agregar() to authenticated;

grant execute on function solo_agregar() to service_role;

grant execute on function touch_updated_at() to anon;

grant execute on function touch_updated_at() to authenticated;

grant execute on function touch_updated_at() to service_role;

grant execute on function validar_token_respaldo(text) to service_role;

grant execute on function verificar_cadena_auditoria() to authenticated;

grant execute on function verificar_cadena_auditoria() to service_role;

grant execute on function verificar_password(text,text) to service_role;

grant execute on function verificar_restauracion(jsonb) to service_role;

grant execute on function vigilar_escalamientos() to service_role;

grant execute on function vigilar_incidentes_diario() to service_role;

grant execute on function vigilar_respaldos() to service_role;

revoke all on function aceptar_terminos(text,text) from public;

revoke all on function activar_respaldos() from public;

revoke all on function actualizar_incidente(uuid,jsonb) from public;

revoke all on function acusar_escalamiento(text,text,text,boolean,boolean,boolean) from public;

revoke all on function admin_alertas(text) from public;

revoke all on function admin_alertas_resumen() from public;

revoke all on function admin_atender_solicitud(uuid,text,text) from public;

revoke all on function admin_bloquear_cuenta(uuid,text) from public;

revoke all on function admin_desbloquear_cuenta(uuid,boolean,text) from public;

revoke all on function admin_descartar_reporte(uuid,text) from public;

revoke all on function admin_reportes_evento(text) from public;

revoke all on function admin_revisar_alerta(uuid,text,text) from public;

revoke all on function admin_solicitudes_derechos(text) from public;

revoke all on function agregar_nota_incidente(uuid,text) from public;

revoke all on function audit_calcular_hash(bigint,timestamp with time zone,uuid,uuid,text,text,uuid,text[],text,text) from public;

revoke all on function audit_encadenar() from public;

revoke all on function audit_inmutable() from public;

revoke all on function auditoria_consultar(timestamp with time zone,timestamp with time zone,integer) from public;

revoke all on function avisar_correo(text,uuid) from public;

revoke all on function bloquear_mi_cuenta() from public;

revoke all on function bloquear_por_codigos() from public;

revoke all on function cerrar_incidente(uuid,text,jsonb) from public;

revoke all on function cerrar_otras_sesiones() from public;

revoke all on function cerrar_sesion(uuid) from public;

revoke all on function cerrar_sesiones_de(uuid) from public;

revoke all on function ci1_otorgado(uuid) from public;

revoke all on function citas_ocupadas(uuid,timestamp with time zone,timestamp with time zone) from public;

revoke all on function comunicar_pacientes(uuid,text) from public;

revoke all on function consentimientos_estado() from public;

revoke all on function crear_alerta(uuid,text,text,text,jsonb,text,interval,boolean,text) from public;

revoke all on function crear_escalamiento(uuid,text,boolean) from public;

revoke all on function crear_incidente(jsonb) from public;

revoke all on function crear_solicitud_derechos(text,text) from public;

revoke all on function dias_habiles(timestamp with time zone,integer) from public;

revoke all on function entregar_informe_posterior(uuid,text) from public;

revoke all on function enviar_alerta_bloqueo() from public;

revoke all on function enviar_informe_mensual(integer,integer) from public;

revoke all on function enviar_informe_mensual_auto() from public;

revoke all on function escalamiento_por_token(text) from public;

revoke all on function espejo_actividad_auditoria() from public;

revoke all on function estado_respaldos() from public;

revoke all on function estado_sesion() from public;

revoke all on function evaluar_ingreso(uuid,text,text,text) from public;

revoke all on function exigir_osi() from public;

revoke all on function exportar_configuracion() from public;

revoke all on function fn_audit() from public;

revoke all on function fn_cambiar_estado_cita(uuid,estado_cita,uuid,text) from public;

revoke all on function fn_notificar_cita_cancelada() from public;

revoke all on function fn_notificar_cita_creada() from public;

revoke all on function fn_notificar_cita_programada() from public;

revoke all on function generar_recordatorio() from public;

revoke all on function get_dashboard_data(timestamp with time zone,timestamp with time zone) from public;

revoke all on function get_dashboard_kpis(date,date) from public;

revoke all on function get_dashboard_kpis_impl(date,date) from public;

revoke all on function habilitar_acceso_exterior(integer) from public;

revoke all on function hashes_recientes(uuid) from public;

revoke all on function hook_exigir_2fa(jsonb) from public;

revoke all on function incidente_desde_alerta(uuid) from public;

revoke all on function incidentes_resumen() from public;

revoke all on function informe_anual(integer) from public;

revoke all on function informe_mensual(integer,integer) from public;

revoke all on function iniciar_simulacro() from public;

revoke all on function latido() from public;

revoke all on function listar_incidentes(text) from public;

revoke all on function listar_medicos() from public;

revoke all on function listar_simulacros() from public;

revoke all on function listar_tablas_respaldo() from public;

revoke all on function marcar_accion(uuid,integer,boolean) from public;

revoke all on function marcar_seguridad_vista(text) from public;

revoke all on function medico_atiende(uuid) from public;

revoke all on function mi_acceso_exterior() from public;

revoke all on function mi_actividad(integer) from public;

revoke all on function mi_rol() from public;

revoke all on function mis_citas() from public;

revoke all on function mis_datos() from public;

revoke all on function mis_sesiones() from public;

revoke all on function mis_solicitudes_derechos() from public;

revoke all on function notify_alerta() from public;

revoke all on function notify_cita_cancelada() from public;

revoke all on function obtener_hash_password(text) from public;

revoke all on function obtener_incidente(uuid) from public;

revoke all on function perfil_proteger_columnas() from public;

revoke all on function quitar_acceso_exterior() from public;

revoke all on function reauth_pendiente(uuid) from public;

revoke all on function red_ip(text) from public;

revoke all on function registrar_acceso(text,uuid,uuid,text) from public;

revoke all on function registrar_afectadas(uuid,text[]) from public;

revoke all on function registrar_cambio_clave(uuid,text) from public;

revoke all on function registrar_consentimiento(text,boolean,text) from public;

revoke all on function registrar_dispositivo(uuid,text,text,text) from public;

revoke all on function registrar_fallo_ingreso(text,text) from public;

revoke all on function reportar_evento(text,text) from public;

revoke all on function seguridad_recordatorio_pendiente() from public;

revoke all on function sesion_existe() from public;

revoke all on function sesion_vigente() from public;

revoke all on function set_updated_at() from public;

revoke all on function sin_borrado() from public;

revoke all on function solo_agregar() from public;

revoke all on function touch_updated_at() from public;

revoke all on function validar_token_respaldo(text) from public;

revoke all on function verificar_cadena_auditoria() from public;

revoke all on function verificar_password(text,text) from public;

revoke all on function verificar_restauracion(jsonb) from public;

revoke all on function vigilar_escalamientos() from public;

revoke all on function vigilar_incidentes_diario() from public;

revoke all on function vigilar_respaldos() from public;

alter table public.aceptacion_terminos add constraint aceptacion_terminos_user_id_fkey FOREIGN KEY (user_id) REFERENCES perfil(id) ON DELETE CASCADE;

alter table public.aceptacion_terminos add constraint aceptacion_terminos_version_fkey FOREIGN KEY (version) REFERENCES terminos(version);

alter table public.actividad_sospechosa add constraint actividad_sospechosa_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.alergia add constraint alergia_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES perfil(id) ON DELETE CASCADE;

alter table public.alerta_seguridad add constraint alerta_seguridad_estado_check CHECK ((estado = ANY (ARRAY['abierta'::text, 'revisada'::text, 'falso_positivo'::text, 'confirmada'::text])));

alter table public.alerta_seguridad add constraint alerta_seguridad_nivel_check CHECK ((nivel = ANY (ARRAY['normal'::text, 'critica'::text])));

alter table public.alerta_seguridad add constraint alerta_seguridad_nota_check CHECK (((nota IS NULL) OR (length(nota) <= 1000)));

alter table public.antecedente add constraint antecedente_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES perfil(id) ON DELETE CASCADE;

alter table public.archivo_clinico add constraint archivo_clinico_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES perfil(id) ON DELETE CASCADE;

alter table public.audit_cabeza add constraint audit_cabeza_id_check CHECK ((id = 1));

alter table public.cita add constraint cita_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES perfil(id) ON DELETE SET NULL;

alter table public.cita add constraint cita_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES perfil(id) ON DELETE RESTRICT;

alter table public.clave_historial add constraint clave_historial_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.codigo_verificacion add constraint codigo_verificacion_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.consentimiento add constraint consentimiento_codigo_version_fkey FOREIGN KEY (codigo, version) REFERENCES consentimiento_catalogo(codigo, version);

alter table public.consulta add constraint consulta_archivo_clinico_id_fkey FOREIGN KEY (archivo_clinico_id) REFERENCES archivo_clinico(id);

alter table public.consulta add constraint consulta_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES cita(id) ON DELETE SET NULL;

alter table public.consulta add constraint consulta_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES perfil(id) ON DELETE SET NULL;

alter table public.consulta add constraint consulta_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES perfil(id) ON DELETE CASCADE;

alter table public.desbloqueo_tokens add constraint desbloqueo_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES perfil(id) ON DELETE CASCADE;

alter table public.diagnostico add constraint diagnostico_consulta_id_fkey FOREIGN KEY (consulta_id) REFERENCES consulta(id) ON DELETE CASCADE;

alter table public.dispositivo_conocido add constraint dispositivo_conocido_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.escalamiento add constraint escalamiento_decision_check CHECK (((decision IS NULL) OR (decision = ANY (ARRAY['trata'::text, 'acepta'::text, 'transfiere'::text]))));

alter table public.escalamiento add constraint escalamiento_incidente_id_fkey FOREIGN KEY (incidente_id) REFERENCES incidente(id);

alter table public.escalamiento add constraint escalamiento_informe_texto_check CHECK (((informe_texto IS NULL) OR (length(informe_texto) <= 4000)));

alter table public.escalamiento add constraint escalamiento_severidad_check CHECK ((severidad = ANY (ARRAY['menor'::text, 'mayor'::text, 'critica'::text])));

alter table public.examen add constraint examen_consulta_id_fkey FOREIGN KEY (consulta_id) REFERENCES consulta(id) ON DELETE CASCADE;

alter table public.fechas_sin_atencion add constraint fechas_sin_atencion_check CHECK ((fecha_inicio <= fecha_fin));

alter table public.fechas_sin_atencion add constraint fechas_sin_atencion_perfil_id_fkey FOREIGN KEY (perfil_id) REFERENCES perfil(id) ON DELETE CASCADE;

alter table public.habilitacion_exterior add constraint habilitacion_exterior_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.horarios_medico add constraint horarios_medico_dia_semana_check CHECK (((dia_semana >= 1) AND (dia_semana <= 7)));

alter table public.horarios_medico add constraint horarios_medico_perfil_id_fkey FOREIGN KEY (perfil_id) REFERENCES perfil(id) ON DELETE CASCADE;

alter table public.incidente add constraint incidente_categoria_fkey FOREIGN KEY (categoria) REFERENCES incidente_categoria(numero);

alter table public.incidente add constraint incidente_causa_check CHECK (((causa IS NULL) OR (length(causa) <= 2000)));

alter table public.incidente add constraint incidente_comunicaciones_check CHECK (((comunicaciones IS NULL) OR (length(comunicaciones) <= 2000)));

alter table public.incidente add constraint incidente_datos_restringidos_tipo_check CHECK (((datos_restringidos_tipo IS NULL) OR (length(datos_restringidos_tipo) <= 300)));

alter table public.incidente add constraint incidente_descripcion_check CHECK (((length(descripcion) >= 5) AND (length(descripcion) <= 2000)));

alter table public.incidente add constraint incidente_estado_check CHECK ((estado = ANY (ARRAY['abierto'::text, 'en_seguimiento'::text, 'cerrado'::text])));

alter table public.incidente add constraint incidente_horas_interrupcion_check CHECK (((horas_interrupcion IS NULL) OR (horas_interrupcion >= (0)::numeric)));

alter table public.incidente add constraint incidente_horas_respuesta_check CHECK (((horas_respuesta IS NULL) OR (horas_respuesta >= (0)::numeric)));

alter table public.incidente add constraint incidente_mitigacion_check CHECK (((mitigacion IS NULL) OR (length(mitigacion) <= 2000)));

alter table public.incidente add constraint incidente_pacientes_afectadas_check CHECK (((pacientes_afectadas IS NULL) OR (pacientes_afectadas >= 0)));

alter table public.incidente add constraint incidente_registros_afectados_check CHECK (((registros_afectados IS NULL) OR (registros_afectados >= 0)));

alter table public.incidente add constraint incidente_reportado_por_check CHECK (((length(reportado_por) >= 2) AND (length(reportado_por) <= 120)));

alter table public.incidente add constraint incidente_severidad_check CHECK ((severidad = ANY (ARRAY['menor'::text, 'mayor'::text, 'critica'::text])));

alter table public.incidente add constraint incidente_sistemas_afectados_check CHECK (((length(sistemas_afectados) >= 2) AND (length(sistemas_afectados) <= 500)));

alter table public.incidente_afectada add constraint incidente_afectada_incidente_id_fkey FOREIGN KEY (incidente_id) REFERENCES incidente(id);

alter table public.incidente_categoria add constraint incidente_categoria_numero_check CHECK (((numero >= 1) AND (numero <= 16)));

alter table public.incidente_comunicacion add constraint incidente_comunicacion_incidente_id_fkey FOREIGN KEY (incidente_id) REFERENCES incidente(id);

alter table public.incidente_comunicacion add constraint incidente_comunicacion_mensaje_check CHECK (((length(mensaje) >= 20) AND (length(mensaje) <= 1500)));

alter table public.incidente_comunicacion add constraint incidente_comunicacion_tipo_check CHECK ((tipo = ANY (ARRAY['pacientes'::text, 'personal'::text, 'autoridades'::text])));

alter table public.incidente_nota add constraint incidente_nota_incidente_id_fkey FOREIGN KEY (incidente_id) REFERENCES incidente(id);

alter table public.incidente_nota add constraint incidente_nota_nota_check CHECK (((length(nota) >= 3) AND (length(nota) <= 1000)));

alter table public.perfil add constraint perfil_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.perfil add constraint perfil_rol_check CHECK ((rol = ANY (ARRAY['paciente'::text, 'medico'::text, 'medicoAdmin'::text])));

alter table public.pregunta add constraint pregunta_encuesta_id_fkey FOREIGN KEY (encuesta_id) REFERENCES encuesta(id) ON DELETE CASCADE;

alter table public.pregunta add constraint pregunta_tipo_check CHECK ((tipo = ANY (ARRAY['rating_100'::text, 'rating_10'::text, 'boolean'::text, 'categoria'::text, 'texto'::text])));

alter table public.receta add constraint receta_consulta_id_fkey FOREIGN KEY (consulta_id) REFERENCES consulta(id) ON DELETE CASCADE;

alter table public.receta_item add constraint receta_item_receta_id_fkey FOREIGN KEY (receta_id) REFERENCES receta(id) ON DELETE CASCADE;

alter table public.reporte_evento add constraint reporte_evento_descripcion_check CHECK (((length(descripcion) >= 5) AND (length(descripcion) <= 1000)));

alter table public.reporte_evento add constraint reporte_evento_estado_check CHECK ((estado = ANY (ARRAY['nuevo'::text, 'convertido'::text, 'descartado'::text])));

alter table public.reporte_evento add constraint reporte_evento_sistemas_check CHECK (((sistemas IS NULL) OR (length(sistemas) <= 300)));

alter table public.respaldo_config add constraint respaldo_config_id_check CHECK ((id = 1));

alter table public.respaldo_registro add constraint respaldo_registro_tipo_check CHECK ((tipo = ANY (ARRAY['horario'::text, 'diario'::text, 'mensual'::text, 'config'::text])));

alter table public.respuesta_encuesta add constraint respuesta_encuesta_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES cita(id) ON DELETE CASCADE;

alter table public.respuesta_encuesta add constraint respuesta_encuesta_encuesta_id_fkey FOREIGN KEY (encuesta_id) REFERENCES encuesta(id) ON DELETE RESTRICT;

alter table public.respuesta_encuesta add constraint respuesta_encuesta_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES perfil(id) ON DELETE CASCADE;

alter table public.respuesta_pregunta add constraint respuesta_pregunta_pregunta_id_fkey FOREIGN KEY (pregunta_id) REFERENCES pregunta(id) ON DELETE CASCADE;

alter table public.respuesta_pregunta add constraint respuesta_pregunta_respuesta_encuesta_id_fkey FOREIGN KEY (respuesta_encuesta_id) REFERENCES respuesta_encuesta(id) ON DELETE CASCADE;

alter table public.respuesta_pregunta add constraint una_sola_columna CHECK ((num_nonnulls(valor_num, valor_bool, valor_texto) = 1));

alter table public.restriccion_cuenta add constraint restriccion_cuenta_tipo_check CHECK ((tipo = ANY (ARRAY['descargas'::text, 'reauth'::text])));

alter table public.restriccion_cuenta add constraint restriccion_cuenta_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.resultado_examen add constraint resultado_examen_examen_id_fkey FOREIGN KEY (examen_id) REFERENCES examen(id) ON DELETE CASCADE;

alter table public.signos_vitales add constraint signos_vitales_consulta_id_fkey FOREIGN KEY (consulta_id) REFERENCES consulta(id) ON DELETE CASCADE;

alter table public.solicitud_derechos add constraint solicitud_derechos_detalle_check CHECK (((detalle IS NULL) OR (length(detalle) <= 1000)));

alter table public.solicitud_derechos add constraint solicitud_derechos_estado_check CHECK ((estado = ANY (ARRAY['recibida'::text, 'en_proceso'::text, 'atendida'::text, 'rechazada'::text])));

alter table public.solicitud_derechos add constraint solicitud_derechos_respuesta_check CHECK (((respuesta IS NULL) OR (length(respuesta) <= 2000)));

alter table public.solicitud_derechos add constraint solicitud_derechos_tipo_check CHECK ((tipo = ANY (ARRAY['acceso'::text, 'rectificacion'::text, 'retiro_consentimiento'::text, 'eliminacion'::text])));

alter table public.aceptacion_terminos enable row level security;

alter table public.actividad_sospechosa enable row level security;

alter table public.alergia enable row level security;

alter table public.alerta_seguridad enable row level security;

alter table public.alertas_enviadas enable row level security;

alter table public.antecedente enable row level security;

alter table public.archivo_clinico enable row level security;

alter table public.audit_cabeza enable row level security;

alter table public.audit_log enable row level security;

alter table public.bloqueo_origen enable row level security;

alter table public.cita enable row level security;

alter table public.clave_historial enable row level security;

alter table public.codigo_verificacion enable row level security;

alter table public.consentimiento enable row level security;

alter table public.consentimiento_catalogo enable row level security;

alter table public.consulta enable row level security;

alter table public.desbloqueo_tokens enable row level security;

alter table public.diagnostico enable row level security;

alter table public.dispositivo_conocido enable row level security;

alter table public.encuesta enable row level security;

alter table public.escalamiento enable row level security;

alter table public.examen enable row level security;

alter table public.fechas_sin_atencion enable row level security;

alter table public.geoip_cache enable row level security;

alter table public.habilitacion_exterior enable row level security;

alter table public.horarios_medico enable row level security;

alter table public.incidente enable row level security;

alter table public.incidente_afectada enable row level security;

alter table public.incidente_categoria enable row level security;

alter table public.incidente_comunicacion enable row level security;

alter table public.incidente_nota enable row level security;

alter table public.informe_incidentes enable row level security;

alter table public.intento_ingreso_fallido enable row level security;

alter table public.perfil enable row level security;

alter table public.pregunta enable row level security;

alter table public.receta enable row level security;

alter table public.receta_item enable row level security;

alter table public.recordatorio_queue enable row level security;

alter table public.reporte_evento enable row level security;

alter table public.reset_tokens enable row level security;

alter table public.respaldo_config enable row level security;

alter table public.respaldo_incidente enable row level security;

alter table public.respaldo_prueba_restauracion enable row level security;

alter table public.respaldo_registro enable row level security;

alter table public.respuesta_encuesta enable row level security;

alter table public.respuesta_pregunta enable row level security;

alter table public.restriccion_cuenta enable row level security;

alter table public.resultado_examen enable row level security;

alter table public.seguridad_recordatorio enable row level security;

alter table public.sesion_actividad enable row level security;

alter table public.signos_vitales enable row level security;

alter table public.solicitud_derechos enable row level security;

alter table public.terminos enable row level security;

create policy "acceso alergia" on public.alergia for all to public using (((paciente_id = auth.uid()) OR ((mi_rol() = ANY (ARRAY['medico'::text, 'medicoAdmin'::text])) AND medico_atiende(paciente_id)) OR (mi_rol() = 'medicoAdmin'::text))) with check ((mi_rol() = ANY (ARRAY['medico'::text, 'medicoAdmin'::text])));

create policy "acceso antecedente" on public.antecedente for all to public using (((paciente_id = auth.uid()) OR ((mi_rol() = ANY (ARRAY['medico'::text, 'medicoAdmin'::text])) AND medico_atiende(paciente_id)) OR (mi_rol() = 'medicoAdmin'::text))) with check ((mi_rol() = ANY (ARRAY['medico'::text, 'medicoAdmin'::text])));

create policy "acceso diagnostico via consulta" on public.diagnostico for all to public using ((EXISTS ( SELECT 1
   FROM consulta c
  WHERE ((c.id = diagnostico.consulta_id) AND ((c.paciente_id = auth.uid()) OR (c.medico_id = auth.uid()) OR (mi_rol() = 'medicoAdmin'::text)))))) with check ((EXISTS ( SELECT 1
   FROM consulta c
  WHERE ((c.id = diagnostico.consulta_id) AND ((c.medico_id = auth.uid()) OR (mi_rol() = 'medicoAdmin'::text))))));

create policy "acceso examen via consulta" on public.examen for all to public using ((EXISTS ( SELECT 1
   FROM consulta c
  WHERE ((c.id = examen.consulta_id) AND ((c.paciente_id = auth.uid()) OR (c.medico_id = auth.uid()) OR (mi_rol() = 'medicoAdmin'::text)))))) with check ((EXISTS ( SELECT 1
   FROM consulta c
  WHERE ((c.id = examen.consulta_id) AND ((c.medico_id = auth.uid()) OR (mi_rol() = 'medicoAdmin'::text))))));

create policy "acceso receta via consulta" on public.receta for all to public using ((EXISTS ( SELECT 1
   FROM consulta c
  WHERE ((c.id = receta.consulta_id) AND ((c.paciente_id = auth.uid()) OR (c.medico_id = auth.uid()) OR (mi_rol() = 'medicoAdmin'::text)))))) with check ((EXISTS ( SELECT 1
   FROM consulta c
  WHERE ((c.id = receta.consulta_id) AND ((c.medico_id = auth.uid()) OR (mi_rol() = 'medicoAdmin'::text))))));

create policy "acceso receta_item via receta" on public.receta_item for all to public using ((EXISTS ( SELECT 1
   FROM (receta r
     JOIN consulta c ON ((c.id = r.consulta_id)))
  WHERE ((r.id = receta_item.receta_id) AND ((c.paciente_id = auth.uid()) OR (c.medico_id = auth.uid()) OR (mi_rol() = 'medicoAdmin'::text)))))) with check ((EXISTS ( SELECT 1
   FROM (receta r
     JOIN consulta c ON ((c.id = r.consulta_id)))
  WHERE ((r.id = receta_item.receta_id) AND ((c.medico_id = auth.uid()) OR (mi_rol() = 'medicoAdmin'::text))))));

create policy "acceso resultado_examen via examen" on public.resultado_examen for all to public using ((EXISTS ( SELECT 1
   FROM (examen e
     JOIN consulta c ON ((c.id = e.consulta_id)))
  WHERE ((e.id = resultado_examen.examen_id) AND ((c.paciente_id = auth.uid()) OR (c.medico_id = auth.uid()) OR (mi_rol() = 'medicoAdmin'::text)))))) with check ((EXISTS ( SELECT 1
   FROM (examen e
     JOIN consulta c ON ((c.id = e.consulta_id)))
  WHERE ((e.id = resultado_examen.examen_id) AND ((c.medico_id = auth.uid()) OR (mi_rol() = 'medicoAdmin'::text))))));

create policy "acceso signos_vitales via consulta" on public.signos_vitales for all to public using ((EXISTS ( SELECT 1
   FROM consulta c
  WHERE ((c.id = signos_vitales.consulta_id) AND ((c.paciente_id = auth.uid()) OR (c.medico_id = auth.uid()) OR (mi_rol() = 'medicoAdmin'::text)))))) with check ((EXISTS ( SELECT 1
   FROM consulta c
  WHERE ((c.id = signos_vitales.consulta_id) AND ((c.medico_id = auth.uid()) OR (mi_rol() = 'medicoAdmin'::text))))));

create policy "aceptacion: la paciente ve las suyas" on public.aceptacion_terminos for select to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT sesion_existe() AS sesion_existe)));

create policy "aceptacion: medicoAdmin ve todas" on public.aceptacion_terminos for select to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "actualizar propio perfil" on public.perfil for update to public using ((id = auth.uid()));

create policy "alertas: medicoAdmin ve todas" on public.alerta_seguridad for select to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "catalogo publico" on public.consentimiento_catalogo for select to anon, authenticated using (true);

create policy "categorias para quien ingresa" on public.incidente_categoria for select to authenticated using (true);

create policy "cita: medico actualiza su cita" on public.cita for update to public using ((medico_id = auth.uid()));

create policy "cita: medico lee sus citas" on public.cita for select to public using ((medico_id = auth.uid()));

create policy "cita: paciente agenda la suya" on public.cita for insert to authenticated with check (((paciente_id = ( SELECT auth.uid() AS uid)) AND (( SELECT mi_rol() AS mi_rol) = 'paciente'::text) AND (estado = 'programada'::estado_cita)));

create policy "cita: paciente cancela o reprograma la suya" on public.cita for update to authenticated using (((paciente_id = ( SELECT auth.uid() AS uid)) AND (estado = 'programada'::estado_cita))) with check (((paciente_id = ( SELECT auth.uid() AS uid)) AND (estado = ANY (ARRAY['programada'::estado_cita, 'cancelada'::estado_cita, 'reprogramada'::estado_cita]))));

create policy "cita: paciente lee sus citas" on public.cita for select to public using ((paciente_id = auth.uid()));

create policy "consentimiento: la paciente ve los suyos" on public.consentimiento for select to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT sesion_existe() AS sesion_existe)));

create policy "consentimiento: medicoAdmin ve todos" on public.consentimiento for select to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "derechos: la paciente ve las suyas" on public.solicitud_derechos for select to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT sesion_existe() AS sesion_existe)));

create policy "derechos: medicoAdmin ve todas" on public.solicitud_derechos for select to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "encuesta: lectura publica autenticada" on public.encuesta for select to public using (true);

create policy "encuesta: medico gestiona" on public.encuesta for all to public using ((EXISTS ( SELECT 1
   FROM perfil p
  WHERE ((p.id = auth.uid()) AND (p.rol = 'medico'::text))))) with check ((EXISTS ( SELECT 1
   FROM perfil p
  WHERE ((p.id = auth.uid()) AND (p.rol = 'medico'::text)))));

create policy "fechas sin atencion: medico gestiona las suyas" on public.fechas_sin_atencion for all to authenticated using ((perfil_id = ( SELECT auth.uid() AS uid))) with check ((perfil_id = ( SELECT auth.uid() AS uid)));

create policy "fechas sin atencion: medicoAdmin gestiona todas" on public.fechas_sin_atencion for all to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text)) with check ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "fechas sin atencion: usuarios con sesion leen" on public.fechas_sin_atencion for select to authenticated using (true);

create policy "horarios: medico gestiona los suyos" on public.horarios_medico for all to authenticated using ((perfil_id = ( SELECT auth.uid() AS uid))) with check ((perfil_id = ( SELECT auth.uid() AS uid)));

create policy "horarios: medicoAdmin gestiona todos" on public.horarios_medico for all to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text)) with check ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "horarios: usuarios con sesion leen" on public.horarios_medico for select to authenticated using (true);

create policy "medico crea archivo clinico de sus pacientes" on public.archivo_clinico for insert to authenticated with check (((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text) OR ((( SELECT mi_rol() AS mi_rol) = 'medico'::text) AND medico_atiende(paciente_id))));

create policy "medico crea/edita sus citas" on public.cita for all to public using ((medico_id = auth.uid())) with check ((medico_id = auth.uid()));

create policy "medico ve archivo de sus pacientes" on public.archivo_clinico for select to public using (((mi_rol() = ANY (ARRAY['medico'::text, 'medicoAdmin'::text])) AND medico_atiende(paciente_id)));

create policy "medico ve perfil de sus pacientes" on public.perfil for select to public using (((mi_rol() = ANY (ARRAY['medico'::text, 'medicoAdmin'::text])) AND medico_atiende(id)));

create policy "medico ve sus citas" on public.cita for select to public using ((medico_id = auth.uid()));

create policy "medico ve/edita consultas que atiende" on public.consulta for all to public using ((medico_id = auth.uid())) with check ((medico_id = auth.uid()));

create policy "medicoAdmin administra archivo clinico" on public.archivo_clinico for all to public using ((mi_rol() = 'medicoAdmin'::text)) with check ((mi_rol() = 'medicoAdmin'::text));

create policy "medicoAdmin administra todas las citas" on public.cita for all to public using ((mi_rol() = 'medicoAdmin'::text)) with check ((mi_rol() = 'medicoAdmin'::text));

create policy "medicoAdmin administra todas las consultas" on public.consulta for all to public using ((mi_rol() = 'medicoAdmin'::text)) with check ((mi_rol() = 'medicoAdmin'::text));

create policy "medicoAdmin ve todas las citas" on public.cita for select to public using ((mi_rol() = 'medicoAdmin'::text));

create policy "medicoAdmin ve todos los perfiles" on public.perfil for select to public using ((mi_rol() = 'medicoAdmin'::text));

create policy "osi ve escalamiento" on public.escalamiento for select to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "osi ve incidente" on public.incidente for select to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "osi ve incidente_afectada" on public.incidente_afectada for select to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "osi ve incidente_comunicacion" on public.incidente_comunicacion for select to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "osi ve incidente_nota" on public.incidente_nota for select to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "osi ve informe_incidentes" on public.informe_incidentes for select to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "osi ve reporte_evento" on public.reporte_evento for select to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "paciente ve su archivo clinico" on public.archivo_clinico for select to public using ((paciente_id = auth.uid()));

create policy "paciente ve sus citas" on public.cita for select to public using ((paciente_id = auth.uid()));

create policy "paciente ve sus consultas" on public.consulta for select to public using ((paciente_id = auth.uid()));

create policy "perfil: medico actualiza datos de sus pacientes" on public.perfil for update to authenticated using (((( SELECT mi_rol() AS mi_rol) = 'medico'::text) AND medico_atiende(id))) with check (((( SELECT mi_rol() AS mi_rol) = 'medico'::text) AND medico_atiende(id)));

create policy "perfil: medicoAdmin actualiza perfiles" on public.perfil for update to authenticated using ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text)) with check ((( SELECT mi_rol() AS mi_rol) = 'medicoAdmin'::text));

create policy "perfil: self select" on public.perfil for select to public using ((id = auth.uid()));

create policy "pregunta: lectura publica autenticada" on public.pregunta for select to public using (true);

create policy "pregunta: medico gestiona" on public.pregunta for all to public using ((EXISTS ( SELECT 1
   FROM perfil p
  WHERE ((p.id = auth.uid()) AND (p.rol = 'medico'::text))))) with check ((EXISTS ( SELECT 1
   FROM perfil p
  WHERE ((p.id = auth.uid()) AND (p.rol = 'medico'::text)))));

create policy "resp_enc: medico lee de sus citas" on public.respuesta_encuesta for select to public using ((EXISTS ( SELECT 1
   FROM cita c
  WHERE ((c.id = respuesta_encuesta.cita_id) AND (c.medico_id = auth.uid())))));

create policy "resp_enc: paciente inserta" on public.respuesta_encuesta for insert to public with check (((paciente_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM cita c
  WHERE ((c.id = respuesta_encuesta.cita_id) AND (c.paciente_id = auth.uid()))))));

create policy "resp_enc: paciente lee propias" on public.respuesta_encuesta for select to public using ((paciente_id = auth.uid()));

create policy "resp_preg: medico lee de sus citas" on public.respuesta_pregunta for select to public using ((EXISTS ( SELECT 1
   FROM (respuesta_encuesta re
     JOIN cita c ON ((c.id = re.cita_id)))
  WHERE ((re.id = respuesta_pregunta.respuesta_encuesta_id) AND (c.medico_id = auth.uid())))));

create policy "resp_preg: paciente inserta" on public.respuesta_pregunta for insert to public with check ((EXISTS ( SELECT 1
   FROM respuesta_encuesta re
  WHERE ((re.id = respuesta_pregunta.respuesta_encuesta_id) AND (re.paciente_id = auth.uid())))));

create policy "resp_preg: paciente lee propias" on public.respuesta_pregunta for select to public using ((EXISTS ( SELECT 1
   FROM respuesta_encuesta re
  WHERE ((re.id = respuesta_pregunta.respuesta_encuesta_id) AND (re.paciente_id = auth.uid())))));

create policy "sesion vigente" on public.actividad_sospechosa as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.alergia as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.alertas_enviadas as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.antecedente as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.archivo_clinico as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.audit_log as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.cita as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.codigo_verificacion as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.consulta as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.desbloqueo_tokens as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.diagnostico as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.encuesta as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.examen as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.fechas_sin_atencion as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.horarios_medico as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.perfil as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.pregunta as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.receta as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.receta_item as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.recordatorio_queue as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.reset_tokens as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.respuesta_encuesta as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.respuesta_pregunta as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.resultado_examen as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "sesion vigente" on public.signos_vitales as restrictive for all to authenticated using (( SELECT sesion_vigente() AS sesion_vigente)) with check (( SELECT sesion_vigente() AS sesion_vigente));

create policy "terminos: lectura con sesion" on public.terminos for select to authenticated using (( SELECT sesion_existe() AS sesion_existe));

create policy "ver propio perfil" on public.perfil for select to public using ((id = auth.uid()));

create policy p_cita_medico_see on public.cita for select to public using ((medico_id = auth.uid()));

create policy p_cita_paciente_see on public.cita for select to public using ((paciente_id = auth.uid()));

CREATE TRIGGER audit_encadenar_trg BEFORE INSERT ON public.audit_log FOR EACH ROW EXECUTE FUNCTION audit_encadenar();

CREATE TRIGGER audit_no_modificar BEFORE DELETE OR UPDATE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION audit_inmutable();

CREATE TRIGGER audit_no_truncar BEFORE TRUNCATE ON public.audit_log FOR EACH STATEMENT EXECUTE FUNCTION audit_inmutable();

CREATE TRIGGER comunicacion_sin_borrado BEFORE DELETE ON public.incidente_comunicacion FOR EACH ROW EXECUTE FUNCTION sin_borrado();

CREATE TRIGGER consentimiento_no_truncate BEFORE TRUNCATE ON public.consentimiento FOR EACH STATEMENT EXECUTE FUNCTION solo_agregar();

CREATE TRIGGER consentimiento_solo_agregar BEFORE DELETE OR UPDATE ON public.consentimiento FOR EACH ROW EXECUTE FUNCTION solo_agregar();

CREATE TRIGGER escalamiento_sin_borrado BEFORE DELETE ON public.escalamiento FOR EACH ROW EXECUTE FUNCTION sin_borrado();

CREATE TRIGGER incidente_nota_solo_agregar BEFORE DELETE OR UPDATE ON public.incidente_nota FOR EACH ROW EXECUTE FUNCTION solo_agregar();

CREATE TRIGGER incidente_sin_borrado BEFORE DELETE ON public.incidente FOR EACH ROW EXECUTE FUNCTION sin_borrado();

CREATE TRIGGER reporte_evento_sin_borrado BEFORE DELETE ON public.reporte_evento FOR EACH ROW EXECUTE FUNCTION sin_borrado();

CREATE TRIGGER trg_audit_aceptacion_terminos AFTER INSERT OR DELETE OR UPDATE ON public.aceptacion_terminos FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_alergia AFTER INSERT OR DELETE OR UPDATE ON public.alergia FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_antecedente AFTER INSERT OR DELETE OR UPDATE ON public.antecedente FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_archivo_clinico AFTER INSERT OR DELETE OR UPDATE ON public.archivo_clinico FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_cita AFTER INSERT OR DELETE OR UPDATE ON public.cita FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_consentimiento AFTER INSERT ON public.consentimiento FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_consulta AFTER INSERT OR DELETE OR UPDATE ON public.consulta FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_diagnostico AFTER INSERT OR DELETE OR UPDATE ON public.diagnostico FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_escalamiento AFTER INSERT OR UPDATE ON public.escalamiento FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_examen AFTER INSERT OR DELETE OR UPDATE ON public.examen FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_fechas_sin_atencion AFTER INSERT OR DELETE OR UPDATE ON public.fechas_sin_atencion FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_horarios_medico AFTER INSERT OR DELETE OR UPDATE ON public.horarios_medico FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_incidente AFTER INSERT OR UPDATE ON public.incidente FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_incidente_comunicacion AFTER INSERT OR UPDATE ON public.incidente_comunicacion FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_perfil AFTER INSERT OR DELETE OR UPDATE ON public.perfil FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_receta AFTER INSERT OR DELETE OR UPDATE ON public.receta FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_receta_item AFTER INSERT OR DELETE OR UPDATE ON public.receta_item FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_reporte_evento AFTER INSERT OR UPDATE ON public.reporte_evento FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_resultado_examen AFTER INSERT OR DELETE OR UPDATE ON public.resultado_examen FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_signos_vitales AFTER INSERT OR DELETE OR UPDATE ON public.signos_vitales FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_solicitud_derechos AFTER INSERT OR UPDATE ON public.solicitud_derechos FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_audit_terminos AFTER INSERT OR DELETE OR UPDATE ON public.terminos FOR EACH ROW EXECUTE FUNCTION fn_audit();

CREATE TRIGGER trg_espejo_auditoria AFTER INSERT ON public.actividad_sospechosa FOR EACH ROW EXECUTE FUNCTION espejo_actividad_auditoria();

CREATE TRIGGER trg_notificar_cita_cancelada AFTER UPDATE ON public.cita FOR EACH ROW EXECUTE FUNCTION fn_notificar_cita_cancelada();

CREATE TRIGGER trg_notificar_cita_programada AFTER INSERT ON public.cita FOR EACH ROW WHEN ((new.estado = 'programada'::estado_cita)) EXECUTE FUNCTION fn_notificar_cita_programada();

CREATE TRIGGER trg_perfil_proteger_columnas BEFORE UPDATE ON public.perfil FOR EACH ROW EXECUTE FUNCTION perfil_proteger_columnas();

CREATE TRIGGER trigger_alerta_bloqueo AFTER INSERT ON public.actividad_sospechosa FOR EACH ROW WHEN ((new.tipo = 'bloqueo'::text)) EXECUTE FUNCTION enviar_alerta_bloqueo();

CREATE TRIGGER trigger_bloqueo_codigos AFTER INSERT ON public.actividad_sospechosa FOR EACH ROW WHEN ((new.tipo = ANY (ARRAY['codigo_incorrecto'::text, 'contrasena_incorrecta'::text]))) EXECUTE FUNCTION bloquear_por_codigos();

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.aceptacion_terminos to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.aceptacion_terminos to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.actividad_sospechosa to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.actividad_sospechosa to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.alergia to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.alergia to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.alertas_enviadas to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.alertas_enviadas to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.antecedente to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.antecedente to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.archivo_clinico to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.archivo_clinico to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.cita to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.cita to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.codigo_verificacion to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.codigo_verificacion to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.consulta to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.consulta to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.desbloqueo_tokens to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.desbloqueo_tokens to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.diagnostico to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.diagnostico to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.encuesta to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.encuesta to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.examen to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.examen to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.fechas_sin_atencion to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.fechas_sin_atencion to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.horarios_medico to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.horarios_medico to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.perfil to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.perfil to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.pregunta to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.pregunta to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.receta to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.receta to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.receta_item to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.receta_item to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.recordatorio_queue to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.recordatorio_queue to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.reset_tokens to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.reset_tokens to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.respaldo_incidente to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.respaldo_incidente to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.respaldo_prueba_restauracion to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.respaldo_prueba_restauracion to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.respaldo_registro to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.respaldo_registro to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.respuesta_encuesta to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.respuesta_encuesta to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.respuesta_pregunta to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.respuesta_pregunta to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.resultado_examen to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.resultado_examen to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.sesion_actividad to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.sesion_actividad to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.signos_vitales to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.signos_vitales to authenticated;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.terminos to anon;

grant DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on public.terminos to authenticated;

grant INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER on public.audit_log to anon;

grant INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER on public.audit_log to authenticated;

grant SELECT on public.alerta_seguridad to authenticated;

grant SELECT on public.consentimiento to authenticated;

grant SELECT on public.consentimiento_catalogo to anon;

grant SELECT on public.consentimiento_catalogo to authenticated;

grant SELECT on public.escalamiento to authenticated;

grant SELECT on public.incidente to authenticated;

grant SELECT on public.incidente_afectada to authenticated;

grant SELECT on public.incidente_categoria to authenticated;

grant SELECT on public.incidente_comunicacion to authenticated;

grant SELECT on public.incidente_nota to authenticated;

grant SELECT on public.informe_incidentes to authenticated;

grant SELECT on public.reporte_evento to authenticated;

grant SELECT on public.solicitud_derechos to authenticated;

revoke all on public.aceptacion_terminos from anon, authenticated;

revoke all on public.actividad_sospechosa from anon, authenticated;

revoke all on public.alergia from anon, authenticated;

revoke all on public.alerta_seguridad from anon, authenticated;

revoke all on public.alertas_enviadas from anon, authenticated;

revoke all on public.antecedente from anon, authenticated;

revoke all on public.archivo_clinico from anon, authenticated;

revoke all on public.audit_cabeza from anon, authenticated;

revoke all on public.audit_log from anon, authenticated;

revoke all on public.bloqueo_origen from anon, authenticated;

revoke all on public.cita from anon, authenticated;

revoke all on public.clave_historial from anon, authenticated;

revoke all on public.codigo_verificacion from anon, authenticated;

revoke all on public.consentimiento from anon, authenticated;

revoke all on public.consentimiento_catalogo from anon, authenticated;

revoke all on public.consulta from anon, authenticated;

revoke all on public.desbloqueo_tokens from anon, authenticated;

revoke all on public.diagnostico from anon, authenticated;

revoke all on public.dispositivo_conocido from anon, authenticated;

revoke all on public.encuesta from anon, authenticated;

revoke all on public.escalamiento from anon, authenticated;

revoke all on public.examen from anon, authenticated;

revoke all on public.fechas_sin_atencion from anon, authenticated;

revoke all on public.geoip_cache from anon, authenticated;

revoke all on public.habilitacion_exterior from anon, authenticated;

revoke all on public.horarios_medico from anon, authenticated;

revoke all on public.incidente from anon, authenticated;

revoke all on public.incidente_afectada from anon, authenticated;

revoke all on public.incidente_categoria from anon, authenticated;

revoke all on public.incidente_comunicacion from anon, authenticated;

revoke all on public.incidente_nota from anon, authenticated;

revoke all on public.informe_incidentes from anon, authenticated;

revoke all on public.intento_ingreso_fallido from anon, authenticated;

revoke all on public.perfil from anon, authenticated;

revoke all on public.pregunta from anon, authenticated;

revoke all on public.receta from anon, authenticated;

revoke all on public.receta_item from anon, authenticated;

revoke all on public.recordatorio_queue from anon, authenticated;

revoke all on public.reporte_evento from anon, authenticated;

revoke all on public.reset_tokens from anon, authenticated;

revoke all on public.respaldo_config from anon, authenticated;

revoke all on public.respaldo_incidente from anon, authenticated;

revoke all on public.respaldo_prueba_restauracion from anon, authenticated;

revoke all on public.respaldo_registro from anon, authenticated;

revoke all on public.respuesta_encuesta from anon, authenticated;

revoke all on public.respuesta_pregunta from anon, authenticated;

revoke all on public.restriccion_cuenta from anon, authenticated;

revoke all on public.resultado_examen from anon, authenticated;

revoke all on public.seguridad_recordatorio from anon, authenticated;

revoke all on public.sesion_actividad from anon, authenticated;

revoke all on public.signos_vitales from anon, authenticated;

revoke all on public.solicitud_derechos from anon, authenticated;

revoke all on public.terminos from anon, authenticated;

select cron.schedule('escalamiento-vigilancia', '*/5 * * * *', 'select public.vigilar_escalamientos()');

select cron.schedule('incidentes-diario', '0 12 * * *', 'select public.vigilar_incidentes_diario()');

select cron.schedule('informe-incidentes-mensual', '0 13 1 * *', 'select public.enviar_informe_mensual_auto()');

select cron.schedule('limpiar-cron-log', '0 3 * * *', 'delete from cron.job_run_details where end_time < now() - interval ''3 days''');

select cron.schedule('limpiar-deteccion', '25 3 * * *', '
  delete from public.intento_ingreso_fallido where creado_en < now() - interval ''7 days'';
  delete from public.geoip_cache where consultado_en < now() - interval ''30 days'';
  delete from public.bloqueo_origen where hasta < now() - interval ''1 day'';
');

select cron.schedule('limpiar-sesion-actividad', '15 3 * * *', 'delete from public.sesion_actividad where ultima_actividad < now() - interval ''2 days''');

select cron.schedule('recordatorio_citas', '*/5 * * * *', '
    select
      net.http_post(
        url := ''https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/recordatorio-citas'',
        headers := jsonb_build_object(
          ''Content-Type'', ''application/json''
        ),
        body := ''{}''::jsonb
      );
    ');

select cron.schedule('respaldo-config-semanal', '20 3 * * 0', 'select net.http_post(url := ''https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/respaldo'', headers := jsonb_build_object(''Content-Type'',''application/json'',''x-cron-token'', ''__TOKEN_DE_RESPALDO__''), body := jsonb_build_object(''accion'',''respaldar'',''tipo'',''config''), timeout_milliseconds := 120000)');

select cron.schedule('respaldo-diario', '30 2 * * *', 'select net.http_post(url := ''https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/respaldo'', headers := jsonb_build_object(''Content-Type'',''application/json'',''x-cron-token'', ''__TOKEN_DE_RESPALDO__''), body := jsonb_build_object(''accion'',''respaldar'',''tipo'',''diario''), timeout_milliseconds := 120000)');

select cron.schedule('respaldo-horario', '5 * * * *', 'select net.http_post(url := ''https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/respaldo'', headers := jsonb_build_object(''Content-Type'',''application/json'',''x-cron-token'', ''__TOKEN_DE_RESPALDO__''), body := jsonb_build_object(''accion'',''respaldar'',''tipo'',''horario''), timeout_milliseconds := 120000)');

select cron.schedule('respaldo-prueba-restauracion', '40 3 * * 0', 'select net.http_post(url := ''https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/respaldo'', headers := jsonb_build_object(''Content-Type'',''application/json'',''x-cron-token'', ''__TOKEN_DE_RESPALDO__''), body := jsonb_build_object(''accion'',''probar_restauracion''), timeout_milliseconds := 120000)');

select cron.schedule('respaldo-vigilancia', '*/30 * * * *', 'select public.vigilar_respaldos()');

insert into storage.buckets (id, name, public) values ('respaldos', 'respaldos', false) on conflict (id) do nothing;
