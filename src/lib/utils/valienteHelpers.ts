import type { Valiente } from '../../types/database.types';

// =========================================================
// TIPOS
// =========================================================

/**
 * Subconjunto ligero de Valiente usado en la lista del directorio.
 * Incluye los campos de identificación y presentación, más los programas
 * opcionales para mostrar badges.
 */
export type ValienteListItem = Pick<
  Valiente,
  | 'id'
  | 'nombres'
  | 'apellidos'
  | 'nombre_completo'
  | 'numero_documento'
  | 'tipo_documento'
  | 'foto_url'
  | 'estado'
> & {
  programas?: Array<{
    programa: { codigo: string };
  }>;
};

// =========================================================
// HELPERS DE PRESENTACIÓN
// =========================================================

/**
 * Retorna el nombre completo del valiente.
 * Usa `nombre_completo` si está disponible; de lo contrario concatena
 * `nombres` y `apellidos`.
 *
 * Acepta tanto `Valiente` completo como `ValienteListItem` (subconjunto),
 * ya que solo necesita los campos `nombre_completo`, `nombres` y `apellidos`.
 */
export function getNombreCompleto(
  v: Pick<Valiente, 'nombre_completo' | 'nombres' | 'apellidos'>
): string {
  return v.nombre_completo ?? `${v.nombres} ${v.apellidos}`;
}

/**
 * Retorna los códigos de programa a los que pertenece el valiente.
 * Retorna un array vacío si no tiene programas o si `programas` es undefined.
 */
export function getProgramaCodes(v: ValienteListItem): string[] {
  return v.programas?.map((p) => p.programa.codigo) ?? [];
}
