# Trivium — Sistema de Gestión de Valientes

Aplicación web para el registro y seguimiento de participantes (valientes) en los programas sociales de la fundación.

---

## Stack

- React 18 + TypeScript
- Vite 5
- Supabase (base de datos + auth)
- Lucide React (iconos)
- Recharts (gráficas)

---

## Configuración local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Crear `.env.local` en la raíz con las variables de Supabase:
   ```
   VITE_SUPABASE_URL=tu_url
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   ```

3. Correr en desarrollo:
   ```bash
   npm run dev
   ```

---

## Estado actual

### Funciona
- Login con Supabase Auth.
- Registro Express: captura datos básicos del valiente, acudiente, salud y perfil deportivo, y los guarda en Supabase.
- Navegación entre vistas (Login → Welcome → RegistrationView → ExpressRegistration).
- Estructura de servicios y tipos TypeScript alineada con el esquema de base de datos.

### Pendiente
- Registro Completo (FullRegistration): formulario existe pero no está conectado a Supabase.
- Poblar catálogos en Supabase (ciudades, comunas, EPS, instituciones educativas).
- Módulo de asistencias.
- Dashboard y estadísticas.
- Gestión de usuarios y roles desde la UI.

---

Para el detalle de las tablas creadas y los servicios implementados, ver [`CHANGES_DATA_EXPRESS.md`](./CHANGES_DATA_EXPRESS.md).
