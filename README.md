# Proyecto FemCare: Sistema Web de Gestión Ginecológica

---

## Resumen del Proyecto

**FemCare** es un sistema web de gestión ginecológica diseñado para **optimizar la administración** de citas médicas, historiales clínicos y la **comunicación** entre pacientes y médicos. Utiliza **recordatorios automáticos por Telegram** para mejorar la adhesión y reducir errores administrativos. El objetivo es ofrecer una experiencia digital accesible, moderna y segura, mejorando la atención general de los usuarios.

---

## Equipo: NovaByte

| Rol | Nombre(s) | Responsabilidades |
| :--- | :--- | :--- |
| **Scrum Master** | (por definir) | Facilitar el proceso Scrum, coordinar reuniones y eliminar obstáculos. |
| **Product Owner** | (por definir) | Representar las necesidades del cliente, priorizar el *Product Backlog* y aprobar entregas. |
| **Desarrolladores** | (por definir) | Implementar las funcionalidades del sistema, integrar módulos y asegurar el cumplimiento de requerimientos. |
| **QAs** | (por definir) | Diseñar y ejecutar pruebas, validar cada incremento del producto y garantizar la calidad final. |

---

## Herramientas de Desarrollo y Stack Tecnológico

### Frontend
* **Tecnologías:** **React + Vite**
* **Estructura:** Modular.

### Backend / Servicios
* **Plataforma:** **Supabase** (Base de datos PostgreSQL, autenticación, almacenamiento).
* **Conexión:** SDK oficial de Supabase con React, asegurado mediante Políticas de Seguridad a Nivel de Fila (**RLS**).

### Control de Versiones
* **Herramientas:** **Git y GitHub**.

### Gestión de Proyecto
* **Herramienta:** **Trello**.
* **Metodología:** Tablero **Kanban** para la organización de *sprints* con etiquetas de prioridad (**To Do, Doing, Done**).

### Despliegue
* **Frontend:** **Vercel** (Con CI/CD automático).
* **Base de Datos y Servicios:** **Supabase Hosting**.

---

## 🏛️ Arquitectura del Sistema

El sistema sigue una arquitectura **Cliente–Servidor** bajo un enfoque modular, facilitando la escalabilidad y el mantenimiento.

| Componente | Tecnología | Ubicación |
| :--- | :--- | :--- |
| **Frontend** | React | Vercel |
| **Backend** | Supabase (Auth, Database, Storage, Edge Functions) | Supabase Hosting |
| **Bot de Comunicación** | Telegram Bot API | Servicios Aislados |

---


## Normas del Equipo

Estas normas garantizan un flujo de trabajo ágil y colaborativo, esencial para el éxito del proyecto.

### Comunicación
* **General y Reuniones:** **WhatsApp** y **Discord**.

### Resolución de Conflictos
* Los conflictos se abordan de forma **constructiva** en reuniones de equipo, priorizando la **transparencia** y el **consenso**.
