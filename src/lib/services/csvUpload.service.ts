// =========================================================
// CSV UPLOAD SERVICE — dedup + inserción en todas las tablas
// =========================================================

import { supabase } from '../supabase';
import type { ParsedRow, RowError } from '../csv/csvParser';

export interface UploadReport {
  totalRows: number;
  insertedCount: number;
  skippedCount: number;
  failedCount: number;
  skipped: RowError[];
  failed: RowError[];
}

// ── Helpers: resolver EPS e IPS por nombre (upsert-like) ──────────────────────

async function resolveEpsId(epsNombre: string | null): Promise<number | null> {
  if (!epsNombre?.trim()) return null;

  const { data } = await supabase
    .from('eps')
    .select('id')
    .ilike('nombre', epsNombre.trim())
    .maybeSingle();

  if (data) return data.id;

  const { data: inserted, error } = await supabase
    .from('eps')
    .insert({ nombre: epsNombre.trim() })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('[csvUpload] resolveEpsId insert error:', error?.message);
    return null;
  }
  return inserted.id;
}

async function resolveIpsId(ipsNombre: string | null): Promise<number | null> {
  if (!ipsNombre?.trim()) return null;

  const { data } = await supabase
    .from('ips')
    .select('id')
    .ilike('nombre', ipsNombre.trim())
    .maybeSingle();

  if (data) return data.id;

  const { data: inserted, error } = await supabase
    .from('ips')
    .insert({ nombre: ipsNombre.trim() })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('[csvUpload] resolveIpsId insert error:', error?.message);
    return null;
  }
  return inserted.id;
}

async function resolveInstitucionId(nombre: string | null): Promise<number | null> {
  if (!nombre?.trim()) return null;

  const { data } = await supabase
    .from('institucion_educativa')
    .select('id')
    .ilike('nombre', nombre.trim())
    .maybeSingle();

  if (data) return data.id;

  const { data: inserted, error } = await supabase
    .from('institucion_educativa')
    .insert({ nombre: nombre.trim() })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('[csvUpload] resolveInstitucionId insert error:', error?.message);
    return null;
  }
  return inserted.id;
}

// ──────────────────────────────────────────────────────────────────────────────

export async function insertValientesBatch(
  rows: ParsedRow[],
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
  const allDocNums = rows.map(r => r.valiente.numero_documento);
  const { data: existing } = await supabase
    .from('valiente')
    .select('numero_documento')
    .in('numero_documento', allDocNums);

  const existingSet = new Set(
    (existing ?? []).map((r: { numero_documento: string }) => r.numero_documento)
  );

  // 2. Dedup intra-archivo
  const seenInFile = new Set<string>();
  const toInsert: Array<{ row: ParsedRow; rowNumber: number }> = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // +2: fila 1 = encabezado
    const doc = row.valiente.numero_documento;

    if (existingSet.has(doc)) {
      report.skipped.push({ rowNumber, numeroDocumento: doc, reason: 'Ya existe en base de datos' });
      report.skippedCount++;
    } else if (seenInFile.has(doc)) {
      report.skipped.push({ rowNumber, numeroDocumento: doc, reason: 'Duplicado en el archivo' });
      report.skippedCount++;
    } else {
      seenInFile.add(doc);
      toInsert.push({ row, rowNumber });
    }
  });

  // 3. Inserción de a 1 valiente a la vez para obtener el ID generado
  let processed = report.skippedCount;

  for (const { row, rowNumber } of toInsert) {
    const doc = row.valiente.numero_documento;

    // ── a. Insertar valiente principal ────────────────────
    const { data: valienteData, error: valienteError } = await supabase
      .from('valiente')
      .insert(row.valiente)
      .select('id')
      .single();

    if (valienteError || !valienteData) {
      report.failed.push({
        rowNumber,
        numeroDocumento: doc,
        reason: valienteError?.message ?? 'No se obtuvo ID del valiente insertado',
      });
      report.failedCount++;
      processed++;
      onProgress?.(processed, rows.length);
      continue;
    }

    const valienteId: number = valienteData.id;

    // ── b–f. Insertar tablas relacionadas en paralelo ─────
    const relacionadas: Promise<void>[] = [];

    // b. Ubicación
    relacionadas.push(
      Promise.resolve(
        supabase
          .from('valiente_ubicacion')
          .insert({
            valiente_id: valienteId,
            direccion:   row.ubicacion.direccion,
            estrato:     row.ubicacion.estrato,
            // ciudad_id, comuna_id, barrio_id se resuelven por nombre en el futuro
          })
      ).then(({ error }) => {
        if (error) console.error(`[csvUpload] ubicacion valiente ${valienteId}:`, error.message);
      })
    );

    // c. Salud — resolver EPS e IPS primero, luego insertar
    relacionadas.push(
      (async () => {
        const [epsId, ipsId] = await Promise.all([
          resolveEpsId(row.salud.eps_nombre),
          resolveIpsId(row.salud.ips_nombre),
        ]);
        const { eps_nombre: _eps, ips_nombre: _ips, ...saludBase } = row.salud;
        const { error } = await supabase
          .from('valiente_salud')
          .insert({ valiente_id: valienteId, ...saludBase, eps_id: epsId, ips_id: ipsId });
        if (error) console.error(`[csvUpload] salud valiente ${valienteId}:`, error.message);
      })()
    );

    // d. Educación — resolver institución primero
    relacionadas.push(
      (async () => {
        const institucionId = await resolveInstitucionId(row.educacion.institucion_nombre);
        const { institucion_nombre: _inst, ...educacionBase } = row.educacion;
        const { error } = await supabase
          .from('valiente_educacion')
          .insert({ valiente_id: valienteId, ...educacionBase, institucion_id: institucionId });
        if (error) console.error(`[csvUpload] educacion valiente ${valienteId}:`, error.message);
      })()
    );

    // e. Ocupación
    relacionadas.push(
      Promise.resolve(
        supabase
          .from('valiente_ocupacion')
          .insert({ valiente_id: valienteId, ...row.ocupacion })
      ).then(({ error }) => {
        if (error) console.error(`[csvUpload] ocupacion valiente ${valienteId}:`, error.message);
      })
    );

    // f. Contexto familiar
    relacionadas.push(
      Promise.resolve(
        supabase
          .from('valiente_contexto_familiar')
          .insert({ valiente_id: valienteId, ...row.contexto_familiar })
      ).then(({ error }) => {
        if (error) console.error(`[csvUpload] contexto_familiar valiente ${valienteId}:`, error.message);
      })
    );

    // g. Acudiente (si existe)
    if (row.acudiente && row.valiente_acudiente) {
      const acudientePayload = row.acudiente;
      const vaAcudientePayload = row.valiente_acudiente;

      relacionadas.push(
        Promise.resolve(
          supabase
            .from('acudiente')
            .insert(acudientePayload)
            .select('id')
            .single()
        ).then(({ data: acudienteData, error: acudienteError }) => {
          if (acudienteError || !acudienteData) {
            console.error(`[csvUpload] acudiente valiente ${valienteId}:`, acudienteError?.message);
            return;
          }
          return Promise.resolve(
            supabase
              .from('valiente_acudiente')
              .insert({
                valiente_id:  valienteId,
                acudiente_id: acudienteData.id,
                ...vaAcudientePayload,
              })
          ).then(({ error }) => {
            if (error) console.error(`[csvUpload] valiente_acudiente ${valienteId}:`, error.message);
          });
        })
      );
    }

    // Esperar todas las inserciones relacionadas (fallos parciales son aceptables)
    await Promise.all(relacionadas);

    report.insertedCount++;
    processed++;
    onProgress?.(processed, rows.length);
  }

  return report;
}
