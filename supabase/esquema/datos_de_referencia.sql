-- Datos de referencia: catálogo de consentimientos (NB-CON-P6-03), categorías de incidentes (NB-PRO-P6-11) y términos vigentes.
-- Se cargan después de esquema_actual.sql. Sin ellos la app no puede pedir consentimientos ni aceptar términos.

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

-- Términos y condiciones vigentes (NB-CON-P6-03), versión 1.0. Es un dato de referencia: sin él las pacientes no pueden usar la app.
insert into public.terminos (titulo, version, vigente, contenido) values (
  'Términos y Condiciones de Uso de la App de NovaByte',
  '1.0',
  true,
  $t$Cláusula 1. Partes. Son partes NovaByte, representada por su Director General, y la paciente usuaria, identificada con los datos de su registro.

Cláusula 2. Objeto. NovaByte presta a la paciente el uso de la app y del sistema web para gestionar sus citas, consultar su expediente y sus resultados y enviar imágenes de autoexploración. La inteligencia artificial de NovaByte apoya a la médica o al médico, pero nunca reemplaza su criterio ni emite diagnósticos por sí sola.

Cláusula 3. Clave y bloqueo. La paciente es la única responsable del uso y de la confidencialidad de su clave. Debe no compartirla y avisar de inmediato si cree que otra persona la conoce. La contraseña se bloquea de forma automática después de tres intentos fallidos. Para recuperar el acceso después de ese bloqueo, la paciente usa el enlace de un solo uso que NovaByte envía a su correo registrado. Si la cuenta se bloqueó a pedido de la paciente o por una alerta de seguridad, la paciente usa los canales de la cláusula 5 y debe verificar su identidad.

Cláusula 4. Operaciones permitidas. La paciente puede: agendar, reprogramar y cancelar citas; ver su expediente y sus resultados; enviar imágenes de autoexploración; actualizar sus datos de contacto; ver «Mi actividad»; y pedir el bloqueo de su cuenta. La paciente no puede acceder a información de otras personas.

Cláusula 5. Horario y alternativa. La app y el sistema web están disponibles todos los días, durante las 24 horas, salvo mantenimientos que NovaByte avisa en la app. Si el servicio no está disponible, la paciente puede llamar a la línea del consultorio en su horario, asistir al consultorio o usar el bloqueo de cuenta de la app si esta funciona. El canal de comunicación y bloqueo está descrito en NB-PRO-P6-05.

Cláusula 6. Medidas de seguridad de NovaByte. NovaByte cifra la información que viaja entre la app y sus sistemas, exige dos factores de verificación para ver información clínica, registra cada acción, detecta usos sospechosos y mantiene un canal para bloquear la cuenta. Las medidas se describen en NB-POL-P6-01 y NB-POL-P6-02.

Cláusula 7. Validez de las operaciones. Las acciones hechas con la clave y los factores de la paciente se consideran hechas por ella. NovaByte guarda un registro con fecha y hora de cada acción y devuelve un acuse de recepción firmado, de modo que ni la paciente ni NovaByte puedan negar que la acción ocurrió. NovaByte además controla que cada paciente solo vea su propia información.

Cláusula 8. Límites de uso. Para proteger la cuenta, NovaByte limita el número de descargas de documentos por día, el tamaño y la cantidad de archivos por envío y el acceso desde fuera del país, según NB-POL-P6-06. La paciente puede pedir que se ajuste el límite avisando con anticipación.

Cláusula 9. Detección y bloqueo automatizado. NovaByte puede bloquear de forma automática y temporal una cuenta si detecta una actividad sospechosa. Avisará a la paciente por su correo o teléfono registrados y le indicará cómo recuperar el acceso.

Cláusula 10. Datos personales. NovaByte trata los datos de la paciente según NB-POL-P6-04 y solo con su consentimiento informado, que la paciente puede retirar.

Cláusula 11. Confidencialidad. NovaByte mantiene la confidencialidad de la información de la paciente. La paciente no divulgará los medios de acceso ni usará la app para obtener información ajena.

Cláusula 12. Uso indebido. Si la paciente usa la app de forma indebida, NovaByte puede suspender o cancelar su cuenta, sin perjuicio de su atención médica en el consultorio.

Cláusula 13. Cambios. NovaByte puede actualizar estos términos. Avisa en la app antes de que rijan y pide una nueva aceptación. La versión vigente y las anteriores se conservan.

Cláusula 14. Vigencia y terminación. El contrato rige mientras la cuenta esté activa. La paciente puede cerrar su cuenta cuando quiera. NovaByte la cierra por uso indebido o si la paciente lo pide. El cierre no borra el expediente clínico, que se conserva según NB-POL-P5-13. Las partes se someten a las leyes del Estado Plurinacional de Bolivia y a los tribunales competentes del lugar donde NovaByte tiene su consultorio.$t$
) on conflict do nothing;
