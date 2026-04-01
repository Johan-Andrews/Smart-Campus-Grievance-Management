// pages/LoginPage.tsx
import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const err = await login(email, password);
      if (err) setError(err);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">

      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Smart Campus
        </h1>
        <p className="text-gray-500 mt-2 text-sm">Grievance Management System</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign in</h2>
        <p className="text-sm text-gray-500 mb-6">
          Use your institutional email to continue.
        </p>

        {/* Error banner */}
        {error && (
          <div className="flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@college.edu"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium text-sm transition"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            <span>{submitting ? 'Signing in...' : 'Sign in'}</span>
          </button>

        </form>
        
        <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">Register</Link>
        </div>
      </div>

      {/* Test credentials hint — remove in production */}
      {/* <div className="mt-6 w-full max-w-md bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
        <p className="font-semibold mb-2">Test accounts</p>
        <div className="space-y-1 font-mono">
          <p>admin@test.com · password</p>
          <p>hodcse@test.com · password</p>
          <p>student@test.com · password</p>
        </div>
      </div> */}

    </div>
  );
};

export default LoginPage;
