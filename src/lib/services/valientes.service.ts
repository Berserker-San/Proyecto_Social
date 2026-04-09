import { supabase } from '../supabase';
import type { Valiente, ValienteCompleto } from '../../types/database.types';

// =========================================================
// SERVICIO DE VALIENTES
// =========================================================

/**
 * Obtener todos los valientes con información básica
 */
export async function getValientes() {
  const { data, error } = await supabase
    .from('valiente')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Valiente[];
}

/**
 * Obtener un valiente por ID con toda su información
 */
export async function getValienteById(id: number) {
  const { data, error } = await supabase
    .from('valiente')
    .select(`
      *,
      ubicacion:valiente_ubicacion(*),
      salud:valiente_salud(*),
      educacion:valiente_educacion(*),
      ocupacion:valiente_ocupacion(*),
      contexto_familiar:valiente_contexto_familiar(*),
      acudientes:valiente_acudiente(
        *,
        acudiente(*)
      ),
      programas:valiente_programa(
        *,
        programa(*)
      ),
      perfil_deportivo:valiente_perfil_deportivo(*),
      perfil_soroca:valiente_perfil_soroca(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ValienteCompleto;
}

/**
 * Buscar valientes por documento
 */
export async function buscarValientePorDocumento(
  tipoDocumento: string,
  numeroDocumento: string
) {
  const { data, error } = await supabase
    .from('valiente')
    .select('*')
    .eq('tipo_documento', tipoDocumento)
    .eq('numero_documento', numeroDocumento)
    .maybeSingle();

  if (error) throw error;
  return data as Valiente | null;
}

/**
 * Crear un nuevo valiente (solo información básica)
 */
export async function crearValiente(valiente: Omit<Valiente, 'id' | 'created_at' | 'updated_at' | 'nombre_completo'>) {
  const { data, error } = await supabase
    .from('valiente')
    .insert(valiente)
    .select()
    .single();

  if (error) throw error;
  return data as Valiente;
}

/**
 * Actualizar información básica de un valiente
 */
export async function actualizarValiente(
  id: number,
  updates: Partial<Omit<Valiente, 'id' | 'created_at' | 'nombre_completo'>>
) {
  const { data, error } = await supabase
    .from('valiente')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Valiente;
}

/**
 * Calcular edad de un valiente
 */
export function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
}
