import { useState } from 'react';
import axios from 'axios';
import { ClipboardCheck, Hash, Star, MessageSquare, Check, AlertCircle } from 'lucide-react';

const GradingForm = () => {
    const [evalId, setEvalId] = useState('');
    const [marks, setMarks] = useState({
        supervisor: 0,
        internal: 0,
        external: 0,
        feedback: ''
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setMarks({ ...marks, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        // Validate Evaluation ID format (MongoDB ObjectId is 24 characters)
        if (evalId.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(evalId)) {
            setMessage('Error: Invalid Evaluation ID format. Please enter a valid 24-character evaluation ID.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`/api/evaluations/${evalId}/marks`, {
                supervisor: Number(marks.supervisor),
                internal: Number(marks.internal),
                external: Number(marks.external),
                feedback: marks.feedback
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage(`Marks Submitted! Total: ${res.data.marks.total}`);
        } catch (err) {
            setMessage(`Error: ${err.response?.data?.message || err.message}`);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                        <ClipboardCheck className="text-orange-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Evaluation & Grading</h2>
                        <p className="text-sm text-slate-500">Submit marks for student defenses based on rubrics.</p>
                    </div>
                </div>

                <div className="p-8">
                    {message && (
                        <div className={`mb-6 p-4 border-l-4 rounded flex items-center space-x-2 ${message.includes('Error')
                            ? 'bg-red-50 border-red-500 text-red-700'
                            : 'bg-green-50 border-green-500 text-green-700'
                            }`}>
                            {message.includes('Error') ? <AlertCircle size={20} /> : <Check size={20} />}
                            <span>{message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Evaluation ID</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={evalId}
                                    onChange={(e) => setEvalId(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter 24-character Evaluation ID (e.g., 507f1f77bcf86cd799439011)"
                                    required
                                    maxLength="24"
                                    pattern="[a-fA-F0-9]{24}"
                                    title="Evaluation ID must be a 24-character hexadecimal string"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Supervisor Marks</label>
                                <div className="relative">
                                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        name="supervisor"
                                        value={marks.supervisor}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Internal Marks</label>
                                <div className="relative">
                                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        name="internal"
                                        value={marks.internal}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">External Marks</label>
                                <div className="relative">
                                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        name="external"
                                        value={marks.external}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Feedback</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 text-slate-400" size={18} />
                                <textarea
                                    name="feedback"
                                    value={marks.feedback}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter detailed feedback..."
                                ></textarea>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center space-x-2"
                        >
                            <ClipboardCheck size={20} />
                            <span>Submit Grades</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GradingForm;
