import { supabase } from '../supabase';

export const authService = {
  // Iniciar sesión
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;

    // Actualizar last_login del administrador
    if (data.user) {
      await supabase
        .from('administrators')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', data.user.id);
    }

    return data;
  },

  // Cerrar sesión
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Obtener usuario actual
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Obtener perfil de administrador
  async getAdminProfile(userId: string) {
    const { data, error } = await supabase
      .from('administrators')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Registrar nuevo administrador
  async signUp(email: string, password: string, adminData: {
    username: string;
    full_name: string;
    role: string;
    program_access: string[];
  }) {
    // Crear usuario en auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) throw authError;

    // Crear perfil de administrador
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('administrators')
        .insert([{
          user_id: authData.user.id,
          ...adminData,
          program_access: adminData.program_access
        }]);
      
      if (profileError) throw profileError;
    }

    return authData;
  },

  // Cambiar contraseña
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
  },

  // Verificar si hay sesión activa
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }
};
