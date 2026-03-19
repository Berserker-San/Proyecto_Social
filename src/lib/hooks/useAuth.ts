import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { authService } from '../services/auth.service';

interface AdminProfile {
  id: string;
  username: string;
  full_name: string;
  role: string;
  program_access: string[];
  is_active: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    // Verificar sesión actual
    const checkSession = async () => {
      try {
        console.log('[useAuth] Checking session...');
        
        // Timeout de 5 segundos para evitar quedarse atascado
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Session check timeout')), 5000);
        });
        
        const sessionPromise = authService.getSession();
        const session = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        clearTimeout(timeoutId);
        console.log('[useAuth] Session result:', session ? 'Session found' : 'No session');
        
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('[useAuth] Loading admin profile...');
          await loadAdminProfile(session.user.id);
        } else {
          console.log('[useAuth] No user, setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('[useAuth] Error checking session:', error);
        if (!mounted) return;
        
        // Si hay timeout o error, cerrar sesión y mostrar login
        console.log('[useAuth] Clearing stale session...');
        await supabase.auth.signOut();
        setUser(null);
        setAdminProfile(null);
        setLoading(false);
      }
    };

    checkSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state changed:', event);
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadAdminProfile(session.user.id);
        } else {
          setAdminProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const loadAdminProfile = async (userId: string) => {
    try {
      console.log('[useAuth] Loading admin profile for user:', userId);
      
      // Timeout de 3 segundos para la carga del perfil
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Admin profile load timeout')), 3000);
      });
      
      const profilePromise = authService.getAdminProfile(userId);
      const profile = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      console.log('[useAuth] Admin profile loaded:', profile ? 'Success' : 'No profile');
      setAdminProfile(profile);
    } catch (error) {
      console.error('[useAuth] Error loading admin profile:', error);
      // No bloquear el acceso si no hay perfil de administrador
      // El usuario puede acceder sin perfil
      setAdminProfile(null);
    } finally {
      console.log('[useAuth] Setting loading to false');
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const data = await authService.signIn(email, password);
    return data;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setAdminProfile(null);
  };

  return {
    user,
    adminProfile,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
}
