// =========================================================
// CSV UPLOAD SERVICE - dedup + insercion en tablas relacionadas
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

type NamedId = {
  id: number;
  nombre: string;
};

// =========================================================
// Helpers generales
// =========================================================

function cleanText(value: string | null | undefined): string | null {
  const cleaned = value?.trim().replace(/\s+/g, ' ') ?? '';
  return cleaned || null;
}

function getFirstNumber(value: string | null | undefined): string | null {
  const cleaned = cleanText(value);
  if (!cleaned) return null;

  const match = cleaned.match(/\d+/);
  return match?.[0] ?? null;
}

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map(value => cleanText(value))
        .filter((value): value is string => Boolean(value))
    )
  );
}

// =========================================================
// Helpers: resolver catalogos por nombre
// =========================================================

async function resolveEpsId(epsNombre: string | null): Promise<number | null> {
  const nombre = cleanText(epsNombre);
  if (!nombre) return null;

  const { data } = await supabase
    .from('eps')
    .select('id')
    .ilike('nombre', nombre)
    .maybeSingle();

  if (data) return data.id;

  const { data: inserted, error } = await supabase
    .from('eps')
    .insert({ nombre })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('[csvUpload] resolveEpsId insert error:', error?.message);
    return null;
  }

  return inserted.id;
}

async function resolveIpsId(ipsNombre: string | null): Promise<number | null> {
  const nombre = cleanText(ipsNombre);
  if (!nombre) return null;

  const { data } = await supabase
    .from('ips')
    .select('id')
    .ilike('nombre', nombre)
    .maybeSingle();

  if (data) return data.id;

  const { data: inserted, error } = await supabase
    .from('ips')
    .insert({ nombre })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('[csvUpload] resolveIpsId insert error:', error?.message);
    return null;
  }

  return inserted.id;
}

async function resolveInstitucionId(nombre: string | null): Promise<number | null> {
  const nombreLimpio = cleanText(nombre);
  if (!nombreLimpio) return null;

  const { data } = await supabase
    .from('institucion_educativa')
    .select('id')
    .ilike('nombre', nombreLimpio)
    .maybeSingle();

  if (data) return data.id;

  const { data: inserted, error } = await supabase
    .from('institucion_educativa')
    .insert({ nombre: nombreLimpio })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('[csvUpload] resolveInstitucionId insert error:', error?.message);
    return null;
  }

  return inserted.id;
}

// =========================================================
// Helpers: resolver ubicacion
// =========================================================

async function resolveCiudadId(ciudadNombre: string | null): Promise<number | null> {
  const nombre = cleanText(ciudadNombre);
  if (!nombre) return null;

  const exact = await findCiudadByPattern(nombre);
  if (exact) return exact.id;

  const partial = await findCiudadByPattern(`%${nombre}%`);
  if (partial) return partial.id;

  console.warn(`[csvUpload] resolveCiudadId: ciudad '${nombre}' no encontrada`);
  return null;
}

async function findCiudadByPattern(pattern: string): Promise<NamedId | null> {
  const { data, error } = await supabase
    .from('ciudad')
    .select('id, nombre')
    .ilike('nombre', pattern)
    .limit(1);

  if (error) {
    console.error('[csvUpload] findCiudadByPattern error:', error.message);
    return null;
  }

  return data?.[0] ?? null;
}

async function resolveComunaId(
  comunaRaw: string | null,
  ciudadId: number | null
): Promise<number | null> {
  const comuna = cleanText(comunaRaw);
  if (!comuna) {
    console.log('[csvUpload] resolveComunaId: comuna vacia');
    return null;
  }

  const numero = getFirstNumber(comuna);
  const esSoloNumero = /^\d+$/.test(comuna);
  const patterns = unique([
    numero ? `Comuna ${numero} -%` : null,
    numero ? `Comuna ${numero} %` : null,
    numero ? `Comuna ${numero}` : null,
    esSoloNumero ? null : comuna,
    esSoloNumero ? null : `%${comuna}%`,
  ]);

  for (const pattern of patterns) {
    const result = await findComunaByPattern(pattern, ciudadId);
    if (result) {
      console.log(`[csvUpload] resolveComunaId: comuna encontrada '${result.nombre}', id=${result.id}`);
      return result.id;
    }
  }

  // Fallback: si la ciudad no coincidio con la comuna real, busca sin ciudad.
  if (ciudadId) {
    for (const pattern of patterns) {
      const result = await findComunaByPattern(pattern, null);
      if (result) {
        console.log(`[csvUpload] resolveComunaId: comuna encontrada sin filtro ciudad '${result.nombre}', id=${result.id}`);
        return result.id;
      }
    }
  }

  console.warn(`[csvUpload] resolveComunaId: comuna '${comuna}' no encontrada`);
  return null;
}

async function findComunaByPattern(
  pattern: string,
  ciudadId: number | null
): Promise<NamedId | null> {
  let query = supabase
    .from('comuna')
    .select('id, nombre')
    .ilike('nombre', pattern);

  if (ciudadId) {
    query = query.eq('ciudad_id', ciudadId);
  }

  const { data, error } = await query.order('id', { ascending: true }).limit(1);

  if (error) {
    console.error('[csvUpload] findComunaByPattern error:', error.message);
    return null;
  }

  return data?.[0] ?? null;
}

async function resolveBarrioId(
  barrioNombre: string | null,
  ciudadId: number | null,
  comunaId: number | null
): Promise<number | null> {
  const barrio = cleanText(barrioNombre);
  if (!barrio) return null;

  const barrioSinPrefijo = barrio.replace(/^barrio\s+/i, '').trim();
  const patterns = unique([
    barrio,
    barrioSinPrefijo,
    `%${barrio}%`,
    barrioSinPrefijo ? `%${barrioSinPrefijo}%` : null,
  ]);

  for (const pattern of patterns) {
    const result = await findBarrioByPattern(pattern, ciudadId, comunaId);
    if (result) {
      console.log(`[csvUpload] resolveBarrioId: barrio encontrado '${result.nombre}', id=${result.id}`);
      return result.id;
    }
  }

  // Fallback: si no se encontro por comuna, busca solo por nombre.
  if (comunaId) {
    for (const pattern of patterns) {
      const result = await findBarrioByPattern(pattern, ciudadId, null);
      if (result) {
        console.log(`[csvUpload] resolveBarrioId: barrio encontrado sin filtro comuna '${result.nombre}', id=${result.id}`);
        return result.id;
      }
    }
  }

  console.warn(`[csvUpload] resolveBarrioId: barrio '${barrio}' no encontrado`);
  return null;
}

async function findBarrioByPattern(
  pattern: string,
  ciudadId: number | null,
  comunaId: number | null
): Promise<NamedId | null> {
  let query = supabase
    .from('barrio')
    .select('id, nombre')
    .ilike('nombre', pattern);

  if (ciudadId) {
    query = query.eq('ciudad_id', ciudadId);
  }

  if (comunaId) {
    query = query.eq('comuna_id', comunaId);
  }

  const { data, error } = await query.order('id', { ascending: true }).limit(1);

  if (error) {
    console.error('[csvUpload] findBarrioByPattern error:', error.message);
    return null;
  }

  return data?.[0] ?? null;
}

// =========================================================
// Insercion principal
// =========================================================

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

  // 1. Dedup contra BD: una sola consulta para todos los documentos.
  const allDocNums = Array.from(
    new Set(
      rows
        .map(row => cleanText(row.valiente.numero_documento))
        .filter((doc): doc is string => Boolean(doc))
    )
  );

  let existing: Array<{ numero_documento: string }> = [];

  if (allDocNums.length > 0) {
    const { data, error } = await supabase
      .from('valiente')
      .select('numero_documento')
      .in('numero_documento', allDocNums);

    if (error) {
      console.error('[csvUpload] consulta duplicados BD:', error.message);
    }

    existing = data ?? [];
  }

  const existingSet = new Set(existing.map(row => row.numero_documento));

  // 2. Dedup intra-archivo.
  const seenInFile = new Set<string>();
  const toInsert: Array<{ row: ParsedRow; rowNumber: number }> = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2;
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

  // 3. Insercion de a 1 valiente para obtener el ID generado.
  let processed = report.skippedCount;

  for (const { row, rowNumber } of toInsert) {
    const doc = row.valiente.numero_documento;

    // a. Insertar valiente principal.
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
    const relacionadas: Promise<void>[] = [];

    // b. Ubicacion: resuelve ciudad, comuna y barrio desde el texto del CSV.
    relacionadas.push(
      (async () => {
        try {
          const ciudadId = await resolveCiudadId(row.ubicacion.ciudad_nombre);
          const comunaId = await resolveComunaId(row.ubicacion.comuna_numero, ciudadId);
          const barrioId = await resolveBarrioId(row.ubicacion.barrio_nombre, ciudadId, comunaId);

          const { data, error } = await supabase
            .from('valiente_ubicacion')
            .upsert({
              valiente_id: valienteId,
              direccion: row.ubicacion.direccion,
              estrato: row.ubicacion.estrato,
              ciudad_id: ciudadId,
              comuna_id: comunaId,
              barrio_id: barrioId,
            })
            .select();

          if (error) {
            console.error(`[csvUpload] ubicacion valiente ${valienteId}:`, error.message);
          } else {
            console.log(`[csvUpload] ubicacion insertada OK valiente ${valienteId}:`, data);
          }
        } catch (err) {
          console.error(`[csvUpload] exception ubicacion valiente ${valienteId}:`, err);
        }
      })()
    );

    // c. Salud: resolver EPS e IPS primero, luego insertar.
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

    // d. Educacion: resolver institucion primero.
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

    // e. Contexto familiar.
    relacionadas.push(
      Promise.resolve(
        supabase
          .from('valiente_contexto_familiar')
          .insert({ valiente_id: valienteId, ...row.contexto_familiar })
      ).then(({ error }) => {
        if (error) console.error(`[csvUpload] contexto_familiar valiente ${valienteId}:`, error.message);
      })
    );

    // f. Programa: buscar programa por codigo y vincular al valiente.
    relacionadas.push(
      (async () => {
        const { data: programaData, error: programaError } = await supabase
          .from('programa')
          .select('id')
          .eq('codigo', row.programa.programa_codigo)
          .maybeSingle();

        if (programaError) {
          console.error(`[csvUpload] programa ${row.programa.programa_codigo}:`, programaError.message);
          return;
        }

        if (!programaData) {
          console.warn(`[csvUpload] programa '${row.programa.programa_codigo}' no encontrado para valiente ${valienteId}`);
          return;
        }

        const { error } = await supabase
          .from('valiente_programa')
          .insert({
            valiente_id: valienteId,
            programa_id: programaData.id,
            es_principal: true,
            fecha_ingreso: new Date().toISOString().split('T')[0],
            fecha_egreso: null,
            estado: 'ACTIVO',
            cohorte: null,
            nivel: row.programa.tipo_programa || null,
            sede: null,
            motivacion: null,
            compromisos: null,
            transformaciones_subjetivas: null,
          });

        if (error) console.error(`[csvUpload] valiente_programa ${valienteId}:`, error.message);
      })()
    );

    // g. Perfil deportivo: solo si es TRIBU.
    if (row.perfil_deportivo) {
      relacionadas.push(
        Promise.resolve(
          supabase
            .from('valiente_perfil_deportivo')
            .insert({
              valiente_id: valienteId,
              disciplina: row.perfil_deportivo.disciplina,
              tiene_experiencia_previa: false,
              experiencia_previa: null,
              talla_guayos: row.perfil_deportivo.talla_guayos,
              talla_camisa: row.perfil_deportivo.talla_camisa,
              talla_pantalon: row.perfil_deportivo.talla_pantalon,
              horario_entrenamiento: null,
            })
        ).then(({ error }) => {
          if (error) console.error(`[csvUpload] perfil_deportivo valiente ${valienteId}:`, error.message);
        })
      );
    }

    // h. Acudiente: si existe en el CSV.
    if (row.acudiente && row.valiente_acudiente) {
      const acudientePayload = row.acudiente;
      const vaAcudientePayload = row.valiente_acudiente;

      const {
        sexo: _sexo,
        edad: _edad,
        ocupacion: _ocupacion,
        tipo_empleo: _tipoEmpleo,
        grupo_vulnerabilidad: _grupoVulnerabilidad,
        ...acudienteParaInsertar
      } = acudientePayload;

      relacionadas.push(
        Promise.resolve(
          supabase
            .from('acudiente')
            .insert(acudienteParaInsertar)
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
                valiente_id: valienteId,
                acudiente_id: acudienteData.id,
                ...vaAcudientePayload,
              })
          ).then(({ error }) => {
            if (error) console.error(`[csvUpload] valiente_acudiente ${valienteId}:`, error.message);
          });
        })
      );
    }

    // i. Documentos: insertar URLs de documentos del CSV.
    if (row.documentos) {
      const docs: Array<{ tipo: string; url: string }> = [];

      if (row.documentos.documento_identidad_url) {
        docs.push({ tipo: 'identidad', url: row.documentos.documento_identidad_url });
      }
      if (row.documentos.eps_url) {
        docs.push({ tipo: 'eps', url: row.documentos.eps_url });
      }
      if (row.documentos.consentimiento_url) {
        docs.push({ tipo: 'consentimiento', url: row.documentos.consentimiento_url });
      }

      for (const doc of docs) {
        relacionadas.push(
          Promise.resolve(
            supabase
              .from('valiente_documento')
              .upsert({
                valiente_id: valienteId,
                tipo_documento: doc.tipo,
                nombre_archivo: null,
                url_archivo: doc.url,
                tamano_bytes: null,
                esta_verificado: false,
                verificado_por: null,
                verificado_en: null,
                subido_por: null,
              }, { onConflict: 'valiente_id,tipo_documento' })
          ).then(({ error }) => {
            if (error) console.error(`[csvUpload] documento ${doc.tipo} valiente ${valienteId}:`, error.message);
          })
        );
      }
    }

    await Promise.all(relacionadas);

    report.insertedCount++;
    processed++;
    onProgress?.(processed, rows.length);
  }

  return report;
}
