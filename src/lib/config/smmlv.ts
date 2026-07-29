// =========================================================
// SALARIO MÍNIMO MENSUAL LEGAL VIGENTE (SMMLV)
//
// Para actualizar el valor al año siguiente:
//   1. Agrega una nueva entrada en SMMLV_HISTORICO.
//   2. Actualiza SMMLV_VIGENTE apuntando a la nueva entrada.
//   No es necesario modificar ningún otro archivo.
// =========================================================

interface SmmlvEntry {
  anio: number;
  valor: number;  // en pesos colombianos
}

/** Histórico de valores para preservar la interpretación de registros anteriores. */
export const SMMLV_HISTORICO: SmmlvEntry[] = [
  { anio: 2024, valor: 1_300_000 },
  { anio: 2025, valor: 1_423_500 },
  { anio: 2026, valor: 1_750_905 },
];

/** Valor vigente — apunta siempre al último año del histórico. */
export const SMMLV_VIGENTE: SmmlvEntry =
  SMMLV_HISTORICO[SMMLV_HISTORICO.length - 1];

/** Formatea el valor como moneda colombiana: "$1.750.905" */
export function formatSmmlv(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`;
}

/**
 * Etiqueta completa para mostrar en formularios y reportes.
 * Ejemplo: "1 SMMLV (2026 · $1.750.905)"
 */
export function labelSmmlv(multiplicador: number | string, entry = SMMLV_VIGENTE): string {
  const formatted = formatSmmlv(entry.valor);
  return `${multiplicador} SMMLV (${entry.anio} · ${formatted})`;
}

/**
 * Rangos de ingreso con sus etiquetas de visualización.
 * El value es el texto que se guarda en DB (compatible con registros históricos).
 * El label es lo que ve el usuario en la UI.
 */
export interface RangoIngreso {
  value: string;   // guardado en ingreso_mensual_hogar — NO cambia entre años
  label: string;   // texto visible — incluye el año y valor de referencia actual
}

export function getRangosIngreso(entry = SMMLV_VIGENTE): RangoIngreso[] {
  const ref = `${entry.anio} · ${formatSmmlv(entry.valor)}`;
  return [
    { value: 'Menos de 1 SMMLV', label: `Menos de 1 SMMLV (${ref})` },
    { value: '1 SMMLV',          label: `1 SMMLV (${ref})`           },
    { value: '2 SMMLV',          label: `2 SMMLV (${ref})`           },
    { value: 'Más de 2 SMMLV',   label: `Más de 2 SMMLV (${ref})`   },
  ];
}

/**
 * Orden canónico de los rangos para gráficos y reportes.
 * Los valores en DB son estables — no cambian con el año.
 */
export const ORDEN_RANGOS_INGRESO = [
  'Menos de 1 SMMLV',
  '1 SMMLV',
  '2 SMMLV',
  'Más de 2 SMMLV',
] as const;

/**
 * Nombre de la columna del CSV que contiene el ingreso mensual del hogar.
 * Incluye el año y valor de referencia del SMMLV vigente.
 * Se usa para que la plantilla CSV siempre refleje el año actual.
 */
export function csvColumnIngresoMensual(entry = SMMLV_VIGENTE): string {
  return `Ingresos Familiares mensuales   (salario mínimo vigente a ${entry.anio} ${formatSmmlv(entry.valor)})`;
}
