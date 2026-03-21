// context/AuthContext.tsx
// Full auth context using Supabase Auth.
// Supabase handles sessions and tokens.
// Your UI controls every screen — no Supabase hosted pages.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────

type Role = 'STUDENT' | 'ADMIN' | 'HOD';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  trust_score: number;
  department_id: string | null;
  department_name: string | null;
  department_code: string | null;
};

type AuthContextValue = {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;  // returns error msg or null
  logout: () => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Role → route map ─────────────────────────────────────────
// After login, each role lands on their own dashboard.
const ROLE_HOME: Record<Role, string> = {
  STUDENT: '/student',
  ADMIN:   '/admin',
  HOD:     '/hod',
};

// ─── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState(true);   // true until first session check done

  // Fetch the public.users profile + department name for the logged-in auth user
  const fetchProfile = useCallback(async (authUser: User): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        trust_score,
        department_id,
        departments (
          name,
          code
        )
      `)
      .eq('id', authUser.id)
      .single();

    if (error || !data) {
      console.error('Profile fetch error:', error?.message);
      return null;
    }

    const dept = data.departments as { name: string; code: string } | null;

    return {
      id:              data.id,
      name:            data.name,
      email:           data.email,
      role:            data.role as Role,
      trust_score:     data.trust_score,
      department_id:   data.department_id,
      department_name: dept?.name ?? null,
      department_code: dept?.code ?? null,
    };
  }, []);

  // ── Bootstrap: restore session on page load ────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const profile = await fetchProfile(session.user);
        setUser(profile);
      }
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (session?.user) {
          const profile = await fetchProfile(session.user);
          setUser(profile);
        } else {
          setUser(null);
        }

        // Token silently refreshed — no action needed
        if (event === 'TOKEN_REFRESHED') return;

        // User signed out from another tab
        if (event === 'SIGNED_OUT') {
          navigate('/login', { replace: true });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile, navigate]);

  // ── Login ──────────────────────────────────────────────────
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<string | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // Map Supabase error messages to friendly UI strings
      if (error.message.includes('Invalid login credentials')) {
        return 'Incorrect email or password.';
      }
      if (error.message.includes('Email not confirmed')) {
        return 'Please confirm your email before logging in.';
      }
      return error.message;
    }

    if (!data.user) return 'Login failed. Please try again.';

    const profile = await fetchProfile(data.user);
    if (!profile) return 'Account profile not found. Contact admin.';

    setUser(profile);

    // Redirect to the dashboard for this role
    navigate(ROLE_HOME[profile.role], { replace: true });
    return null;   // null = no error
  }, [fetchProfile, navigate]);

  // ── Logout ─────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
