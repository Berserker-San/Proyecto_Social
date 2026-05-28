import { supabase } from '../supabase';

// =========================================================
// SERVICIO DE ADMINISTRACIÓN DE USUARIOS
// =========================================================

export interface UsuarioSistemaConRoles {
  id: string;
  auth_user_id: string | null;
  nombre: string;
  email: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  roles: { id: number; codigo: string; nombre: string }[];
}

/**
 * Crea un usuario en Supabase Auth + usuario_sistema + rol
 * a través de la Edge Function 'create-user' (usa service_role de forma segura).
 */
export async function crearUsuarioAdmin(payload: {
  email: string;
  password: string;
  nombre: string;
  rol_id?: number | null;
}): Promise<{ usuario_id: string; auth_user_id: string }> {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      },
      body: JSON.stringify(payload),
    }
  );

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error al crear usuario');
  return json;
}

/** Lista todos los usuarios del sistema con sus roles */
export async function getUsuariosSistema(): Promise<UsuarioSistemaConRoles[]> {
  // Paso 1: traer usuarios
  const { data: usuarios, error: uErr } = await supabase
    .from('usuario_sistema')
    .select('*')
    .order('created_at', { ascending: false });

  if (uErr) throw uErr;
  if (!usuarios?.length) return [];

  // Paso 2: traer roles de todos los usuarios en una sola query
  const ids = usuarios.map(u => u.id);
  const { data: relaciones, error: rErr } = await supabase
    .from('usuario_rol')
    .select('usuario_id, rol ( id, codigo, nombre )')
    .in('usuario_id', ids);

  if (rErr) throw rErr;

  // Agrupar roles por usuario_id
  const rolesPorUsuario = new Map<string, { id: number; codigo: string; nombre: string }[]>();
  for (const rel of relaciones ?? []) {
    const rol = (rel as any).rol;
    if (!rol) continue;
    const lista = rolesPorUsuario.get(rel.usuario_id) ?? [];
    lista.push(rol);
    rolesPorUsuario.set(rel.usuario_id, lista);
  }

  return usuarios.map(u => ({
    ...u,
    roles: rolesPorUsuario.get(u.id) ?? [],
  }));
}

/** Lista todos los roles disponibles */
export async function getRoles() {
  const { data, error } = await supabase
    .from('rol')
    .select('id, codigo, nombre')
    .order('nombre');

  if (error) throw error;
  return data ?? [];
}

/**
 * Registra un usuario_sistema vinculándolo a un auth_user_id existente.
 * El usuario en Supabase Auth debe crearse primero desde el dashboard.
 */
export async function registrarUsuarioSistema(payload: {
  auth_user_id: string;
  nombre: string;
  email: string;
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('usuario_sistema')
    .insert({
      auth_user_id: payload.auth_user_id,
      nombre: payload.nombre,
      email: payload.email,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

/** Asigna un rol a un usuario del sistema */
export async function asignarRol(usuarioId: string, rolId: number): Promise<void> {
  const { error } = await supabase
    .from('usuario_rol')
    .upsert({ usuario_id: usuarioId, rol_id: rolId }, { onConflict: 'usuario_id,rol_id' });

  if (error) throw error;
}

/** Quita un rol a un usuario del sistema */
export async function quitarRol(usuarioId: string, rolId: number): Promise<void> {
  const { error } = await supabase
    .from('usuario_rol')
    .delete()
    .eq('usuario_id', usuarioId)
    .eq('rol_id', rolId);

  if (error) throw error;
}

/** Activa o desactiva un usuario */
export async function toggleUsuarioActivo(usuarioId: string, activo: boolean): Promise<void> {
  const { error } = await supabase
    .from('usuario_sistema')
    .update({ is_active: activo })
    .eq('id', usuarioId);

  if (error) throw error;
}

/**
 * Elimina un usuario del sistema y de Supabase Auth.
 * Usa la Edge Function 'delete-user'.
 */
export async function eliminarUsuarioAdmin(payload: {
  usuario_sistema_id: string;
  auth_user_id: string | null;
}): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      },
      body: JSON.stringify(payload),
    }
  );

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error al eliminar usuario');
}

export async function cambiarContrasena(payload: {
  target_email: string;
  current_password: string;
  new_password: string;
}): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/change-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      },
      body: JSON.stringify(payload),
    }
  );

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error al cambiar contraseña');
}
