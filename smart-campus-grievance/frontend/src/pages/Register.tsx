import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [department, setDepartment] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/register', { email, password, role, department: role === 'FACULTY' ? department : undefined });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-xl border border-gray-100">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">Create an Account</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">Smart Campus Grievance Platform</p>
                </div>
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">{error}</div>}

                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input type="email" required className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-black" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input type="password" required className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-black" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Role</label>
                            <select className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={role} onChange={e => setRole(e.target.value)}>
                                <option value="STUDENT">Student</option>
                                <option value="FACULTY">Faculty</option>
                                <option value="ADMIN">System Admin</option>
                            </select>
                        </div>

                        {role === 'FACULTY' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Department Name</label>
                                <input type="text" required className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-black" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Academic, IT_Infrastructure" />
                            </div>
                        )}
                    </div>

                    <div>
                        <button disabled={loading} type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition">
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </div>

                    <div className="text-center text-sm">
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Already have an account? Sign in</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
