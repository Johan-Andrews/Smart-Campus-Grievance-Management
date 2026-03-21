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

    const HOD_ACCOUNTS: Record<string, { id: string; deptId: string; deptName: string; deptCode: string }> = {
      'hodcse@test.com':   { id: 'a0000000-0000-0000-0000-000000000002', deptId: 'd1000000-0000-0000-0000-000000000001', deptName: 'Computer Science',       deptCode: 'CSE' },
      'hodeee@test.com':   { id: 'a0000000-0000-0000-0000-000000000003', deptId: 'd1000000-0000-0000-0000-000000000002', deptName: 'Electrical Engineering', deptCode: 'EEE' },
      'hodmech@test.com':  { id: 'a0000000-0000-0000-0000-000000000004', deptId: 'd1000000-0000-0000-0000-000000000003', deptName: 'Mechanical Engineering', deptCode: 'MECH' },
      'hodcivil@test.com': { id: 'a0000000-0000-0000-0000-000000000005', deptId: 'd1000000-0000-0000-0000-000000000004', deptName: 'Civil Engineering',      deptCode: 'CIVIL' },
      'hodece@test.com':   { id: 'a0000000-0000-0000-0000-000000000006', deptId: 'd1000000-0000-0000-0000-000000000005', deptName: 'Electronics & Comm.',   deptCode: 'ECE' },
    };

    const lowerEmail = email.trim().toLowerCase();
    if (HOD_ACCOUNTS[lowerEmail] && password === 'password') {
        const acc = HOD_ACCOUNTS[lowerEmail];
        const profile: UserProfile = {
            id:              acc.id,
            name:            `${acc.deptCode} HOD`,
            email:           lowerEmail,
            role:            'HOD',
            trust_score:     5,
            department_id:   acc.deptId,
            department_name: acc.deptName,
            department_code: acc.deptCode,
        };

        setUser(profile);
        setSession({ user: { id: profile.id, email: profile.email } } as any);
        localStorage.setItem('sb-mock-user', JSON.stringify(profile));
        navigate(ROLE_HOME[profile.role], { replace: true });
        return null;
    }

    return 'Only test@test.com accounts (student, admin, hodcse, hodeee, etc.) are available in mock mode.';
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
