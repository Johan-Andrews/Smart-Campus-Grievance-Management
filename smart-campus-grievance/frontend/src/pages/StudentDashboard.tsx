import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Clock, Plus, AlertCircle, FileText } from 'lucide-react';
import { format, isPast } from 'date-fns';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState<any[]>([]);

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const { data } = await api.get('/complaints');
                setComplaints(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchComplaints();
    }, []);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'IN_PROGRESS': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'RESOLVED': return 'bg-green-50 text-green-700 border-green-200';
            case 'REJECTED': return 'bg-gray-50 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Smart Campus</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600">{user?.email}</span>
                    <button onClick={logout} className="text-sm font-medium text-red-600 hover:text-red-700 transition">Logout</button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">My Grievances</h2>
                        <p className="text-gray-500 mt-1">Track and manage your submitted complaints.</p>
                    </div>
                    <button
                        onClick={() => navigate('/student/new')}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition font-medium"
                    >
                        <Plus size={18} />
                        <span>New Grievance</span>
                    </button>
                </div>

                <div className="grid gap-6">
                    {complaints.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                            <h3 className="text-lg font-medium text-gray-900">No grievances yet</h3>
                            <p className="text-gray-500">You haven't submitted any complaints.</p>
                        </div>
                    ) : (
                        complaints.map(c => {
                            const deadline = new Date(c.slaDeadline);
                            const isOverdue = isPast(deadline) && (c.status === 'OPEN' || c.status === 'IN_PROGRESS');

                            return (
                                <div key={c.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => navigate(`/complaint/${c.id}`)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">{c.title}</h3>
                                        <div className="flex space-x-2">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getPriorityColor(c.priority)}`}>
                                                {c.priority}
                                            </span>
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusColor(c.status)}`}>
                                                {c.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{c.description}</p>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center text-gray-500 space-x-4">
                                            <span>Category: <span className="font-medium text-gray-700">{c.category}</span></span>
                                            <span>•</span>
                                            <span>Created: {format(new Date(c.createdAt), 'MMM d, yyyy')}</span>
                                        </div>

                                        {(c.status === 'OPEN' || c.status === 'IN_PROGRESS') && (
                                            <div className={`flex items-center space-x-1.5 font-medium ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                                                {isOverdue ? <AlertCircle size={16} /> : <Clock size={16} />}
                                                <span>
                                                    {isOverdue ? 'SLA Breached ' : 'ETA: '}
                                                    {format(deadline, 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
