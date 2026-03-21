import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';

const MOCK_DEPT_COMPLAINTS = [
    {
        id: '101',
        title: 'Projector in LH-1 not working',
        description: 'The projector turns off automatically after 5 minutes of use.',
        priority: 'HIGH',
        status: 'OPEN',
        isAnonymous: false,
        student: { email: 'student1@test.com' },
        createdAt: new Date().toISOString()
    },
    {
        id: '102',
        title: 'Laboratory Assistant absence',
        description: 'The lab assistant for the morning session has been absent for 3 days without notice.',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        isAnonymous: true,
        student: { email: 'hidden@test.com' },
        createdAt: addDays(new Date(), -2).toISOString()
    }
];

const FacultyDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [complaints] = useState<any[]>(MOCK_DEPT_COMPLAINTS);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">Faculty Hub</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600">{user?.email} ({user?.department || 'Faculty'})</span>
                    <button onClick={logout} className="text-sm font-medium text-red-600 hover:text-red-700 transition">Logout</button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Department Grievances</h2>
                    <p className="text-gray-500 mt-1">Manage and resolve issues assigned to your department.</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Title</th>
                                <th className="px-6 py-4 font-semibold">Priority</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Student</th>
                                <th className="px-6 py-4 font-semibold">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {complaints.map(c => (
                                <tr key={c.id} onClick={() => navigate(`/complaint/${c.id}`)} className="hover:bg-gray-50 cursor-pointer transition">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{c.title}</div>
                                        <div className="text-sm text-gray-500 truncate w-64">{c.description}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 text-xs font-semibold rounded bg-gray-100 border">{c.priority}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 border">{c.status.replace('_', ' ')}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {c.isAnonymous ? 'Anonymous' : (c.student?.email || 'Unknown')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {format(new Date(c.createdAt), 'MMM d, yyyy')}
                                    </td>
                                </tr>
                            ))}
                            {complaints.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No complaints assigned to your department.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default FacultyDashboard;
