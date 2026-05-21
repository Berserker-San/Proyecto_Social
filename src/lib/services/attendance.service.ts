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
  payload: Pick<Evento, 'nombre_evento' | 'fecha' | 'hora' | 'creado_por' | 'programa_id'>
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

export async function getAsistenciaEvento(
  eventoId: number,
  programaId?: number | null
): Promise<(Valiente & { asistencia_estado: string | null; asistencia_id: number | null })[]> {

  let valienteIds: number[] | null = null;

  console.log(programaId);
  // Paso 1: si hay programa, obtener los valiente_id del programa con estado ACTIVO
  if (programaId) {
    const { data: vpData, error: vpErr } = await supabase
      .from('valiente_programa')
      .select('valiente_id')
      .eq('programa_id', programaId)
      .eq('estado', 'ACTIVO');

    if (vpErr) throw vpErr;

    valienteIds = (vpData ?? []).map((r: any) => r.valiente_id);
    if (valienteIds.length === 0) return [];
  }

  // Paso 2: traer valientes (filtrados o todos)
  let valientesQuery = supabase
    .from('valiente')
    .select('id, nombres, apellidos, numero_documento, tipo_documento, foto_url')
    .eq('estado', 'ACTIVO')
    .order('apellidos');

  if (valienteIds) {
    valientesQuery = valientesQuery.in('id', valienteIds) as typeof valientesQuery;
  }

  // Paso 3: traer asistencias existentes del evento en paralelo
  const [{ data: valientes, error: vErr }, { data: asistencias, error: aErr }] = await Promise.all([
    valientesQuery,
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
