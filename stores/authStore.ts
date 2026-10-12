import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';

interface AuthState {
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  setSession: (session: any | null) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  loading: true,

  setSession: (session) => set({ session, loading: false }),
  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) set({ profile: data });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));
