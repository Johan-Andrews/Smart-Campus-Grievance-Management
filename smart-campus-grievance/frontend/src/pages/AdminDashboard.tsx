import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type AdminGrievance = {
    id: string;
    ref_id: string;
    title: string;
    priority: string;
    status: string;
    sla_deadline: string | null;
    sla_display: string | null;
    is_slabreach: boolean;
    category_label: string;
    created_date: string;
};

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [complaints, setComplaints] = useState<AdminGrievance[]>([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);

    const [stats, setStats] = useState({
        open: 0,
        inProgress: 0,
        resolved: 0,
        slaBreaches: 0
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: sbError } = await supabase
                .from('v_admin_grievances')
                .select('*')
                .order('created_at', { ascending: false });

            if (sbError) throw sbError;

            const grievances = data as AdminGrievance[];
            setComplaints(grievances);

            // Calculate Metrics
            const metrics = grievances.reduce((acc, curr) => {
                if (curr.status === 'OPEN') acc.open++;
                if (curr.status === 'IN_PROGRESS') acc.inProgress++;
                if (curr.status === 'RESOLVED') acc.resolved++;
                if (curr.is_slabreach) acc.slaBreaches++;
                return acc;
            }, { open: 0, inProgress: 0, resolved: 0, slaBreaches: 0 });

            setStats(metrics);

        } catch (err: any) {
            console.error('Admin Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600 font-medium">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-3"></div>
                Loading Admin Dashboard...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
                    <span className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 mr-3 flex items-center justify-center font-black text-sm">A</span>
                    System Admin Panel
                </h1>
                <div className="flex items-center space-x-4">
                    <div className="text-right mr-2 hidden sm:block">
                        <p className="text-sm font-bold text-white leading-none">{user?.name || 'Admin User'}</p>
                        <p className="text-[10px] text-gray-400 font-medium lowercase tracking-wider">{user?.email}</p>
                    </div>
                    <button onClick={logout} className="px-3 py-1.5 text-xs font-bold bg-red-600/10 text-red-500 rounded-md hover:bg-red-600/20 transition">Logout</button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
                        <AlertCircle className="mr-2" size={20} />
                        {error}
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 text-center sm:text-left">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500 transform hover:scale-[1.02] transition">
                        <p className="text-sm font-medium text-gray-500 mb-1">Open Grievances</p>
                        <h3 className="text-3xl font-black text-gray-900">{stats.open}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-purple-500 transform hover:scale-[1.02] transition">
                        <p className="text-sm font-medium text-gray-500 mb-1">In Progress</p>
                        <h3 className="text-3xl font-black text-gray-900">{stats.inProgress}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500 transform hover:scale-[1.02] transition">
                        <p className="text-sm font-medium text-gray-500 mb-1">Resolved</p>
                        <h3 className="text-3xl font-black text-gray-900">{stats.resolved}</h3>
                    </div>
                    <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm border-l-4 border-l-red-500 transform hover:scale-[1.02] transition">
                        <p className="text-sm font-bold text-red-800 mb-1 flex items-center justify-center sm:justify-start">
                            <AlertTriangle size={16} className="mr-1" /> Critical Breaches
                        </p>
                        <h3 className="text-3xl font-black text-red-900">{stats.slaBreaches}</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Table */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase">Global Grievance View</h3>
                            <button onClick={fetchData} className="text-xs font-bold text-blue-600 hover:underline">Refresh List</button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white shadow-sm ring-1 ring-gray-100">
                                    <tr className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                        <th className="px-6 py-4">Complaint Title</th>
                                        <th className="px-6 py-4">Priority</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">SLA Target</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {complaints.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">No grievances found.</td></tr>
                                    ) : (
                                        complaints.map(c => (
                                            <tr key={c.id} onClick={() => navigate(`/complaint/${c.id}`)} className="hover:bg-blue-50/30 cursor-pointer transition text-sm group">
                                                <td className="px-6 py-4">
                                                   <div className="font-bold text-gray-900 group-hover:text-blue-600 transition">{c.title}</div>
                                                   <div className="text-[10px] font-mono font-bold text-gray-400 mt-0.5">{c.ref_id} · {c.category_label}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                                                        c.priority === 'HIGH' || c.priority === 'CRITICAL' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-600 border border-gray-100'
                                                    }`}>{c.priority}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center text-xs font-bold text-gray-700">
                                                        {c.status === 'RESOLVED' ? <CheckCircle size={14} className="text-green-500 mr-1.5" /> : <Clock size={14} className="text-blue-500 mr-1.5" />}
                                                        {c.status.replace('_', ' ')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`text-xs font-bold ${c.is_slabreach ? 'text-red-500' : 'text-gray-500'}`}>
                                                        {c.sla_display || 'N/A'}
                                                    </div>
                                                    <div className="text-[9px] text-gray-400 font-medium">{c.created_date}</div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sidebar: SLA focus */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-red-600 mb-6 flex items-center">
                                <AlertCircle size={14} className="mr-2" />
                                Immediate Attention Required
                            </h3>
                            {complaints.filter(c => c.is_slabreach && c.status !== 'RESOLVED').length === 0 ? (
                                <p className="text-xs text-gray-400 font-medium bg-gray-50 p-4 rounded-lg text-center ring-1 ring-inset ring-gray-100">All high priority issues are within SLA limits.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {complaints.filter(c => c.is_slabreach && c.status !== 'RESOLVED').slice(0, 5).map((v) => (
                                        <li key={v.id} onClick={() => navigate(`/complaint/${v.id}`)} className="p-4 bg-red-50/50 border border-red-100 rounded-xl cursor-pointer hover:bg-red-50 transition shadow-sm group">
                                            <div className="font-bold text-red-900 truncate text-sm group-hover:text-red-600">{v.title}</div>
                                            <div className="text-[10px] font-bold text-red-700/70 mt-1 flex items-center uppercase tracking-tighter">
                                                <AlertTriangle size={10} className="mr-1" /> SLA BREACHED
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                         <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl shadow-lg p-6 text-white overflow-hidden relative">
                             <div className="relative z-10">
                                <h3 className="text-xs font-black uppercase tracking-tight text-blue-200 mb-2">System Analytics</h3>
                                <p className="text-sm text-gray-300 font-medium leading-relaxed">Integrated AI monitoring is active. All grievances are being dynamically routed to respective HODs.</p>
                                <div className="mt-4 flex space-x-2">
                                    <div className="px-2 py-1 bg-white/10 rounded font-mono text-[9px] font-bold">MODE: REST_API</div>
                                    <div className="px-2 py-1 bg-white/10 rounded font-mono text-[9px] font-bold text-green-400">STATUS: LIVE</div>
                                </div>
                             </div>
                             <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
