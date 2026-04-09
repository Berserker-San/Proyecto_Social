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
export async function getComunas(ciudadId: number) {
  const { data, error } = await supabase
    .from('comuna')
    .select('*')
    .eq('ciudad_id', ciudadId)
    .order('nombre');

  if (error) throw error;
  return data as Comuna[];
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
