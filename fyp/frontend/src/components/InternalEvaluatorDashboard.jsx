import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Users, CheckCircle, Clock, FileText, BarChart3 } from 'lucide-react';
import EvaluationForm from './EvaluationForm';

const InternalEvaluatorDashboard = () => {
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0
    });
    const [loading, setLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showEvaluationForm, setShowEvaluationForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchAssignments();
    }, []);

    useEffect(() => {
        calculateStats();
    }, [assignments]);

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/evaluator/assignments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignments(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setLoading(false);
        }
    };

    const calculateStats = () => {
        const total = assignments.length;
        const completed = assignments.filter(a => a.hasSubmitted).length;
        const pending = total - completed;
        setStats({ total, pending, completed });
    };

    const handleEvaluate = (assignment) => {
        setSelectedAssignment(assignment);
        setShowEvaluationForm(true);
    };

    const handleEvaluationSubmit = () => {
        setShowEvaluationForm(false);
        setSelectedAssignment(null);
        fetchAssignments(); // Refresh
    };

    const getEventIcon = (type) => {
        const icons = {
            'Proposal Defense': 'ðŸŽ¯',
            'Interim Evaluation I': 'ðŸ“Š',
            'Mid-Term Evaluation II': 'ðŸ“ˆ',
            'Final Viva': 'ðŸŽ“'
        };
        return icons[type] || 'ðŸ“‹';
    };

    const filteredAssignments = assignments.filter(a => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'pending') return !a.hasSubmitted;
        if (filterStatus === 'completed') return a.hasSubmitted;
        return true;
    });

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading assignments...</div>;
    }

    if (showEvaluationForm && selectedAssignment) {
        return (
            <EvaluationForm
                assignment={selectedAssignment}
                onSubmit={handleEvaluationSubmit}
                onCancel={() => setShowEvaluationForm(false)}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                    <BarChart3 size={28} />
                    <span>Evaluator Dashboard</span>
                </h1>
                <p className="mt-1 text-purple-100">View and evaluate your assigned groups</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Assignments</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <FileText className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Pending Evaluations</p>
                            <h3 className="text-3xl font-bold text-orange-600 mt-1">{stats.pending}</h3>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Clock className="text-orange-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Completed</p>
                            <h3 className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</h3>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-slate-700">Filter:</span>
                    <div className="flex space-x-2">
                        {['all', 'pending', 'completed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Assignments List */}
            <div className="space-y-4">
                {filteredAssignments.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                        <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500">No assignments found</p>
                    </div>
                ) : (
                    filteredAssignments.map(assignment => (
                        <div
                            key={assignment._id}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <span className="text-3xl">{getEventIcon(assignment.evaluationType)}</span>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">
                                                    {assignment.evaluationType}
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    {assignment.group?.groupCode}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${assignment.hasSubmitted
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                    }`}
                                            >
                                                {assignment.hasSubmitted ? 'Completed' : 'Pending'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
                                            <div className="flex items-center space-x-2">
                                                <Calendar size={16} />
                                                <span>{new Date(assignment.evaluationDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Users size={16} />
                                                <span>
                                                    {assignment.students?.length} student(s)
                                                </span>
                                            </div>
                                        </div>

                                        {assignment.students && assignment.students.length > 0 && (
                                            <div className="text-sm text-slate-600">
                                                <strong>Students:</strong>{' '}
                                                {assignment.students.map(s => s.name).join(', ')}
                                            </div>
                                        )}
                                    </div>

                                    <div className="ml-4">
                                        {!assignment.hasSubmitted ? (
                                            (() => {
                                                // Check constraints for Interim Evaluation I
                                                const isInterim = assignment.evaluationType === 'Interim Evaluation I';
                                                const srsApproved = assignment.srsDeliverable?.supervisorApproved;

                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                const evalDate = new Date(assignment.evaluationDate);
                                                evalDate.setHours(0, 0, 0, 0);

                                                if (today < evalDate) {
                                                    return (
                                                        <div className="flex flex-col items-center">
                                                            <button
                                                                disabled
                                                                className="px-6 py-3 bg-slate-100 text-slate-400 rounded-lg font-semibold cursor-not-allowed"
                                                            >
                                                                Evaluate
                                                            </button>
                                                            <span className="text-xs text-slate-400 mt-1 font-medium">Opens on {evalDate.toLocaleDateString()}</span>
                                                        </div>
                                                    );
                                                }

                                                if (isInterim && !srsApproved) {
                                                    return (
                                                        <div className="flex flex-col items-center">
                                                            <button
                                                                disabled
                                                                className="px-6 py-3 bg-slate-200 text-slate-500 rounded-lg font-semibold cursor-not-allowed"
                                                                title="Supervisor must approve SRS first"
                                                            >
                                                                Evaluate
                                                            </button>
                                                            <span className="text-xs text-orange-500 mt-1 font-medium">Wait for Supervisor</span>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <button
                                                        onClick={() => handleEvaluate(assignment)}
                                                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                                                    >
                                                        Evaluate
                                                    </button>
                                                );
                                            })()
                                        ) : (
                                            <div className="flex items-center space-x-2 text-green-600">
                                                <CheckCircle size={20} />
                                                <span className="font-medium">Submitted</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default InternalEvaluatorDashboard;
