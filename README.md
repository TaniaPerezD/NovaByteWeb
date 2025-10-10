

Equipo y Proyecto

Equipo: NovaByte

Rol	Nombre(s)	Responsabilidades
Scrum Master	(por definir)	Facilitar el proceso Scrum, coordinar reuniones y eliminar obstáculos.
Product Owner	(por definir)	Representar las necesidades del cliente, priorizar el Product Backlog y aprobar entregas.
Desarrolladores	(por definir)	Implementar las funcionalidades del sistema, integrar módulos y asegurar el cumplimiento de requerimientos.
QAs	(por definir)	Diseñar y ejecutar pruebas, validar cada incremento del producto y garantizar la calidad final.


⸻

Proyecto

El proyecto FemCare tiene como objetivo desarrollar un Sistema Web de Gestión Ginecológica que permita optimizar la administración de citas médicas, historiales clínicos y comunicación entre pacientes y médicos mediante recordatorios automáticos por Telegram.
El sistema busca reducir errores administrativos, mejorar la atención y ofrecer una experiencia digital accesible, moderna y segura para los usuarios.

⸻

Normas del Equipo
	•	Comunicación:
Se emplean Telegram y Google Meet para reuniones y coordinación general, así como GitHub para la comunicación técnica mediante issues y pull requests.
	•	Reuniones:
Se celebran reuniones semanales de Sprint Planning, Daily Scrum, Sprint Review y Sprint Retrospective según el calendario definido al inicio del proyecto.
	•	Resolución de Conflictos:
Los conflictos se abordan de forma constructiva en reuniones de equipo, priorizando la transparencia y el consenso.
	•	Entrega de Trabajo:
Cada integrante debe cumplir los plazos establecidos en el cronograma de sprints y garantizar que cada tarea cumpla la definición de “Hecho”, es decir:
	•	Código funcional y probado.
	•	Documentación técnica actualizada.
	•	Revisión de código completada.

⸻

Herramientas de desarrollo y gestor de base de datos

Herramientas de Desarrollo

El entorno de desarrollo de FemCare está diseñado para garantizar productividad, colaboración y escalabilidad.
	•	Frontend: React + Vite + Bootstrap + SweetAlert2
Framework moderno para el desarrollo de interfaces dinámicas, reactivas y responsivas.
Estructura modular: components/, pages/, services/, hooks/ y utils/.
	•	Backend / Servicios: Supabase
Proporciona una base de datos PostgreSQL con autenticación, almacenamiento y funciones Edge.
Permite conexión directa con React mediante SDK oficial y políticas RLS para seguridad de datos.
	•	Control de Versiones: Git y GitHub
	•	Gestión de Proyecto: Trello o Jira
Organización de sprints mediante tablero Kanban con etiquetas de prioridad (To Do, Doing, Done).
Validación del comportamiento del sistema y documentación clara de la API.
	•	Despliegue: Vercel y Supabase Hosting
Vercel para frontend con CI/CD automático; Supabase aloja la base de datos y servicios en la nube.

⸻

Gestor de Base de Datos

El gestor elegido es Supabase, basado en PostgreSQL, que combina robustez relacional con facilidad de administración en la nube.
Ofrece autenticación integrada, API REST automática y soporte en tiempo real.



Tablas Principales:

Tabla	Descripción
usuario	Contiene la información general de todos los usuarios (médicos, pacientes, administradores).
paciente	Datos personales y antecedentes médicos.
cita	Información de reservas, horarios y estado.
consulta	Detalles clínicos de la atención médica.
encuesta	Registro de encuestas de satisfacción.
notificacion	Historial de recordatorios enviados por Telegram o correo.


⸻

Arquitectura del Sistema

El sistema sigue una arquitectura Cliente–Servidor bajo un enfoque modular:
	•	Frontend: React en Vercel
	•	Backend: Supabase (Auth, Database, Storage, Edge Functions)
	•	Bot: Telegram Bot API para agendamiento y recordatorios


