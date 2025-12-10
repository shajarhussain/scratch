import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';

const ExternalEvaluation = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [valid, setValid] = useState(false);
    const [data, setData] = useState(null);
    const [marks, setMarks] = useState({
        presentation: '',
        report: '',
        implementation: ''
    });
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const validate = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:5000/api/external/validate/${token}`);
                if (res.data.valid) {
                    setValid(true);
                    setData(res.data);
                }
                setLoading(false);
            } catch (err) {
                setValid(false);
                setLoading(false);
            }
        };
        validate();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://127.0.0.1:5000/api/external/submit', {
                token,
                marks,
                feedback
            });
            setSubmitted(true);
        } catch (err) {
            alert('Error submitting evaluation');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!valid) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Invalid or Expired Link</h1>
                <p className="text-slate-500">This evaluation link is no longer valid. Please contact the coordinator.</p>
            </div>
        </div>
    );

    if (submitted) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Evaluation Submitted</h1>
                <p className="text-slate-500">Thank you for your valuable feedback.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold">External Evaluation</h1>
                            <p className="text-slate-400 text-sm">Welcome, {data.evaluatorName}</p>
                        </div>
                        <ShieldCheck size={32} className="text-blue-500" />
                    </div>

                    <div className="p-8">
                        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <h3 className="font-bold text-blue-900 mb-1">Group Details</h3>
                            <p className="text-sm text-blue-700">Evaluating Group ID: <span className="font-mono">{data.group._id}</span></p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Presentation (20)</label>
                                    <input
                                        type="number"
                                        max="20"
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                        value={marks.presentation}
                                        onChange={(e) => setMarks({ ...marks, presentation: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Report (20)</label>
                                    <input
                                        type="number"
                                        max="20"
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                        value={marks.report}
                                        onChange={(e) => setMarks({ ...marks, report: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Implementation (10)</label>
                                    <input
                                        type="number"
                                        max="10"
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                        value={marks.implementation}
                                        onChange={(e) => setMarks({ ...marks, implementation: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Feedback / Comments</label>
                                <textarea
                                    className="w-full p-3 border border-slate-300 rounded-lg"
                                    rows="4"
                                    placeholder="Enter your detailed feedback here..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Submit Evaluation
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExternalEvaluation;
