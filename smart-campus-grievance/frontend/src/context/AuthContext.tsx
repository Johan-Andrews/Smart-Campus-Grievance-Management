import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

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
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Role → route map ─────────────────────────────────────────

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
  const [loading, setLoading] = useState(true);
  
  // Track the last processed user ID to avoid redundant profile fetches
  const lastFetchedId = useRef<string | null>(null);

  // Fetch the public.users profile + department name for the logged-in auth user
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (lastFetchedId.current === userId && user) return user;
    
    try {
      console.log('Fetching profile for:', userId);
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
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Database profile fetch error:', error.message);
        return null;
      }
      
      if (!data) return null;

      const profileData = data as any;
      const dept = profileData.departments;
      
      const profile: UserProfile = {
        id:              profileData.id,
        name:            profileData.name,
        email:           profileData.email,
        role:            (profileData.role || 'STUDENT').toUpperCase() as Role,
        trust_score:     profileData.trust_score || 0,
        department_id:   profileData.department_id,
        department_name: dept?.name || null,
        department_code: dept?.code || null,
      };

      lastFetchedId.current = userId;
      setUser(profile);
      return profile;
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
      setUser(null);
      return null;
    }
  }, []); // Only rebuild if supabase client changes (which it doesn't)

  // ── Bootstrap & Listen for Auth Changes ─────────────────────
  useEffect(() => {
    let mounted = true;

    // Supabase fires onAuthStateChange(INITIAL_SESSION) immediately on mount.
    // We rely primarily on this listener to handle the bootstrap and subsequent changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, newSession: Session | null) => {
      if (!mounted) return;
      
      console.log('Auth event:', event);
      setSession(newSession);
      
      if (newSession?.user) {
        // If there's a user, fetch the profile.
        // It's crucial we don't block the logic if the fetch is slow or fails.
        await fetchProfile(newSession.user.id);
      } else {
        setUser(null);
        lastFetchedId.current = null;
      }
      
      // Always dismiss the loading screen once an auth state is determined
      if (mounted) setLoading(false);
    });

    // Backup: If for some reason the listener hasn't fired in 2 seconds, 
    // manually check session and clear loading to avoid a permanent deadlock screen.
    const timeout = setTimeout(async () => {
      if (mounted && loading) {
        console.warn('Auth initialization timed out, performing fallback check.');
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && loading) {
          setSession(session);
          if (session?.user) await fetchProfile(session.user.id);
          setLoading(false);
        }
      }
    }, 2000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchProfile]); // Removed 'loading' from deps to avoid re-triggering

  // ── Login ──────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) return error.message;
      if (!data.session || !data.user) return 'Login failed: No session established.';

      // Get profile immediately to know where to redirect
      const profile = await fetchProfile(data.user.id);
      
      if (!profile) {
        return 'Login success, but could not load profile details. Contact Admin.';
      }

      const dest = ROLE_HOME[profile.role] || '/';
      navigate(dest, { replace: true });
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
    lastFetchedId.current = null;
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
