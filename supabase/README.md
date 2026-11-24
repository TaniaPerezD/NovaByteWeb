# Backend de NovaByte (Supabase)

Todo lo que hace falta para reconstruir el backend está en esta carpeta (NB-POL-P3-08, NB-POL-P5-12).

| Carpeta | Contenido |
|---|---|
| `migrations/` | Cambios por fase, en orden de fecha. Se aplican a producción con `apply_migration`. |
| `esquema/esquema_actual.sql` | Foto completa del esquema de producción (tablas, funciones, permisos, RLS, disparadores, tareas cron). Sin datos. |
| `esquema/datos_de_referencia.sql` | Datos que la app necesita para funcionar: términos vigentes, catálogo de consentimientos, categorías de incidentes. |
| `functions/` | Funciones Edge (código fuente desplegado). |

## Reglas de trabajo
1. Todo cambio de base se escribe como migración en `migrations/` **antes** de aplicarse a producción.
2. Después de aplicar una migración se regenera `esquema/esquema_actual.sql`.
3. Primero se prueba en desarrollo, luego se pasa a producción y a `main`.
4. Los secretos (clave SMTP, `RESPALDO_CLAVE`, llaves `sb_secret`, token de Telegram) **nunca** van en git. Solo en los secretos del proyecto Supabase y en archivos `*.local.txt`.
5. En desarrollo solo se usan cuentas y datos ficticios.

## Crear el ambiente de desarrollo
Proyecto vacío recomendado: «prueba-app». Antes, en su panel: **Database → Extensions → pg_cron y pg_net**.

```bash
cd scripts && npm install pg
DATABASE_URL_DEV='postgresql://postgres:<clave>@db.<ref>.supabase.co:5432/postgres' node crear-ambiente-desarrollo.js
```

El script se niega a correr contra producción, no pisa tablas ajenas y deshace todo si algo falla. Reemplaza solo el token de respaldo y la referencia del proyecto.

Pasos manuales después:
1. **Authentication → Hooks → Custom Access Token** → función `public.hook_exigir_2fa`. Si pide permiso: `grant execute on function public.hook_exigir_2fa(jsonb) to supabase_auth_admin;`.
2. Desplegar funciones: `supabase functions deploy <nombre> --project-ref <ref>`.
3. Secretos de las funciones (con datos de prueba): `SMTP_USER`, `SMTP_PASS`, `RESPALDO_CLAVE` (distinta a producción), `DIRECTOR_EMAIL`, `SUPLENTE_EMAIL`, `DIRECTOR_EMAIL_2`, `ALERTA_EMAIL`.
4. En `portal-innovacion/.env` apuntar `REACT_APP_SUPABASE_URL` y `REACT_APP_SUPABASE_ANON_KEY` al proyecto de desarrollo.

## Funciones Edge
En git: `login-step1`, `login-step2`, `signup`, `signup-medico`, `forgot-password`, `reset-password`, `solicitar-desbloqueo`, `notificar-alerta`, `enviar-alerta`, `incidentes-correo`.
`smtp.ts` es el mismo archivo en cada función que envía correo (se copia, no se comparte).

Desplegadas en producción y **aún sin código en git**: `respaldo`, `confirmar-desbloqueo`, `recordatorio-citas`, `notificar_cita_programada`, `notificar_cita_cancelada`, `check-activity`, `telegram-bot`. Para traerlas:

```bash
supabase functions download <nombre> --project-ref nvfhmlfbocdiczpxgidu
```

## Limitaciones conocidas
- La auditoría de lecturas se registra desde la app; una lectura directa a la API con sesión válida queda frenada por RLS pero no aparece como «lectura:» en la bitácora.
- El cambio directo de contraseña por GoTrue (sesión autenticada) no pasa por el historial de 5 claves; el flujo oficial es el enlace de recuperación.
