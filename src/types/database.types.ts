// =========================================================
// TIPOS DE BASE DE DATOS - NUEVA ESTRUCTURA MVP
// =========================================================

// Tipos base
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
  created_at: string;
}

export interface Ciudad {
  id: number;
  nombre: string;
  departamento: string | null;
  pais_id: number;
  created_at: string;
}

export interface Comuna {
  id: number;
  ciudad_id: number;
  nombre: string;
  created_at: string;
}

export interface InstitucionEducativa {
  id: number;
  nombre: string;
  tipo: string | null;
  ciudad_id: number | null;
  created_at: string;
}

export interface EPS {
  id: number;
  nombre: string;
  codigo: string | null;
  created_at: string;
}

export interface IPS {
  id: number;
  nombre: string;
  eps_id: number | null;
  ciudad_id: number | null;
  created_at: string;
}

// =========================================================
// SEGURIDAD Y USUARIOS
// =========================================================

export interface Rol {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
}

export interface Permiso {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  modulo: string | null;
  created_at: string;
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
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsuarioRol {
  usuario_id: string;
  rol_id: number;
  asignado_por: string | null;
  asignado_en: string;
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
  nombre_completo?: string; // Generado
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
  
  // Ocupación (directo en valiente)
  trabaja_estudia: string | null;
  hobbies: string | null;
  
  // Estado
  estado: string;
  foto_url: string | null;
  
  // Auditoría
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
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
  tiene_autorizacion_firmada: boolean;
  created_at: string;
  updated_at: string;
}

export interface ValienteAcudiente {
  id: number;
  valiente_id: number;
  acudiente_id: number;
  parentesco: string;
  es_principal: boolean;
  es_contacto_emergencia: boolean;
  vive_con_valiente: boolean;
  created_at: string;
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
  updated_at: string;
}

export interface ValienteSalud {
  valiente_id: number;
  eps_id: number | null;
  ips_id: number | null;
  // IPS como texto libre (catálogo vacío)
  ips_nombre: string | null;
  tipo_sangre: string | null;
  tiene_discapacidad: boolean;
  tipo_discapacidad: string | null;
  diagnostico_medico: string | null;
  tiene_alergias: boolean;
  alergias: string | null;
  medicamentos_actuales: string | null;
  tratamiento_en_curso: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
  contacto_emergencia_parentesco: string | null;
  updated_at: string;
}

export interface ValienteEducacion {
  valiente_id: number;
  nivel_educativo: string | null;
  grado_actual: string | null;
  institucion_id: number | null;
  materia_favorita: string | null;
  materia_dificil: string | null;
  updated_at: string;
}


export interface ValienteContextoFamiliar {
  valiente_id: number;
  composicion_familiar: string | null;
  numero_personas_hogar: number | null;
  ingreso_mensual_hogar: string | null;
  es_victima_conflicto: boolean;
  esta_en_ruv: boolean;
  etnia: string | null;
  updated_at: string;
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
  esta_activo: boolean;
  created_at: string;
}

export interface ValientePrograma {
  id: number;
  valiente_id: number;
  programa_id: number;
  es_principal: boolean;
  fecha_ingreso: string;
  fecha_egreso: string | null;
  estado: string;
  cohorte: string | null;
  nivel: string | null;
  sede: string | null;
  motivacion: string | null;
  compromisos: string | null;
  transformaciones_subjetivas: string | null;
  created_at: string;
  updated_at: string;
}

export interface ValientePerfilDeportivo {
  valiente_id: number;
  disciplina: string | null;
  tiene_experiencia_previa: boolean;
  experiencia_previa: string | null;
  talla_guayos: string | null;
  talla_camisa: string | null;
  talla_pantalon: string | null;
  horario_entrenamiento: Json | null;
  updated_at: string;
}

export interface ValientePerfilSoroca {
  valiente_id: number;
  macro: string | null;
  simbolo: string | null;
  intereses_artisticos: string | null;
  habilidades: string | null;
  proyectos_personales: string | null;
  updated_at: string;
}

// =========================================================
// HISTORIAL Y DOCUMENTOS
// =========================================================

export interface HistorialValiente {
  id: number;
  valiente_id: number;
  tipo_evento: string;
  categoria: string | null;
  titulo: string | null;
  descripcion: string | null;
  fecha_evento: string;
  es_importante: boolean;
  registrado_por: string | null;
  created_at: string;
}

export interface ValienteDocumento {
  id: number;
  valiente_id: number;
  tipo_documento: string;
  nombre_archivo: string | null;
  url_archivo: string | null;
  tamano_bytes: number | null;
  esta_verificado: boolean;
  verificado_por: string | null;
  verificado_en: string | null;
  subido_por: string | null;
  created_at: string;
}

// =========================================================
// TIPOS COMPUESTOS Y VISTAS
// =========================================================

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
  CC: 'CC',
  TI: 'TI',
  CE: 'CE',
  PASAPORTE: 'PASAPORTE',
} as const;

export const SEXO = {
  MASCULINO: 'MASCULINO',
  FEMENINO: 'FEMENINO',
} as const;

export const ESTADO_VALIENTE = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  EGRESADO: 'EGRESADO',
} as const;

export const PARENTESCO = {
  MADRE: 'MADRE',
  PADRE: 'PADRE',
  ABUELO: 'ABUELO',
  ABUELA: 'ABUELA',
  TIO: 'TÍO',
  TIA: 'TÍA',
  HERMANO: 'HERMANO',
  HERMANA: 'HERMANA',
  OTRO: 'OTRO',
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

export const NIVEL_EDUCATIVO = {
  PRIMARIA: 'PRIMARIA',
  BACHILLERATO: 'BACHILLERATO',
  TECNICO: 'TÉCNICO',
  UNIVERSITARIO: 'UNIVERSITARIO',
  POSGRADO: 'POSGRADO',
} as const;

export const JORNADA = {
  MANANA: 'MAÑANA',
  TARDE: 'TARDE',
  NOCHE: 'NOCHE',
  UNICA: 'ÚNICA',
} as const;

export const TIPO_EVENTO_HISTORIAL = {
  INGRESO: 'INGRESO',
  NOTA: 'NOTA',
  LOGRO: 'LOGRO',
  ALERTA: 'ALERTA',
  ACOMPANAMIENTO: 'ACOMPAÑAMIENTO',
} as const;

export const ROL_CODIGO = {
  ADMIN: 'ADMIN',
  NAHUAL: 'NAHUAL',
  ACOMPANANTE: 'ACOMPAÑANTE',
  VALIENTE: 'VALIENTE',
} as const;

// =========================================================
// EVENTOS Y ASISTENCIA
// =========================================================

export interface Evento {
  id: number;
  nombre_evento: string;
  creado_por: string | null;   // uuid → usuario_sistema.id
  programa_id: number | null;  // FK → programa.id
  programa: string | null;     // 'TRIBU' | 'SOROCA' | null (campo extra para display)
  fecha: string;               // date
  hora: string | null;         // time
  created_at?: string;
}

export interface Asistencia {
  id: number;
  evento_id: number;
  valiente_id: number;
  estado: string;              // 'Presente' | 'Ausente' | 'Justificado'
}
