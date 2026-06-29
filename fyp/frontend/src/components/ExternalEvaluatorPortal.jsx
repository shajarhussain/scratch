import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Clock, Calendar, Users, AlertCircle, FileText } from 'lucide-react';
import EvaluationForm from './EvaluationForm';

const ExternalEvaluatorPortal = () => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showEvaluationForm, setShowEvaluationForm] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState('');
    const [expiryWarning, setExpiryWarning] = useState(false);

    useEffect(() => {
        // Check if external user
        const isExternal = localStorage.getItem('isExternal');
        if (!isExternal) {
            navigate('/login');
            return;
        }

        fetchAssignments();
        calculateTimeRemaining();

        // Update time every minute
        const interval = setInterval(calculateTimeRemaining, 60000);
        return () => clearInterval(interval);
    }, []);

    const calculateTimeRemaining = () => {
        const expiresAt = localStorage.getItem('expiresAt');
        if (!expiresAt) return;

        const expiry = new Date(expiresAt);
        const now = new Date();
        const diff = expiry - now;

        if (diff <= 0) {
            handleExpiry();
            return;
        }

        // Show warning if less than 24 hours
        if (diff < 24 * 60 * 60 * 1000) {
            setExpiryWarning(true);
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        setTimeRemaining(`${hours}h ${minutes}m`);
    };

    const handleExpiry = () => {
        localStorage.clear();
        navigate('/login');
    };

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/evaluator/external/assignments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignments(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            if (error.response?.status === 401) {
                handleExpiry();
            }
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleEvaluate = (assignment) => {
        setSelectedAssignment(assignment);
        setShowEvaluationForm(true);
    };

    const handleEvaluationSubmit = () => {
        setShowEvaluationForm(false);
        setSelectedAssignment(null);
        fetchAssignments();
    };

    if (showEvaluationForm && selectedAssignment) {
        return (
            <EvaluationForm
                assignment={selectedAssignment}
                onSubmit={handleEvaluationSubmit}
                onCancel={() => setShowEvaluationForm(false)}
                isExternal={true}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">External Evaluator Portal</h1>
                            <p className="text-purple-100 text-sm mt-1">Final Viva Evaluations</p>
                        </div>

                        <div className="flex items-center space-x-6">
                            {/* Time Remaining */}
                            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${expiryWarning ? 'bg-red-500/20 border border-red-300' : 'bg-white/20'
                                }`}>
                                <Clock size={18} />
                                <div className="text-sm">
                                    <div className="font-semibold">Access Expires In</div>
                                    <div className="text-xs">{timeRemaining || 'Calculating...'}</div>
                                </div>
                            </div>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning Banner */}
            {expiryWarning && (
                <div className="bg-red-50 border-b border-red-200">
                    <div className="max-w-7xl mx-auto px-6 py-3">
                        <div className="flex items-center space-x-3 text-red-800">
                            <AlertCircle size={20} />
                            <p className="text-sm font-medium">
                                âš ï¸ Your access will expire soon. Please complete your evaluations.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Info Card */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-8">
                    <div className="flex items-start space-x-4">
                        <FileText className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                        <div>
                            <h3 className="font-bold text-blue-900 mb-2">External Evaluator Guidelines</h3>
                            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                <li>You have been assigned to evaluate Final Year Projects for Final Viva</li>
                                <li>Please review all project materials before submitting your evaluation</li>
                                <li>Your scores will be combined with internal evaluators for final grading</li>
                                <li>Ensure to complete evaluations before your access expires</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Assignments */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 bg-slate-50 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800">Your Assigned Evaluations</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {assignments.length} Final Viva assignment(s)
                        </p>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Loading assignments...</div>
                    ) : assignments.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500">No assignments found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {assignments.map((assignment) => (
                                <div key={assignment._id} className="p-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <span className="text-3xl">ðŸŽ“</span>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800">
                                                        {assignment.eventType}
                                                    </h3>
                                                    <p className="text-sm text-slate-500">
                                                        {assignment.group?.groupCode}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar size={16} />
                                                    <span>{new Date(assignment.eventDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Users size={16} />
                                                    <span>{assignment.students?.length || 0} student(s)</span>
                                                </div>
                                            </div>

                                            {assignment.students && (
                                                <div className="text-sm text-slate-600">
                                                    <strong>Students:</strong> {assignment.students.map(s => s.name).join(', ')}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleEvaluate(assignment)}
                                            className="ml-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                                        >
                                            Evaluate
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Security Notice */}
                <div className="mt-6 text-center text-xs text-slate-400">
                    <p>ðŸ”’ This is a secure, time-limited access portal. All activities are logged.</p>
                </div>
            </div>
        </div>
    );
};

export default ExternalEvaluatorPortal;
