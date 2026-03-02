import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [complaints, setComplaints] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [complaintsRes, analyticsRes] = await Promise.all([
                    api.get('/complaints'),
                    api.get('/admin/analytics')
                ]);
                setComplaints(complaintsRes.data);
                setStats(analyticsRes.data);
            } catch (err) { }
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
                    <span className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 mr-3 flex items-center justify-center font-black">A</span>
                    System Admin
                </h1>
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-300">{user?.email}</span>
                    <button onClick={logout} className="text-sm font-medium text-red-400 hover:text-red-300 transition">Logout</button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">

                {/* KPI Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
                            <p className="text-sm font-medium text-gray-500 mb-1">Open Grievances</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.metrics.open}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-purple-500">
                            <p className="text-sm font-medium text-gray-500 mb-1">In Progress</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.metrics.inProgress}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
                            <p className="text-sm font-medium text-gray-500 mb-1">Resolved</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.metrics.resolved}</h3>
                        </div>
                        <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm border-l-4 border-l-red-500">
                            <p className="text-sm font-medium text-red-800 mb-1 flex items-center"><AlertCircle size={16} className="mr-1" /> SLA Breaches</p>
                            <h3 className="text-3xl font-bold text-red-900">{stats.metrics.slaBreaches}</h3>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Table */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">All Grievances Global View</h3>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white shadow-sm ring-1 ring-gray-100">
                                    <tr className="text-xs text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-3 font-semibold">Title</th>
                                        <th className="px-6 py-3 font-semibold">Priority</th>
                                        <th className="px-6 py-3 font-semibold">Status</th>
                                        <th className="px-6 py-3 font-semibold">SLA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {complaints.map(c => (
                                        <tr key={c.id} onClick={() => navigate(`/complaint/${c.id}`)} className="hover:bg-gray-50 cursor-pointer transition text-sm">
                                            <td className="px-6 py-3 font-medium text-gray-900 max-w-[200px] truncate">{c.title}</td>
                                            <td className="px-6 py-3"><span className="px-2 py-0.5 rounded border bg-gray-50">{c.priority}</span></td>
                                            <td className="px-6 py-3">{c.status}</td>
                                            <td className="px-6 py-3 text-gray-500">{format(new Date(c.slaDeadline), 'MMM d, ha')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recurrent & Moderation Panel */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center">
                                <AlertCircle size={18} className="mr-2 text-orange-500" />
                                Systemic Issues (Recurrent)
                            </h3>
                            {stats?.systemicIssues?.length === 0 ? (
                                <p className="text-sm text-gray-500">No highly recurrent issues detected.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {stats?.systemicIssues?.map((s: any) => (
                                        <li key={s.id} className="p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm">
                                            <div className="font-semibold text-orange-900">{s.issueType}</div>
                                            <div className="text-orange-800 flex justify-between mt-1">
                                                <span>Location: {s.location}</span>
                                                <span className="font-bold">{s.frequency} reports</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center">
                                SLA Breached Currently
                            </h3>
                            {stats?.slaViolations?.length === 0 ? (
                                <p className="text-sm text-gray-500">All within SLA limits.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {stats?.slaViolations?.map((v: any) => (
                                        <li key={v.id} onClick={() => navigate(`/complaint/${v.id}`)} className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm cursor-pointer hover:bg-red-100 transition">
                                            <div className="font-semibold text-red-900 truncate">{v.title}</div>
                                            <div className="text-red-700 mt-1">Overdue: {format(new Date(v.slaDeadline), 'PPp')}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
