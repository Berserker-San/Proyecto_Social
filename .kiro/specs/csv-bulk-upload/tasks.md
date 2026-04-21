# Plan de Implementación: Carga Masiva de CSV

## Descripción General

Implementación incremental del pipeline de carga masiva de CSV para TRIVIUM. Cada módulo se construye sobre el anterior, terminando con la integración completa en la aplicación.

## Tareas

- [x] 1. Definir tipos base en types.ts
  - [x] 1.1 Agregar interfaces `RowError`, `UploadReport`, `ParseResult` a `types.ts`
    - Definir `RowError { rowNumber, documentId?, reason }`
    - Definir `UploadReport { totalRows, insertedCount, skippedCount, failedCount, skipped[], failed[] }`
    - Definir `ParseResult { valid[], invalid[] }`
    - _Requisitos: 3.4, 4.7, 5.3_

  - [x] 1.2 Agregar interfaces `ParsedValiente` y `ParsedGuardian` a `types.ts`
    - Incluir todos los campos opcionales en snake_case según el diseño
    - `ParsedGuardian` debe incluir `valiente_id` e `is_primary: true`
    - _Requisitos: 2.1, 2.5, 4.4_

- [ ] 2. Implementar utilidades CSV
  - [ ] 2.1 Crear `lib/csv/columnMapper.ts` con la función `mapHeaders` y el mapa `COLUMN_MAP`
    - Implementar función `normalize` (trim, minúsculas, eliminar diacríticos con NFD)
    - Incluir todas las entradas del mapa según el diseño (columnas de valiente y guardian)
    - Exportar `mapHeaders(rawHeaders: string[]): string[]`
    - _Requisitos: 2.1_

  - [ ]* 2.2 Escribir prueba unitaria para `columnMapper`
    - Verificar que encabezados con acentos se mapeen correctamente (ej. `'Número de documento'` → `'document_id'`)
    - Verificar que encabezados de guardian se mapeen con prefijo `guardian_`
    - _Requisitos: 2.1_

  - [ ] 2.3 Crear `lib/csv/idGenerator.ts` con la función `generateValienteId`
    - Construir slug: `{first_name}-{last_name}-{document_id}` en minúsculas, sin caracteres no ASCII
    - Si el slug ya está en `usedIds`, agregar sufijo `crypto.randomUUID().slice(0, 4)`
    - _Requisitos: 4.1_

  - [ ]* 2.4 Escribir prueba de propiedad para `idGenerator`
    - **Propiedad 10: Unicidad de IDs en una sola carga**
    - Generar N valientes con `fc.array(fc.record(...))`, verificar que todos los IDs generados sean distintos
    - **Valida: Requisito 4.1**
    - _Requisitos: 4.1_

  - [ ] 2.5 Crear `lib/csv/csvParser.ts` con la función `parseCSV`
    - Dividir texto CSV en filas, tratar primera fila como encabezado
    - Llamar a `mapHeaders` para normalizar encabezados
    - Por cada fila de datos: construir objeto plano con campos mapeados
    - Convertir booleanos desde cadenas en español (`'si'`, `'sí'`, `'1'`, `'true'` → `true`)
    - Convertir columnas JSONB (separadas por coma o JSON crudo) a arreglos
    - Llamar a `generateValienteId` para asignar `id` a cada valiente
    - Construir `ParsedGuardian` si la fila contiene campos `guardian_*`
    - _Requisitos: 2.1, 2.2, 2.5_

  - [ ] 2.6 Agregar validación de campos requeridos en `csvParser.ts`
    - Marcar fila como inválida si falta `first_name`, `last_name`, `birth_date` o `document_id`
    - Marcar fila como inválida si `birth_date` no puede interpretarse como fecha válida
    - Incluir razón descriptiva en `RowError`
    - _Requisitos: 2.3, 2.4_

  - [ ]* 2.7 Escribir prueba de propiedad: conteo de filas del parser
    - **Propiedad 2: El parser produce un registro por fila de datos**
    - Generar cadenas CSV con N filas de datos; verificar `valid.length + invalid.length === N`
    - **Valida: Requisito 2.2**
    - _Requisitos: 2.2_

  - [ ]* 2.8 Escribir prueba de propiedad: validación de campos requeridos
    - **Propiedad 3: La validación de campos requeridos rechaza filas incompletas**
    - Generar filas con un campo requerido vacío; verificar que aparezcan en `invalid[]`
    - **Valida: Requisitos 2.3, 2.4**
    - _Requisitos: 2.3, 2.4_

  - [ ]* 2.9 Escribir prueba de propiedad: ida y vuelta del mapeo de columnas
    - **Propiedad 4: Ida y vuelta del mapeo de columnas**
    - Generar `ParsedValiente[]`, serializar a CSV, analizar, comparar `document_id`, `first_name`, `last_name`, `birth_date`
    - **Valida: Requisitos 2.1, 2.6**
    - _Requisitos: 2.1, 2.6_

  - [ ]* 2.10 Escribir prueba de propiedad: vínculo con Guardian
    - **Propiedad 5: Corrección del vínculo con Guardian**
    - Generar filas con datos de guardian; verificar `guardian.valiente_id === valiente.id` e `is_primary === true`
    - **Valida: Requisitos 2.5, 4.4**
    - _Requisitos: 2.5, 4.4_

- [ ] 3. Checkpoint — Verificar utilidades CSV
  - Asegurarse de que todos los tests pasen. Consultar al usuario si surgen dudas.

- [ ] 4. Implementar servicio de carga `csvUpload.service.ts`
  - [ ] 4.1 Crear `lib/services/csvUpload.service.ts` con la función `validateFile`
    - Rechazar si la extensión no es `.csv`
    - Rechazar si el tamaño supera 5 MB
    - Devolver `null` si el archivo es válido, o una cadena de error descriptiva
    - _Requisitos: 1.1, 1.2, 1.3_

  - [ ]* 4.2 Escribir prueba de propiedad para `validateFile`
    - **Propiedad 1: La validación de archivos rechaza archivos inválidos**
    - Generar nombres de archivo con extensiones y tamaños aleatorios; verificar aceptar/rechazar
    - **Valida: Requisitos 1.1, 1.2, 1.3**
    - _Requisitos: 1.1, 1.2, 1.3_

  - [ ] 4.3 Implementar verificación previa de duplicados en `csvUpload.service.ts`
    - Extraer todos los `document_id` del CSV en una sola consulta `SELECT ... IN (...)`
    - Detectar duplicados intra-archivo con un `Set<string>` de document_ids vistos
    - Agregar duplicados a `report.skipped` con razón `'Duplicado en archivo'` o `'Ya existe en base de datos'`
    - _Requisitos: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 4.4 Escribir prueba de propiedad: deduplicación contra BD
    - **Propiedad 6: La deduplicación omite document_ids existentes**
    - Generar registros + conjunto de document_ids existentes; verificar que el conjunto omitido sea la intersección
    - **Valida: Requisitos 3.1, 3.2**
    - _Requisitos: 3.1, 3.2_

  - [ ]* 4.5 Escribir prueba de propiedad: duplicados intra-archivo
    - **Propiedad 7: Manejo de duplicados dentro del archivo**
    - Generar registros con document_ids duplicados; verificar que solo se inserte la primera ocurrencia
    - **Valida: Requisitos 3.3, 3.4**
    - _Requisitos: 3.3, 3.4_

  - [ ] 4.6 Implementar bucle de inserción por lotes en `csvUpload.service.ts`
    - Insertar valientes en lotes de máximo 50 filas por solicitud a Supabase
    - Por cada lote exitoso, insertar los guardians correspondientes con `is_primary = true`
    - Si un lote falla, marcar todas sus filas como fallidas y continuar con el siguiente lote
    - Llamar `onProgress(procesados, total)` después de cada lote
    - Devolver `UploadReport` final con conteos de insertados, omitidos y fallidos
    - _Requisitos: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 4.7 Escribir prueba de propiedad: invariante de conservación del reporte
    - **Propiedad 8: Invariante de conservación del reporte de carga**
    - Verificar `insertedCount + skippedCount + failedCount === totalRows` para cualquier ejecución
    - **Valida: Requisito 4.7**
    - _Requisitos: 4.7_

  - [ ]* 4.8 Escribir prueba de propiedad: invariante del tamaño de lote
    - **Propiedad 9: Invariante del tamaño de lote**
    - Generar N registros; contar llamadas insert a Supabase; verificar `Math.ceil(N / 50)`
    - **Valida: Requisito 4.3**
    - _Requisitos: 4.3_

  - [ ]* 4.9 Escribir prueba de propiedad: aislamiento de errores por lote
    - **Propiedad 11: Aislamiento de errores — las filas fallidas no detienen el procesamiento**
    - Simular fallo en un lote intermedio; verificar que los lotes posteriores se procesen
    - **Valida: Requisitos 4.5, 4.6**
    - _Requisitos: 4.5, 4.6_

- [ ] 5. Checkpoint — Verificar servicio de carga
  - Asegurarse de que todos los tests pasen. Consultar al usuario si surgen dudas.

- [ ] 6. Implementar componente `CSVUploader`
  - [ ] 6.1 Crear `components/CSVUploader.tsx` con zona de arrastrar y soltar y selector de archivo
    - Aceptar únicamente archivos `.csv` en el input (`accept=".csv"`)
    - Implementar zona drag-and-drop como alternativa al botón
    - Mostrar nombre y tamaño del archivo seleccionado antes de iniciar la carga
    - Llamar a `validateFile` al seleccionar; mostrar error si falla
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 6.2 Agregar lógica de carga y progreso en `CSVUploader.tsx`
    - Al confirmar carga: leer el archivo como texto, llamar a `parseCSV`, luego `insertBatch`
    - Mostrar indicador de progreso con filas procesadas / total durante la carga
    - Deshabilitar input y botón de carga mientras el pipeline está en ejecución
    - Al completarse, mostrar resumen del `UploadReport` (insertados, omitidos, fallidos)
    - Si el pipeline falla completamente, mostrar mensaje de error y permitir reintento
    - Llamar a `onUploadComplete(report, inserted)` al finalizar
    - _Requisitos: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 6.3 Escribir prueba unitaria para `CSVUploader`
    - Verificar que muestra nombre y tamaño del archivo tras selección
    - Verificar que deshabilita inputs durante la carga
    - Verificar que muestra resumen de éxito al completarse
    - Verificar que no se renderiza cuando `user` es null (barrera de autenticación)
    - _Requisitos: 1.4, 5.1, 5.2, 5.3, 7.1_

- [ ] 7. Implementar componente `ResultsViewer`
  - [ ] 7.1 Crear `components/ResultsViewer.tsx` con resumen del reporte y lista de valientes
    - Mostrar resumen: insertados, omitidos, fallidos en la parte superior
    - Renderizar una fila por valiente insertado con `full_name`, `document_id`, `discipline`/`programs`, `cohort`
    - Cada fila es clicable y llama a `onSelectValiente(valiente.id)`
    - Mostrar sección de filas fallidas (número de fila + razón) solo si `failedCount > 0`
    - Incluir botón "Volver al Directorio" que llama a `onBack()`
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 7.2 Escribir prueba de propiedad: campos del visor de resultados
    - **Propiedad 12: El visor de resultados renderiza todos los valientes insertados con los campos requeridos**
    - Generar `ParsedValiente[]`; renderizar `ResultsViewer`; verificar que cada fila tenga `full_name`, `document_id`, programa y `cohort`
    - **Valida: Requisitos 6.1, 6.2**
    - _Requisitos: 6.1, 6.2_

  - [ ]* 7.3 Escribir prueba de propiedad: visibilidad de filas fallidas
    - **Propiedad 13: Visibilidad de filas fallidas**
    - Generar reportes con `failedCount === 0` y `failedCount > 0`; verificar renderizado condicional
    - **Valida: Requisito 6.5**
    - _Requisitos: 6.5_

  - [ ]* 7.4 Escribir prueba unitaria para `ResultsViewer`
    - Verificar que el botón "Volver al Directorio" llama a `onBack()`
    - Verificar que hacer clic en una fila llama a `onSelectValiente` con el id correcto
    - Verificar que la sección de fallidos se oculta cuando `failedCount === 0`
    - _Requisitos: 6.3, 6.5, 6.6_

- [ ] 8. Integrar en `App.tsx` y `Layout.tsx`
  - [ ] 8.1 Agregar estado y manejadores de carga CSV en `App.tsx`
    - Declarar `uploadReport: UploadReport | null` y `uploadedValientes: ParsedValiente[]` con `useState`
    - Implementar manejador `onUploadComplete` que actualice ambos estados
    - _Requisitos: 6.1, 7.1_

  - [ ] 8.2 Agregar caso `'csv-upload'` en `renderContent()` de `App.tsx`
    - Si `uploadReport` es null, renderizar `<CSVUploader>`
    - Si `uploadReport` existe, renderizar `<ResultsViewer>` con el reporte y los valientes insertados
    - El botón "Volver" debe limpiar `uploadReport` y navegar a `'valientes'`
    - _Requisitos: 6.1, 6.6, 7.2_

  - [ ] 8.3 Agregar ítem de navegación "Carga CSV" en `Layout.tsx`
    - Agregar `{ id: 'csv-upload', label: 'Carga CSV', icon: FileUp }` a `operationalItems`
    - Verificar que el ícono `FileUp` esté importado desde `lucide-react`
    - El ítem solo debe ser visible para usuarios autenticados (ya garantizado por la barrera existente)
    - _Requisitos: 7.1, 7.2_

- [ ] 9. Checkpoint final — Verificar integración completa
  - Asegurarse de que todos los tests pasen. Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints garantizan validación incremental antes de continuar
- Las pruebas de propiedades usan `fast-check` (ya instalado como dependencia de desarrollo)
- Las pruebas unitarias y de propiedades se ubican en `lib/csv/__tests__/` y `components/__tests__/`
