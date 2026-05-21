import { supabase } from '../supabase';
import type {
  Valiente,
  ValienteCompleto,
  ValienteSalud,
  ValienteUbicacion,
  ValienteEducacion,
  ValienteOcupacion,
  ValienteContextoFamiliar,
  ValientePerfilDeportivo,
  ValientePrograma,
  Acudiente,
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
      ubicacion:valiente_ubicacion(*),
      salud:valiente_salud(*, eps:eps(nombre), ips:ips(nombre)),
      educacion:valiente_educacion(*, institucion_educativa:institucion_educativa(nombre)),
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

// =========================================================
// DOCUMENTOS — SUPABASE STORAGE
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
  discipline: string;
  docType: string;
  docId: string;
  firstName: string;
  lastName: string;
  sex: string;
  genderIdentity: string;
  birthDate: string;
  birthPlaceCityId: number | null;
  birthPlaceOther: string;
  birthPlaceCityName: string;
  nationality: string;
  paisId: number | null;
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
  favSubject: string;
  hardSubject: string;
  responsibilities: string;
  hobbies: string;
  workPlace: string;
  workDescription: string;
  // Salud
  epsId: number | null;
  ips: string;
  bloodType: string;
  hasDisability: string;
  disabilityDetails: string;
  hasAllergy: string;
  allergyDetails: string;
  hasMedication: string;
  medicationDetails: string;
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
  shoeSize: string;
  trainingDays: string[];
}

/**
 * Registrar o actualizar un valiente completo.
 * Busca por tipo_documento + numero_documento:
 *   - Si existe → actualiza todos sus perfiles (upsert)
 *   - Si no existe → crea el valiente y sus perfiles
 * Devuelve el valiente resultante y si fue creado o actualizado.
 */
export async function registrarValienteCompleto(
  datos: DatosRegistroCompleto
): Promise<{ valiente: Valiente; esNuevo: boolean }> {

  // ── 1. Buscar valiente existente ──────────────────────
  const existente = await buscarValientePorDocumento(datos.docType, datos.docId);

  // ── 2. Crear o actualizar valiente base ───────────────
  const datosBase: Omit<Valiente, 'id' | 'created_at' | 'updated_at' | 'nombre_completo'> = {
    tipo_documento: datos.docType,
    numero_documento: datos.docId,
    nombres: datos.firstName,
    apellidos: datos.lastName,
    apodo: null,
    fecha_nacimiento: datos.birthDate,
    sexo: datos.sex || null,
    identidad_genero: datos.genderIdentity || null,
    celular: datos.phone || null,
    telefono_fijo: null,
    email: datos.email || null,
    redes_sociales: null,
    lugar_nacimiento: datos.birthPlaceCityId === -1
      ? (datos.birthPlaceOther || null)
      : (datos.birthPlaceCityName || null),
    lugar_nacimiento_ciudad_id: datos.birthPlaceCityId !== null && datos.birthPlaceCityId !== -1 ? datos.birthPlaceCityId : null,
    nacionalidad: datos.nationality || null,
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

  // ── 3. Ubicación ──────────────────────────────────────
  const ubicacion: Omit<ValienteUbicacion, 'updated_at'> = {
    valiente_id: valienteId,
    direccion: datos.address || null,
    ciudad_id: datos.cityId ?? null,
    comuna_id: datos.communeId ?? null,
    barrio_id: null,
    estrato: datos.stratum || null,
    latitud: null,
    longitud: null,
  };
  await supabase.from('valiente_ubicacion').upsert(ubicacion);

  // ── 4. Salud ──────────────────────────────────────────
  const salud: Omit<ValienteSalud, 'updated_at'> = {
    valiente_id: valienteId,
    eps_id: datos.epsId ?? null,
    ips_id: null,
    ips_nombre: datos.ips || null,
    tipo_sangre: datos.bloodType || null,
    tiene_discapacidad: datos.hasDisability === 'Si',
    tipo_discapacidad: datos.hasDisability === 'Si' ? datos.disabilityDetails || null : null,
    diagnostico_medico: null,
    tiene_alergias: datos.hasAllergy === 'Si',
    alergias: datos.hasAllergy === 'Si' ? datos.allergyDetails || null : null,
    medicamentos_actuales: datos.hasMedication === 'Si' ? datos.medicationDetails || null : null,
    tratamiento_en_curso: null,
    contacto_emergencia_nombre: null,
    contacto_emergencia_telefono: null,
    contacto_emergencia_parentesco: null,
  };
  await supabase.from('valiente_salud').upsert(salud);

  // ── 5. Educación ──────────────────────────────────────
  const educacion: Omit<ValienteEducacion, 'updated_at'> = {
    valiente_id: valienteId,
    nivel_educativo: datos.educationLevel || null,
    grado_actual: datos.grade || null,
    jornada: null,
    institucion_id: datos.schoolId ?? null,
    materia_favorita: datos.favSubject || null,
    materia_dificil: datos.hardSubject || null,
    actividades_extracurriculares: null,
  };
  await supabase.from('valiente_educacion').upsert(educacion);

  // ── 6. Ocupación ──────────────────────────────────────
  const ocupacion: Omit<ValienteOcupacion, 'updated_at'> = {
    valiente_id: valienteId,
    esta_trabajando: ['Trabajo', 'Estudio y trabajo'].includes(datos.occupation),
    lugar_trabajo: datos.workPlace || null,
    cargo: null,
    tipo_empleo: null,
    horario_trabajo: null,
    otras_responsabilidades: datos.responsibilities || null,
    actividades_extracurriculares: null,
    hobbies: datos.hobbies || null,
    intereses_profesionales: null,
  };
  await supabase.from('valiente_ocupacion').upsert(ocupacion);

  // ── 7. Contexto familiar ──────────────────────────────
  const contexto: Omit<ValienteContextoFamiliar, 'updated_at'> = {
    valiente_id: valienteId,
    composicion_familiar: datos.familyComposition || null,
    numero_personas_hogar: datos.familyCount ? parseInt(datos.familyCount, 10) : null,
    ingreso_mensual_hogar: datos.familyIncome || null,
    es_victima_conflicto: datos.isConflictVictim === 'Si',
    esta_en_ruv: datos.isRUV === 'Si',
    etnia: datos.ethnicity === 'Otro'
      ? datos.ethnicityOther || null
      : datos.ethnicity || null,
    factores_protectores: null,
    factores_riesgo: null,
    familia_busca_empleo: false,
    detalles_buscador_empleo: null,
  };
  await supabase.from('valiente_contexto_familiar').upsert(contexto);

  // ── 8. Perfil deportivo ───────────────────────────────
  const perfilDeportivo: Omit<ValientePerfilDeportivo, 'updated_at'> = {
    valiente_id: valienteId,
    disciplina: datos.discipline || null,
    tiene_experiencia_previa: false,
    experiencia_previa: null,
    talla_guayos: datos.shoeSize || null,
    talla_camisa: datos.shirtSize || null,
    talla_pantalon: null,
    horario_entrenamiento: datos.trainingDays.length > 0 ? datos.trainingDays : null,
    disponibilidad: null,
  };
  await supabase.from('valiente_perfil_deportivo').upsert(perfilDeportivo);

  // ── 9. Programa ───────────────────────────────────────
  // Buscar el programa por código para obtener su ID
  const { data: programaData } = await supabase
    .from('programa')
    .select('id')
    .eq('codigo', datos.program)
    .maybeSingle();

  if (programaData) {
    // Verificar si ya está inscrito en este programa
    const { data: inscripcionExistente } = await supabase
      .from('valiente_programa')
      .select('id')
      .eq('valiente_id', valienteId)
      .eq('programa_id', programaData.id)
      .maybeSingle();

    if (!inscripcionExistente) {
      const programa: Omit<ValientePrograma, 'id' | 'created_at' | 'updated_at'> = {
        valiente_id: valienteId,
        programa_id: programaData.id,
        es_principal: true,
        fecha_ingreso: new Date().toISOString().split('T')[0],
        fecha_egreso: null,
        estado: 'ACTIVO',
        cohorte: null,
        nivel: null,
        sede: null,
        motivacion: datos.linkage || null,
        compromisos: null,
        transformaciones_subjetivas: null,
      };
      await supabase.from('valiente_programa').insert(programa);
    }
  }

  // ── 10. Acudiente ─────────────────────────────────────
  if (datos.guardianFullName) {
    // Buscar acudiente existente por documento
    let acudienteId: number | null = null;

    if (datos.guardianDocId) {
      const { data: acudienteExistente } = await supabase
        .from('acudiente')
        .select('id')
        .eq('tipo_documento', datos.guardianDocType)
        .eq('numero_documento', datos.guardianDocId)
        .maybeSingle();

      if (acudienteExistente) {
        acudienteId = acudienteExistente.id;
        // Actualizar datos del acudiente
        await supabase
          .from('acudiente')
          .update({
            nombre_completo: datos.guardianFullName,
            celular: datos.guardianPhone || null,
            email: datos.guardianEmail || null,
            esta_trabajando: datos.guardianWorks === 'Si',
          } as any)
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
        telefono_fijo: null,
        email: datos.guardianEmail || null,
        sexo: null,
        edad: null,
        ocupacion: null,
        tipo_empleo: null,
        grupo_vulnerabilidad: null,
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

    // Vincular acudiente al valiente si no está ya vinculado
    const { data: vinculoExistente } = await supabase
      .from('valiente_acudiente')
      .select('id')
      .eq('valiente_id', valienteId)
      .eq('acudiente_id', acudienteId)
      .maybeSingle();

    if (!vinculoExistente) {
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
