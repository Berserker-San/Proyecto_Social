import { supabase } from '../supabase';
import type { ValienteDocumento } from '../../types/database.types';

const BUCKET = 'valiente-documentos';

// =========================================================
// DOCUMENTOS DEL VALIENTE
// =========================================================

/**
 * Obtiene todos los documentos registrados de un valiente.
 */
export async function getDocumentosValiente(valienteId: number): Promise<ValienteDocumento[]> {
  const { data, error } = await supabase
    .from('valiente_documento')
    .select('*')
    .eq('valiente_id', valienteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ValienteDocumento[];
}

/**
 * Genera una URL firmada (válida 60 minutos) para descargar un documento.
 * Usa la ruta almacenada en url_archivo.
 */
export async function getUrlDescarga(urlArchivo: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(urlArchivo, 3600); // 1 hora

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Sube un archivo al bucket y registra el documento en la tabla.
 * Ruta: {valienteId}/{tipo}.{ext}
 */
export async function subirDocumentoValiente(
  valienteId: number,
  tipo: 'identidad' | 'eps' | 'consentimiento',
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'pdf';
  const path = `${valienteId}/${tipo}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { error: dbError } = await supabase
    .from('valiente_documento')
    .upsert(
      {
        valiente_id: valienteId,
        tipo_documento: tipo,
        nombre_archivo: file.name,
        url_archivo: path,
        tamano_bytes: file.size,
        esta_verificado: false,
        verificado_por: null,
        verificado_en: null,
        subido_por: null,
      },
      { onConflict: 'valiente_id,tipo_documento' }
    );

  if (dbError) throw dbError;
  return path;
}

/** Etiquetas legibles por tipo de documento */
export const TIPO_DOC_LABEL: Record<string, string> = {
  identidad: 'Documento de Identidad',
  eps: 'Certificado EPS',
  consentimiento: 'Consentimiento Informado',
};
