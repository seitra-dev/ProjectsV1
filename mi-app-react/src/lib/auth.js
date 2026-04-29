// ============================================================================
// SERVICIO DE AUTENTICACIÓN CON SUPABASE
// ============================================================================
// Maneja login, registro, logout y Google Sign-In
// ============================================================================

import { supabase } from './supabase';
import { dbUsers } from './database';

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

export const auth = {
  // ========================================
  // GOOGLE SIGN-IN
  // ========================================
  signInWithGoogle: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // Vuelve a tu app después del login
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en Google Sign-In:', error);
      throw error;
    }
  },

  // ========================================
  // EMAIL/PASSWORD SIGN-IN
  // ========================================
  signInWithEmail: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  // ========================================
  // REGISTRO CON EMAIL/PASSWORD
  // ========================================
  signUpWithEmail: async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            avatar: '👤',
          },
        },
      });

      if (error) throw error;

      // Crear registro en la tabla users
      if (data.user) {
        await dbUsers.create({
          id: data.user.id,
          email: data.user.email,
          name: name,
          avatar: '👤',
          role: 'user',
        });
      }

      return data;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  },

  // ========================================
  // LOGOUT
  // ========================================
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  },

  // ========================================
  // OBTENER USUARIO ACTUAL
  // ========================================
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) return null;

      // Buscar datos completos del usuario en la tabla users
      try {
        const userData = await dbUsers.getById(user.id);
        return userData;
      } catch (dbError) {
        // Si no existe en la tabla users, crearlo
        const newUser = await dbUsers.create({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          avatar: user.user_metadata?.avatar_url || '👤',
          role: 'user',
        });
        return newUser;
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
  },

  // ========================================
  // OBTENER SESIÓN ACTUAL
  // ========================================
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      return null;
    }
  },

  // ========================================
  // ESCUCHAR CAMBIOS DE AUTENTICACIÓN
  // ========================================
  onAuthStateChange: (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = await auth.getCurrentUser();
          callback(event, user);
        } else if (event === 'SIGNED_OUT') {
          callback(event, null);
        }
      }
    );

    return subscription;
  },

  // ========================================
  // RESET PASSWORD
  // ========================================
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error en reset password:', error);
      throw error;
    }
  },

  // ========================================
// ESPERAR SESIÓN DE RECOVERY
// ========================================
waitForRecoverySession: () => {
  return new Promise((resolve) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        subscription.unsubscribe();
        resolve(session);
      }
    });
  });
},

  // ========================================
  // UPDATE PASSWORD
  // ========================================
  updatePassword: async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error actualizando password:', error);
      throw error;
    }
  },

  /** Fusiona metadata en auth.users (p. ej. preferencias 2FA en UI). */
  updateUserMetadata: async (data) => {
    const { data: out, error } = await supabase.auth.updateUser({
      data,
    });
    if (error) throw error;
    return out?.user ?? null;
  },
};