import { supabase } from '../supabase';
import { calcularEdad } from './valientes.service';
import { formatComuna } from './catalogos.service';
import { ORDEN_RANGOS_INGRESO } from '../config/smmlv';

// =========================================================
// TIPOS DE RETORNO
// =========================================================

export interface EstadisticaPrograma {
  programa: string;
  total: number;
}

export interface EstadisticaGenero {
  genero: string;
  total: number;
  porcentaje: number;
}

export interface EstadisticaEstrato {
  estrato: string;
  total: number;
}

export interface EstadisticaRangoEdad {
  rango: string;
  total: number;
  edadMin: number;
  edadMax: number;
}

export interface ResumenEstadisticas {
  totalValientes: number;
  totalActivos: number;
  totalProgramas: number;
  porPrograma: EstadisticaPrograma[];
  porGenero: EstadisticaGenero[];
  porEstrato: EstadisticaEstrato[];
  porRangoEdad: EstadisticaRangoEdad[];
}

// =========================================================
// RANGOS DE EDAD
// =========================================================

const RANGOS_EDAD = [
  { rango: '0 - 5',   edadMin: 0,  edadMax: 5  },
  { rango: '6 - 11',  edadMin: 6,  edadMax: 11 },
  { rango: '12 - 17', edadMin: 12, edadMax: 17 },
  { rango: '18 - 25', edadMin: 18, edadMax: 25 },
  { rango: '26 - 35', edadMin: 26, edadMax: 35 },
  { rango: '36 - 50', edadMin: 36, edadMax: 50 },
  { rango: '51+',     edadMin: 51, edadMax: 999 },
];

// =========================================================
// ESTADÍSTICAS POR PROGRAMA
// Cuenta cuántos valientes activos hay en cada programa.
// =========================================================

export async function getEstadisticasPorPrograma(): Promise<EstadisticaPrograma[]> {
  const { data, error } = await supabase
    .from('valiente_programa')
    .select(`
      programa_id,
      programa ( nombre )
    `)
    .eq('estado', 'ACTIVO');

  if (error) throw error;

  // Agrupar por nombre de programa
  const conteo: Record<string, number> = {};

  for (const row of data ?? []) {
    const nombre = (row.programa as unknown as { nombre: string } | null)?.nombre ?? 'Sin programa';
    conteo[nombre] = (conteo[nombre] ?? 0) + 1;
  }

  return Object.entries(conteo)
    .map(([programa, total]) => ({ programa, total }))
    .sort((a, b) => b.total - a.total);
}

// =========================================================
// ESTADÍSTICAS POR GÉNERO
// Distribución de sexo con porcentaje calculado.
// =========================================================

export async function getEstadisticasPorGenero(): Promise<EstadisticaGenero[]> {
  const { data, error } = await supabase
    .from('valiente')
    .select('sexo')
    .eq('estado', 'ACTIVO');

  if (error) throw error;

  const conteo: Record<string, number> = {};

  for (const row of data ?? []) {
    const genero = row.sexo ?? 'No especificado';
    conteo[genero] = (conteo[genero] ?? 0) + 1;
  }

  const total = Object.values(conteo).reduce((sum, n) => sum + n, 0);

  return Object.entries(conteo)
    .map(([genero, cantidad]) => ({
      genero,
      total: cantidad,
      porcentaje: total > 0 ? Math.round((cantidad / total) * 100 * 10) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// =========================================================
// ESTADÍSTICAS POR ESTRATO
// Concentración de la población por nivel socioeconómico.
// =========================================================

export async function getEstadisticasPorEstrato(): Promise<EstadisticaEstrato[]> {
  const { data, error } = await supabase
    .from('valiente_ubicacion')
    .select(`
      estrato,
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO');

  if (error) throw error;

  const conteo: Record<string, number> = {};

  for (const row of data ?? []) {
    const estrato = row.estrato ?? 'No registrado';
    conteo[estrato] = (conteo[estrato] ?? 0) + 1;
  }

  // Ordenar numéricamente: estrato 1, 2, 3... y "No registrado" al final
  return Object.entries(conteo)
    .map(([estrato, total]) => ({ estrato, total }))
    .sort((a, b) => {
      const numA = parseInt(a.estrato);
      const numB = parseInt(b.estrato);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      if (!isNaN(numA)) return -1;
      if (!isNaN(numB)) return 1;
      return a.estrato.localeCompare(b.estrato);
    });
}

// =========================================================
// ESTADÍSTICAS POR RANGO DE EDAD
// Histograma de distribución etaria.
// =========================================================

export async function getEstadisticasPorEdad(): Promise<EstadisticaRangoEdad[]> {
  const { data, error } = await supabase
    .from('valiente')
    .select('fecha_nacimiento')
    .eq('estado', 'ACTIVO')
    .not('fecha_nacimiento', 'is', null);

  if (error) throw error;

  // Inicializar todos los rangos en 0
  const resultado: EstadisticaRangoEdad[] = RANGOS_EDAD.map((r) => ({ ...r, total: 0 }));

  for (const row of data ?? []) {
    if (!row.fecha_nacimiento) continue;
    const edad = calcularEdad(row.fecha_nacimiento);

    const rango = resultado.find((r) => edad >= r.edadMin && edad <= r.edadMax);
    if (rango) rango.total++;
  }

  return resultado;
}

// =========================================================
// RESUMEN COMPLETO
// Ejecuta todas las consultas en paralelo para mayor eficiencia.
// =========================================================

export async function getResumenEstadisticas(): Promise<ResumenEstadisticas> {
  const [
    { data: totalData, error: totalError },
    porPrograma,
    porGenero,
    porEstrato,
    porRangoEdad,
  ] = await Promise.all([
    supabase
      .from('valiente')
      .select('estado', { count: 'exact', head: false }),
    getEstadisticasPorPrograma(),
    getEstadisticasPorGenero(),
    getEstadisticasPorEstrato(),
    getEstadisticasPorEdad(),
  ]);

  if (totalError) throw totalError;

  const todos = totalData ?? [];
  const totalValientes = todos.length;
  const totalActivos = todos.filter((v) => v.estado === 'ACTIVO').length;

  // Programas únicos activos
  const { count: totalProgramas, error: progError } = await supabase
    .from('programa')
    .select('*', { count: 'exact', head: true })
    .eq('esta_activo', true);

  if (progError) throw progError;

  return {
    totalValientes,
    totalActivos,
    totalProgramas: totalProgramas ?? 0,
    porPrograma,
    porGenero,
    porEstrato,
    porRangoEdad,
  };
}

// =========================================================
// ESTADÍSTICAS POR OCUPACIÓN
// Distribución de trabaja_estudia en la tabla valiente.
// =========================================================

export interface EstadisticaOcupacion {
  ocupacion: string;
  total: number;
  porcentaje: number;
}

export async function getEstadisticasPorOcupacion(): Promise<EstadisticaOcupacion[]> {
  const { data, error } = await supabase
    .from('valiente')
    .select('trabaja_estudia')
    .eq('estado', 'ACTIVO');

  if (error) throw error;

  const conteo: Record<string, number> = {};

  for (const row of data ?? []) {
    const ocupacion = row.trabaja_estudia ?? 'No especificado';
    conteo[ocupacion] = (conteo[ocupacion] ?? 0) + 1;
  }

  const total = Object.values(conteo).reduce((sum, n) => sum + n, 0);

  return Object.entries(conteo)
    .map(([ocupacion, cantidad]) => ({
      ocupacion,
      total: cantidad,
      porcentaje: total > 0 ? Math.round((cantidad / total) * 100 * 10) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// =========================================================
// ESTADÍSTICAS POR ESCOLARIDAD
// Distribución de nivel_educativo en valiente_educacion.
// =========================================================

export interface EstadisticaEscolaridad {
  nivel: string;
  total: number;
}

export async function getEstadisticasPorEscolaridad(): Promise<EstadisticaEscolaridad[]> {
  const { data, error } = await supabase
    .from('valiente_educacion')
    .select(`
      nivel_educativo,
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO');

  if (error) throw error;

  const conteo: Record<string, number> = {};

  for (const row of data ?? []) {
    const nivel = row.nivel_educativo ?? 'No registrado';
    conteo[nivel] = (conteo[nivel] ?? 0) + 1;
  }

  const ORDER = ['Primaria', 'Secundaria', 'Técnico', 'Tecnólogo', 'Profesional universitario', 'Posgrado'];

  return Object.entries(conteo)
    .map(([nivel, total]) => ({ nivel, total }))
    .sort((a, b) => {
      const ia = ORDER.indexOf(a.nivel);
      const ib = ORDER.indexOf(b.nivel);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.nivel.localeCompare(b.nivel);
    });
}

// =========================================================
// ESTADÍSTICAS POR COMUNA
// Concentración geográfica por comuna_id en valiente_ubicacion.
// =========================================================

export interface EstadisticaComuna {
  comuna: string;
  total: number;
}

export async function getEstadisticasPorComuna(): Promise<EstadisticaComuna[]> {
  const { data, error } = await supabase
    .from('valiente_ubicacion')
    .select(`
      comuna_id,
      comuna:comuna ( nombre ),
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO');

  if (error) throw error;

  const conteo: Record<string, number> = {};

  for (const row of data ?? []) {
    let label: string;
    const comunaNombre = (row as any)?.comuna?.nombre as string | undefined;
    if (comunaNombre) {
      label = formatComuna(comunaNombre);
    } else if (row.comuna_id) {
      label = `Comuna ${row.comuna_id}`;
    } else {
      label = 'No registrada';
    }
    conteo[label] = (conteo[label] ?? 0) + 1;
  }

  // Ordenar numéricamente por número de comuna; "No registrada" al final
  return Object.entries(conteo)
    .map(([comuna, total]) => ({ comuna, total }))
    .sort((a, b) => {
      const na = parseInt(a.comuna.replace(/\D/g, ''), 10);
      const nb = parseInt(b.comuna.replace(/\D/g, ''), 10);
      if (isNaN(na) && isNaN(nb)) return 0;
      if (isNaN(na)) return 1;
      if (isNaN(nb)) return -1;
      return na - nb;
    });
}

// =========================================================
// ESTADÍSTICAS SALUD Y BIENESTAR
// Distribución de discapacidad, alergias y tratamiento médico.
// =========================================================

export interface EstadisticaSaludItem {
  categoria: string;  // "Sí" | "No"
  total: number;
  porcentaje: number;
}

export interface EstadisticaSalud {
  discapacidad: EstadisticaSaludItem[];
  alergia: EstadisticaSaludItem[];
  tratamiento: EstadisticaSaludItem[];
}

export async function getEstadisticasSalud(): Promise<EstadisticaSalud> {
  const { data, error } = await supabase
    .from('valiente_salud')
    .select(`
      tiene_discapacidad,
      tiene_alergias,
      tratamiento_en_curso,
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO');

  if (error) throw error;

  const rows = data ?? [];
  const total = rows.length;

  const toItems = (siCount: number): EstadisticaSaludItem[] => {
    const noCount = total - siCount;
    return [
      { categoria: 'Sí', total: siCount, porcentaje: total > 0 ? Math.round((siCount / total) * 1000) / 10 : 0 },
      { categoria: 'No', total: noCount, porcentaje: total > 0 ? Math.round((noCount / total) * 1000) / 10 : 0 },
    ];
  };

  const discapacidadSi  = rows.filter(r => r.tiene_discapacidad === true).length;
  const alergiaSi       = rows.filter(r => r.tiene_alergias === true).length;
  const tratamientoSi   = rows.filter(r => r.tratamiento_en_curso !== null && r.tratamiento_en_curso !== '').length;

  return {
    discapacidad: toItems(discapacidadSi),
    alergia:      toItems(alergiaSi),
    tratamiento:  toItems(tratamientoSi),
  };
}

// =========================================================
// ESTADÍSTICAS ENTORNO FAMILIAR Y SOCIOECONÓMICO
// Tablas: valiente_contexto_familiar
// =========================================================

export interface EstadisticaPersonasHogar {
  cantidad: string;
  total: number;
}

export interface EstadisticaIngreso {
  rango: string;
  total: number;
}

export interface EstadisticaConflicto {
  categoria: string;
  total: number;
  porcentaje: number;
}

export interface EstadisticaEtnia {
  etnia: string;
  total: number;
  porcentaje: number;
}

export async function getEstadisticasPersonasHogar(): Promise<EstadisticaPersonasHogar[]> {
  const { data, error } = await supabase
    .from('valiente_contexto_familiar')
    .select(`
      numero_personas_hogar,
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO');

  if (error) throw error;

  const conteo: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = row.numero_personas_hogar != null ? String(row.numero_personas_hogar) : 'No registrado';
    conteo[key] = (conteo[key] ?? 0) + 1;
  }

  return Object.entries(conteo)
    .map(([cantidad, total]) => ({ cantidad, total }))
    .sort((a, b) => {
      const na = parseInt(a.cantidad), nb = parseInt(b.cantidad);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.cantidad.localeCompare(b.cantidad);
    });
}

export async function getEstadisticasIngresos(): Promise<EstadisticaIngreso[]> {
  const { data, error } = await supabase
    .from('valiente_contexto_familiar')
    .select(`
      ingreso_mensual_hogar,
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO');

  if (error) throw error;

  const conteo: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = row.ingreso_mensual_hogar ?? 'No registrado';
    conteo[key] = (conteo[key] ?? 0) + 1;
  }

  const ORDER = ORDEN_RANGOS_INGRESO;

  return Object.entries(conteo)
    .map(([rango, total]) => ({ rango, total }))
    .sort((a, b) => {
      const ia = ORDER.indexOf(a.rango), ib = ORDER.indexOf(b.rango);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.rango.localeCompare(b.rango);
    });
}

export async function getEstadisticasConflicto(): Promise<EstadisticaConflicto[]> {
  const { data, error } = await supabase
    .from('valiente_contexto_familiar')
    .select(`
      es_victima_conflicto,
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO');

  if (error) throw error;

  const rows = data ?? [];
  const total = rows.length;
  const siCount = rows.filter(r => r.es_victima_conflicto === true).length;
  const noCount = total - siCount;

  return [
    { categoria: 'Sí', total: siCount, porcentaje: total > 0 ? Math.round((siCount / total) * 1000) / 10 : 0 },
    { categoria: 'No', total: noCount, porcentaje: total > 0 ? Math.round((noCount / total) * 1000) / 10 : 0 },
  ];
}

export async function getEstadisticasEtnia(): Promise<EstadisticaEtnia[]> {
  const { data, error } = await supabase
    .from('valiente_contexto_familiar')
    .select(`
      etnia,
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO');

  if (error) throw error;

  const conteo: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = row.etnia ?? 'No registrado';
    conteo[key] = (conteo[key] ?? 0) + 1;
  }

  const total = Object.values(conteo).reduce((s, n) => s + n, 0);

  return Object.entries(conteo)
    .map(([etnia, cantidad]) => ({
      etnia,
      total: cantidad,
      porcentaje: total > 0 ? Math.round((cantidad / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// =========================================================
// ESTADÍSTICAS DEPORTE Y CULTURA
// Tabla: valiente_perfil_deportivo
// =========================================================

export interface EstadisticaTalla {
  talla: string;
  total: number;
}

export interface EstadisticaEntreno {
  dia: string;
  total: number;
}

export async function getEstadisticasTallaCamisa(): Promise<EstadisticaTalla[]> {
  const { data, error } = await supabase
    .from('valiente_perfil_deportivo')
    .select(`
      talla_camisa,
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO');

  if (error) throw error;

  const ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const conteo: Record<string, number> = {};

  for (const row of data ?? []) {
    const key = row.talla_camisa ?? 'No registrado';
    conteo[key] = (conteo[key] ?? 0) + 1;
  }

  return Object.entries(conteo)
    .map(([talla, total]) => ({ talla, total }))
    .sort((a, b) => {
      const ia = ORDER.indexOf(a.talla), ib = ORDER.indexOf(b.talla);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.talla.localeCompare(b.talla);
    });
}

export async function getEstadisticasTallaGuayos(): Promise<EstadisticaTalla[]> {
  const { data, error } = await supabase
    .from('valiente_perfil_deportivo')
    .select(`
      talla_guayos,
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO')
    .not('talla_guayos', 'is', null);

  if (error) throw error;

  const conteo: Record<string, number> = {};

  for (const row of data ?? []) {
    const key = row.talla_guayos ?? 'No registrado';
    conteo[key] = (conteo[key] ?? 0) + 1;
  }

  return Object.entries(conteo)
    .map(([talla, total]) => ({ talla, total }))
    .sort((a, b) => {
      const na = parseInt(a.talla), nb = parseInt(b.talla);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.talla.localeCompare(b.talla);
    });
}

export async function getEstadisticasEntrenos(): Promise<EstadisticaEntreno[]> {
  const { data, error } = await supabase
    .from('valiente_perfil_deportivo')
    .select(`
      horario_entrenamiento,
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO')
    .not('horario_entrenamiento', 'is', null);

  if (error) throw error;

  const conteo: Record<string, number> = {};

  for (const row of data ?? []) {
    const horario = row.horario_entrenamiento;
    // horario puede ser un array de strings o un objeto; normalizamos ambos casos
    const dias: string[] = Array.isArray(horario)
      ? horario
      : typeof horario === 'object' && horario !== null
        ? Object.values(horario as Record<string, string>)
        : [];

    for (const dia of dias) {
      if (typeof dia === 'string' && dia.trim()) {
        conteo[dia] = (conteo[dia] ?? 0) + 1;
      }
    }
  }

  const ORDER = ['Lunes 4-6pm', 'Martes 4-6pm', 'Miércoles 4-6pm', 'Viernes 4-6pm', 'Sábados 8-10am'];

  return Object.entries(conteo)
    .map(([dia, total]) => ({ dia, total }))
    .sort((a, b) => {
      const ia = ORDER.indexOf(a.dia), ib = ORDER.indexOf(b.dia);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.dia.localeCompare(b.dia);
    });
}

// =========================================================
// ESTADÍSTICAS EPS — Certificado cargado o no
// =========================================================

export interface EstadisticaEpsCertificado {
  categoria: string;   // "Con certificado" | "Sin certificado"
  total: number;
  porcentaje: number;
}

export async function getEstadisticasEpsCertificado(): Promise<EstadisticaEpsCertificado[]> {
  // Traer todos los valientes activos
  const { data: valientes, error: vErr } = await supabase
    .from('valiente')
    .select('id')
    .eq('estado', 'ACTIVO');

  if (vErr) throw vErr;

  const ids = (valientes ?? []).map(v => v.id);
  if (ids.length === 0) return [];

  // Traer los que tienen documento de tipo 'eps'
  const { data: docs, error: dErr } = await supabase
    .from('valiente_documento')
    .select('valiente_id')
    .eq('tipo_documento', 'eps')
    .in('valiente_id', ids);

  if (dErr) throw dErr;

  const conCert = new Set((docs ?? []).map(d => d.valiente_id)).size;
  const sinCert = ids.length - conCert;
  const total   = ids.length;

  return [
    { categoria: 'Con certificado', total: conCert, porcentaje: total > 0 ? Math.round((conCert / total) * 1000) / 10 : 0 },
    { categoria: 'Sin certificado', total: sinCert, porcentaje: total > 0 ? Math.round((sinCert / total) * 1000) / 10 : 0 },
  ];
}

// =========================================================
// ESTADÍSTICAS CARACTERIZACIÓN — Tribu vs Soroca y sub-tipos
// =========================================================

export interface EstadisticaCaracterizacion {
  categoria: string;
  total: number;
  porcentaje: number;
}

/** Distribución TRIBU vs SOROCA */
export async function getEstadisticasPorTipoPrograma(): Promise<EstadisticaCaracterizacion[]> {
  const { data, error } = await supabase
    .from('valiente_programa')
    .select(`
      programa ( codigo ),
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO')
    .eq('estado', 'ACTIVO');

  if (error) throw error;

  const conteo: Record<string, number> = {};
  for (const row of data ?? []) {
    const codigo = (row.programa as any)?.codigo ?? 'Sin programa';
    conteo[codigo] = (conteo[codigo] ?? 0) + 1;
  }

  const total = Object.values(conteo).reduce((s, n) => s + n, 0);
  return Object.entries(conteo)
    .map(([categoria, t]) => ({
      categoria,
      total: t,
      porcentaje: total > 0 ? Math.round((t / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Distribución disciplina TRIBU: Ultimate vs Rugby */
export async function getEstadisticasDisciplinaTribu(): Promise<EstadisticaCaracterizacion[]> {
  const { data, error } = await supabase
    .from('valiente_perfil_deportivo')
    .select(`
      disciplina,
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO');

  if (error) throw error;

  const conteo: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = row.disciplina ?? 'No registrado';
    conteo[key] = (conteo[key] ?? 0) + 1;
  }

  const total = Object.values(conteo).reduce((s, n) => s + n, 0);
  return Object.entries(conteo)
    .map(([categoria, t]) => ({
      categoria,
      total: t,
      porcentaje: total > 0 ? Math.round((t / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Distribución macro SOROCA: Soñar, Romper, Cambiar, Mundo Cotidiano */
export async function getEstadisticasMacroSoroca(): Promise<EstadisticaCaracterizacion[]> {
  const { data, error } = await supabase
    .from('valiente_perfil_soroca')
    .select(`
      macro,
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO');

  if (error) throw error;

  const conteo: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = row.macro ?? 'No registrado';
    conteo[key] = (conteo[key] ?? 0) + 1;
  }

  const ORDER = ['Soñar', 'Romper', 'Cambiar', 'Mundo Cotidiano'];
  const total = Object.values(conteo).reduce((s, n) => s + n, 0);

  return Object.entries(conteo)
    .map(([categoria, t]) => ({
      categoria,
      total: t,
      porcentaje: total > 0 ? Math.round((t / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => {
      const ia = ORDER.indexOf(a.categoria), ib = ORDER.indexOf(b.categoria);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.categoria.localeCompare(b.categoria);
    });
}

// =========================================================
// ESTADÍSTICAS EDUCACIÓN Y OCUPACIÓN — Valientes vs Acudientes
// =========================================================

export interface EstadisticaOcupacionAcudiente {
  ocupacion: string;
  total: number;
  porcentaje: number;
}

/** Ocupación de acudientes (trabaja_actualmente en valiente_acudiente no existe,
 *  usamos la tabla acudiente — campo no disponible directamente.
 *  Por ahora retorna datos de valiente.trabaja_estudia para acudientes
 *  cuando se implemente la tabla. Placeholder para futura extensión. */
export async function getEstadisticasOcupacionAcudientes(): Promise<EstadisticaOcupacionAcudiente[]> {
  // La tabla acudiente no tiene campo de ocupación en el esquema actual.
  // Esta función retorna vacío hasta que se agregue el campo.
  return [];
}
