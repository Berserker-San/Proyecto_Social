## Por qué un nuevo esquema

La estructura anterior concentraba toda la información del participante en una sola tabla con más de 60 campos. Esto funcionaba para un MVP inicial, pero generaba problemas concretos:

- Cualquier cambio en un área (salud, educación, ubicación) implicaba modificar una tabla central con riesgo de afectar todo lo demás.
- Era difícil agregar nuevos módulos sin romper la estructura existente.
- Los reportes y consultas se volvían lentos y complejos.

El nuevo esquema normaliza la información en tablas especializadas, cada una con una responsabilidad clara. Esto permite que la herramienta crezca de forma modular: se pueden agregar nuevos módulos (asistencias, LMS, bolsa de empleo) sin tocar el núcleo, y la información se puede consultar, filtrar y reportar de forma eficiente.

---

## Tablas creadas en Supabase

### Núcleo

**`valiente`**
Es la entidad central del sistema. Almacena únicamente la información de identificación y contacto básico del participante. Todas las demás tablas de perfil se relacionan con esta mediante `valiente_id`, lo que permite cargar solo la información necesaria según el contexto.
Campos clave: `tipo_documento`, `numero_documento`, `nombres`, `apellidos`, `fecha_nacimiento`, `sexo`, `identidad_genero`, `celular`, `estado`.

**`acudiente`**
Almacena la información de la persona responsable del valiente. Se diseñó como entidad independiente porque un acudiente puede estar vinculado a más de un valiente (hermanos, por ejemplo), evitando duplicar datos.
Campos clave: `nombre_completo`, `celular`, `parentesco`, `tiene_autorizacion_firmada`.

**`valiente_acudiente`**
Tabla de relación muchos-a-muchos entre `valiente` y `acudiente`. Permite que un valiente tenga varios acudientes y que un acudiente esté vinculado a varios valientes. Registra además el tipo de relación y si es el contacto principal o de emergencia.
Campos clave: `valiente_id`, `acudiente_id`, `parentesco`, `es_principal`, `es_contacto_emergencia`, `vive_con_valiente`.

---

### Perfiles del valiente

Cada tabla de perfil tiene `valiente_id` como clave primaria (relación uno a uno con `valiente`). Se separaron en tablas distintas para que cada módulo sea independiente: se puede consultar o actualizar la información de salud sin tocar la de educación, y viceversa.

**`valiente_salud`**
Información médica del valiente. Se separó del núcleo porque es sensible, puede cambiar con el tiempo, y en el futuro puede requerir permisos de acceso diferenciados.
Campos clave: `tiene_discapacidad`, `tiene_alergias`, `alergias`, `diagnostico_medico`, `medicamentos_actuales`, `contacto_emergencia_nombre`, `contacto_emergencia_telefono`, `eps_id` (FK → `eps`), `ips_id` (FK → `ips`).

**`valiente_ubicacion`**
Dirección y datos geográficos del valiente. Usa claves foráneas hacia los catálogos geográficos para garantizar consistencia en los datos y facilitar reportes por zona.
Campos clave: `direccion`, `ciudad_id` (FK → `ciudad`), `comuna_id` (FK → `comuna`), `barrio_id` (FK → `barrio`), `estrato`.

**`valiente_educacion`**
Información académica actual del valiente. Se separó para poder actualizar el estado educativo sin afectar otros datos del perfil.
Campos clave: `nivel_educativo`, `grado_actual`, `institucion_id` (FK → `institucion_educativa`), `esta_estudiando`.

**`valiente_ocupacion`**
Situación laboral y actividades del valiente. Permite registrar si trabaja, dónde, y sus intereses, lo que es útil para el módulo de bolsa de empleo futuro.
Campos clave: `esta_trabajando`, `lugar_trabajo`, `hobbies`, `intereses_profesionales`.

**`valiente_contexto_familiar`**
Composición del hogar y contexto socioeconómico. Información relevante para el análisis de vulnerabilidad y para los reportes de impacto social de la fundación.
Campos clave: `composicion_familiar`, `numero_personas_hogar`, `ingreso_mensual_hogar`, `es_victima_conflicto`, `etnia`.

**`valiente_perfil_deportivo`**
Perfil específico para el programa TRIBU. Se creó como tabla separada porque solo aplica a un subconjunto de valientes, y mezclarla con el núcleo inflaría innecesariamente la tabla principal.
Campos clave: `disciplina`, `tiene_experiencia_previa`, `talla_camisa`, `talla_guayos`.

**`valiente_perfil_soroca`**
Perfil específico para el programa SOROCA. Misma razón que el perfil deportivo: aplica solo a un subconjunto y tiene campos propios del programa artístico.
Campos clave: `macro`, `simbolo`, `intereses_artisticos`, `habilidades`.

---

### Programas

**`programa`**
Catálogo de programas disponibles (TRIBU, SOROCA, etc.). Centraliza la definición de cada programa para que no se repita en cada inscripción.
Campos clave: `codigo`, `nombre`, `tipo`, `esta_activo`.

**`valiente_programa`**
Inscripción de un valiente a un programa. Permite que un valiente esté en varios programas simultáneamente y registra el historial de participación con fechas de ingreso y egreso.
Campos clave: `valiente_id` (FK → `valiente`), `programa_id` (FK → `programa`), `es_principal`, `fecha_ingreso`, `estado`, `sede`.

---

### Catálogos

**`pais`**, **`ciudad`**, **`comuna`**, **`barrio`**
Jerarquía geográfica para normalizar la ubicación de los valientes. Evita texto libre inconsistente ("Medellín", "medellin", "MDE") y permite filtrar y reportar por zona geográfica con precisión.

**`eps`**, **`ips`**
Catálogos de entidades de salud. Normalizan la información médica y permiten cruzar datos con el sistema de salud si se requiere en el futuro.

**`institucion_educativa`**
Catálogo de colegios y universidades. Permite reportar cuántos valientes asisten a cada institución y facilita alianzas con colegios específicos.

> **Pendiente operacional:** estos catálogos deben poblarse en Supabase antes de que el Registro Completo pueda funcionar correctamente. El Registro Express no los requiere porque no usa selects de catálogo.

---

### Sistema y auditoría

**`rol`**, **`permiso`**, **`rol_permiso`**
Sistema de roles y permisos granulares. Permite definir qué puede ver y hacer cada tipo de usuario (ADMIN, ACOMPAÑANTE, VALIENTE) sin hardcodear lógica de acceso en el frontend.

**`usuario_sistema`**, **`usuario_rol`**
Usuarios internos vinculados a `auth.users` de Supabase con sus roles asignados. Separa la identidad de autenticación (manejada por Supabase Auth) de los datos del usuario dentro del sistema.

**`historial_valiente`**
Registro automático de eventos relevantes del valiente (ingresos, cambios de estado, notas de acompañamiento). Permite tener trazabilidad del proceso de cada participante sin depender de la memoria del equipo.

**`valiente_documento`**
Gestión de archivos adjuntos al perfil del valiente (autorizaciones, documentos de identidad, etc.). Se separó del perfil principal para no mezclar metadatos de archivos con datos del participante.

---

## Servicios implementados

### `valientes.service.ts`
- `crearValiente()` — inserta un nuevo registro en `valiente`.
- `actualizarValiente()` — actualiza campos básicos por ID.
- `getValienteById()` — obtiene el valiente con todos sus perfiles relacionados.
- `buscarValientePorDocumento()` — búsqueda por tipo y número de documento.
- `getValientes()` — lista todos los valientes.

### `acudientes.service.ts`
- `crearAcudiente()` — inserta un nuevo acudiente.
- `vincularAcudiente()` — crea la relación en `valiente_acudiente`.
- `actualizarAcudiente()` — actualiza datos del acudiente.
- `actualizarRelacionAcudiente()` — modifica la relación (parentesco, flags).
- `desvincularAcudiente()` — elimina la relación.

### `perfiles.service.ts`
Usa `upsert` en todas las tablas de perfil (clave primaria `valiente_id`), por lo que sirve tanto para crear como para actualizar.
- `guardarSalud()` / `getSalud()`
- `guardarUbicacion()` / `getUbicacion()`
- `guardarEducacion()` / `getEducacion()`
- `guardarOcupacion()` / `getOcupacion()`
- `guardarContextoFamiliar()` / `getContextoFamiliar()`
- `guardarPerfilDeportivo()` / `getPerfilDeportivo()`
- `guardarPerfilSoroca()` / `getPerfilSoroca()`

### `catalogos.service.ts`
Consultas de solo lectura para poblar selects en formularios.
- `getPaises()`, `getCiudades()`, `getComunas()`, `getBarrios()`
- `getEPS()`, `getIPS()`
- `getInstitucionesEducativas()`

---

## Flujo del Registro Express

Al enviar el formulario se ejecutan 5 pasos en secuencia:

1. `crearValiente()` → inserta en `valiente`, retorna el ID.
2. `crearAcudiente()` → inserta en `acudiente`.
3. `vincularAcudiente(valiente.id, acudiente.id)` → inserta en `valiente_acudiente`.
4. `guardarSalud({ valiente_id })` → inserta en `valiente_salud`.
5. Si el contexto es `TRIBU`: `guardarPerfilDeportivo({ valiente_id })` → inserta en `valiente_perfil_deportivo`.

Si cualquier paso falla, se muestra el error con detalles de Supabase. No hay rollback automático aún (pendiente para una versión futura).
