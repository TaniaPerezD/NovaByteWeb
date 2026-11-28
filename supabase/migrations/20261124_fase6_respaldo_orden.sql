-- Fase 6 (hallazgo de la verificación): el respaldo horario fallaba porque leía cada tabla ordenando por «id» y las tablas
-- nuevas de la Fase 3 (bloqueo_origen, restriccion_cuenta, etc.) tienen otra clave. Ahora cada tabla se ordena por su clave primaria real.
create or replace function public.columnas_orden_respaldo(p_tabla text)
returns text[] language sql stable security definer set search_path = public, pg_catalog as $$
  select coalesce(
    (select array_agg(a.attname::text order by k.ord)
       from pg_index i
       join lateral unnest(i.indkey) with ordinality as k(attnum, ord) on true
       join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
      where i.indrelid = ('public.' || quote_ident(p_tabla))::regclass and i.indisprimary),
    (select array_agg(attname::text order by attnum) from pg_attribute
      where attrelid = ('public.' || quote_ident(p_tabla))::regclass and attnum > 0 and not attisdropped)
  );
$$;
revoke all on function public.columnas_orden_respaldo(text) from public, anon, authenticated;
grant execute on function public.columnas_orden_respaldo(text) to service_role;
