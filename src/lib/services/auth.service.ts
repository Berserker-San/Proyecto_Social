import { supabase } from '../supabase';
import type { UsuarioSistema } from '../../types/database.types';

// =========================================================
// SERVICIO DE AUTENTICACIÓN
// =========================================================

/**
 * Iniciar sesión con email y contraseña
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Obtener usuario actual de Supabase Auth
 */
export async function getCurrentAuthUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Obtener información del usuario del sistema
 */
export async function getCurrentUsuarioSistema() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return null;

  const { data, error } = await supabase
    .from('usuario_sistema')
    .select(`
      *,
      roles:usuario_rol(
        rol(*)
      )
    `)
    .eq('auth_user_id', authUser.id)
    .single();

  if (error) throw error;
  return data as UsuarioSistema & { roles: any[] };
}

/**
 * Verificar si el usuario tiene un rol específico
 */
export async function hasRole(roleCodigo: string): Promise<boolean> {
  const usuario = await getCurrentUsuarioSistema();
  if (!usuario) return false;

  return usuario.roles.some((ur: any) => ur.rol.codigo === roleCodigo);
}

/**
 * Verificar si el usuario es admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('ADMIN');
}

/**
 * Registrar último login
 */
export async function registrarLogin(usuarioId: string) {
  const { error } = await supabase
    .from('usuario_sistema')
    .update({ last_login: new Date().toISOString() })
    .eq('id', usuarioId);

  if (error) throw error;
}
