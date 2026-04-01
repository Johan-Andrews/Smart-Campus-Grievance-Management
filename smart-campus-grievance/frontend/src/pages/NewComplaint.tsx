import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useGrievanceForm } from '../hooks/useGrievanceForm';

const NewComplaint = () => {
    const navigate = useNavigate();
    const {
        form,
        setField,
        submit,
        aiSuggestion,
        aiLoading,
        submitting,
        submitError,
        submitted,
        showDepartmentHint
    } = useGrievanceForm();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submit();
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-sans">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-green-100">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Grievance Lodged!</h2>
                    <p className="text-gray-600 mb-8">
                        Your complaint has been successfully submitted. Reference ID: <span className="font-mono font-bold text-blue-600">{submitted.ref_id}</span>
                    </p>
                    <div className="space-y-3">
                        <button 
                            onClick={() => navigate('/student/dashboard')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                            {submitError && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start text-red-700 text-sm">
                                    <AlertCircle size={18} className="mr-2 shrink-0 mt-0.5" />
                                    {submitError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text" required value={form.title} 
                                    onChange={e => setField('title', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Broken projector in Room 302"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    required rows={5} value={form.description} 
                                    onChange={e => setField('description', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Detail the issue..."
                                />
                                {showDepartmentHint && aiSuggestion?.department_name && (
                                    <p className="mt-2 text-xs text-blue-600 font-medium flex items-center">
                                        <Sparkles size={12} className="mr-1" />
                                        Auto-routing to: {aiSuggestion.department_name}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                                    <select 
                                        value={form.urgency} 
                                        onChange={e => setField('urgency', e.target.value as any)} 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="CRITICAL">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input 
                                        type="text" value={form.location} 
                                        onChange={e => setField('location', e.target.value)} 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                                        placeholder="Optional" 
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <input 
                                    type="checkbox" id="anon" checked={form.isAnonymous} 
                                    onChange={e => setField('isAnonymous', e.target.checked)} 
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                                />
                                <label htmlFor="anon" className="text-sm text-gray-700">Submit anonymously (Trust score applies invisibly)</label>
                            </div>

                            <button disabled={submitting} type="submit" className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50">
                                <Send size={18} className="mr-2" />
                                {submitting ? 'Submitting...' : 'Submit Grievance'}
                            </button>
                        </form>

                        {/* AI Draft Coach Side Panel */}
                        <div className="w-full md:w-80 shrink-0 bg-blue-50/50 rounded-xl p-5 border border-blue-100 h-fit sticky top-8">
                            <div className="flex items-center text-blue-800 font-semibold mb-3">
                                <Sparkles size={18} className="mr-2" />
                                AI Draft Coach
                            </div>
                            
                            {aiLoading && (
                                <div className="flex items-center space-x-2 text-sm text-blue-600 animate-pulse mb-3">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <span>AI is analyzing...</span>
                                </div>
                            )}

                            {(!aiSuggestion || aiSuggestion.suggestions.length === 0) ? (
                                <p className="text-sm text-blue-600/70">
                                    {aiLoading ? 'Refining suggestions...' : 'Start typing your description to get real-time feedback designed to help resolve your issue faster.'}
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    <ul className="space-y-3">
                                        {aiSuggestion.suggestions.map((s, i) => (
                                            <li key={i} className="text-sm text-blue-800 flex items-start bg-white/50 p-2 rounded-lg border border-blue-100/50 shadow-sm transition-all hover:shadow-md hover:bg-white">
                                                <span className="mr-2 mt-0.5 text-blue-500">•</span>
                                                <span>{s}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {aiSuggestion.ai_summary && (
                                        <div className="pt-4 border-t border-blue-100">
                                            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">AI Summary</h4>
                                            <p className="text-sm text-blue-800 italic leading-relaxed">
                                                "{aiSuggestion.ai_summary}"
                                            </p>
                                        </div>
                                    )}

                                    {aiSuggestion.category && (
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">
                                                Auto-Cat: {aiSuggestion.category}
                                            </span>
                                            {aiSuggestion.quality_score !== null && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${aiSuggestion.quality_score > 7 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    Quality: {aiSuggestion.quality_score}/10
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewComplaint;
