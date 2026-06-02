import { supabase } from '../supabase';
import type {
  ValienteUbicacion,
  ValienteSalud,
  ValienteEducacion,
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

// INSIGNIAS SOROCA
export const INSIGNIAS_SOROCA = ['Ascua', 'Fuego', 'Tierra', 'Agua', 'Aire'] as const;
export type InsigniaSoroca = typeof INSIGNIAS_SOROCA[number];

/**
 * Asigna una insignia (símbolo) al perfil SOROCA del valiente
 * y registra el evento en historial_valiente.
 */
export async function asignarInsignia(
  valienteId: number,
  insignia: InsigniaSoroca,
  fecha: string,
  registradoPor: string | null
): Promise<void> {
  // 1. Actualizar símbolo en valiente_perfil_soroca (upsert por si no existe)
  const { error: perfilError } = await supabase
    .from('valiente_perfil_soroca')
    .upsert({ valiente_id: valienteId, simbolo: insignia }, { onConflict: 'valiente_id' });

  if (perfilError) throw perfilError;

  // 2. Registrar en historial_valiente
  const { error: historialError } = await supabase
    .from('historial_valiente')
    .insert({
      valiente_id: valienteId,
      tipo_evento: 'INSIGNIA',
      categoria: 'SOROCA',
      titulo: `Insignia asignada: ${insignia}`,
      descripcion: `Se asignó la insignia "${insignia}" al valiente.`,
      fecha_evento: fecha,
      es_importante: true,
      registrado_por: registradoPor,
    });

  if (historialError) throw historialError;
}
