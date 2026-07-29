import { supabase } from '../supabase';
import type {
  Pais,
  Ciudad,
  Comuna,
  Barrio,
  InstitucionEducativa,
  EPS,
  IPS,
} from '../../types/database.types';

// =========================================================
// SERVICIO DE CATÁLOGOS
// =========================================================

// PAÍSES
export async function getPaises() {
  const { data, error } = await supabase
    .from('pais')
    .select('*')
    .order('nombre');

  if (error) throw error;
  return data as Pais[];
}

// CIUDADES
export async function getCiudades(paisId?: number) {
  let query = supabase
    .from('ciudad')
    .select('*')
    .order('nombre');

  if (paisId) {
    query = query.eq('pais_id', paisId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Ciudad[];
}

// COMUNAS
/**
 * Extrae el número de una comuna a partir de su nombre en DB.
 * Ejemplos:
 *   "Comuna 1 - Sucre"  → "Comuna 1"
 *   "Comuna 12"         → "Comuna 12"
 *   "Corregimiento X"   → "Corregimiento X"  (sin número inicial → sin cambio)
 */
export function formatComuna(nombre: string): string {
  const match = nombre.match(/^(Comuna\s+\d+)/i);
  return match ? match[1] : nombre;
}

/** Extrae el número entero de una comuna para ordenamiento numérico. */
function comunaNumero(nombre: string): number {
  const match = nombre.match(/\d+/);
  return match ? parseInt(match[0], 10) : Infinity;
}

export async function getComunas(ciudadId: number) {
  const { data, error } = await supabase
    .from('comuna')
    .select('*')
    .eq('ciudad_id', ciudadId);

  if (error) throw error;

  // Ordenar numéricamente por el número de la comuna
  const comunas = (data as Comuna[]).sort(
    (a, b) => comunaNumero(a.nombre) - comunaNumero(b.nombre)
  );
  return comunas;
}

// BARRIOS
export async function getBarrios(ciudadId?: number, comunaId?: number) {
  let query = supabase
    .from('barrio')
    .select('*')
    .order('nombre');

  if (ciudadId) {
    query = query.eq('ciudad_id', ciudadId);
  }
  if (comunaId) {
    query = query.eq('comuna_id', comunaId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Barrio[];
}

// INSTITUCIONES EDUCATIVAS
export async function getInstitucionesEducativas(ciudadId?: number) {
  let query = supabase
    .from('institucion_educativa')
    .select('*')
    .order('nombre');

  if (ciudadId) {
    query = query.eq('ciudad_id', ciudadId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as InstitucionEducativa[];
}

// EPS
export async function getEPS() {
  const { data, error } = await supabase
    .from('eps')
    .select('*')
    .order('nombre');

  if (error) throw error;
  return data as EPS[];
}

// IPS
export async function getIPS(epsId?: number, ciudadId?: number) {
  let query = supabase
    .from('ips')
    .select('*')
    .order('nombre');

  if (epsId) {
    query = query.eq('eps_id', epsId);
  }
  if (ciudadId) {
    query = query.eq('ciudad_id', ciudadId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as IPS[];
}
