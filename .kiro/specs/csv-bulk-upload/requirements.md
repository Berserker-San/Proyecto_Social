# Documento de Requisitos

## Introducción

Esta funcionalidad agrega una capacidad de carga masiva de CSV a la aplicación web Proyecto Social (TRIVIUM). Permite a los administradores autenticados cargar un archivo `.csv` formateado según el esquema BBDD CARACTERIZACIÓN SOCIODEMOGRÁFICA SOROCA, analizar todos los registros, insertarlos en las tablas `valientes` y `guardians` de Supabase, y visualizar inmediatamente los participantes recién agregados en una vista de resultados post-carga.

## Glosario

- **CSV_Uploader**: El componente de UI que acepta un archivo `.csv` del usuario e inicia el pipeline de carga.
- **CSV_Parser**: El módulo del lado del cliente responsable de leer y transformar el texto CSV sin procesar en objetos `Valiente` estructurados.
- **Upload_Pipeline**: El proceso de extremo a extremo desde la selección del archivo hasta el análisis, validación, deduplicación e inserción en la base de datos.
- **Batch_Inserter**: La capa de servicio responsable de insertar los registros analizados en Supabase en lotes.
- **Results_Viewer**: El componente de UI que muestra la lista de valientes recién agregados después de que se completa una carga.
- **Valiente**: Un registro de participante almacenado en la tabla `valientes`. La clave primaria es `id` (character varying, generado como slug o UUID). El campo `document_id` (character varying) contiene el número de documento nacional y tiene una restricción UNIQUE — es el campo utilizado para la deduplicación.
- **Guardian**: Un registro de acudiente/tutor almacenado en la tabla `guardians`. Su clave primaria es `id` (integer, auto-incremento). Está vinculado a un Valiente mediante `valiente_id` (character varying, FK → `valientes.id`).
- **Document_ID**: La columna `document_id` en la tabla `valientes`. NO es la clave primaria pero tiene una restricción UNIQUE y es el campo canónico para la detección de duplicados.
- **Valiente_ID**: La columna `id` en la tabla `valientes` (character varying). Es la clave primaria y debe generarse (p. ej., slug derivado del nombre + documento, o UUID) antes de la inserción porque la columna no es auto-incremento.
- **Upload_Report**: Un objeto resumen producido después de una carga, que contiene conteos de registros insertados, omitidos y fallidos junto con detalles de error por fila.

---

## Referencia de Mapeo de Columnas

Las columnas del CSV del exportado Excel de la BBDD CARACTERIZACIÓN SOCIODEMOGRÁFICA SOROCA se mapean a las siguientes columnas de la tabla `valientes`:

| Columna CSV (encabezado aproximado) | Columna `valientes` | noas |
|---|---|---|
| Nombres | first_name | Requerido |
| Apellidos | last_name | Requerido |
| Nombre completo | full_name | Derivado o explícito |
| Apodo / Nickname | nickname | |
| Sexo | sex | |
| Identidad de género | gender_identity | |
| Fecha de nacimiento | birth_date | Requerido |
| Lugar de nacimiento | place_of_birth | |
| Nacionalidad | nationality | |
| Edad | age | |
| Tipo de documento | doc_type | |
| Número de documento | document_id | Requerido; UNIQUE — usado para deduplicación |
| Ciudad | city | |
| Barrio | neighborhood | |
| Comuna | commune | |
| Estrato | stratum | |
| Dirección | address | |
| Teléfono | phone | |
| Correo electrónico | email | |
| Redes sociales | social_media | |
| Programas | programs | jsonb |
| Macro SOROCA | soroca_macro | |
| Símbolo SOROCA | soroca_symbol | |
| Disciplina | discipline | |
| Nivel tribu | tribu_level | |
| Vinculación | linkage | |
| Cohorte | cohort | |
| Estado | status | |
| Nivel de escolaridad | schooling_level | |
| Institución educativa | institution | |
| Programa académico | academic_program | |
| Materia favorita | favorite_subject | |
| Materia difícil | hard_subject | |
| Trabaja | is_working | boolean |
| Descripción trabajo | work_description | |
| Otras responsabilidades | other_responsibilities | |
| Actividades extracurriculares | extracurriculars | |
| Pasatiempos | hobbies | |
| Intereses de carrera | career_interests | |
| EPS | eps | |
| IPS | ips | |
| Tipo de sangre | blood_type | |
| Tiene discapacidad | has_disability | boolean |
| Tipo de discapacidad | disability_type | |
| Diagnóstico médico | medical_diagnosis | |
| Tiene alergias | has_allergies | boolean |
| Tipo de alergia | allergy_type | |
| Tratamiento en curso | ongoing_treatment | |
| Flags médicos | medical_flags | jsonb |
| Medicamentos | medications | |
| Contacto de emergencia | emergency_contact | |
| Composición familiar | family_composition | |
| Tamaño del hogar | household_size | |
| Ingreso mensual | monthly_income | |
| Víctima del conflicto | is_conflict_victim | boolean |
| En RUV | is_in_ruv | boolean |
| Etnia | ethnicity | |
| Factores protectores | protective_factors | |
| Factores de riesgo | risk_factors | |
| Antecedentes rugby | rugby_background | |
| Talla camisa | shirt_size | |
| Talla zapatos | shoes_size | |
| Motivación | motivation | |
| Horario de entrenamiento | training_schedule | jsonb |
| Tasa de asistencia | attendance_rate | |
| Insignias | badges | jsonb |

Las columnas de Guardian del CSV se mapean a la tabla `guardians`:

| Columna CSV (encabezado aproximado) | Columna `guardians` | noas |
|---|---|---|
| Nombre acudiente | full_name | |
| Tipo doc acudiente | doc_type | |
| Número doc acudiente | doc_id | |
| Teléfono acudiente | phone | |
| Género acudiente | gender | |
| Edad acudiente | age | |
| Parentesco | kinship | |
| Trabaja acudiente | is_working | boolean |
| Ocupación | occupation | |
| Tipo de trabajo | job_type | |
| Grupo de vulnerabilidad | vulnerability_group | |
| Autorización firmada | has_auth_signed | boolean |

---

## Requisitos

### Requisito 1: Selección y Validación de Archivo

**Historia de Usuario:** Como administrador, quiero seleccionar y validar un archivo CSV antes de cargarlo, para poder detectar errores de formato de forma temprana sin desperdiciar una operación de base de datos.

#### Criterios de Aceptación

1. THE CSV_Uploader debería aceptar únicamente archivos con extensión `.csv` mediante un elemento de entrada de archivo.
2. Cuando se selecciona un archivo con una extensión distinta a `.csv`, THE CSV_Uploader debería mostrar un mensaje de error indicando que el tipo de archivo no es compatible y debería no proceder al análisis.
3. Cuando se selecciona un archivo `.csv` de más de 5 MB, THE CSV_Uploader debería mostrar un mensaje de error indicando que el archivo supera el límite de tamaño y debería no proceder al análisis.
4. Cuando se selecciona un archivo `.csv` válido, THE CSV_Uploader debería mostrar el nombre y tamaño del archivo al usuario antes de que comience la carga.
5. THE CSV_Uploader debería proporcionar una zona de arrastrar y soltar como alternativa al botón de entrada de archivo.

---

### Requisito 2: Análisis del CSV

**Historia de Usuario:** Como administrador, quiero que el sistema analice el archivo CSV en registros estructurados, para que cada fila se mapee correctamente a un Valiente y un Guardian en la base de datos.

#### Criterios de Aceptación

1. Cuando se proporciona un archivo `.csv` válido, THE CSV_Parser debería analizar cada fila en un objeto `Valiente` usando el mapeo de columnas definido en la sección Referencia de Mapeo de Columnas de este documento.
2. THE CSV_Parser debería tratar la primera fila del archivo como fila de encabezado y debería no intentar insertarla como registro de datos.
3. Cuando una fila no contiene alguno de los campos requeridos (`first_name`, `last_name`, `birth_date`, `document_id`), THE CSV_Parser debería marcar esa fila como inválida y debería incluir un error descriptivo en el Upload_Report.
4. Cuando una fila contiene un valor `birth_date` que no puede interpretarse como una fecha válida, THE CSV_Parser debería marcar esa fila como inválida y debería registrar el error de análisis.
5. THE CSV_Parser debería mapear las columnas de Guardian de la fila CSV en un objeto `Guardian` vinculado al Valiente correspondiente mediante el `Valiente_ID` generado.
6. Para todos los archivos CSV válidos, analizar y luego re-serializar los registros analizados de vuelta a formato CSV y luego analizarlos nuevamente debería producir un conjunto equivalente de registros (propiedad de ida y vuelta).

---

### Requisito 3: Detección de Duplicados

**Historia de Usuario:** Como administrador, quiero que el sistema omita los registros que ya existen en la base de datos, para no crear entradas duplicadas de valientes.

#### Criterios de Aceptación

1. BEFORE insertar un registro analizado, THE Batch_Inserter debería verificar si ya existe un Valiente con el mismo `document_id` en la tabla `valientes`, usando la restricción UNIQUE de esa columna.
2. Cuando se detecta un `document_id` duplicado, THE Batch_Inserter debería omitir ese registro y debería agregarlo al conteo de "omitidos" en el Upload_Report.
3. Cuando aparecen valores `document_id` duplicados dentro del mismo archivo CSV, THE Batch_Inserter debería insertar únicamente la primera ocurrencia y debería omitir los duplicados posteriores.
4. THE Upload_Report debería listar el valor `document_id` y el número de fila de cada registro duplicado omitido.

---

### Requisito 4: Inserción en la Base de Datos

**Historia de Usuario:** Como administrador, quiero que todos los registros válidos y no duplicados se inserten en la base de datos, para que los nuevos participantes estén disponibles en el sistema inmediatamente después de la carga.

#### Criterios de Aceptación

1. BEFORE insertar un registro Valiente, THE Batch_Inserter debería generar un valor `id` único (character varying) para la clave primaria `valientes.id`, usando un slug derivado de `first_name`, `last_name` y `document_id`, o un UUID si el slug no puede hacerse único.
2. Cuando hay registros válidos y no duplicados disponibles después del análisis, THE Batch_Inserter debería insertarlos en la tabla `valientes` de Supabase usando los patrones existentes de `valientesService`.
3. THE Batch_Inserter debería insertar registros en lotes de máximo 50 filas por solicitud a Supabase para evitar límites de tamaño de solicitud.
4. Cuando hay un objeto `Guardian` presente para un Valiente, THE Batch_Inserter debería insertar el Guardian en la tabla `guardians` con `is_primary = true` y el `valiente_id` establecido al `Valiente_ID` generado del Valiente correspondiente.
5. IF ocurre un error de inserción en Supabase para una fila específica, THEN THE Batch_Inserter debería registrar esa fila en el Upload_Report como fallida y debería continuar procesando las filas restantes.
6. IF ocurre un error de inserción en Supabase para un lote completo, THEN THE Batch_Inserter debería registrar todas las filas de ese lote como fallidas y debería continuar con el siguiente lote.
7. Cuando se han procesado todos los lotes, THE Batch_Inserter debería producir un Upload_Report final que contenga el total de registros insertados, omitidos y fallidos.

---

### Requisito 5: Retroalimentación de Progreso de Carga

**Historia de Usuario:** Como administrador, quiero ver el progreso en tiempo real durante la carga, para saber que el sistema está funcionando y poder estimar cuánto tiempo tomará.

#### Criterios de Aceptación

1. WHILE el Upload_Pipeline está en ejecución, THE CSV_Uploader debería mostrar un indicador de progreso con el número de filas procesadas del total de filas en el archivo.
2. WHILE el Upload_Pipeline está en ejecución, THE CSV_Uploader debería deshabilitar la entrada de archivo y el botón de carga para evitar cargas concurrentes.
3. Cuando el Upload_Pipeline se completa exitosamente, THE CSV_Uploader debería mostrar un resumen de éxito del Upload_Report (conteos de insertados, omitidos y fallidos).
4. IF el Upload_Pipeline falla completamente antes de que se inserte algún registro, THEN THE CSV_Uploader debería mostrar un mensaje de error descriptivo y debería permitir al usuario reintentar.

---

### Requisito 6: Visualización de Resultados Post-Carga

**Historia de Usuario:** Como administrador, quiero ver la lista de personas que acaban de ser agregadas después de la carga, para poder verificar que los datos se cargaron correctamente.

#### Criterios de Aceptación

1. Cuando el Upload_Pipeline se completa con al menos un registro insertado exitosamente, THE Results_Viewer debería mostrar una lista de los valientes recién insertados.
2. THE Results_Viewer debería mostrar, para cada valiente insertado: `full_name` (o `first_name` + `last_name`), `document_id`, asignación de programa (`programs` o `discipline`), y `cohort`.
3. Cuando un usuario hace clic en una fila de valiente en el Results_Viewer, THE Results_Viewer debería navegar a la vista de perfil de ese valiente usando el `id` del valiente (Valiente_ID).
4. THE Results_Viewer debería mostrar el resumen del Upload_Report (insertados, omitidos, fallidos) en la parte superior de la lista de resultados.
5. Cuando el conteo de fallidos en el Upload_Report es mayor que cero, THE Results_Viewer debería mostrar la lista de filas fallidas con su número de fila y razón del error.
6. THE Results_Viewer debería proporcionar un botón "Volver al Directorio" que navegue al usuario a la vista de lista de `valientes`.

---

### Requisito 7: Control de Acceso

**Historia de Usuario:** Como administrador del sistema, quiero que solo los usuarios autenticados puedan acceder a la funcionalidad de carga CSV, para que partes no autorizadas no puedan insertar datos de forma masiva.

#### Criterios de Aceptación

1. WHILE un usuario no está autenticado, THE CSV_Uploader debería no ser accesible ni renderizado.
2. THE CSV_Uploader debería ser accesible desde el layout de navegación existente (componente Layout) como un elemento de menú visible únicamente para usuarios autenticados.
3. Cuando una solicitud no autenticada llega a la capa de inserción de Supabase, THE Batch_Inserter debería recibir un error de RLS de Supabase y debería presentarlo como un Upload_Report fallido en lugar de un fallo silencioso.
