import { supabase } from '../supabase';
import type {
  Valiente,
  ValienteCompleto,
  Acudiente,
  HistorialValiente,
} from '../../types/database.types';

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
      ubicacion:valiente_ubicacion(*, comuna:comuna(nombre)),
      salud:valiente_salud(*, eps:eps(nombre), ips:ips(nombre)),
      educacion:valiente_educacion(*, institucion_educativa:institucion_educativa(nombre)),
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
 * Eliminar un valiente y todos sus datos relacionados
 */
export async function eliminarValiente(id: number): Promise<void> {
  const tablas = [
    'valiente_salud',
    'valiente_ubicacion',
    'valiente_educacion',
    'valiente_contexto_familiar',
    'valiente_perfil_deportivo',
    'valiente_perfil_soroca',
    'valiente_programa',
    'valiente_acudiente',
    'valiente_documento',
    'asistencia'
  ];

  for (const tabla of tablas) {
    const { error } = await supabase.from(tabla).delete().eq('valiente_id', id);
    if (error && !error.message.includes('does not exist')) throw error;
  }

  const { error } = await supabase.from('valiente').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Obtener todos los eventos del historial de un valiente
 */
export async function getHistorialValiente(valienteId: number): Promise<HistorialValiente[]> {
  const { data, error } = await supabase
    .from('historial_valiente')
    .select('*')
    .eq('valiente_id', valienteId)
    .order('fecha_evento', { ascending: false });

  if (error) throw error;
  return (data ?? []) as HistorialValiente[];
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


// =========================================================
// HELPERS DE REGISTRO COMPLETO
// =========================================================

function isYes(value: string | boolean | null | undefined): boolean {
  if (typeof value === 'boolean') return value;
  return (value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'si';
}

function cleanText(value: string | null | undefined): string | null {
  const cleaned = (value ?? '').trim();
  return cleaned ? cleaned : null;
}

function getValidCatalogId(id: number | null | undefined): number | null {
  return id !== null && id !== undefined && id !== -1 ? id : null;
}

type CatalogTable = 'eps' | 'ips' | 'institucion_educativa';

async function resolveCatalogId(
  table: CatalogTable,
  selectedId: number | null | undefined,
  otherName: string | null | undefined,
  label: string
): Promise<number | null> {
  const validId = getValidCatalogId(selectedId);
  if (validId) return validId;

  if (selectedId !== -1) return null;

  const name = cleanText(otherName);
  if (!name) return null;

  const { data: existing, error: lookupError } = await supabase
    .from(table)
    .select('id')
    .ilike('nombre', name)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`No se pudo consultar ${label}: ${lookupError.message}`);
  }

  if (existing) return existing.id;

  const { data: inserted, error: insertError } = await supabase
    .from(table)
    .insert({ nombre: name })
    .select('id')
    .single();

  if (insertError || !inserted) {
    throw new Error(`No se pudo crear ${label}: ${insertError?.message ?? 'sin ID retornado'}`);
  }

  return inserted.id;
}

type OneToOneTable =
  | 'valiente_ubicacion'
  | 'valiente_salud'
  | 'valiente_educacion'
  | 'valiente_contexto_familiar'
  | 'valiente_perfil_deportivo'
  | 'valiente_perfil_soroca';

async function saveByValienteId(
  table: OneToOneTable,
  valienteId: number,
  payload: Record<string, unknown>
): Promise<void> {
  const { data: existing, error: lookupError } = await supabase
    .from(table)
    .select('valiente_id')
    .eq('valiente_id', valienteId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`No se pudo consultar ${table}: ${lookupError.message}`);
  }

  const response = existing
    ? await supabase.from(table).update(payload).eq('valiente_id', valienteId)
    : await supabase.from(table).insert(payload);

  if (response.error) {
    throw new Error(`No se pudo guardar ${table}: ${response.error.message}`);
  }
}

// =========================================================
// DOCUMENTOS - SUPABASE STORAGE
// =========================================================

const BUCKET = 'valiente-documentos';

export type TipoDocumentoArchivo = 'identidad' | 'eps' | 'consentimiento';

/**
 * Sube un archivo al bucket privado y registra la URL en valiente_documento.
 * Ruta: {valienteId}/{tipo}.{ext}
 */
export async function subirDocumentoValiente(
  valienteId: number,
  tipo: TipoDocumentoArchivo,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'pdf';
  const path = `${valienteId}/${tipo}.${ext}`;

  // Subir archivo (upsert para sobrescribir si ya existe)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  // Registrar en tabla valiente_documento
  const { error: dbError } = await supabase
    .from('valiente_documento')
    .upsert({
      valiente_id: valienteId,
      tipo_documento: tipo,
      nombre_archivo: file.name,
      url_archivo: path,
      tamano_bytes: file.size,
      esta_verificado: false,
      verificado_por: null,
      verificado_en: null,
      subido_por: null,
    }, { onConflict: 'valiente_id,tipo_documento' });

  if (dbError) throw dbError;

  return path;
}



export interface DatosRegistroCompleto {
  // Básico
  program: string;
  programType?: string;
  discipline: string;
  docType: string;
  docId: string;
  firstName: string;
  lastName: string;
  apodo: string;
  sex: string;
  genderIdentity: string;
  birthDate: string;
  birthPlaceCityId: number | null;
  birthPlaceOther: string;
  birthPlaceCityName: string;
  nationality: string;
  paisId: number | null;
  nationalityOther: string;
  phone: string;
  email: string;
  linkage: string;
  // Residencia
  address: string;
  neighborhood: string;
  cityId: number | null;
  communeId: number | null;
  stratum: string;
  // Escolaridad / Ocupación
  occupation: string;
  educationLevel: string;
  grade: string;
  schoolId: number | null;
  schoolName: string;
  schoolOther: string;
  favSubject: string;
  hardSubject: string;
  responsibilities: string;
  hobbies: string;
  workPlace: string;
  workDescription: string;
  // Salud
  epsId: number | null;
  epsOther: string;
  ipsId: number | null;
  ipsOther: string;
  bloodType: string;
  hasDisability: string;
  disabilityDetails: string;
  hasAllergy: string;
  allergyDetails: string;
  hasMedication: string;
  medicationDetails: string;
  hasTreatment: string;
  treatmentDetails: string;
  hasDiagnosis: string;
  diagnosisDetails: string;
  // Socioeconómico
  familyComposition: string;
  familyCount: string;
  familyIncome: string;
  isConflictVictim: string;
  isRUV: string;
  ethnicity: string;
  ethnicityOther: string;
  // Acudiente
  guardianDocType: string;
  guardianDocId: string;
  guardianFullName: string;
  guardianKinship: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianWorks: string;
  // Deportivo
  shirtSize: string;
  pantalonSize: string;
  shoeSize: string;
  rugbyBackground: string;
  trainingDays: string[];
}

/**
 * Registrar o actualizar un valiente completo.
 * Busca por tipo_documento + numero_documento:
 *   - Si existe -> actualiza todos sus perfiles (upsert)
 *   - Si no existe -> crea el valiente y sus perfiles
 * Devuelve el valiente resultante y si fue creado o actualizado.
 */
export async function registrarValienteCompleto(
  datos: DatosRegistroCompleto
): Promise<{ valiente: Valiente; esNuevo: boolean }> {

  // -- 1. Buscar valiente existente ----------------------
  const existente = await buscarValientePorDocumento(datos.docType, datos.docId);

  // -- 2. Crear o actualizar valiente base ---------------
  const datosBase: Omit<Valiente, 'id' | 'created_at' | 'updated_at' | 'nombre_completo'> = {
    tipo_documento: datos.docType,
    numero_documento: datos.docId,
    nombres: datos.firstName,
    apellidos: datos.lastName,
    apodo: datos.apodo || null,
    fecha_nacimiento: datos.birthDate,
    sexo: datos.sex || null,
    identidad_genero: datos.genderIdentity || null,
    celular: datos.phone || null,
    email: datos.email || null,
    lugar_nacimiento: datos.birthPlaceCityId === -1
      ? (datos.birthPlaceOther || null)
      : (datos.birthPlaceCityName || null),
    lugar_nacimiento_ciudad_id: datos.birthPlaceCityId !== null && datos.birthPlaceCityId !== -1 ? datos.birthPlaceCityId : null,
    nacionalidad: datos.paisId === -1 ? (datos.nationalityOther || null) : (datos.nationality || null),
    trabaja_estudia: datos.occupation || null,
    hobbies: datos.hobbies || null,
    estado: 'ACTIVO',
    foto_url: null,
    created_by: null,
    updated_by: null,
  };

  let valiente: Valiente;
  let esNuevo = false;

  if (existente) {
    valiente = await actualizarValiente(existente.id, datosBase);
  } else {
    valiente = await crearValiente(datosBase);
    esNuevo = true;
  }

  const valienteId = valiente.id;

  // -- 3. Ubicación ----------------------------------------
  const ubicacion = {
    valiente_id: valienteId,
    direccion: cleanText(datos.address),
    ciudad_id: getValidCatalogId(datos.cityId),
    comuna_id: getValidCatalogId(datos.communeId),
    estrato: cleanText(datos.stratum),
    latitud: null,
    longitud: null,
  };
  await saveByValienteId('valiente_ubicacion', valienteId, ubicacion);

  // -- 4. Salud -------------------------------------------
  const [epsId, ipsId] = await Promise.all([
    resolveCatalogId('eps', datos.epsId, datos.epsOther, 'la EPS'),
    resolveCatalogId('ips', datos.ipsId, datos.ipsOther, 'la IPS'),
  ]);

  const salud = {
    valiente_id: valienteId,
    eps_id: epsId,
    ips_id: ipsId,
    tipo_sangre: cleanText(datos.bloodType),
    tiene_discapacidad: isYes(datos.hasDisability),
    tipo_discapacidad: isYes(datos.hasDisability) ? cleanText(datos.disabilityDetails) : null,
    diagnostico_medico: isYes(datos.hasDiagnosis) ? cleanText(datos.diagnosisDetails) : null,
    tiene_alergias: isYes(datos.hasAllergy),
    alergias: isYes(datos.hasAllergy) ? cleanText(datos.allergyDetails) : null,
    medicamentos_actuales: isYes(datos.hasMedication) ? cleanText(datos.medicationDetails) : null,
    tratamiento_en_curso: isYes(datos.hasTreatment) ? cleanText(datos.treatmentDetails) : null,
    contacto_emergencia_nombre: null,
    contacto_emergencia_telefono: null,
    contacto_emergencia_parentesco: null,
  };
  await saveByValienteId('valiente_salud', valienteId, salud);

  // -- 5. Educación ---------------------------------------
  const institucionId = await resolveCatalogId(
    'institucion_educativa',
    datos.schoolId,
    datos.schoolOther || datos.schoolName,
    'la institución educativa'
  );

  const educacion = {
    valiente_id: valienteId,
    nivel_educativo: cleanText(datos.educationLevel),
    grado_actual: cleanText(datos.grade),
    institucion_id: institucionId,
    materia_favorita: cleanText(datos.favSubject),
    materia_dificil: cleanText(datos.hardSubject),
  };
  await saveByValienteId('valiente_educacion', valienteId, educacion);

  // -- 6. Contexto familiar -------------------------------
  const familyCount = datos.familyCount ? parseInt(datos.familyCount, 10) : null;
  const contexto = {
    valiente_id: valienteId,
    composicion_familiar: cleanText(datos.familyComposition),
    numero_personas_hogar: Number.isNaN(familyCount) ? null : familyCount,
    ingreso_mensual_hogar: cleanText(datos.familyIncome),
    es_victima_conflicto: isYes(datos.isConflictVictim),
    esta_en_ruv: isYes(datos.isRUV),
    etnia: datos.ethnicity === 'Otro'
      ? cleanText(datos.ethnicityOther)
      : cleanText(datos.ethnicity),
  };
  await saveByValienteId('valiente_contexto_familiar', valienteId, contexto);

  // -- 7. Perfil deportivo (TRIBU) o perfil SOROCA (SOROCA) ----
  if (datos.program === 'TRIBU') {
    const perfilDeportivo = {
      valiente_id: valienteId,
      disciplina: cleanText(datos.discipline),
      tiene_experiencia_previa: isYes(datos.rugbyBackground),
      experiencia_previa: isYes(datos.rugbyBackground) ? 'Experiencia previa' : null,
      talla_guayos: cleanText(datos.shoeSize),
      talla_camisa: cleanText(datos.shirtSize),
      talla_pantalon: cleanText(datos.pantalonSize),
      horario_entrenamiento: datos.trainingDays.length > 0 ? datos.trainingDays : null,
    };
    await saveByValienteId('valiente_perfil_deportivo', valienteId, perfilDeportivo);
  } else {
    // SOROCA: limpiar perfil deportivo si existía y guardar el tipo de programa en macro
    const { error: deletePerfilError } = await supabase
      .from('valiente_perfil_deportivo')
      .delete()
      .eq('valiente_id', valienteId);

    if (deletePerfilError) {
      throw new Error(`No se pudo limpiar el perfil deportivo: ${deletePerfilError.message}`);
    }

    // Guardar el tipo de programa SOROCA (Soñar, Romper, Cambiar, Mundo Cotidiano) en macro
    if (datos.programType) {
      await saveByValienteId('valiente_perfil_soroca', valienteId, {
        valiente_id: valienteId,
        macro: cleanText(datos.programType),
        simbolo: null,
        intereses_artisticos: null,
        habilidades: null,
        proyectos_personales: null,
      });
    }
  }

  // -- 8. Programa ----------------------------------------
  const { data: programaData, error: programaError } = await supabase
    .from('programa')
    .select('id')
    .eq('codigo', datos.program)
    .maybeSingle();

  if (programaError) throw programaError;

  if (programaData) {
    const nivelPrograma = datos.program === 'SOROCA'
      ? cleanText(datos.programType)
      : cleanText(datos.discipline);

    const { data: inscripcionExistente, error: inscripcionError } = await supabase
      .from('valiente_programa')
      .select('id')
      .eq('valiente_id', valienteId)
      .eq('programa_id', programaData.id)
      .maybeSingle();

    if (inscripcionError) throw inscripcionError;

    const programaPayload = {
      valiente_id: valienteId,
      programa_id: programaData.id,
      es_principal: true,
      fecha_ingreso: new Date().toISOString().split('T')[0],
      fecha_egreso: null,
      estado: 'ACTIVO',
      cohorte: null,
      nivel: nivelPrograma,
      sede: null,
      motivacion: cleanText(datos.linkage),
      compromisos: null,
      transformaciones_subjetivas: null,
    };

    if (inscripcionExistente) {
      const { error } = await supabase
        .from('valiente_programa')
        .update({
          es_principal: true,
          estado: 'ACTIVO',
          nivel: nivelPrograma,
          motivacion: cleanText(datos.linkage),
        })
        .eq('id', inscripcionExistente.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('valiente_programa').insert(programaPayload);
      if (error) throw error;
    }
  }

  // -- 10. Acudiente -------------------------------------
  if (datos.guardianFullName) {
    let acudienteId: number | null = null;

    // Paso 1: buscar si el valiente ya tiene un acudiente principal vinculado
    const { data: vinculoPrincipal } = await supabase
      .from('valiente_acudiente')
      .select('id, acudiente_id')
      .eq('valiente_id', valienteId)
      .eq('es_principal', true)
      .maybeSingle();

    if (vinculoPrincipal) {
      // Ya existe vínculo -> actualizar el acudiente existente
      acudienteId = vinculoPrincipal.acudiente_id;
      await supabase
        .from('acudiente')
        .update({
          tipo_documento: datos.guardianDocType || null,
          numero_documento: datos.guardianDocId || null,
          nombre_completo: datos.guardianFullName,
          celular: datos.guardianPhone || null,
          email: datos.guardianEmail || null,
        })
        .eq('id', acudienteId);

      // Actualizar parentesco en el vínculo
      await supabase
        .from('valiente_acudiente')
        .update({ parentesco: datos.guardianKinship || 'OTRO' })
        .eq('id', vinculoPrincipal.id);

    } else {
      // No existe vínculo -> buscar acudiente por documento o crear uno nuevo
      if (datos.guardianDocId) {
        const { data: acudientePorDoc } = await supabase
          .from('acudiente')
          .select('id')
          .eq('tipo_documento', datos.guardianDocType)
          .eq('numero_documento', datos.guardianDocId)
          .maybeSingle();

        if (acudientePorDoc) {
          acudienteId = acudientePorDoc.id;
          await supabase
            .from('acudiente')
            .update({
              nombre_completo: datos.guardianFullName,
              celular: datos.guardianPhone || null,
              email: datos.guardianEmail || null,
            })
            .eq('id', acudienteId);
        }
      }

      if (!acudienteId) {
        // Crear nuevo acudiente
        const nuevoAcudiente: Omit<Acudiente, 'id' | 'created_at' | 'updated_at'> = {
          tipo_documento: datos.guardianDocType || null,
          numero_documento: datos.guardianDocId || null,
          nombre_completo: datos.guardianFullName,
          celular: datos.guardianPhone || null,
          email: datos.guardianEmail || null,
          tiene_autorizacion_firmada: false,
        };
        const { data: acudienteCreado, error: errAcudiente } = await supabase
          .from('acudiente')
          .insert(nuevoAcudiente)
          .select('id')
          .single();

        if (errAcudiente) throw errAcudiente;
        acudienteId = acudienteCreado.id;
      }

      // Crear el vínculo
      await supabase.from('valiente_acudiente').insert({
        valiente_id: valienteId,
        acudiente_id: acudienteId,
        parentesco: datos.guardianKinship || 'OTRO',
        es_principal: true,
        es_contacto_emergencia: true,
        vive_con_valiente: false,
      });
    }
  }

  return { valiente, esNuevo };
}
