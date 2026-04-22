// =========================================================
// CSV UPLOAD SERVICE — dedup + inserción por lotes en Supabase
// =========================================================

import { supabase } from '../supabase';
import type { ValienteCSVRow, RowError } from '../csv/csvParser';

const BATCH_SIZE = 50;

export interface UploadReport {
  totalRows: number;
  insertedCount: number;
  skippedCount: number;
  failedCount: number;
  skipped: RowError[];
  failed: RowError[];
}

export async function insertValientesBatch(
  rows: ValienteCSVRow[],
  onProgress?: (processed: number, total: number) => void
): Promise<UploadReport> {
  const report: UploadReport = {
    totalRows: rows.length,
    insertedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    skipped: [],
    failed: [],
  };

  if (rows.length === 0) return report;

  // 1. Dedup contra BD: una sola consulta para todos los documentos
  const allDocNums = rows.map(r => r.numero_documento);
  const { data: existing } = await supabase
    .from('valiente')
    .select('numero_documento')
    .in('numero_documento', allDocNums);

  const existingSet = new Set((existing ?? []).map((r: { numero_documento: string }) => r.numero_documento));

  // 2. Dedup intra-archivo
  const seenInFile = new Set<string>();
  const toInsert: ValienteCSVRow[] = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // +2: fila 1 = encabezado
    if (existingSet.has(row.numero_documento)) {
      report.skipped.push({ rowNumber, numeroDocumento: row.numero_documento, reason: 'Ya existe en base de datos' });
      report.skippedCount++;
    } else if (seenInFile.has(row.numero_documento)) {
      report.skipped.push({ rowNumber, numeroDocumento: row.numero_documento, reason: 'Duplicado en el archivo' });
      report.skippedCount++;
    } else {
      seenInFile.add(row.numero_documento);
      toInsert.push(row);
    }
  });

  // 3. Inserción por lotes
  let processed = report.skippedCount;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from('valiente').insert(batch);

    if (error) {
      batch.forEach((row) => {
        const rowNumber = rows.indexOf(row) + 2;
        report.failed.push({ rowNumber, numeroDocumento: row.numero_documento, reason: error.message });
        report.failedCount++;
      });
    } else {
      report.insertedCount += batch.length;
    }

    processed += batch.length;
    onProgress?.(processed, rows.length);
  }

  return report;
}
