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
import type { Session } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────

type Role = 'STUDENT' | 'ADMIN' | 'HOD' | 'FACULTY';

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
  STUDENT: '/student/dashboard',
  ADMIN: '/admin/dashboard',
  HOD: '/hod/dashboard',
  FACULTY: '/faculty/dashboard',
};

// ─── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);   // true until first session check done

  // Fetch the public.users profile + department name for the logged-in auth user
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: profileData, error: profileError } = await supabase
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
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('User profile not found.');

      const dept = profileData.departments as { name: string; code: string } | null;
      const profile: UserProfile = {
        id:              profileData.id,
        name:            profileData.name,
        email:           profileData.email,
        role:            (profileData.role as string).toUpperCase() as Role,
        trust_score:     profileData.trust_score,
        department_id:   profileData.department_id,
        department_name: dept?.name ?? null,
        department_code: dept?.code ?? null,
      };

      setUser(profile);
      return profile;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUser(null);
      return null;
    }
  }, []);

  // ── Bootstrap: restore session on page load ────────────────
  useEffect(() => {
    // 1. Get initial session
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    initSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
        if (event === 'SIGNED_IN') {
           // Find the role and navigate
           // This is a bit tricky here because we don't have the profile yet.
           // Better to navigate after fetchProfile or in the component.
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ── Login ──────────────────────────────────────────────────
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) return error.message;
      if (!data.session || !data.user) return 'Login failed: No session established.';

      // Fetch profile immediately to get the role for navigation
      const profile = await fetchProfile(data.user.id);
      
      if (profile?.role) {
        navigate(ROLE_HOME[profile.role], { replace: true });
      }

      return null;
    } catch (err: any) {
      return err.message || 'An unexpected error occurred during login.';
    }
  }, [navigate, fetchProfile]);

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
