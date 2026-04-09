import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { signIn as authSignIn, signOut as authSignOut, getCurrentUsuarioSistema } from '../services/auth.service';
import type { UsuarioSistema } from '../../types/database.types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [usuarioSistema, setUsuarioSistema] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUsuarioSistema().catch(console.error);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUsuarioSistema().catch(console.error);
        } else {
          setUsuarioSistema(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUsuarioSistema = async () => {
    try {
      const usuario = await getCurrentUsuarioSistema();
      setUsuarioSistema(usuario);
    } catch (error) {
      console.error('Error loading usuario sistema:', error);
      setUsuarioSistema(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const data = await authSignIn(email, password);
    return data;
  };

  const signOut = async () => {
    await authSignOut();
    setUser(null);
    setUsuarioSistema(null);
  };

  return {
    user,
    usuarioSistema,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
}
