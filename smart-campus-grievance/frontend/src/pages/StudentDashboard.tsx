import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Clock, Plus, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// ─── Type ─────────────────────────────────────────────────────
// Mirrors every column returned by v_student_grievances
type Grievance = {
    id: string;
    ref_id: string;
    title: string;
    description: string;
    category: string;
    category_label: string;       // "Hostel", "Academics" etc — pre-formatted by the view
    urgency: string;
    priority: string;
    status: string;
    is_anonymous: boolean;
    is_slabreach: boolean;
    location: string | null;
    department_name: string | null;
    department_code: string | null;
    created_date: string;          // "Mar 02, 2026" — pre-formatted by the view
    sla_display: string | null;    // "Mar 03, 9:48 AM"
    sla_breach_label: string | null; // "SLA Breached Mar 03, 9:48 AM" or null
    sla_deadline: string | null;
    resolved_at: string | null;
    created_at: string;
    updated_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────
const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
        case 'HIGH':     return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'MEDIUM':   return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default:         return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'OPEN':        return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'IN_PROGRESS': return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'RESOLVED':    return 'bg-green-50 text-green-700 border-green-200';
        case 'REJECTED':    return 'bg-gray-50 text-gray-700 border-gray-200';
        default:            return 'bg-gray-100 text-gray-800';
    }
};

const isActive = (status: string) => status === 'OPEN' || status === 'IN_PROGRESS';

// ─── Component ────────────────────────────────────────────────
const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [grievances, setGrievances]   = useState<Grievance[]>([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState<string | null>(null);

    // ── Fetch from v_student_grievances ───────────────────────
    // RLS on the complaints table automatically filters rows to
    // the currently logged-in student — no WHERE clause needed.
    const fetchGrievances = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        // When using mock login (or even real login), we explicitly filter by student_id.
        // This ensures the student only sees their own grievances even if RLS is partially bypassed
        // or if we are using the mock user session.
        const { data, error: sbError } = await supabase
            .from('v_student_grievances')
            .select('*')
            .eq('student_id', user.id);

        if (sbError) {
            setError(sbError.message);
        } else {
            setGrievances(data as Grievance[]);
        }

        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchGrievances();
    }, [fetchGrievances]);

    // ── Real-time: re-fetch when any complaint row changes ────
    // Supabase Realtime listens to the underlying complaints table.
    // The view re-runs automatically when we refresh.
    useEffect(() => {
        const channel = supabase
            .channel('student-grievances')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'complaints',
                    filter: `student_id=eq.${user?.id}`,
                },
                () => { fetchGrievances(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id, fetchGrievances]);

    // ─── Render ───────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">

            {/* Nav */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Smart Campus
                </h1>
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600">{user?.email}</span>
                    <button
                        onClick={logout}
                        className="text-sm font-medium text-red-600 hover:text-red-700 transition"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-8">

                {/* Header row */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">My Grievances</h2>
                        <p className="text-gray-500 mt-1">Track and manage your submitted complaints.</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {/* Manual refresh button */}
                        <button
                            onClick={fetchGrievances}
                            disabled={loading}
                            className="p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition disabled:opacity-40"
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => navigate('/student/new')}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition font-medium"
                        >
                            <Plus size={18} />
                            <span>New Grievance</span>
                        </button>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="mb-6 flex items-start space-x-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <div>
                            <p className="font-medium">Failed to load grievances</p>
                            <p className="text-red-600 mt-0.5">{error}</p>
                        </div>
                    </div>
                )}

                {/* Loading skeletons */}
                {loading && (
                    <div className="grid gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse">
                                <div className="flex justify-between mb-4">
                                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                                    <div className="flex space-x-2">
                                        <div className="h-5 bg-gray-200 rounded w-16" />
                                        <div className="h-5 bg-gray-200 rounded w-16" />
                                    </div>
                                </div>
                                <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                                <div className="h-4 bg-gray-100 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && grievances.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                        <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-gray-900">No grievances yet</h3>
                        <p className="text-gray-500 mt-1">You haven't submitted any complaints.</p>
                        <button
                            onClick={() => navigate('/student/new')}
                            className="mt-4 inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            <Plus size={16} />
                            <span>Lodge your first grievance</span>
                        </button>
                    </div>
                )}

                {/* Grievance cards */}
                {!loading && grievances.length > 0 && (
                    <div className="grid gap-6">
                        {grievances.map(g => (
                            <div
                                key={g.id}
                                onClick={() => navigate(`/complaint/${g.id}`)}
                                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer"
                            >
                                {/* Title + badges */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{g.title}</h3>
                                        {g.is_anonymous && (
                                            <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                                                Anonymous
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex space-x-2 shrink-0 ml-4">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getPriorityColor(g.priority)}`}>
                                            {g.priority}
                                        </span>
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusColor(g.status)}`}>
                                            {g.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{g.description}</p>

                                {/* Footer row */}
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center text-gray-500 space-x-4">
                                        {/* category_label is "Hostel", "Academics" etc — pre-formatted by the view */}
                                        <span>
                                            Category: <span className="font-medium text-gray-700">{g.category_label}</span>
                                        </span>
                                        {/* Department shown only for HOD/ACADEMICS complaints */}
                                        {g.department_name && (
                                            <>
                                                <span>•</span>
                                                <span>
                                                    Dept: <span className="font-medium text-gray-700">{g.department_code}</span>
                                                </span>
                                            </>
                                        )}
                                        <span>•</span>
                                        {/* created_date is pre-formatted by the view: "Mar 02, 2026" */}
                                        <span>Created: {g.created_date}</span>
                                    </div>

                                    {/* SLA section — right side */}
                                    {isActive(g.status) && (
                                        <div className={`flex items-center space-x-1.5 font-medium ${g.is_slabreach ? 'text-red-600' : 'text-amber-600'}`}>
                                            {g.is_slabreach
                                                ? <AlertCircle size={16} />
                                                : <Clock size={16} />
                                            }
                                            <span>
                                                {/* sla_breach_label = "SLA Breached Mar 03, 9:48 AM" (from view, only set when breached) */}
                                                {/* sla_display      = "Mar 03, 9:48 AM" (always set)                                    */}
                                                {g.sla_breach_label ?? `ETA: ${g.sla_display}`}
                                            </span>
                                        </div>
                                    )}

                                    {/* Resolved timestamp */}
                                    {g.status === 'RESOLVED' && g.resolved_at && (
                                        <span className="text-green-600 font-medium text-xs">
                                            Resolved
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentDashboard;
