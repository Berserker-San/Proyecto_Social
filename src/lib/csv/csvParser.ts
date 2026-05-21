// =========================================================
// CSV PARSER — mapea columnas del CSV al modelo Valiente
// Parseo por índice de columna (no por nombre de encabezado)
// Cubre todas las tablas relacionadas del valiente
// =========================================================

import type {
  Valiente,
  ValienteUbicacion,
  ValienteSalud,
  ValienteEducacion,
  ValienteOcupacion,
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
};

export type SaludCSVRow = Omit<
  ValienteSalud,
  'valiente_id' | 'updated_at' | 'eps_id' | 'ips_id'
> & {
  eps_nombre: string | null;
};

export type EducacionCSVRow = Omit<
  ValienteEducacion,
  'valiente_id' | 'updated_at' | 'institucion_id' | 'jornada'
> & {
  institucion_nombre: string | null;  // texto para resolver a ID en el servicio
};

export type OcupacionCSVRow = Omit<
  ValienteOcupacion,
  'valiente_id' | 'updated_at' | 'horario_trabajo' | 'cargo' | 'tipo_empleo' | 'actividades_extracurriculares'
>;

export type ContextoFamiliarCSVRow = Omit<
  ValienteContextoFamiliar,
  'valiente_id' | 'updated_at' | 'factores_protectores' | 'factores_riesgo'
>;

export type AcudienteCSVRow = Omit<
  Acudiente,
  'id' | 'created_at' | 'updated_at' | 'telefono_fijo' | 'email'
>;

export type ValienteAcudienteCSVRow = {
  parentesco: string;
  es_principal: boolean;
  es_contacto_emergencia: boolean;
  vive_con_valiente: boolean;
};

export interface ParsedRow {
  valiente: ValienteCSVRow;
  ubicacion: UbicacionCSVRow;
  salud: SaludCSVRow;
  educacion: EducacionCSVRow;
  ocupacion: OcupacionCSVRow;
  contexto_familiar: ContextoFamiliarCSVRow;
  acudiente: AcudienteCSVRow | null;
  valiente_acudiente: ValienteAcudienteCSVRow | null;
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

function mapSexo(raw: string): string | null {
  const v = raw.trim();
  if (v === 'Masculino') return 'MASCULINO';
  if (v === 'Femenino') return 'FEMENINO';
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
  return raw.trim().toLowerCase() === 'sí' || raw.trim().toLowerCase() === 'si';
}

// =========================================================
// PARSEO DE FECHA
// =========================================================

export function parseDate(raw: string): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();

  // Ya está en formato ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY o DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Intentar con Date nativo como último recurso
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
      inQuotes = !inQuotes;
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
// NORMALIZACIÓN DE NOMBRES DE COLUMNA
// =========================================================

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

// =========================================================
// PARSER PRINCIPAL
// =========================================================

export function parseCSV(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return { valid: [], invalid: [] };

  // Detectar separador (punto y coma o coma)
  const separator = lines[0].includes(';') ? ';' : ',';

  // Construir mapa de encabezados: nombre normalizado → índice
  const rawHeaders = splitCSVLine(lines[0], separator);
  const headerIndex: Record<string, number> = {};
  rawHeaders.forEach((header, idx) => {
    headerIndex[normalize(header)] = idx;
  });

  // Saltar la fila de encabezados (fila 0), parsear desde fila 1
  const valid: ParsedRow[] = [];
  const invalid: RowError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1; // +1 porque la fila 1 es el encabezado
    const cols = splitCSVLine(lines[i], separator);

    const c = (idx: number): string => cols[idx]?.trim() ?? '';
    const h = (colName: string): string =>
      cols[headerIndex[normalize(colName)] ?? -1]?.trim() ?? '';

    // ── Validar campos requeridos ──────────────────────────
    const nombres = c(1);
    const apellidos = c(2);
    const numeroDocumento = c(9).replace(/[.,]/g, '');
    const rawFecha = c(4);

    const missing: string[] = [];
    if (!nombres)         missing.push('nombres');
    if (!apellidos)       missing.push('apellidos');
    if (!numeroDocumento) missing.push('numero_documento');
    if (!rawFecha)        missing.push('fecha_nacimiento');

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

    // ── VALIENTE ──────────────────────────────────────────
    const valiente: ValienteCSVRow = {
      tipo_documento:   mapTipoDocumento(c(8)),
      numero_documento: numeroDocumento,
      nombres,
      apellidos,
      apodo:            null,
      fecha_nacimiento: fechaParsed,
      sexo:             mapSexo(c(3)),
      identidad_genero: c(3) || null,
      celular:          c(15) || null,
      telefono_fijo:    null,
      email:            null,
      redes_sociales:   null,
      lugar_nacimiento: c(5) || null,
      nacionalidad:     c(6) || null,
      estado:           'ACTIVO',
      foto_url:         null,
      created_by:       null,
      updated_by:       null,
    };

    // ── UBICACIÓN ─────────────────────────────────────────
    const ubicacion: UbicacionCSVRow = {
      direccion:    c(14) || null,
      estrato:      c(13) || null,
      ciudad_nombre: c(10) || null,
      barrio_nombre: c(11) || null,
    };

    // ── SALUD ─────────────────────────────────────────────
    const epsNombreRaw = h('Nombre de la EPS');
    const epsNombre = epsNombreRaw.toLowerCase() === 'otra'
      ? h('En caso de haber respondido OTRA en la respuesta anterior, indique el nombre de la EPS')
      : epsNombreRaw;

    const salud: SaludCSVRow = {
      eps_nombre:                     epsNombre || null,
      ips_nombre:                     h('Nombre de la IPS donde es atendido/a por urgencias') || null,
      tipo_sangre:                    h('Tipo de sangre') || null,
      tiene_discapacidad:             mapBool(h('¿Presenta alguna discapacidad?')),
      tipo_discapacidad:              h('En caso de haber respondido afirmativamente la respuesta anterior, seleccione ¿Cuál?') || null,
      diagnostico_medico:             h('En caso de haber respondido afirmativamente en la respuesta anterior, ¿Cuál?') || null,
      tiene_alergias:                 mapBool(h('¿Tiene alguna alergia?')),
      alergias:                       h('En caso de haber respondido afirmativamente en la respuesta anterior, ¿a qué reaccionas con alergia?') || null,
      medicamentos_actuales:          null,
      tratamiento_en_curso:           h('¿Se encuentra en tratamiento médico y/o farmacológico? Descríbalo') || null,
      contacto_emergencia_nombre:     null,
      contacto_emergencia_telefono:   null,
      contacto_emergencia_parentesco: null,
    };

    // ── EDUCACIÓN ─────────────────────────────────────────
    const colegio = h('Colegio en el que estudia (o estudió para los de Mundo cotidiano)');
    const colegioOtra = h('Si tu respuesta anterior fue otra, indica cuál colegio:');
    const institucionUniversitaria = h('En el caso de que estés cursando un programa de pregrado universitario o programa técnico o tecnológico ¿En qué institución educativa?');

    let institucionNombre: string | null = null;
    if (colegio && colegio.toLowerCase() !== 'otra') {
      institucionNombre = colegio;
    } else if (colegio.toLowerCase() === 'otra' && colegioOtra) {
      institucionNombre = colegioOtra;
    } else if (!colegio && institucionUniversitaria) {
      institucionNombre = institucionUniversitaria;
    }

    const educacion: EducacionCSVRow = {
      nivel_educativo:               mapNivelEducativo(h('Nivel en el que te encuentras actualmente:')),
      grado_actual:                  h('Escolaridad (grado o programa que estés cursando actualmente)') || null,
      materia_favorita:              h('¿Qué temática o curso del colegio o institución universitaria disfrutas más?') || null,
      materia_dificil:               h('¿Qué temática o curso del colegio o institución universitaria es más difícil para ti?') || null,
      actividades_extracurriculares: h('¿Perteneces a alguna organización, equipos o clubes dentro y fuera de la Institución educativa? (diferente a Soroca) ¿Cuáles?') || null,
      institucion_nombre:            institucionNombre,
    };

    // ── OCUPACIÓN ─────────────────────────────────────────
    const ocupacion: OcupacionCSVRow = {
      esta_trabajando:              mapBool(c(26)),
      lugar_trabajo:                c(27) || null,
      otras_responsabilidades:      c(23) || null,
      hobbies:                      c(25) || null,
      intereses_profesionales:      c(28) || null,
    };

    // ── CONTEXTO FAMILIAR ─────────────────────────────────
    const numPersonas = c(43) ? parseInt(c(43), 10) : null;

    const contexto_familiar: ContextoFamiliarCSVRow = {
      composicion_familiar:      c(42) || null,
      numero_personas_hogar:     isNaN(numPersonas as number) ? null : numPersonas,
      ingreso_mensual_hogar:     c(44) || null,
      es_victima_conflicto:      mapBool(c(45)),
      esta_en_ruv:               mapBool(c(46)),
      etnia:                     c(47) || null,
      familia_busca_empleo:      mapBool(c(48)),
      detalles_buscador_empleo:  c(49) || null,
    };

    // ── ACUDIENTE ─────────────────────────────────────────
    let acudiente: AcudienteCSVRow | null = null;
    let valiente_acudiente: ValienteAcudienteCSVRow | null = null;

    const nombreAcudiente = c(50);
    if (nombreAcudiente) {
      const edadAcudienteRaw = c(56);
      const edadAcudiente = edadAcudienteRaw ? parseInt(edadAcudienteRaw, 10) : null;

      // La ocupación del acudiente: si col 57 indica que trabaja, usar col 58 como descripción
      const trabajaAcudiente = c(57);
      const laborAcudiente = c(58);
      const ocupacionAcudiente = laborAcudiente || trabajaAcudiente || null;

      acudiente = {
        nombre_completo:           nombreAcudiente,
        tipo_documento:            c(51) ? mapTipoDocumento(c(51)) : null,
        numero_documento:          c(52) || null,
        celular:                   c(53) || null,
        sexo:                      mapSexo(c(54)),
        edad:                      isNaN(edadAcudiente as number) ? null : edadAcudiente,
        ocupacion:                 ocupacionAcudiente,
        tipo_empleo:               c(59) || null,
        grupo_vulnerabilidad:      c(60) || null,
        tiene_autorizacion_firmada: mapBool(c(72)),
      };

      valiente_acudiente = {
        parentesco:             c(55) || 'OTRO',
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
      ocupacion,
      contexto_familiar,
      acudiente,
      valiente_acudiente,
    });
  }

  return { valid, invalid };
}
