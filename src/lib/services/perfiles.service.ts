import { supabase } from '../supabase';
import type {
  ValienteUbicacion,
  ValienteSalud,
  ValienteEducacion,
  ValienteOcupacion,
  ValienteContextoFamiliar,
  ValientePerfilDeportivo,
  ValientePerfilSoroca,
} from '../../types/database.types';

// =========================================================
// SERVICIO DE PERFILES DEL VALIENTE
// =========================================================

// UBICACIÓN
export async function guardarUbicacion(ubicacion: Omit<ValienteUbicacion, 'updated_at'>) {
  const { data, error } = await supabase
    .from('valiente_ubicacion')
    .upsert(ubicacion)
    .select()
    .single();

  if (error) throw error;
  return data as ValienteUbicacion;
}

export async function getUbicacion(valienteId: number) {
  const { data, error } = await supabase
    .from('valiente_ubicacion')
    .select('*')
    .eq('valiente_id', valienteId)
    .maybeSingle();

  if (error) throw error;
  return data as ValienteUbicacion | null;
}

// SALUD
export async function guardarSalud(salud: Omit<ValienteSalud, 'updated_at'>) {
  const { data, error } = await supabase
    .from('valiente_salud')
    .upsert(salud)
    .select()
    .single();

  if (error) throw error;
  return data as ValienteSalud;
}

export async function getSalud(valienteId: number) {
  const { data, error } = await supabase
    .from('valiente_salud')
    .select('*')
    .eq('valiente_id', valienteId)
    .maybeSingle();

  if (error) throw error;
  return data as ValienteSalud | null;
}

// EDUCACIÓN
export async function guardarEducacion(educacion: Omit<ValienteEducacion, 'updated_at'>) {
  const { data, error } = await supabase
    .from('valiente_educacion')
    .upsert(educacion)
    .select()
    .single();

  if (error) throw error;
  return data as ValienteEducacion;
}

export async function getEducacion(valienteId: number) {
  const { data, error } = await supabase
    .from('valiente_educacion')
    .select('*')
    .eq('valiente_id', valienteId)
    .maybeSingle();

  if (error) throw error;
  return data as ValienteEducacion | null;
}

// OCUPACIÓN
export async function guardarOcupacion(ocupacion: Omit<ValienteOcupacion, 'updated_at'>) {
  const { data, error } = await supabase
    .from('valiente_ocupacion')
    .upsert(ocupacion)
    .select()
    .single();

  if (error) throw error;
  return data as ValienteOcupacion;
}

export async function getOcupacion(valienteId: number) {
  const { data, error } = await supabase
    .from('valiente_ocupacion')
    .select('*')
    .eq('valiente_id', valienteId)
    .maybeSingle();

  if (error) throw error;
  return data as ValienteOcupacion | null;
}

// CONTEXTO FAMILIAR
export async function guardarContextoFamiliar(contexto: Omit<ValienteContextoFamiliar, 'updated_at'>) {
  const { data, error } = await supabase
    .from('valiente_contexto_familiar')
    .upsert(contexto)
    .select()
    .single();

  if (error) throw error;
  return data as ValienteContextoFamiliar;
}

export async function getContextoFamiliar(valienteId: number) {
  const { data, error } = await supabase
    .from('valiente_contexto_familiar')
    .select('*')
    .eq('valiente_id', valienteId)
    .maybeSingle();

  if (error) throw error;
  return data as ValienteContextoFamiliar | null;
}

// PERFIL DEPORTIVO
export async function guardarPerfilDeportivo(perfil: Omit<ValientePerfilDeportivo, 'updated_at'>) {
  const { data, error } = await supabase
    .from('valiente_perfil_deportivo')
    .upsert(perfil)
    .select()
    .single();

  if (error) throw error;
  return data as ValientePerfilDeportivo;
}

export async function getPerfilDeportivo(valienteId: number) {
  const { data, error } = await supabase
    .from('valiente_perfil_deportivo')
    .select('*')
    .eq('valiente_id', valienteId)
    .maybeSingle();

  if (error) throw error;
  return data as ValientePerfilDeportivo | null;
}

// PERFIL SOROCA
export async function guardarPerfilSoroca(perfil: Omit<ValientePerfilSoroca, 'updated_at'>) {
  const { data, error } = await supabase
    .from('valiente_perfil_soroca')
    .upsert(perfil)
    .select()
    .single();

  if (error) throw error;
  return data as ValientePerfilSoroca;
}

export async function getPerfilSoroca(valienteId: number) {
  const { data, error } = await supabase
    .from('valiente_perfil_soroca')
    .select('*')
    .eq('valiente_id', valienteId)
    .maybeSingle();

  if (error) throw error;
  return data as ValientePerfilSoroca | null;
}
