import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type GrievanceDetail = {
    id: string;
    ref_id: string;
    title: string;
    description: string;
    category: string;
    category_label: string;
    priority: string;
    urgency: string;
    status: string;
    is_anonymous: boolean;
    location: string | null;
    created_at: string;
    created_date: string;
    sla_deadline: string | null;
    sla_display: string | null;
    sla_breach_label: string | null;
    resolved_at: string | null;
    student_email: string;
    ai_summary: string | null;
    explainable_output?: string | null;
};

type TimelineLog = {
    id: string;
    complaint_id: string;
    action: string;
    new_status: string;
    timestamp: string;
    timestamp_display: string;
    actor_name: string | null;
    note: string | null;
};

const ComplaintDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [complaint, setComplaint] = useState<GrievanceDetail | null>(null);
    const [logs, setLogs]           = useState<TimelineLog[]>([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Fetch main grievance details from v_admin_grievances (most comprehensive view)
            const { data: grievance, error: gError } = await supabase
                .from('v_admin_grievances')
                .select('*')
                .eq('id', id)
                .single();

            if (gError) throw gError;
            if (!grievance) throw new Error('Complaint not found.');

            // 2. Fetch explainable output from raw table if needed (not in view)
            const { data: aiData } = await supabase
                .from('complaint_ai_analysis')
                .select('explainable_output')
                .eq('complaint_id', id)
                .single();

            // 3. Fetch logs from timeline view
            const { data: timelineLogs, error: lError } = await supabase
                .from('v_complaint_timeline')
                .select('*')
                .eq('complaint_id', id)
                .order('timestamp', { ascending: false });

            if (lError) console.warn('Failed to load logs', lError);

            setComplaint({
                ...grievance,
                explainable_output: aiData?.explainable_output ? JSON.stringify(aiData.explainable_output) : null
            });
            setLogs(timelineLogs || []);

        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStatusUpdate = async (status: string) => {
        if (!id || !user) return;
        
        try {
            const { error: updateError } = await supabase
                .from('complaints')
                .update({ status })
                .eq('id', id);

            if (updateError) throw updateError;
            
            // Re-fetch data to show updated status and new log
            fetchData();
        } catch (err: any) {
            alert(`Failed to update status: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !complaint) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
                <p className="text-gray-600 mb-6">{error || 'Complaint not found.'}</p>
                <button onClick={() => navigate(-1)} className="text-blue-600 font-medium hover:underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans text-gray-900">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition">
                    <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                        <div>
                            <div className="flex space-x-2 mb-2">
                                <span className="px-2 py-1 text-xs font-semibold rounded-md border bg-white">{complaint.category_label}</span>
                                <span className="px-2 py-1 text-xs font-semibold rounded-md border bg-white text-gray-600">{complaint.priority}</span>
                                <span className="px-2 py-1 text-xs font-semibold rounded-md border bg-blue-50 text-blue-700">{complaint.status.replace('_', ' ')}</span>
                            </div>
                            <h1 className="text-2xl font-bold">{complaint.title}</h1>
                            <p className="text-gray-500 text-sm mt-1">Ref ID: <span className="font-mono text-blue-600 font-bold">{complaint.ref_id}</span> • Submitted on {complaint.created_date}</p>
                        </div>

                        {/* Admin/Faculty Actions */}
                        {(user?.role === 'ADMIN' || user?.role === 'FACULTY' || user?.role === 'HOD') && complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED' && (
                            <div className="flex space-x-2">
                                {complaint.status === 'OPEN' && (
                                    <button onClick={() => handleStatusUpdate('IN_PROGRESS')} className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition shadow-sm">Mark In Progress</button>
                                )}
                                <button onClick={() => handleStatusUpdate('RESOLVED')} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition shadow-sm">Resolve</button>
                                <button onClick={() => handleStatusUpdate('REJECTED')} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition shadow-sm">Reject</button>
                            </div>
                        )}
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Description</h3>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{complaint.description}</p>

                            {complaint.ai_summary && (
                                <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                                    <h3 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center">
                                        <AlertTriangle size={16} className="mr-2" /> AI Analysis Summary
                                    </h3>
                                    <p className="text-sm text-indigo-900 mb-2">{complaint.ai_summary}</p>
                                    {(user?.role === 'ADMIN' || user?.role === 'FACULTY' || user?.role === 'HOD') && complaint.explainable_output && (
                                        <div className="text-xs text-indigo-700 mt-2 p-2 bg-white rounded border border-indigo-100">
                                            <span className="font-semibold">Reasoning: </span>
                                            {JSON.parse(complaint.explainable_output || '{}').reasoning || 'N/A'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Meta Details</h3>
                                <ul className="space-y-3 text-sm text-gray-700 font-medium">
                                    <li className="flex justify-between">
                                        <span className="text-gray-500 uppercase text-[10px] tracking-wider">Location</span>
                                        <span className="text-right">{complaint.location || 'N/A'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-gray-500 uppercase text-[10px] tracking-wider">Student</span>
                                        <span className="text-right">{complaint.is_anonymous ? 'Anonymous' : (complaint.student_email || 'Unknown')}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-gray-500 uppercase text-[10px] tracking-wider">Urgency</span>
                                        <span className="text-right">{complaint.urgency}</span>
                                    </li>
                                    <li className="flex justify-between border-t border-gray-100 pt-3">
                                        <span className="text-gray-500 uppercase text-[10px] tracking-wider">ETA / Deadline</span>
                                        <span className={`text-right ${complaint.sla_breach_label ? 'text-red-500' : 'text-blue-600'}`}>
                                            {complaint.sla_breach_label ?? (complaint.sla_display || 'N/A')}
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline Log */}
                {logs.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold mb-6">Activity Timeline</h3>
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                            {logs.map((log) => (
                                <div key={log.id} className="relative flex items-center justify-between group">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-600 shrink-0 shadow-sm z-10">
                                        {(log.new_status === 'RESOLVED' || log.action.includes('Resolve')) ? <CheckCircle size={18} /> : <Clock size={18} />}
                                    </div>
                                    <div className="ml-6 w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 transition">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-gray-900 text-sm">{log.action}</span>
                                            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-tighter">{log.timestamp_display}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {log.note || `Status changed to ${log.new_status?.replace('_', ' ')}`}
                                            {log.actor_name ? ` by ${log.actor_name}` : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComplaintDetail;
