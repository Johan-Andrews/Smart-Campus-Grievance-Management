import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, ArrowLeft, Clock, Info, User, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type HODGrievance = {
    id: string;
    ref_id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    is_anonymous: boolean;
    student_email: string | null;
    sla_deadline: string | null;
    sla_display: string | null;
    is_slabreach: boolean;
    category_label: string;
    created_date: string;
    ai_summary?: string | null;
    location?: string | null;
};

type TimelineLog = {
    id: string;
    action: string;
    new_status: string;
    timestamp_display: string;
    actor_name: string | null;
    note: string | null;
};

const HODDashboard = () => {
    const { user, logout } = useAuth();

    const [complaints, setComplaints] = useState<HODGrievance[]>([]);
    const [loading, setLoading]       = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [error, setError]           = useState<string | null>(null);

    // Detail View State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail]         = useState<HODGrievance | null>(null);
    const [timeline, setTimeline]     = useState<TimelineLog[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const [stats, setStats] = useState({
        open: 0,
        inProgress: 0,
        resolved: 0,
        slaBreaches: 0
    });

    const CSE_DEPT_ID = 'd1000000-0000-0000-0000-000000000001';

    const fetchData = useCallback(async () => {
        if (complaints.length === 0) setLoading(true);
        setError(null);

        try {
            const { data, error: sbError } = await supabase
                .from('v_hod_grievances')
                .select('*')
                .eq('department_id', CSE_DEPT_ID)
                .order('created_at', { ascending: false });

            if (sbError) throw sbError;

            const grievances = data as HODGrievance[];
            setComplaints(grievances);

            // Update stats
            const metrics = grievances.reduce((acc, curr) => {
                if (curr.status === 'OPEN') acc.open++;
                if (curr.status === 'IN_PROGRESS') acc.inProgress++;
                if (curr.status === 'RESOLVED') acc.resolved++;
                if (curr.is_slabreach) acc.slaBreaches++;
                return acc;
            }, { open: 0, inProgress: 0, resolved: 0, slaBreaches: 0 });

            setStats(metrics);

            // If a detail is selected and in the list, update it too
            if (selectedId) {
                const updatedSelected = grievances.find(g => g.id === selectedId);
                if (updatedSelected) setDetail(updatedSelected);
            }

        } catch (err: any) {
            console.error('HOD Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [complaints.length, selectedId]);

    const fetchDetail = useCallback(async (id: string) => {
        setDetailLoading(true);
        try {
            // Find in current list first (already includes description and ai_summary)
            const item = complaints.find(c => c.id === id);
            if (item) setDetail(item);

            // Fetch Timeline
            const { data: logs } = await supabase
                .from('v_complaint_timeline')
                .select('*')
                .eq('complaint_id', id)
                .order('timestamp', { ascending: false });

            setTimeline((logs as TimelineLog[]) || []);
        } finally {
            setDetailLoading(false);
        }
    }, [complaints]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (selectedId) fetchDetail(selectedId);
    }, [selectedId, fetchDetail]);

    const handleStatusUpdate = async (_e: React.MouseEvent | null, id: string, newStatus: string) => {
        if (_e) _e.stopPropagation();
        if (!user) return;
        setUpdatingId(id);
        
        try {
            const { error: updateError } = await supabase
                .from('complaints')
                .update({ status: newStatus })
                .eq('id', id);

            if (updateError) throw updateError;
            await fetchData();
        } catch (err: any) {
            alert(`Failed: ${err.message}`);
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-emerald-600 font-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mr-4"></div>
                BOOTING HOD SYSTEM...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center z-20 shadow-xl border-b border-teal-500/30">
                <h1 className="text-xl font-black tracking-tighter text-white flex items-center">
                    <span className="w-8 h-8 rounded bg-gradient-to-br from-teal-500 to-emerald-600 mr-3 flex items-center justify-center font-black text-xs">H</span>
                    HOD SYSTEM: {user?.department_code || 'DEPT'}
                </h1>
                <div className="flex items-center space-x-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-white leading-none uppercase tracking-widest">{user?.name || 'HOD User'}</p>
                        <p className="text-[9px] text-teal-400 font-bold uppercase tracking-tighter mt-1">{user?.department_name || 'Department'}</p>
                    </div>
                    <button onClick={logout} className="px-4 py-2 text-[10px] font-black bg-red-600/20 text-red-500 rounded border border-red-500/20 hover:bg-red-600/30 transition uppercase tracking-widest">Terminate</button>
                </div>
            </nav>

            <div className="flex-1 flex overflow-hidden">
                {/* LIST PANEL */}
                <aside className={`${selectedId ? 'hidden lg:flex w-1/3' : 'w-full'} flex flex-col bg-white border-r border-gray-100 shadow-inner z-10`}>
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                        {error && (
                            <div className="mb-4 p-2 bg-red-50 text-red-600 text-[10px] font-black rounded border border-red-100 uppercase text-center">
                                Error: {error}
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Grievance queue</h2>
                            <span className="px-2 py-0.5 bg-teal-50 text-teal-600 text-[10px] font-black rounded uppercase">CSE Live</span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3">
                            <div className="bg-white p-2 rounded border border-gray-100 text-center">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Open</p>
                                <p className="text-lg font-black text-teal-600">{stats.open}</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-100 text-center">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Actv</p>
                                <p className="text-lg font-black text-orange-500">{stats.inProgress}</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-100 text-center">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Done</p>
                                <p className="text-lg font-black text-emerald-500">{stats.resolved}</p>
                            </div>
                            <div className="bg-red-50 p-2 rounded border border-red-100 text-center">
                                <p className="text-[8px] font-black text-red-400 uppercase">Fail</p>
                                <p className="text-lg font-black text-red-600">{stats.slaBreaches}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {complaints.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">Empty Queue</div>
                        ) : (
                            complaints.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => setSelectedId(c.id)}
                                    className={`p-5 cursor-pointer transition-all hover:bg-gray-50 group border-l-4 ${
                                        selectedId === c.id ? 'bg-teal-50/50 border-teal-500' : 'border-transparent'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                                            c.priority === 'CRITICAL' || c.priority === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                                        }`}>{c.priority}</span>
                                        <span className="text-[9px] font-mono font-bold text-gray-400">{c.ref_id}</span>
                                    </div>
                                    <h3 className={`text-sm font-black uppercase tracking-tight line-clamp-1 transition-colors ${
                                        selectedId === c.id ? 'text-teal-700' : 'text-gray-900 group-hover:text-teal-600'
                                    }`}>{c.title}</h3>
                                    <p className="text-[10px] text-gray-400 font-medium mt-1 line-clamp-1">{c.description}</p>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center text-[9px] font-black">
                                            {updatingId === c.id ? (
                                                <span className="text-teal-600 animate-pulse">SYNCING...</span>
                                            ) : (
                                                <>
                                                    <span className={`w-2 h-2 rounded-full mr-2 ${
                                                        c.status === 'OPEN' ? 'bg-teal-500' : c.status === 'IN_PROGRESS' ? 'bg-orange-500' : 'bg-emerald-500'
                                                    }`}></span>
                                                    <span className={c.status === 'OPEN' ? 'text-teal-600' : c.status === 'IN_PROGRESS' ? 'text-orange-600' : 'text-emerald-600'}>
                                                        {c.status.replace('_', ' ')}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <span className={`text-[9px] font-black ${c.is_slabreach ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                                            {c.sla_display || 'STABLE'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* DETAIL PANEL */}
                <main className={`${selectedId ? 'flex' : 'hidden lg:flex'} flex-1 flex flex-col bg-white overflow-hidden relative`}>
                    {!selectedId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/50">
                            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-6 shadow-sm border border-teal-200">
                                <Info size={40} />
                            </div>
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Select a grievance</h2>
                            <p className="text-sm text-gray-400 font-bold mt-2 uppercase tracking-wide">Monitoring system ready. No record currently in focus.</p>
                        </div>
                    ) : (
                        <>
                            {/* Detail Toolbar */}
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20 shadow-sm">
                                <button onClick={() => setSelectedId(null)} className="lg:hidden flex items-center text-teal-600 font-black text-xs uppercase">
                                    <ArrowLeft size={16} className="mr-2" /> Back
                                </button>
                                <div className="hidden lg:flex items-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                    Focusing: <span className="text-teal-600 ml-2">{detail?.ref_id}</span>
                                </div>
                                <div className="flex space-x-2">
                                    {updatingId === detail?.id ? (
                                        <div className="px-4 py-2 text-[10px] font-black text-teal-600 animate-pulse uppercase">Syncing...</div>
                                    ) : (
                                        <>
                                            {detail?.status !== 'IN_PROGRESS' && detail?.status !== 'RESOLVED' && (
                                                <button 
                                                    onClick={() => handleStatusUpdate(null, detail!.id, 'IN_PROGRESS')}
                                                    className="px-4 py-2 bg-orange-600 text-white text-[10px] font-black rounded uppercase hover:bg-orange-700 transition shadow-lg"
                                                >
                                                    In Progress
                                                </button>
                                            )}
                                            {detail?.status !== 'RESOLVED' && (
                                                <button 
                                                    onClick={() => handleStatusUpdate(null, detail!.id, 'RESOLVED')}
                                                    className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded uppercase hover:bg-emerald-700 transition shadow-lg"
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                            {detail?.status !== 'REJECTED' && detail?.status !== 'RESOLVED' && (
                                                <button 
                                                    onClick={() => handleStatusUpdate(null, detail!.id, 'REJECTED')}
                                                    className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded uppercase hover:bg-red-700 transition shadow-lg"
                                                >
                                                    Reject
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12">
                                {detailLoading ? (
                                    <div className="flex items-center justify-center h-full text-teal-600 font-black text-xs animate-pulse uppercase tracking-widest">Fetching full intelligence...</div>
                                ) : detail && (
                                    <>
                                        {/* Header Detail */}
                                        <header>
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                <span className="px-3 py-1 bg-gray-900 text-white text-[9px] font-black rounded uppercase tracking-widest">{detail.category_label}</span>
                                                <span className={`px-3 py-1 border text-[9px] font-black rounded uppercase tracking-widest ${
                                                    detail.is_slabreach ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-blue-50 text-blue-600 border-blue-200'
                                                }`}>
                                                    {detail.sla_display || 'NO_DEADLINE'}
                                                </span>
                                                <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-100 text-[9px] font-black rounded uppercase tracking-widest">{detail.priority}</span>
                                            </div>
                                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-[1.1] mb-4">{detail.title}</h2>
                                            <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                                <Clock size={12} className="mr-1.5" /> Filed {detail.created_date} • CSE DEPARTMENT RECORD
                                            </div>
                                        </header>

                                        {/* Content Grid */}
                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                                            <div className="xl:col-span-2 space-y-12">
                                                <section>
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center">
                                                        <ChevronRight size={14} className="mr-2 text-teal-500" /> Narrative description
                                                    </h3>
                                                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 text-gray-700 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                                                        {detail.description}
                                                    </div>
                                                </section>

                                                {detail.ai_summary && (
                                                    <section className="bg-gradient-to-br from-teal-900 to-black p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                                                         <div className="relative z-10">
                                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-4 flex items-center">
                                                                <AlertTriangle size={14} className="mr-2" /> AI analytical intelligence
                                                            </h3>
                                                            <p className="text-xs text-gray-300 font-bold leading-relaxed mb-6 italic">"{detail.ai_summary}"</p>
                                                            <div className="flex gap-4">
                                                                <div className="px-3 py-1.5 bg-white/5 rounded border border-white/10 text-[8px] font-black uppercase tracking-tighter">Confidence: HIGH</div>
                                                                <div className="px-3 py-1.5 bg-white/5 rounded border border-white/10 text-[8px] font-black uppercase tracking-tighter">Routing: VALIDATED</div>
                                                            </div>
                                                         </div>
                                                         <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform"></div>
                                                    </section>
                                                )}

                                                <section>
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center">
                                                        <ChevronRight size={14} className="mr-2 text-teal-500" /> Operational timeline
                                                    </h3>
                                                    <div className="space-y-6 relative ml-3 border-l-2 border-gray-100 pl-8 pb-4">
                                                        {timeline.length === 0 ? (
                                                            <p className="text-[10px] text-gray-400 font-black uppercase py-4">Initial state recorded. No further logs.</p>
                                                        ) : (
                                                            timeline.map((log, idx) => (
                                                                <div key={log.id} className="relative mb-8">
                                                                    <div className={`absolute -left-[41px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                                                                        idx === 0 ? 'bg-teal-500 scale-125 shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'bg-gray-200'
                                                                    }`}></div>
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{log.action}</span>
                                                                        <span className="text-[9px] font-mono font-bold text-gray-400">{log.timestamp_display}</span>
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-500 font-medium">
                                                                        {log.note || `Transitioned to ${log.new_status}`}
                                                                        {log.actor_name && <span className="italic text-teal-600"> — {log.actor_name}</span>}
                                                                    </p>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </section>
                                            </div>

                                            <aside className="space-y-8">
                                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                                    <div>
                                                        <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-3">Target location</h4>
                                                        <div className="text-xs font-black text-gray-900 flex items-center">
                                                            <Info size={14} className="mr-2 text-teal-500" />
                                                            {detail.location || 'CAMPUS_WIDE'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-3">Originator identity</h4>
                                                        <div className="text-xs font-black text-gray-900 flex items-center">
                                                            <User size={14} className="mr-2 text-emerald-500" />
                                                            {detail.is_anonymous ? 'SECURED_ANONYMOUS' : detail.student_email || 'DECRYPTED_UNKNOWN'}
                                                        </div>
                                                    </div>
                                                    <div className="pt-6 border-t border-gray-50">
                                                        <div className="bg-gray-900 rounded-xl p-4 text-center">
                                                             <p className="text-[8px] font-black text-teal-400 uppercase mb-1">Current State</p>
                                                             <p className="text-xs font-black text-white uppercase tracking-widest">{detail.status.replace('_', ' ')}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                                                    <h4 className="text-[9px] font-black uppercase text-emerald-700 tracking-widest mb-3">Department status</h4>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                        <p className="text-[10px] text-emerald-800 font-black uppercase tracking-tight">Active Ownership: CSE HOD</p>
                                                    </div>
                                                </div>
                                            </aside>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default HODDashboard;
