import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const ComplaintDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [complaint, setComplaint] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComplaint = async () => {
            try {
                const { data } = await api.get(`/complaints/${id}`);
                setComplaint(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchComplaint();
    }, [id]);

    const handleStatusUpdate = async (status: string) => {
        try {
            await api.put(`/complaints/${id}/status`, { status });
            // Refresh
            const { data } = await api.get(`/complaints/${id}`);
            setComplaint(data);
        } catch (err) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="p-8 text-center bg-gray-50 min-h-screen">Loading...</div>;
    if (!complaint) return <div className="p-8 text-center bg-gray-50 min-h-screen text-red-500">Complaint not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans text-gray-900">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition">
                    <ArrowLeft size={18} className="mr-2" /> Back
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                        <div>
                            <div className="flex space-x-2 mb-2">
                                <span className="px-2 py-1 text-xs font-semibold rounded-md border bg-white">{complaint.category}</span>
                                <span className="px-2 py-1 text-xs font-semibold rounded-md border bg-white text-gray-600">{complaint.priority}</span>
                                <span className="px-2 py-1 text-xs font-semibold rounded-md border bg-blue-50 text-blue-700">{complaint.status}</span>
                            </div>
                            <h1 className="text-2xl font-bold">{complaint.title}</h1>
                            <p className="text-gray-500 text-sm mt-1">Submitted on {format(new Date(complaint.createdAt), 'PPpp')}</p>
                        </div>

                        {/* Admin/Faculty Actions */}
                        {(user?.role === 'ADMIN' || user?.role === 'FACULTY') && complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED' && (
                            <div className="flex space-x-2">
                                {complaint.status === 'OPEN' && (
                                    <button onClick={() => handleStatusUpdate('IN_PROGRESS')} className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700">Mark In Progress</button>
                                )}
                                <button onClick={() => handleStatusUpdate('RESOLVED')} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">Resolve</button>
                                <button onClick={() => handleStatusUpdate('REJECTED')} className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700">Reject</button>
                            </div>
                        )}
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Description</h3>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{complaint.description}</p>

                            {complaint.aiAnalysis && (
                                <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                                    <h3 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center">
                                        <AlertTriangle size={16} className="mr-2" /> AI Analysis Summary
                                    </h3>
                                    <p className="text-sm text-indigo-900 mb-2">{complaint.aiAnalysis.aiSummary}</p>
                                    {(user?.role === 'ADMIN' || user?.role === 'FACULTY') && (
                                        <div className="text-xs text-indigo-700 mt-2 p-2 bg-white rounded border border-indigo-100">
                                            <span className="font-semibold">Explainable Output: </span>
                                            {JSON.parse(complaint.aiAnalysis.explainableOutput || '{}').reasoning || 'N/A'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Meta Details</h3>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li><span className="text-gray-500 w-24 inline-block">Location:</span> {complaint.location || 'N/A'}</li>
                                    <li><span className="text-gray-500 w-24 inline-block">Student:</span> {complaint.isAnonymous ? 'Anonymous' : (complaint.student?.email || 'Unknown')}</li>
                                    <li><span className="text-gray-500 w-24 inline-block">SLA Deadline:</span> {format(new Date(complaint.slaDeadline), 'PPp')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline Log */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold mb-6">Activity Timeline</h3>
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                        {complaint.logs.map((log: any) => (
                            <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                                    {log.newStatus === 'RESOLVED' ? <CheckCircle size={18} /> : <Clock size={18} />}
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-gray-900 text-sm">{log.action}</span>
                                        <span className="text-xs text-gray-500">{format(new Date(log.timestamp), 'p, MMM d')}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Status changed to <span className="font-medium">{log.newStatus}</span>
                                        {log.changedBy ? ` by ${log.changedBy.role.toLowerCase()}` : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetail;
