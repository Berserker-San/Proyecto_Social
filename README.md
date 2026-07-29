# TRIVIUM — Sistema de Gestión de Valientes

Plataforma web para el registro, seguimiento y análisis de participantes (**valientes**) en los programas sociales **TRIBU** (deporte) y **SOROCA** (arte y cultura).

Desarrollado como proyecto social universitario para una fundación real. Construido con React + TypeScript sobre Supabase como backend completo.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript 5.8 |
| Build tool | Vite 5 |
| Estilos | Tailwind CSS (utility-first) |
| Iconos | Lucide React |
| Gráficas | Recharts |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Testing | Vitest + Testing Library + fast-check (property-based) |
| Deploy | Vercel |

---

## Módulos del sistema

### Autenticación
- Login con Supabase Auth (email/contraseña)
- Sesiones persistentes con `onAuthStateChange`
- Sistema de roles: ADMIN, NAHUAL, ACOMPAÑANTE, VALIENTE

### Registro de Valientes
- **Registro Express** — formulario rápido con datos esenciales
- **Registro Completo** — formulario multi-paso con más de 60 campos distribuidos en 8 secciones (identidad, salud, educación, ubicación, contexto familiar, acudiente, perfil deportivo/artístico)
- Lógica de upsert: si el valiente ya existe por documento, se actualizan todos sus perfiles sin duplicar
- Resolución dinámica de catálogos (EPS, IPS, instituciones educativas)

### Carga Masiva por CSV
- Componente `CSVUploader` con parser tolerante a errores
- Procesa cada fila de forma independiente y reporta resultados por fila.

### Perfil del Valiente
Vista completa con 8 pestañas de carga diferida:

| Pestaña | Contenido |
|---|---|
| Identidad | Datos personales, contacto, dirección |
| Salud | EPS, alergias, discapacidad, medicamentos |
| Educación | Institución, nivel, grado, materias |
| Entorno | Estrato, comuna, contexto familiar, etnia |
| Red de Apoyo | Acudiente, autorización firmada (toggle), documentos adjuntos |
| El Ser | Hobbies, insignias SOROCA (Ascua/Fuego/Tierra/Agua/Aire), perfil artístico |
| Nahual | Registro de acompañamientos psicosociales con acordeón expandible |
| Historial | Línea de tiempo combinada: eventos de `historial_valiente` + ingresos/egresos de programas |

### Estadísticas
Panel con más de 15 métricas visualizadas con Recharts:
- Distribución por género, rango de edad, estrato
- TRIBU vs SOROCA, disciplina deportiva, macro SOROCA
- Salud y bienestar (discapacidad, alergias, tratamientos)
- Entorno familiar (personas en el hogar, ingresos, conflicto armado, etnia)
- Escolaridad y ocupación
- Cobertura de certificado EPS

### Asistencia
- Creación de eventos y entrenamientos
- Registro de asistencia por valiente (Presente / Ausente / Justificado)

### Administración de Usuarios
- CRUD de usuarios del sistema sin acceder al panel de Supabase
- Asignación de roles
- Cambio de contraseña
- Creación y eliminación a través de Supabase Edge Functions (Deno)

---

## Arquitectura

```
src/
  components/       # Componentes reutilizables (Navbar, CSVUploader, tabs, etc.)
  lib/
    services/       # 12 servicios de acceso a datos (capa de abstracción sobre Supabase)
    hooks/          # useAuth
    utils/          # Helpers de formato
  pages/            # Vistas por módulo (Admin, Attendance, Registration, Statistics, etc.)
  types/            # Interfaces TypeScript sincronizadas con el esquema de Supabase
```

La aplicación sigue una arquitectura de tres capas: componentes React → servicios TypeScript → Supabase. Ningún componente llama directamente al cliente de Supabase.

Las operaciones privilegiadas (crear/eliminar usuarios en Auth) se ejecutan a través de **Supabase Edge Functions** con `service_role`, manteniendo la clave fuera del cliente.

---

## Base de datos

Esquema PostgreSQL con más de 25 tablas relacionales documentadas en [`docs/database-schema.md`](docs/database-schema.md).

Incluye RLS (Row Level Security) por rol de usuario y triggers para generación automática de campos calculados.

---

## Configuración local

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd trivium_fullstack
npm install
```

### 2. Variables de entorno

Crea `.env.local` en la raíz:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_anon_key
```

### 3. Correr en desarrollo

```bash
npm run dev
```

### 4. Build de producción

```bash
npm run build
```

---

## Deploy

El proyecto está desplegado en **Vercel**. Para desplegar en tu propia cuenta:

1. Conecta el repositorio en [vercel.com](https://vercel.com)
2. Agrega las variables de entorno en Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
3. Vercel detecta automáticamente Vite y usa el comando `npm run build`

---

## Tests

```bash
npm run test        # Ejecutar tests
```

Se incluyen pruebas de componentes con Testing Library y pruebas basadas en propiedades con **fast-check** para validar invariantes del sistema.

---

## Requisitos de Node

Node.js >= 20 (especificado en `.nvmrc`)
