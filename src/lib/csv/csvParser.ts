// =========================================================
// CSV PARSER — mapea columnas del CSV al modelo Valiente
// Solo campos de la tabla principal `valiente`
// =========================================================

import type { Valiente } from '../../types/database.types';

// Tipo para una fila parseada (sin campos auto-generados por BD)
export type ValienteCSVRow = Omit<Valiente, 'id' | 'created_at' | 'updated_at' | 'nombre_completo'>;

export interface RowError {
  rowNumber: number;
  numeroDocumento?: string;
  reason: string;
}

export interface ParseResult {
  valid: ValienteCSVRow[];
  invalid: RowError[];
}

// Normaliza encabezados: minúsculas, sin acentos, sin espacios extra
const normalize = (s: string) =>
  s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

// Mapa de encabezado CSV normalizado → campo del modelo Valiente
const COLUMN_MAP: Record<string, keyof ValienteCSVRow> = {
  'tipo documento':                    'tipo_documento',
  'tipo de documento':                 'tipo_documento',
  'numero documento':                  'numero_documento',
  'numero de documento':                                    'numero_documento',
  'numero de identificacion':                               'numero_documento',
  'numero de identificacion (sin comas ni puntos)':         'numero_documento',
  'numero identificacion':                                  'numero_documento',
  'n° documento':                                           'numero_documento',
  'no documento':                                           'numero_documento',
  'identificacion':                                         'numero_documento',
  'nombres':                           'nombres',
  'nombre':                            'nombres',
  'nombre(s)':                         'nombres',
  'nombres(s)':                        'nombres',
  'apellidos':                         'apellidos',
  'apellido':                          'apellidos',
  'apodo':                'apodo',
  'nickname':             'apodo',
  'fecha nacimiento':     'fecha_nacimiento',
  'fecha de nacimiento':  'fecha_nacimiento',
  'sexo':                 'sexo',
  'sexo biologico':       'sexo',
  'identidad genero':     'identidad_genero',
  'identidad de genero':  'identidad_genero',
  'genero':               'identidad_genero',
  'celular':              'celular',
  'telefono celular':     'celular',
  'telefono movil':       'celular',
  'telefono fijo':        'telefono_fijo',
  'fijo':                 'telefono_fijo',
  'email':                'email',
  'correo':               'email',
  'correo electronico':   'email',
  'lugar nacimiento':     'lugar_nacimiento',
  'lugar de nacimiento':  'lugar_nacimiento',
  'nacionalidad':         'nacionalidad',
  'estado':               'estado',
};

// Parsea una fecha en varios formatos a YYYY-MM-DD
function parseDate(raw: string): string | null {
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

// Parsea el CSV completo y retorna filas válidas e inválidas
export function parseCSV(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return { valid: [], invalid: [] };

  // Detectar separador (coma o punto y coma)
  const separator = lines[0].includes(';') ? ';' : ',';

  const rawHeaders = lines[0].split(separator);
  const mappedHeaders = rawHeaders.map(h => COLUMN_MAP[normalize(h)] ?? null);

  // Debug: muestra en consola los encabezados detectados
  console.debug('[csvParser] Encabezados raw:', rawHeaders);
  console.debug('[csvParser] Encabezados normalizados:', rawHeaders.map(normalize));
  console.debug('[csvParser] Mapeo resultante:', mappedHeaders);

  const valid: ValienteCSVRow[] = [];
  const invalid: RowError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1; // +1 porque la fila 1 es el encabezado
    const cols = splitCSVLine(lines[i], separator);

    const raw: Record<string, string> = {};
    mappedHeaders.forEach((field, idx) => {
      if (field) raw[field] = cols[idx]?.trim() ?? '';
    });

    // Validar campos requeridos
    const missing: string[] = [];
    if (!raw['nombres'])           missing.push('nombres');
    if (!raw['apellidos'])         missing.push('apellidos');
    if (!raw['numero_documento'])  missing.push('numero_documento');
    if (!raw['fecha_nacimiento'])  missing.push('fecha_nacimiento');

    if (missing.length > 0) {
      invalid.push({ rowNumber, numeroDocumento: raw['numero_documento'], reason: `Campos requeridos faltantes: ${missing.join(', ')}` });
      continue;
    }

    // Parsear fecha
    const fechaParsed = parseDate(raw['fecha_nacimiento']);
    if (!fechaParsed) {
      invalid.push({ rowNumber, numeroDocumento: raw['numero_documento'], reason: `Fecha de nacimiento inválida: "${raw['fecha_nacimiento']}"` });
      continue;
    }

    const row: ValienteCSVRow = {
      tipo_documento:   raw['tipo_documento'] || 'CC',
      numero_documento: raw['numero_documento'].replace(/[.,]/g, ''),
      nombres:          raw['nombres'],
      apellidos:        raw['apellidos'],
      apodo:            raw['apodo'] || null,
      fecha_nacimiento: fechaParsed,
      sexo:             raw['sexo'] || null,
      identidad_genero: raw['identidad_genero'] || null,
      celular:          raw['celular'] || null,
      telefono_fijo:    raw['telefono_fijo'] || null,
      email:            raw['email'] || null,
      redes_sociales:   null,
      lugar_nacimiento: raw['lugar_nacimiento'] || null,
      nacionalidad:     raw['nacionalidad'] || null,
      estado:           raw['estado'] || 'ACTIVO',
      foto_url:         null,
      created_by:       null,
      updated_by:       null,
    };

    valid.push(row);
  }

  return { valid, invalid };
}

// Divide una línea CSV respetando campos entre comillas
function splitCSVLine(line: string, sep: string): string[] {
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
