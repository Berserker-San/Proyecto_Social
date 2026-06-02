// =========================================================
// TIPOS DE BASE DE DATOS
// Sincronizado con esquema Supabase — Mayo 2026
// =========================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// =========================================================
// CATÁLOGOS
// =========================================================

export interface Pais {
  id: number;
  nombre: string;
  codigo_iso: string | null;
  created_at: string | null;
}

export interface Ciudad {
  id: number;
  nombre: string;
  departamento: string | null;
  pais_id: number | null;
  created_at: string | null;
}

export interface Comuna {
  id: number;
  ciudad_id: number | null;
  nombre: string;
  created_at: string | null;
}

export interface InstitucionEducativa {
  id: number;
  nombre: string;
  tipo: string | null;
  ciudad_id: number | null;
  created_at: string | null;
}

export interface EPS {
  id: number;
  nombre: string;
  codigo: string | null;
  created_at: string | null;
}

export interface IPS {
  id: number;
  nombre: string;
  eps_id: number | null;
  ciudad_id: number | null;
  created_at: string | null;
}

export interface Barrio {
  id: number;
  nombre: string;
  ciudad_id: number | null;
  comuna_id: number | null;
  created_at: string | null;
}

// =========================================================
// SEGURIDAD Y USUARIOS
// =========================================================

export interface Rol {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  created_at: string | null;
}

export interface Permiso {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  modulo: string | null;
  created_at: string | null;
}

export interface RolPermiso {
  rol_id: number;
  permiso_id: number;
}

export interface UsuarioSistema {
  id: string;
  auth_user_id: string | null;
  nombre: string;
  email: string;
  telefono: string | null;
  is_active: boolean | null;
  last_login: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UsuarioRol {
  usuario_id: string;
  rol_id: number;
  asignado_por: string | null;
  asignado_en: string | null;
}

// =========================================================
// VALIENTE (Entidad Principal)
// =========================================================

export interface Valiente {
  id: number;

  // Identificación
  tipo_documento: string;
  numero_documento: string;

  // Información Personal
  nombres: string;
  apellidos: string;
  nombre_completo?: string | null; // Generado por trigger
  apodo: string | null;

  // Datos Demográficos
  fecha_nacimiento: string;
  sexo: string | null;
  identidad_genero: string | null;

  // Contacto
  celular: string | null;
  email: string | null;

  // Ubicación de Nacimiento
  lugar_nacimiento: string | null;
  lugar_nacimiento_ciudad_id: number | null;
  nacionalidad: string | null;

  // Ocupación
  trabaja_estudia: string | null;
  hobbies: string | null;

  // Estado
  estado: string | null;
  foto_url: string | null;

  // Auditoría
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// =========================================================
// ACUDIENTES
// =========================================================

export interface Acudiente {
  id: number;
  tipo_documento: string | null;
  numero_documento: string | null;
  nombre_completo: string;
  celular: string | null;
  email: string | null;
  tiene_autorizacion_firmada: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ValienteAcudiente {
  id: number;
  valiente_id: number | null;
  acudiente_id: number | null;
  parentesco: string;
  es_principal: boolean | null;
  es_contacto_emergencia: boolean | null;
  vive_con_valiente: boolean | null;
  created_at: string | null;
}

// =========================================================
// PERFILES DEL VALIENTE
// =========================================================

export interface ValienteUbicacion {
  valiente_id: number;
  direccion: string | null;
  ciudad_id: number | null;
  comuna_id: number | null;
  barrio_id: number | null;
  estrato: string | null;
  latitud: number | null;
  longitud: number | null;
  updated_at: string | null;
}

export interface ValienteSalud {
  valiente_id: number;
  eps_id: number | null;
  eps_nombre: string | null;   // texto libre si no está en catálogo
  ips_id: number | null;
  ips_nombre: string | null;   // texto libre si no está en catálogo
  tipo_sangre: string | null;
  tiene_discapacidad: boolean | null;
  tipo_discapacidad: string | null;
  diagnostico_medico: string | null;
  tiene_alergias: boolean | null;
  alergias: string | null;
  medicamentos_actuales: string | null;
  tratamiento_en_curso: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
  contacto_emergencia_parentesco: string | null;
  updated_at: string | null;
}

export interface ValienteEducacion {
  valiente_id: number;
  nivel_educativo: string | null;
  grado_actual: string | null;
  institucion_id: number | null;
  materia_favorita: string | null;
  materia_dificil: string | null;
  updated_at: string | null;
}

export interface ValienteContextoFamiliar {
  valiente_id: number;
  composicion_familiar: string | null;
  numero_personas_hogar: number | null;
  ingreso_mensual_hogar: string | null;
  es_victima_conflicto: boolean | null;
  esta_en_ruv: boolean | null;
  etnia: string | null;
  updated_at: string | null;
}

export interface ValientePerfilDeportivo {
  valiente_id: number;
  disciplina: string | null;
  tiene_experiencia_previa: boolean | null;
  experiencia_previa: string | null;
  talla_guayos: string | null;
  talla_camisa: string | null;
  talla_pantalon: string | null;
  horario_entrenamiento: Json | null;
  updated_at: string | null;
}

export interface ValientePerfilSoroca {
  valiente_id: number;
  macro: string | null;
  simbolo: string | null;
  intereses_artisticos: string | null;
  habilidades: string | null;
  proyectos_personales: string | null;
  updated_at: string | null;
}

// =========================================================
// PROGRAMAS
// =========================================================

export interface Programa {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: string | null;
  esta_activo: boolean | null;
  created_at: string | null;
}

export interface ValientePrograma {
  id: number;
  valiente_id: number | null;
  programa_id: number | null;
  es_principal: boolean | null;
  fecha_ingreso: string;
  fecha_egreso: string | null;
  estado: string | null;
  cohorte: string | null;
  nivel: string | null;
  sede: string | null;
  motivacion: string | null;
  compromisos: string | null;
  transformaciones_subjetivas: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// =========================================================
// HISTORIAL Y DOCUMENTOS
// =========================================================

export interface HistorialValiente {
  id: number;
  valiente_id: number | null;
  tipo_evento: string;
  categoria: string | null;
  titulo: string | null;
  descripcion: string | null;
  fecha_evento: string;
  es_importante: boolean | null;
  registrado_por: string | null;
  created_at: string | null;
}

export interface ValienteDocumento {
  id: number;
  valiente_id: number | null;
  tipo_documento: string;
  nombre_archivo: string | null;
  url_archivo: string | null;
  tamano_bytes: number | null;
  esta_verificado: boolean | null;
  verificado_por: string | null;
  verificado_en: string | null;
  subido_por: string | null;
  created_at: string | null;
}

// =========================================================
// EVENTOS Y ASISTENCIA
// =========================================================

export interface Evento {
  id: number;
  nombre_evento: string | null;
  creado_por: string | null;
  fecha: string;
  hora: string | null;
  programa_id: number | null;
}

export interface Asistencia {
  id: number;
  evento_id: number;
  valiente_id: number | null;
  estado: string | null;
}

// =========================================================
// ACOMPAÑAMIENTO (NAHUAL)
// =========================================================

export interface Acompanamiento {
  id: number;
  valiente_id: number;
  nahual_id: string;           // uuid → usuario_sistema
  fecha: string;               // date ISO
  lugar: string | null;
  motivo_tema: string | null;
  nota: string | null;
  compromisos_acuerdos: string | null;
  fecha_proximo_encuentro: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Acompañamiento con datos del Nahual incluidos (para mostrar en el perfil) */
export interface AcompanamientoConNahual extends Acompanamiento {
  nahual?: { nombre: string; email: string } | null;
}

// =========================================================
// TIPOS COMPUESTOS
// =========================================================

/** Alias para compatibilidad con perfiles.service (no existe tabla propia) */
export interface ValienteOcupacion {
  valiente_id: number;
  trabaja_estudia: string | null;
  lugar_trabajo: string | null;
  descripcion_trabajo: string | null;
  updated_at: string | null;
}

/**
 * Tipo mínimo requerido por @supabase/supabase-js createClient<Database>.
 * No necesita reflejar todo el esquema; con un objeto vacío basta para
 * satisfacer el genérico sin romper las consultas con tipado dinámico.
 * @deprecated — supabase.ts usa createClient<any> directamente.
 */
export type Database = Record<string, unknown>;


export interface ValienteCompleto extends Valiente {
  edad?: number;
  ubicacion?: ValienteUbicacion;
  salud?: ValienteSalud;
  educacion?: ValienteEducacion;
  contexto_familiar?: ValienteContextoFamiliar;
  acudientes?: (ValienteAcudiente & { acudiente: Acudiente })[];
  programas?: (ValientePrograma & { programa: Programa })[];
  perfil_deportivo?: ValientePerfilDeportivo;
  perfil_soroca?: ValientePerfilSoroca;
}

// =========================================================
// ENUMS Y CONSTANTES
// =========================================================

export const TIPO_DOCUMENTO = {
  TI: 'TI',
  CC: 'CC',
  CCE: 'CCE',
  PPT: 'PPT',
  PAS: 'PAS',
} as const;

export const SEXO = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
} as const;

export const ESTADO_VALIENTE = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  EGRESADO: 'EGRESADO',
} as const;

export const TIPO_SANGRE = {
  O_POSITIVO: 'O+',
  O_NEGATIVO: 'O-',
  A_POSITIVO: 'A+',
  A_NEGATIVO: 'A-',
  B_POSITIVO: 'B+',
  B_NEGATIVO: 'B-',
  AB_POSITIVO: 'AB+',
  AB_NEGATIVO: 'AB-',
} as const;

export const ROL_CODIGO = {
  ADMIN: 'ADMIN',
  NAHUAL: 'NAHUAL',
  ACOMPANANTE: 'ACOMPAÑANTE',
  VALIENTE: 'VALIENTE',
} as const;
