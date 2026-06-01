# Esquema de Base de Datos — TRIVIUM

> Supabase / PostgreSQL · Actualizado Mayo 2026

---

## Catálogos

| Tabla | Descripción |
|-------|-------------|
| `pais` | Países (id, nombre, codigo_iso) |
| `ciudad` | Ciudades → `pais` |
| `comuna` | Comunas → `ciudad` |
| `institucion_educativa` | Colegios / universidades → `ciudad` |
| `eps` | Entidades Promotoras de Salud |
| `ips` | Instituciones Prestadoras de Salud → `eps`, `ciudad` |

---

## Seguridad y Usuarios

| Tabla | Descripción |
|-------|-------------|
| `rol` | Roles del sistema. id=1 ADMIN, id=2 NAHUAL, id=3 ACOMPAÑANTE, id=4 VALIENTE |
| `permiso` | Permisos granulares por módulo |
| `rol_permiso` | Relación N:M rol ↔ permiso |
| `usuario_sistema` | Usuarios de la app (uuid, vinculado a `auth.users`) |
| `usuario_rol` | Relación N:M usuario ↔ rol |

---

## Valiente (entidad central)

| Tabla | Descripción |
|-------|-------------|
| `valiente` | Datos base: documento, nombres, fecha nacimiento, contacto, estado (ACTIVO/INACTIVO/EGRESADO) |
| `valiente_ubicacion` | Dirección, ciudad, comuna, estrato. PK = `valiente_id` |
| `valiente_salud` | EPS, IPS, alergias, discapacidad, medicamentos, contacto emergencia. PK = `valiente_id` |
| `valiente_educacion` | Nivel, institución, grado, materias. PK = `valiente_id` |
| `valiente_contexto_familiar` | Composición hogar, ingresos, etnia, conflicto armado. PK = `valiente_id` |
| `valiente_perfil_deportivo` | Disciplina, tallas, experiencia previa, horarios. Solo TRIBU. PK = `valiente_id` |
| `valiente_perfil_soroca` | `macro` (Soñar/Romper/Cambiar/Mundo Cotidiano), símbolo, habilidades. Solo SOROCA. PK = `valiente_id` |

---

## Acudientes

| Tabla | Descripción |
|-------|-------------|
| `acudiente` | Datos del acudiente (nombre, documento, celular, autorización) |
| `valiente_acudiente` | Vínculo valiente ↔ acudiente con parentesco, es_principal, es_contacto_emergencia |

---

## Programas

| Tabla | Descripción |
|-------|-------------|
| `programa` | TRIBU / SOROCA (codigo, nombre, tipo, esta_activo) |
| `valiente_programa` | Inscripción del valiente a un programa: fecha ingreso/egreso, estado, nivel, motivación, compromisos, transformaciones_subjetivas |

---

## Acompañamiento (Nahual)

| Tabla | Descripción |
|-------|-------------|
| `acompanamiento` | Registro de sesiones de acompañamiento psicosocial. Nahual (rol_id=2) → Valiente |

### Columnas de `acompanamiento`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | bigint PK | Auto-incremental |
| `valiente_id` | bigint FK → `valiente` | Valiente acompañado |
| `nahual_id` | uuid FK → `usuario_sistema` | Nahual que realiza el acompañamiento |
| `fecha` | date | Fecha de la sesión |
| `lugar` | varchar | Lugar (ej. "TRIBU", "SOROCA", dirección) |
| `motivo_tema` | text | Motivo o tema del acompañamiento |
| `nota` | text | Nota narrativa del Nahual |
| `compromisos_acuerdos` | text | Compromisos, acuerdos y tareas pactados |
| `fecha_proximo_encuentro` | date | Fecha del próximo encuentro |
| `created_at` | timestamp | Fecha de creación del registro |
| `updated_at` | timestamp | Última actualización |

---

## Historial y Documentos

| Tabla | Descripción |
|-------|-------------|
| `historial_valiente` | Eventos importantes del valiente (tipo, categoría, descripción, fecha) |
| `valiente_documento` | Archivos subidos a Storage (identidad, EPS, consentimiento) |

---

## Asistencia

| Tabla | Descripción |
|-------|-------------|
| `evento` | Eventos/entrenamientos (nombre, fecha, hora, programa) |
| `asistencia` | Registro de asistencia valiente ↔ evento (Presente/Ausente/Justificado) |

---

## Diagrama simplificado

```
usuario_sistema ──┬── usuario_rol ── rol
                  │
                  └── acompanamiento ──┐
                                       │
valiente ──────────────────────────────┤
    ├── valiente_ubicacion             │
    ├── valiente_salud                 │
    ├── valiente_educacion             │
    ├── valiente_contexto_familiar     │
    ├── valiente_perfil_deportivo      │
    ├── valiente_perfil_soroca         │
    ├── valiente_acudiente ── acudiente│
    ├── valiente_programa ── programa  │
    ├── historial_valiente             │
    ├── valiente_documento             │
    └── asistencia ── evento           │
                                       │
        (nahual_id FK) ────────────────┘
```
