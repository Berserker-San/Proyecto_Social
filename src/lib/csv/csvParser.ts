// =========================================================
// CSV PARSER - mapea columnas del CSV al modelo Valiente
// Parseo por nombre de encabezado, no por indice de columna
// Permite agregar, quitar o reordenar columnas sin romper el mapeo
// =========================================================

import type {
  Valiente,
  ValienteUbicacion,
  ValienteSalud,
  ValienteEducacion,
  ValienteContextoFamiliar,
  Acudiente,
} from '../../types/database.types';

// =========================================================
// TIPOS EXPORTADOS
// =========================================================

export type ValienteCSVRow = Omit<
  Valiente,
  'id' | 'created_at' | 'updated_at' | 'nombre_completo' | 'lugar_nacimiento_ciudad_id'
>;

export type UbicacionCSVRow = Omit<
  ValienteUbicacion,
  'valiente_id' | 'updated_at' | 'ciudad_id' | 'comuna_id' | 'barrio_id' | 'latitud' | 'longitud'
> & {
  ciudad_nombre: string | null;
  barrio_nombre: string | null;
  comuna_numero: string | null;  // numero de comuna del CSV, se resuelve a ID en el servicio
};

export type SaludCSVRow = Omit<
  ValienteSalud,
  'valiente_id' | 'updated_at' | 'eps_id' | 'ips_id'
> & {
  eps_nombre: string | null;
};

export type EducacionCSVRow = Omit<
  ValienteEducacion,
  'valiente_id' | 'updated_at' | 'institucion_id'
> & {
  institucion_nombre: string | null;  // texto para resolver a ID en el servicio
};

export type ContextoFamiliarCSVRow = Omit<
  ValienteContextoFamiliar,
  'valiente_id' | 'updated_at'
>;

export type AcudienteCSVRow = Omit<
  Acudiente,
  'id' | 'created_at' | 'updated_at'
> & {
  // Campos adicionales que vienen del CSV pero no estan en la tabla acudiente
  sexo: string | null;
  edad: number | null;
  ocupacion: string | null;
  tipo_empleo: string | null;
  grupo_vulnerabilidad: string | null;
};

export type ValienteAcudienteCSVRow = {
  parentesco: string;
  es_principal: boolean;
  es_contacto_emergencia: boolean;
  vive_con_valiente: boolean;
};

export type ValienteProgramaCSVRow = {
  programa_codigo: string;  // 'TRIBU' o 'SOROCA'
  tipo_programa: string;    // 'Rugby', 'Ultimate', 'Mundo Cotidiano', 'Soñar', 'Romper', 'Cambiar'
};

export type ValientePerfilDeportivoCSVRow = {
  disciplina: string | null;           // 'Rugby' o 'Ultimate'
  talla_guayos: string | null;
  talla_camisa: string | null;
  talla_pantalon: string | null;
};

export type ValienteDocumentoCSVRow = {
  documento_identidad_url: string | null;
  eps_url: string | null;
  consentimiento_url: string | null;
};

export interface ParsedRow {
  valiente: ValienteCSVRow;
  ubicacion: UbicacionCSVRow;
  salud: SaludCSVRow;
  educacion: EducacionCSVRow;
  contexto_familiar: ContextoFamiliarCSVRow;
  acudiente: AcudienteCSVRow | null;
  valiente_acudiente: ValienteAcudienteCSVRow | null;
  programa: ValienteProgramaCSVRow;
  perfil_deportivo: ValientePerfilDeportivoCSVRow | null;
  documentos: ValienteDocumentoCSVRow;
}

export interface RowError {
  rowNumber: number;
  numeroDocumento?: string;
  reason: string;
}

export interface ParseResult {
  valid: ParsedRow[];
  invalid: RowError[];
}

// =========================================================
// COLUMNAS DEL CSV
// =========================================================

type ColumnRef = string | readonly string[];
type HeaderIndex = Record<string, number[]>;

export const CSV_COLUMNS = {
  programa: 'Programa',
  tipo: 'Tipo',
  tallaGuayos: 'Talla Guayos',
  tallaCamiseta: 'Talla Camiseta',

  nivelEducativo: 'Nivel en el que te encuentras actualmente:',
  nombres: 'Nombre(s)',
  apellidos: 'Apellidos',
  apodo: 'Apodo',
  genero: 'Género',
  fechaNacimiento: 'Fecha de nacimiento',
  lugarNacimiento: 'Lugar de nacimiento',
  nacionalidad: 'NACIONALIDAD',
  edad: 'Edad',
  tipoDocumentoValiente: [
    'Tipo de documento de identificación',
    'Tipo de documento',
  ],
  numeroDocumentoValiente: [
    'Número de identificación (sin comas ni puntos)',
    'Número de identificación',
  ],

  ciudad: 'Ciudad en la que vive',
  barrio: 'Barrio o corregimiento donde vive',
  comuna: 'Comuna',
  estrato: 'Estrato socioeconómico',
  direccion: 'Dirección',
  telefono: 'Número de teléfono',
  email: 'Email',

  escolaridad: 'Escolaridad (grado o programa que estés cursando actualmente)',
  colegio: 'Colegio en el que estudia (o estudió para los de Mundo cotidiano)',
  colegioOtra: 'Si tu respuesta anterior fue otra, indica cuál colegio:',
  programaPregrado: 'En el caso de que estés cursando un programa de pregrado universitario o programa técnico o tecnológico ¿cuál?',
  institucionEducativa: 'En el caso de que estés cursando un programa de pregrado universitario o programa técnico o tecnológico ¿En qué institución educativa?',
  materiaFavorita: '¿Qué temática o curso del colegio o institución universitaria disfrutas más?',
  materiaDificil: '¿Qué temática o curso del colegio o institución universitaria es más difícil para ti?',
  responsabilidadEspecial: '¿Tienes alguna responsabilidad especial diferente al estudio?',
  organizaciones: '¿Perteneces a alguna organización, equipos o clubes dentro y fuera de la Institución educativa? (diferente a Soroca) ¿Cuáles?',
  hobbies: '¿Qué te gusta hacer en tu tiempo libre? (además de pasar tiempo con tus amistades)',
  trabaja: '¿Actualmente, te encuentras trabajando?',
  laboresTrabajo: 'En caso de haber respondido afirmativamente en la respuesta anterior, escribe qué labores desempeñas, dónde y hace cuánto',
  carrerasInteres: '¿Qué carreras/profesiones/oficios te interesaría que podrías estudiar/aprender? (si ya lo estás estudiando puedes responder "lo estoy haciendo")',

  afiliadoEps: '¿Estás actualmente afiliado a EPS?',
  eps: 'Nombre de la EPS',
  epsOtra: 'En caso de haber respondido OTRA en la respuesta anterior, indique el nombre de la EPS',
  ipsUrgencias: 'Nombre de la IPS donde es atendido/a por urgencias',
  certificadoEps: 'Adjunta certificado EPS',
  tipoSangre: 'Tipo de sangre',
  presentaDiscapacidad: '¿Presenta alguna discapacidad?',
  tipoDiscapacidad: 'En caso de haber respondido afirmativamente la respuesta anterior, seleccione ¿Cuál?',
  cuentaDiagnostico: '¿Cuenta con algún diagnóstico médico de enfermedad, discapacidad, limitación o tratamiento?',
  diagnostico: 'En caso de haber respondido afirmativamente en la respuesta anterior, ¿Cuál?',
  tieneAlergia: '¿Tiene alguna alergia?',
  alergias: 'En caso de haber respondido afirmativamente en la respuesta anterior, ¿a qué reaccionas con alergia?',
  tratamiento: '¿Se encuentra en tratamiento médico y/o farmacológico? Descríbalo',

  composicionFamiliar: 'Composición familiar (¿Con quiénes vives en tu casa?)',
  numeroPersonasHogar: '¿Cuántas personas viven en tu casa? incluyéndote',
  ingresoMensualHogar: 'Ingresos Familiares mensuales   (salario mínimo vigente a 2025 $1.423.000)',
  victimaConflicto: '¿Fuiste víctima del conflicto armado?',
  inscritoRuv: '¿Te encuentras inscrito/a en el Registro Único de Víctimas?',
  etnia: '¿Con qué etnia te identificas?',
  familiaBuscaEmpleo: '¿Alguien de tu familia/red de apoyo primario están buscando empleo?',
  recomendacionCompromisoValle: 'La Fundación Ser para Ser, al ser aliada de Compromiso Valle, tiene la posiblidad de recomendar . En caso de responder a la anterior pregunta si. Bríndanos su nombre, parentesco y número de contacto.',

  nombreAcudiente: 'Nombres  y apellidos de tu acudiente principal',
  tipoDocumentoAcudiente: 'Tipo de documento de identidad',
  numeroDocumentoAcudiente: 'Número de documento de identidad (sin comas ni puntos)',
  telefonoAcudiente: 'Número de teléfono 2',
  generoAcudiente: 'Género 2',
  parentescoAcudiente: 'Parentesco',
  edadAcudiente: 'Edad 2',
  trabajaAcudiente: '¿Trabaja actualmente?',
  laborAcudiente: '¿Qué labor desempeña?',
  tipoVinculacionAcudiente: 'Tipo de vinculación laboral',
  grupoPoblacionalAcudiente: '¿Con qué grupo poblacional te identificas?',

  nombreAcudienteSecundario: 'Nombres  y apellidos',
  tipoDocumentoAcudienteSecundario: 'Tipo de documento de identidad 2',
  numeroDocumentoAcudienteSecundario: 'Número de documento de identidad (sin comas ni puntos) 2',
  edadAcudienteSecundario: 'Edad 3',
  telefonoAcudienteSecundario: 'Número de teléfono 3',
  generoAcudienteSecundario: 'Género 3',
  parentescoAcudienteSecundario: 'Parentesco  2',
  trabajaAcudienteSecundario: '¿Trabaja actualmente? 2',
  laborAcudienteSecundario: '¿Qué labor desempeña? 2',
  tipoVinculacionAcudienteSecundario: 'Tipo de vinculación laboral  2',
  grupoPoblacionalAcudienteSecundario: '¿Con qué grupo poblacional te identificas? 2',

  autorizacionFirmada: 'Se tiene la autorización firmada por el acudiente en documento físico',
  parentescoAutorizacion: 'Parentesco  3',
  regimenAfiliacion: 'Régimen de afiliación',
  nacionalidad2: 'Nacionalidad2',
  nacionalidadOtra: 'En el caso de que hayas respondido otra en la pregunta anterior, indique ¿cuál?',
  idDocumentoDrive: 'ID. DOCUMENTO SUBIDO DRIVE',
  epsSubidoDrive: 'EPS. SUBIDO AL DRIVE',
  consentimientoSubidoDrive: 'CONSENTIMIENTO SUBIDO AL DRIVE',
} as const;

// =========================================================
// HELPERS DE MAPEO DE VALORES
// =========================================================

function mapTipoDocumento(raw: string): string {
  const v = raw.trim();
  if (v === 'Cédula de Ciudadanía' || v === 'Cedula de Ciudadania') return 'CC';
  if (v === 'Tarjeta de Identidad') return 'TI';
  if (v === 'Cédula de Extranjería' || v === 'Cedula de Extranjeria') return 'CE';
  if (v === 'Pasaporte') return 'PASAPORTE';
  return 'CC';
}

function mapRegimenEps(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (v === 'contributivo') return 'CONTRIBUTIVO';
  if (v === 'subsidiado')   return 'SUBSIDIADO';
  if (v === 'especial')     return 'ESPECIAL';
  return null;
}

function mapSexo(raw: string): string | null {  const v = raw.trim();
  if (v === 'Masculino') return 'MASCULINO';
  if (v === 'Femenino') return 'FEMENINO';
  if (v === 'Intersexual') return 'INTERSEXUAL';
  return null;
}

function mapNivelEducativo(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (v === 'Universitario') return 'UNIVERSITARIO';
  if (v === 'Técnico/Tecnológico' || v === 'Tecnico/Tecnologico') return 'TÉCNICO';
  if (v === 'Media') return 'BACHILLERATO';
  if (v === 'Primaria') return 'PRIMARIA';
  return v;
}

function mapBool(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === 'sí' || v === 'si';
}

function parseInteger(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;

  const parsed = parseInt(v, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function cleanDocument(raw: string): string {
  return raw.replace(/[.,]/g, '').trim();
}

// =========================================================
// PARSEO DE FECHA
// =========================================================

export function parseDate(raw: string): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();

  // Ya esta en formato ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY o DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Intentar con Date nativo como ultimo recurso
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

// =========================================================
// SPLIT CSV LINE
// =========================================================

export function splitCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // Maneja comillas escapadas dentro de un campo: "" -> "
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  result.push(current);
  return result;
}

// =========================================================
// NORMALIZACION Y LECTURA DE COLUMNAS
// =========================================================

function normalize(s: string): string {
  return s
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function columnNames(column: ColumnRef): readonly string[] {
  return typeof column === 'string' ? [column] : column;
}

function buildHeaderIndex(headers: string[]): HeaderIndex {
  const headerIndex: HeaderIndex = {};

  headers.forEach((header, idx) => {
    const key = normalize(header);
    if (!key) return;

    if (!headerIndex[key]) {
      headerIndex[key] = [];
    }

    headerIndex[key].push(idx);
  });

  return headerIndex;
}

function getHeaderIndexes(headerIndex: HeaderIndex, column: ColumnRef): number[] {
  for (const name of columnNames(column)) {
    const indexes = headerIndex[normalize(name)];
    if (indexes?.length) {
      return indexes;
    }
  }

  return [];
}

function hasHeader(headerIndex: HeaderIndex, column: ColumnRef): boolean {
  return getHeaderIndexes(headerIndex, column).length > 0;
}

function columnDisplayName(column: ColumnRef): string {
  return columnNames(column)[0] ?? '';
}

function valueAt(cols: string[], idx: number | undefined): string {
  if (idx === undefined || idx < 0) return '';
  return cols[idx]?.trim() ?? '';
}

function getColumnValue(
  cols: string[],
  headerIndex: HeaderIndex,
  column: ColumnRef,
  occurrence = 0,
): string {
  const idx = getHeaderIndexes(headerIndex, column)[occurrence];
  return valueAt(cols, idx);
}

function getColumnValueAfter(
  cols: string[],
  headerIndex: HeaderIndex,
  column: ColumnRef,
  afterColumn: ColumnRef,
  fallbackOccurrence = 0,
): string {
  const afterIdx = getHeaderIndexes(headerIndex, afterColumn)[0];
  const indexes = getHeaderIndexes(headerIndex, column);

  const idx = afterIdx === undefined
    ? indexes[fallbackOccurrence]
    : indexes.find(candidate => candidate > afterIdx) ?? indexes[fallbackOccurrence];

  return valueAt(cols, idx);
}

// =========================================================
// PARSER PRINCIPAL
// =========================================================

export function generateCSVTemplate(): Blob {
  const headers = Object.values(CSV_COLUMNS).flat();
  const headerRow = headers.map(h => `"${h}"`).join(',');
  const emptyRow = headers.map(() => '').join(',');
  const csv = `${headerRow}\n${emptyRow}`;
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

export function parseCSV(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return { valid: [], invalid: [] };

  // Detectar separador: punto y coma o coma
  const separator = lines[0].includes(';') ? ';' : ',';

  // Construir mapa de encabezados normalizados a indices.
  // Guarda todos los indices para soportar encabezados repetidos, por ejemplo: Email.
  const rawHeaders = splitCSVLine(lines[0], separator);
  const headerIndex = buildHeaderIndex(rawHeaders);

  const requiredHeaders: ColumnRef[] = [
    CSV_COLUMNS.nombres,
    CSV_COLUMNS.apellidos,
    CSV_COLUMNS.numeroDocumentoValiente,
    CSV_COLUMNS.fechaNacimiento,
  ];

  const missingHeaders = requiredHeaders
    .filter(column => !hasHeader(headerIndex, column))
    .map(columnDisplayName);

  if (missingHeaders.length > 0) {
    return {
      valid: [],
      invalid: [{
        rowNumber: 1,
        reason: `Encabezados requeridos faltantes: ${missingHeaders.join(', ')}`,
      }],
    };
  }

  const valid: ParsedRow[] = [];
  const invalid: RowError[] = [];

  // Saltar la fila de encabezados, fila 0, y parsear desde la fila 1
  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const cols = splitCSVLine(lines[i], separator);

    const h = (column: ColumnRef, occurrence = 0): string =>
      getColumnValue(cols, headerIndex, column, occurrence);

    const hAfter = (column: ColumnRef, afterColumn: ColumnRef, fallbackOccurrence = 0): string =>
      getColumnValueAfter(cols, headerIndex, column, afterColumn, fallbackOccurrence);

    // Validar campos requeridos
    const nombres = h(CSV_COLUMNS.nombres);
    const apellidos = h(CSV_COLUMNS.apellidos);
    const numeroDocumento = cleanDocument(h(CSV_COLUMNS.numeroDocumentoValiente));
    const rawFecha = h(CSV_COLUMNS.fechaNacimiento);

    const missing: string[] = [];
    if (!nombres) missing.push('nombres');
    if (!apellidos) missing.push('apellidos');
    if (!numeroDocumento) missing.push('numero_documento');
    if (!rawFecha) missing.push('fecha_nacimiento');

    if (missing.length > 0) {
      invalid.push({
        rowNumber,
        numeroDocumento: numeroDocumento || undefined,
        reason: `Campos requeridos faltantes: ${missing.join(', ')}`,
      });
      continue;
    }

    const fechaParsed = parseDate(rawFecha);
    if (!fechaParsed) {
      invalid.push({
        rowNumber,
        numeroDocumento,
        reason: `Fecha de nacimiento inválida: "${rawFecha}"`,
      });
      continue;
    }

    // PROGRAMA Y PERFIL DEPORTIVO
    const programaRaw = h(CSV_COLUMNS.programa);
    const tipoRaw = h(CSV_COLUMNS.tipo);
    const tallaGuayos = h(CSV_COLUMNS.tallaGuayos);
    const tallaCamiseta = h(CSV_COLUMNS.tallaCamiseta);

    const programa: ValienteProgramaCSVRow = {
      programa_codigo: programaRaw || 'SOROCA',
      tipo_programa: tipoRaw || '',
    };

    const esTribu = programa.programa_codigo.trim().toUpperCase() === 'TRIBU';
    const perfil_deportivo: ValientePerfilDeportivoCSVRow | null = esTribu ? {
      disciplina: tipoRaw || null,
      talla_guayos: tallaGuayos || null,
      talla_camisa: tallaCamiseta || null,
      talla_pantalon: null,
    } : null;

    // VALIENTE
    const trabajaRaw = h(CSV_COLUMNS.trabaja);

    const valiente: ValienteCSVRow = {
      tipo_documento:   mapTipoDocumento(h(CSV_COLUMNS.tipoDocumentoValiente)),
      numero_documento: numeroDocumento,
      nombres,
      apellidos,
      apodo:            h(CSV_COLUMNS.apodo) || null,
      fecha_nacimiento: fechaParsed,
      sexo:             mapSexo(h(CSV_COLUMNS.genero)),
      identidad_genero: h(CSV_COLUMNS.genero) || null,
      celular:          h(CSV_COLUMNS.telefono) || null,
      email:            hAfter(CSV_COLUMNS.email, CSV_COLUMNS.telefono) || null,
      lugar_nacimiento: h(CSV_COLUMNS.lugarNacimiento) || null,
      nacionalidad:     h(CSV_COLUMNS.nacionalidad) || null,
      trabaja_estudia:  trabajaRaw ? (mapBool(trabajaRaw) ? 'TRABAJA' : 'ESTUDIA') : null,
      hobbies:          h(CSV_COLUMNS.hobbies) || null,
      estado:           'ACTIVO',
      foto_url:         null,
      created_by:       null,
      updated_by:       null,
    };

    // UBICACION
    const ubicacion: UbicacionCSVRow = {
      direccion:     h(CSV_COLUMNS.direccion) || null,
      estrato:       h(CSV_COLUMNS.estrato) || null,
      ciudad_nombre: h(CSV_COLUMNS.ciudad) || null,
      barrio_nombre: h(CSV_COLUMNS.barrio) || null,
      comuna_numero: h(CSV_COLUMNS.comuna) || null,
    };

    // SALUD
    const epsNombreRaw = h(CSV_COLUMNS.eps);
    const epsNombre = epsNombreRaw.toLowerCase() === 'otra'
      ? h(CSV_COLUMNS.epsOtra)
      : epsNombreRaw;

    const salud: SaludCSVRow = {
      eps_nombre:                     epsNombre || null,
      regimen_eps:                    mapRegimenEps(h(CSV_COLUMNS.regimenAfiliacion)),
      ips_nombre:                     h(CSV_COLUMNS.ipsUrgencias) || null,
      tipo_sangre:                    h(CSV_COLUMNS.tipoSangre) || null,
      tiene_discapacidad:             mapBool(h(CSV_COLUMNS.presentaDiscapacidad)),
      tipo_discapacidad:              h(CSV_COLUMNS.tipoDiscapacidad) || null,
      diagnostico_medico:             h(CSV_COLUMNS.diagnostico) || null,
      tiene_alergias:                 mapBool(h(CSV_COLUMNS.tieneAlergia)),
      alergias:                       h(CSV_COLUMNS.alergias) || null,
      medicamentos_actuales:          null,  // el CSV no tiene columnas separadas de medicamentos; usar tratamiento_en_curso para texto libre
      tratamiento_en_curso:           h(CSV_COLUMNS.tratamiento) || null,
      contacto_emergencia_nombre:     null,
      contacto_emergencia_telefono:   null,
      contacto_emergencia_parentesco: null,
    };

    // EDUCACION
    const colegio = h(CSV_COLUMNS.colegio);
    const colegioOtra = h(CSV_COLUMNS.colegioOtra);
    const institucionUniversitaria = h(CSV_COLUMNS.institucionEducativa);

    let institucionNombre: string | null = null;
    if (colegio && colegio.toLowerCase() !== 'otra') {
      institucionNombre = colegio;
    } else if (colegio.toLowerCase() === 'otra' && colegioOtra) {
      institucionNombre = colegioOtra;
    } else if (!colegio && institucionUniversitaria) {
      institucionNombre = institucionUniversitaria;
    }

    const gradoOPrograma = h(CSV_COLUMNS.escolaridad) || h(CSV_COLUMNS.programaPregrado);

    const educacion: EducacionCSVRow = {
      nivel_educativo:    mapNivelEducativo(h(CSV_COLUMNS.nivelEducativo)),
      grado_actual:       gradoOPrograma || null,
      materia_favorita:   h(CSV_COLUMNS.materiaFavorita) || null,
      materia_dificil:    h(CSV_COLUMNS.materiaDificil) || null,
      institucion_nombre: institucionNombre,
    };

    // CONTEXTO FAMILIAR
    const numPersonas = parseInteger(h(CSV_COLUMNS.numeroPersonasHogar));

    const contexto_familiar: ContextoFamiliarCSVRow = {
      composicion_familiar:  h(CSV_COLUMNS.composicionFamiliar) || null,
      numero_personas_hogar: numPersonas,
      ingreso_mensual_hogar: h(CSV_COLUMNS.ingresoMensualHogar) || null,
      es_victima_conflicto:  mapBool(h(CSV_COLUMNS.victimaConflicto)),
      esta_en_ruv:           mapBool(h(CSV_COLUMNS.inscritoRuv)),
      etnia:                 h(CSV_COLUMNS.etnia) || null,
    };

    // ACUDIENTE PRINCIPAL
    let acudiente: AcudienteCSVRow | null = null;
    let valiente_acudiente: ValienteAcudienteCSVRow | null = null;

    const nombreAcudiente = h(CSV_COLUMNS.nombreAcudiente);
    if (nombreAcudiente) {
      const edadAcudiente = parseInteger(h(CSV_COLUMNS.edadAcudiente));
      const tipoDocumentoAcudiente = h(CSV_COLUMNS.tipoDocumentoAcudiente);
      const numeroDocumentoAcudiente = cleanDocument(h(CSV_COLUMNS.numeroDocumentoAcudiente));

      acudiente = {
        nombre_completo:            nombreAcudiente,
        tipo_documento:             tipoDocumentoAcudiente ? mapTipoDocumento(tipoDocumentoAcudiente) : null,
        numero_documento:           numeroDocumentoAcudiente || null,
        celular:                    h(CSV_COLUMNS.telefonoAcudiente) || null,
        email:                      hAfter(CSV_COLUMNS.email, CSV_COLUMNS.numeroDocumentoAcudiente, 1) || null,
        tiene_autorizacion_firmada: mapBool(h(CSV_COLUMNS.autorizacionFirmada)),

        // Campos adicionales del CSV que no estan en la tabla acudiente
        sexo:                 mapSexo(h(CSV_COLUMNS.generoAcudiente)),
        edad:                 edadAcudiente,
        ocupacion:            h(CSV_COLUMNS.laborAcudiente) || null,
        tipo_empleo:          h(CSV_COLUMNS.tipoVinculacionAcudiente) || null,
        grupo_vulnerabilidad: h(CSV_COLUMNS.grupoPoblacionalAcudiente) || null,
      };

      valiente_acudiente = {
        parentesco:             h(CSV_COLUMNS.parentescoAcudiente) || 'OTRO',
        es_principal:           true,
        es_contacto_emergencia: true,
        vive_con_valiente:      false,
      };
    }

    valid.push({
      valiente,
      ubicacion,
      salud,
      educacion,
      contexto_familiar,
      acudiente,
      valiente_acudiente,
      programa,
      perfil_deportivo,
      documentos: {
        documento_identidad_url: h(CSV_COLUMNS.idDocumentoDrive) || null,
        eps_url: h(CSV_COLUMNS.epsSubidoDrive) || null,
        consentimiento_url: h(CSV_COLUMNS.consentimientoSubidoDrive) || null,
      },
    });
  }

  return { valid, invalid };
}
