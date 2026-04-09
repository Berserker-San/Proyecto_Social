import { supabase } from '../supabase';
import type { Acudiente, ValienteAcudiente } from '../../types/database.types';

// =========================================================
// SERVICIO DE ACUDIENTES
// =========================================================

/**
 * Obtener acudientes de un valiente
 */
export async function getAcudientesPorValiente(valienteId: number) {
  const { data, error } = await supabase
    .from('valiente_acudiente')
    .select(`
      *,
      acudiente(*)
    `)
    .eq('valiente_id', valienteId);

  if (error) throw error;
  return data;
}

/**
 * Crear un nuevo acudiente
 */
export async function crearAcudiente(acudiente: Omit<Acudiente, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('acudiente')
    .insert(acudiente)
    .select()
    .single();

  if (error) throw error;
  return data as Acudiente;
}

/**
 * Vincular acudiente con valiente
 */
export async function vincularAcudiente(
  valienteId: number,
  acudienteId: number,
  relacion: Omit<ValienteAcudiente, 'id' | 'valiente_id' | 'acudiente_id' | 'created_at'>
) {
  const { data, error } = await supabase
    .from('valiente_acudiente')
    .insert({
      valiente_id: valienteId,
      acudiente_id: acudienteId,
      ...relacion,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ValienteAcudiente;
}

/**
 * Actualizar información de un acudiente
 */
export async function actualizarAcudiente(
  id: number,
  updates: Partial<Omit<Acudiente, 'id' | 'created_at'>>
) {
  const { data, error } = await supabase
    .from('acudiente')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Acudiente;
}

/**
 * Actualizar relación valiente-acudiente
 */
export async function actualizarRelacionAcudiente(
  id: number,
  updates: Partial<Omit<ValienteAcudiente, 'id' | 'valiente_id' | 'acudiente_id' | 'created_at'>>
) {
  const { data, error } = await supabase
    .from('valiente_acudiente')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ValienteAcudiente;
}

/**
 * Desvincular acudiente de valiente
 */
export async function desvincularAcudiente(relacionId: number) {
  const { error } = await supabase
    .from('valiente_acudiente')
    .delete()
    .eq('id', relacionId);

  if (error) throw error;
}
