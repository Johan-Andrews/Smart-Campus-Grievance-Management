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
  ADMIN:   '/admin/dashboard',
  HOD:     '/hod/dashboard',
  FACULTY: '/faculty/dashboard',
};

// ─── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState(true);   // true until first session check done

  // Fetch the public.users profile + department name for the logged-in auth user

  // ── Bootstrap: restore session on page load ────────────────
  useEffect(() => {
    console.log('AuthBootstrap: Pure Mock Mode Starting...');
    
    // Safety timeout: don't stay in loading forever
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('AuthBootstrap: Safety timeout reached. Forcing loading=false');
        setLoading(false);
      }
    }, 5000);

    const initSession = async () => {
      console.log('AuthBootstrap: initSession (Mock Mode)...');
      
      // Check for mock session first
      const savedMockUser = localStorage.getItem('sb-mock-user');
      if (savedMockUser) {
        try {
          const profile = JSON.parse(savedMockUser) as UserProfile;
          console.log('AuthBootstrap: Found mock user in localStorage', profile.email);
          setUser(profile);
          // Set a minimal mock session so ProtectedRoute and other stuff think we are logged in
          setSession({ user: { id: profile.id, email: profile.email } } as any);
        } catch (e) {
          console.error('AuthBootstrap: Error parsing mock user', e);
          localStorage.removeItem('sb-mock-user');
        }
      }

      // NO SUPABASE AUTH CALLS HERE
      setLoading(false);
      clearTimeout(timer);
    };

    initSession();

    // NO SUPABASE AUTH STATE LISTENERS HERE

    return () => {
        clearTimeout(timer);
    };
  }, [navigate]);

  // ── Login ──────────────────────────────────────────────────
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<string | null> => {
    // Intercept mock student login
    if (email.trim().toLowerCase() === 'student@test.com' && password === 'password') {
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
            .eq('email', 'student@test.com')
            .single();

        if (profileError || !profileData) {
            return 'Mock student account not found in database. Please register first.';
        }

        const dept = profileData.departments as { name: string; code: string } | null;
        const profile: UserProfile = {
            id:              profileData.id,
            name:            profileData.name,
            email:           profileData.email,
            role:            profileData.role as Role,
            trust_score:     profileData.trust_score,
            department_id:   profileData.department_id,
            department_name: dept?.name ?? null,
            department_code: dept?.code ?? null,
        };

        setUser(profile);
        // Set a minimal mock session
        setSession({ user: { id: profile.id, email: profile.email } } as any);
        localStorage.setItem('sb-mock-user', JSON.stringify(profile));

        navigate(ROLE_HOME[profile.role], { replace: true });
        return null;   // null = no error
    }

    if (email.trim().toLowerCase() === 'admin@test.com' && password === 'password') {
        const ADMIN_UID = 'a0000000-0000-0000-0000-000000000001';
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
            .eq('id', ADMIN_UID)
            .single();

        if (profileError || !profileData) {
            return 'Mock admin account not found in database.';
        }

        const dept = profileData.departments as { name: string; code: string } | null;
        const profile: UserProfile = {
            id:              profileData.id,
            name:            profileData.name,
            email:           profileData.email,
            role:            profileData.role as Role,
            trust_score:     profileData.trust_score,
            department_id:   profileData.department_id,
            department_name: dept?.name ?? null,
            department_code: dept?.code ?? null,
        };

        setUser(profile);
        setSession({ user: { id: profile.id, email: profile.email } } as any);
        localStorage.setItem('sb-mock-user', JSON.stringify(profile));

        navigate(ROLE_HOME[profile.role], { replace: true });
        return null;
    }

    if (email.trim().toLowerCase() === 'hodcse@test.com' && password === 'password') {
        const HOD_UID = 'a0000000-0000-0000-0000-000000000002';
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
            .eq('id', HOD_UID)
            .single();

        if (profileError || !profileData) {
            return 'Mock HOD account not found in database.';
        }

        const dept = profileData.departments as { name: string; code: string } | null;
        const profile: UserProfile = {
            id:              profileData.id,
            name:            profileData.name,
            email:           profileData.email,
            role:            profileData.role as Role,
            trust_score:     profileData.trust_score,
            department_id:   profileData.department_id,
            department_name: dept?.name ?? null,
            department_code: dept?.code ?? null,
        };

        setUser(profile);
        setSession({ user: { id: profile.id, email: profile.email } } as any);
        localStorage.setItem('sb-mock-user', JSON.stringify(profile));

        navigate(ROLE_HOME[profile.role], { replace: true });
        return null;
    }

    // Real Supabase Auth fallback — disabled as requested
    /*
    ...
    */

    return 'Only student@test.com, admin@test.com and hodcse@test.com are available in mock mode.';
  }, [navigate]);

  // ── Logout ─────────────────────────────────────────────────
  const logout = useCallback(async () => {
    localStorage.removeItem('sb-mock-user');
    // await supabase.auth.signOut(); // Disabled to avoid connection
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
