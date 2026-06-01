import { supabase } from '../supabase';
import type { Acompanamiento, AcompanamientoConNahual } from '../../types/database.types';

// =========================================================
// SERVICIO DE ACOMPAÑAMIENTO (NAHUAL)
// =========================================================

/**
 * Obtiene todos los acompañamientos de un valiente,
 * ordenados del más reciente al más antiguo.
 * Incluye el nombre del Nahual.
 */
export async function getAcompanamientosByValiente(
  valienteId: number
): Promise<AcompanamientoConNahual[]> {
  const { data, error } = await supabase
    .from('acompanamiento')
    .select(`
      *,
      nahual:usuario_sistema ( nombre, email )
    `)
    .eq('valiente_id', valienteId)
    .order('fecha', { ascending: false });

  if (error) throw error;
  return (data ?? []) as AcompanamientoConNahual[];
}

/**
 * Crea un nuevo registro de acompañamiento.
 */
export async function crearAcompanamiento(
  payload: Omit<Acompanamiento, 'id' | 'created_at' | 'updated_at'>
): Promise<Acompanamiento> {
  const { data, error } = await supabase
    .from('acompanamiento')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as Acompanamiento;
}

/**
 * Actualiza un acompañamiento existente.
 */
export async function actualizarAcompanamiento(
  id: number,
  updates: Partial<Omit<Acompanamiento, 'id' | 'valiente_id' | 'nahual_id' | 'created_at'>>
): Promise<Acompanamiento> {
  const { data, error } = await supabase
    .from('acompanamiento')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Acompanamiento;
}

/**
 * Elimina un acompañamiento.
 */
export async function eliminarAcompanamiento(id: number): Promise<void> {
  const { error } = await supabase
    .from('acompanamiento')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
