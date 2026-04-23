import { supabase } from '../supabase';
import { calcularEdad } from './valientes.service';

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
    const nombre = (row.programa as { nombre: string } | null)?.nombre ?? 'Sin programa';
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
      valiente!inner ( estado )
    `)
    .eq('valiente.estado', 'ACTIVO');

  if (error) throw error;

  const conteo: Record<string, number> = {};

  for (const row of data ?? []) {
    const comuna = row.comuna_id ? String(row.comuna_id) : 'No registrada';
    conteo[comuna] = (conteo[comuna] ?? 0) + 1;
  }

  return Object.entries(conteo)
    .map(([comuna, total]) => ({ comuna, total }))
    .sort((a, b) => b.total - a.total);
}
