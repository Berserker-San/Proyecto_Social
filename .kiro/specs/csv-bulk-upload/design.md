# Documento de Diseño: Carga Masiva de CSV

## Descripción General

Esta funcionalidad agrega un pipeline de carga masiva de CSV a la aplicación TRIVIUM, permitiendo a los administradores autenticados cargar un archivo `.csv` exportado de la hoja de cálculo BBDD CARACTERIZACIÓN SOCIODEMOGRÁFICA SOROCA, analizar todos los registros, deduplicar contra la base de datos existente, e insertar nuevos registros en Supabase en lotes.

La implementación es completamente del lado del cliente (análisis, validación, verificación previa de duplicados) con Supabase como capa de persistencia. No se requiere nueva infraestructura de backend.

> **Nota de implementación:** La tabla en Supabase se llama `valiente` (singular). Todos los campos usan nombres en español (`nombres`, `apellidos`, `tipo_documento`, `numero_documento`, etc.) tal como están definidos en `src/types/database.types.ts`.

---

## Estrategia de Expansión Progresiva por Fases

La carga CSV se implementa en fases, comenzando por la tabla principal y expandiéndose a las tablas relacionadas. Cada fase es funcional e independiente.

| Fase | Tablas cubiertas | Estado |
|------|-----------------|--------|
| **Fase 1** | `valiente` (tabla principal) | ✅ Implementado |
| **Fase 2** | `acudiente` + `valiente_acudiente` | 🔲 Pendiente |
| **Fase 3** | `valiente_ubicacion` | 🔲 Pendiente |
| **Fase 4** | `valiente_salud` | 🔲 Pendiente |
| **Fase 5** | `valiente_educacion` + `valiente_ocupacion` | 🔲 Pendiente |
| **Fase 6** | `valiente_contexto_familiar` | 🔲 Pendiente |
| **Fase 7** | `valiente_programa` + `valiente_perfil_deportivo` + `valiente_perfil_soroca` | 🔲 Pendiente |

---

## Arquitectura

```
Capa UI       →  CSVUploader   (selección, drag & drop, progreso, reporte)
                 ResultsViewer (lista post-carga) [pendiente]

Capa Lógica   →  csvParser     (texto CSV → ValienteCSVRow[])
                 csvUpload.service (dedup + inserciones por lotes)

Capa de Datos →  Supabase: tabla `valiente` (Fase 1)
                           + tablas relacionadas (Fases 2-7)
```

### Flujo de Datos

```mermaid
sequenceDiagram
    actor Admin
    participant Uploader as CSVUploader
    participant Parser as csvParser
    participant Service as csvUpload.service
    participant DB as Supabase

    Admin->>Uploader: Selecciona / arrastra .csv
    Uploader->>Uploader: validateFile() — ext + tamaño
    Uploader->>Parser: parseCSV(text)
    Parser->>Parser: Detectar separador (; o ,)
    Parser->>Parser: Normalizar encabezados
    Parser->>Parser: Mapear a campos del modelo
    Parser->>Parser: Validar campos requeridos por fila
    Parser-->>Uploader: ParseResult { valid[], invalid[] }
    Uploader->>Service: insertValientesBatch(valid[], onProgress)
    Service->>DB: SELECT numero_documento FROM valiente WHERE numero_documento IN (...)
    DB-->>Service: documentos existentes
    Service->>Service: Filtrar duplicados (BD + intra-archivo)
    loop Cada 50 filas
        Service->>DB: INSERT INTO valiente (lote)
        DB-->>Service: ok | error
        Service->>Uploader: onProgress(procesados, total)
    end
    Service-->>Uploader: UploadReport
```

---

## Archivos Implementados

| Archivo | Responsabilidad |
|---------|----------------|
| `src/lib/csv/csvParser.ts` | Parsea CSV → `ValienteCSVRow[]`, valida campos requeridos, normaliza fechas |
| `src/lib/services/csvUpload.service.ts` | Dedup contra BD + inserción por lotes de 50 |
| `src/components/CSVUploader/CSVUploader.tsx` | UI: drag & drop, progreso, reporte de resultados |
| `src/pages/Layout/Layout.tsx` | Agrega vista `csv-upload` |
| `src/components/Navbar/Navbar.tsx` | Agrega ítem "Carga CSV" en navegación |

---

## Fase 1: Tabla `valiente`

### Campos requeridos en el CSV

| Campo CSV (variantes aceptadas) | Campo en BD |
|--------------------------------|-------------|
| `Nombre(s)`, `Nombres`, `Nombre` | `nombres` |
| `Apellidos`, `Apellido` | `apellidos` |
| `Número de identificación`, `Numero de documento`, `Numero documento` | `numero_documento` |
| `Fecha de nacimiento`, `Fecha nacimiento` | `fecha_nacimiento` |

### Campos opcionales reconocidos

| Campo CSV | Campo en BD | Notas |
|-----------|-------------|-------|
| `Tipo de documento`, `Tipo documento` | `tipo_documento` | Default: `CC` |
| `Apodo`, `Nickname` | `apodo` | |
| `Sexo`, `Sexo biológico` | `sexo` | |
| `Identidad de género`, `Género` | `identidad_genero` | |
| `Celular`, `Teléfono celular` | `celular` | |
| `Teléfono fijo`, `Fijo` | `telefono_fijo` | |
| `Email`, `Correo`, `Correo electrónico` | `email` | |
| `Lugar de nacimiento` | `lugar_nacimiento` | |
| `Nacionalidad` | `nacionalidad` | |
| `Estado` | `estado` | Default: `ACTIVO` |

### Tipo `ValienteCSVRow`

```typescript
// Omite campos auto-generados por la BD
type ValienteCSVRow = Omit<Valiente, 'id' | 'created_at' | 'updated_at' | 'nombre_completo'>;
```

### Normalización de encabezados

El parser normaliza cada encabezado: recorta espacios, convierte a minúsculas y elimina acentos antes de buscar en el mapa de columnas.

```typescript
const normalize = (s: string) =>
  s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
```

Esto permite que `Número de Identificación`, `numero de identificacion` y `NUMERO DE IDENTIFICACION` sean equivalentes.

### Formatos de fecha aceptados

- `YYYY-MM-DD` (ISO)
- `DD/MM/YYYY`
- `DD-MM-YYYY`

### Deduplicación

1. **Contra BD**: una sola query `SELECT numero_documento FROM valiente WHERE numero_documento IN (...)` antes de insertar.
2. **Intra-archivo**: `Set<string>` que rastrea documentos ya vistos en el mismo CSV. La segunda ocurrencia se omite.

---

## Fase 2: `acudiente` + `valiente_acudiente` (Pendiente)

Al completar la Fase 1, el parser se extenderá para leer columnas de acudiente del mismo CSV y crear registros en `acudiente` y `valiente_acudiente`.

### Columnas CSV → `acudiente`

| Campo CSV | Campo en BD |
|-----------|-------------|
| `Nombre acudiente` | `nombre_completo` |
| `Tipo doc acudiente` | `tipo_documento` |
| `Número doc acudiente` | `numero_documento` |
| `Celular acudiente` | `celular` |
| `Sexo acudiente` | `sexo` |
| `Edad acudiente` | `edad` |
| `Ocupación acudiente` | `ocupacion` |
| `Tipo empleo acudiente` | `tipo_empleo` |
| `Grupo vulnerabilidad` | `grupo_vulnerabilidad` |
| `Autorización firmada` | `tiene_autorizacion_firmada` (bool) |

### Columnas CSV → `valiente_acudiente`

| Campo CSV | Campo en BD | Valor por defecto |
|-----------|-------------|-------------------|
| `Parentesco` | `parentesco` | requerido |
| — | `es_principal` | `true` |
| — | `es_contacto_emergencia` | `true` |
| — | `vive_con_valiente` | `false` |

---

## Fase 3: `valiente_ubicacion` (Pendiente)

| Campo CSV | Campo en BD |
|-----------|-------------|
| `Dirección` | `direccion` |
| `Ciudad` | `ciudad_id` (lookup por nombre) |
| `Comuna` | `comuna_id` (lookup por nombre) |
| `Barrio` | `barrio_id` (lookup por nombre) |
| `Estrato` | `estrato` |

> Los campos de ciudad/comuna/barrio requieren lookup contra las tablas de catálogo. Si no se encuentra, se guarda el nombre como texto libre en `direccion`.

---

## Fase 4: `valiente_salud` (Pendiente)

| Campo CSV | Campo en BD |
|-----------|-------------|
| `EPS` | `eps_id` (lookup) |
| `IPS` | `ips_id` (lookup) |
| `Tipo de sangre` | `tipo_sangre` |
| `Tiene discapacidad` | `tiene_discapacidad` (bool) |
| `Tipo discapacidad` | `tipo_discapacidad` |
| `Diagnóstico médico` | `diagnostico_medico` |
| `Tiene alergias` | `tiene_alergias` (bool) |
| `Alergias` | `alergias` |
| `Medicamentos actuales` | `medicamentos_actuales` |
| `Tratamiento en curso` | `tratamiento_en_curso` |
| `Contacto emergencia nombre` | `contacto_emergencia_nombre` |
| `Contacto emergencia teléfono` | `contacto_emergencia_telefono` |
| `Contacto emergencia parentesco` | `contacto_emergencia_parentesco` |

---

## Fase 5: `valiente_educacion` + `valiente_ocupacion` (Pendiente)

### `valiente_educacion`

| Campo CSV | Campo en BD |
|-----------|-------------|
| `Nivel educativo` | `nivel_educativo` |
| `Grado actual` | `grado_actual` |
| `Jornada` | `jornada` |
| `Institución educativa` | `nombre_institucion` |
| `Programa académico` | `programa_academico` |
| `Materia favorita` | `materia_favorita` |
| `Materia difícil` | `materia_dificil` |
| `Está estudiando` | `esta_estudiando` (bool) |

### `valiente_ocupacion`

| Campo CSV | Campo en BD |
|-----------|-------------|
| `Trabaja` | `esta_trabajando` (bool) |
| `Lugar de trabajo` | `lugar_trabajo` |
| `Cargo` | `cargo` |
| `Tipo empleo` | `tipo_empleo` |
| `Otras responsabilidades` | `otras_responsabilidades` |
| `Actividades extracurriculares` | `actividades_extracurriculares` |
| `Hobbies` | `hobbies` |
| `Intereses profesionales` | `intereses_profesionales` |

---

## Fase 6: `valiente_contexto_familiar` (Pendiente)

| Campo CSV | Campo en BD |
|-----------|-------------|
| `Composición familiar` | `composicion_familiar` |
| `Número personas hogar` | `numero_personas_hogar` |
| `Ingreso mensual hogar` | `ingreso_mensual_hogar` |
| `Víctima del conflicto` | `es_victima_conflicto` (bool) |
| `En RUV` | `esta_en_ruv` (bool) |
| `Etnia` | `etnia` |
| `Factores protectores` | `factores_protectores` |
| `Factores de riesgo` | `factores_riesgo` |

---

## Fase 7: Programas y Perfiles (Pendiente)

### `valiente_programa`

| Campo CSV | Campo en BD |
|-----------|-------------|
| `Programa` | `programa_id` (lookup por código) |
| `Cohorte` | `cohorte` |
| `Nivel` | `nivel` |
| `Sede` | `sede` |
| `Estado programa` | `estado` |
| `Fecha ingreso` | `fecha_ingreso` |
| `Motivación` | `motivacion` |

### `valiente_perfil_deportivo`

| Campo CSV | Campo en BD |
|-----------|-------------|
| `Disciplina` | `disciplina` |
| `Experiencia previa` | `tiene_experiencia_previa` (bool) |
| `Talla camisa` | `talla_camisa` |
| `Talla guayos` | `talla_guayos` |
| `Horario entrenamiento` | `horario_entrenamiento` (JSON) |

### `valiente_perfil_soroca`

| Campo CSV | Campo en BD |
|-----------|-------------|
| `Macro SOROCA` | `macro` |
| `Símbolo SOROCA` | `simbolo` |
| `Intereses artísticos` | `intereses_artisticos` |
| `Habilidades` | `habilidades` |

---

## Manejo de Errores

| Escenario | Comportamiento |
|-----------|---------------|
| Archivo no `.csv` | Rechazado antes de parsear |
| Archivo > 5 MB | Rechazado antes de parsear |
| Campos requeridos faltantes | Fila → `invalid[]`, omitida en inserción |
| Fecha inválida | Fila → `invalid[]`, omitida en inserción |
| `numero_documento` duplicado en BD | Fila → `skipped[]`, no insertada |
| `numero_documento` duplicado en archivo | Fila → `skipped[]`, solo se inserta la primera |
| Error de lote en Supabase | Lote completo → `failed[]`, continúa con el siguiente |
| CSV vacío (solo encabezado) | Muestra "No se encontraron registros" |
| Encabezado no reconocido | Columna ignorada silenciosamente |

---

## Reporte de Carga (`UploadReport`)

```typescript
export interface UploadReport {
  totalRows: number;       // filas de datos (sin encabezado)
  insertedCount: number;
  skippedCount: number;    // duplicados
  failedCount: number;
  skipped: RowError[];
  failed: RowError[];
}

export interface RowError {
  rowNumber: number;
  numeroDocumento?: string;
  reason: string;
}
```

Invariante garantizada: `insertedCount + skippedCount + failedCount === totalRows` (sobre filas válidas procesadas).

---

## ResultsViewer (Pendiente)

Componente post-carga que muestra:

```
┌─────────────────────────────────────────────────┐
│  ✅ 42 insertados  ⚠️ 3 omitidos  ❌ 1 fallido  │
├─────────────────────────────────────────────────┤
│  [Errores expandibles si failedCount > 0]        │
├─────────────────────────────────────────────────┤
│  Valientes insertados                            │
│  Juan Pérez  │ TI 1000123456 │ ACTIVO            │
│  Ana García  │ CC 52345678   │ ACTIVO            │
├─────────────────────────────────────────────────┤
│  [Cargar otro archivo]                           │
└─────────────────────────────────────────────────┘
```

Props:
```typescript
interface ResultsViewerProps {
  report: UploadReport;
  insertedValientes: ValienteCSVRow[];
  onBack: () => void;
}
```
