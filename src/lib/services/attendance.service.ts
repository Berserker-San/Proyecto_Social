import { supabase } from '../supabase';
import type { Evento, Asistencia, Valiente } from '../../types/database.types';

// ── Eventos ───────────────────────────────────────────────────────────────

export async function getEventos(): Promise<Evento[]> {
  const { data, error } = await supabase
    .from('evento')
    .select('*')
    .order('fecha', { ascending: false })
    .order('hora',  { ascending: false });

  if (error) throw error;
  return data as Evento[];
}

export async function crearEvento(
  payload: Pick<Evento, 'nombre_evento' | 'fecha' | 'hora' | 'creado_por'>
): Promise<Evento> {
  const { data, error } = await supabase
    .from('evento')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as Evento;
}

export async function eliminarEvento(id: number): Promise<void> {
  const { error } = await supabase.from('evento').delete().eq('id', id);
  if (error) throw error;
}

// ── Asistencia ────────────────────────────────────────────────────────────

/** Devuelve todos los valientes activos con su estado de asistencia para un evento */
export async function getAsistenciaEvento(
  eventoId: number
): Promise<(Valiente & { asistencia_estado: string | null; asistencia_id: number | null })[]> {
  const [{ data: valientes, error: vErr }, { data: asistencias, error: aErr }] = await Promise.all([
    supabase
      .from('valiente')
      .select('id, nombres, apellidos, numero_documento, tipo_documento, foto_url')
      .eq('estado', 'ACTIVO')
      .order('apellidos'),
    supabase
      .from('asistencia')
      .select('id, valiente_id, estado')
      .eq('evento_id', eventoId),
  ]);

  if (vErr) throw vErr;
  if (aErr) throw aErr;

  const asistenciaMap = new Map<number, { id: number; estado: string }>();
  for (const a of asistencias ?? []) {
    asistenciaMap.set(a.valiente_id, { id: a.id, estado: a.estado });
  }

  return (valientes ?? []).map(v => ({
    ...(v as unknown as Valiente),
    asistencia_estado: asistenciaMap.get(v.id)?.estado ?? null,
    asistencia_id:     asistenciaMap.get(v.id)?.id     ?? null,
  }));
}

/** Registra o actualiza la asistencia de un valiente en un evento */
export async function upsertAsistencia(
  eventoId: number,
  valienteId: number,
  estado: string
): Promise<Asistencia> {
  const { data, error } = await supabase
    .from('asistencia')
    .upsert(
      { evento_id: eventoId, valiente_id: valienteId, estado },
      { onConflict: 'evento_id,valiente_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as Asistencia;
}
