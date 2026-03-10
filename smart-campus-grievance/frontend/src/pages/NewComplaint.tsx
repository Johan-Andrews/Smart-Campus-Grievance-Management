import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';

const NewComplaint = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('hostel');
    const [urgency, setUrgency] = useState('Low');
    const [location, setLocation] = useState('');
    const [department, setDepartment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (description.length > 20) {
                try {
                    const { data } = await api.post('/ai/draft-coach', { title, description });
                    setSuggestions(data.suggestions);
                } catch (e) { }
            } else {
                setSuggestions([]);
            }
        }, 1000); // Debounce
        return () => clearTimeout(timer);
    }, [title, description]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/complaints', {
                title, description, category, department, urgency, location, isAnonymous
            });
            navigate('/student/dashboard');
        } catch (err) {
            alert('Error submitting complaint');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans text-gray-900">
            <div className="max-w-3xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition">
                    <ArrowLeft size={18} className="mr-2" /> Back
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h1 className="text-2xl font-bold">Lodge a Grievance</h1>
                        <p className="text-gray-500 mt-1">Please provide accurate details. Our AI will automatically categorize and prioritize.</p>
                    </div>

                    <div className="p-8 flex flex-col md:flex-row gap-8">
                        <form onSubmit={handleSubmit} className="flex-1 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text" required value={title} onChange={e => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Broken projector in Room 302"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    required rows={5} value={description} onChange={e => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Detail the issue..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                        <option value="hostel">Hostel</option>
                                        <option value="academics">Academics</option>
                                        <option value="management">Management</option>
                                        <option value="hod">HOD</option>
                                        <option value="principal">Principal</option>
                                    </select>
                                </div>
                                {(category === 'hod' || category === 'academics') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                        <select required value={department} onChange={e => setDepartment(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                            <option value="">Select Department</option>
                                            <option value="CSE">CSE</option>
                                            <option value="CIVIL">CIVIL</option>
                                            <option value="ECE">ECE</option>
                                            <option value="EEE">EEE</option>
                                            <option value="MECH">MECH</option>
                                            <option value="BARCH">BARCH</option>
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                                    <select value={urgency} onChange={e => setUrgency(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                        <option>Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <input type="checkbox" id="anon" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                <label htmlFor="anon" className="text-sm text-gray-700">Submit anonymously (Trust score applies invisibly)</label>
                            </div>

                            <button disabled={loading} type="submit" className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50">
                                <Send size={18} className="mr-2" />
                                {loading ? 'Submitting...' : 'Submit Grievance'}
                            </button>
                        </form>

                        {/* AI Draft Coach Side Panel */}
                        <div className="w-full md:w-64 shrink-0 bg-blue-50/50 rounded-xl p-5 border border-blue-100 h-fit sticky top-8">
                            <div className="flex items-center text-blue-800 font-semibold mb-3">
                                <Sparkles size={18} className="mr-2" />
                                AI Draft Coach
                            </div>
                            {suggestions.length === 0 ? (
                                <p className="text-sm text-blue-600/70">Start typing your description to get real-time feedback designed to help resolve your issue faster.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {suggestions.map((s, i) => (
                                        <li key={i} className="text-sm text-blue-800 flex items-start">
                                            <span className="mr-2 mt-0.5">•</span>
                                            <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewComplaint;
