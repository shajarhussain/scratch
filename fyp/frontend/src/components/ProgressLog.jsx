import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckCircle, MessageSquare, Clock, Award, FileText, Users, ArrowLeft } from 'lucide-react';

const ProgressLog = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        weekNumber: 1,
        weekStartDate: new Date().toISOString().split('T')[0],
        tasksCompleted: '',
        nextWeekTasks: '',
        challenges: '',
        hoursSpent: 0
    });
    const [feedbackForm, setFeedbackForm] = useState({ logId: null, feedback: '' });

    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);

    useEffect(() => {
        if ((user.role === 'Coordinator' || user.role === 'Admin') && !selectedGroup) {
            fetchGroups();
        } else {
            fetchLogs();
        }
    }, [user, selectedGroup]);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('/api/groups', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch groups:', err);
            setError('Failed to load groups');
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            let progressEndpoint;
            let supervisorLogsEndpoint;

            if (user.role === 'Student') {
                progressEndpoint = '/api/progress/my-group';
                supervisorLogsEndpoint = '/api/supervisor-logs/student/my-logs';
            } else if (user.role === 'Supervisor') {
                progressEndpoint = '/api/progress/supervisor/groups';
                supervisorLogsEndpoint = '/api/supervisor-logs/my-logs';
            } else if (user.role === 'Coordinator' || user.role === 'Admin') {
                if (selectedGroup) {
                    progressEndpoint = `/api/progress/group/${selectedGroup._id}`;
                    supervisorLogsEndpoint = `/api/supervisor-logs/coordinator/group/${selectedGroup._id}`;
                } else {
                    return; // Wait for selection
                }
            }

            if (!progressEndpoint) {
                setLoading(false);
                return;
            }

            // Fetch Progress Logs
            const progressRes = await axios.get(progressEndpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Fetch Supervisor Logs (Meeting Records)
            let supervisorLogs = [];
            if (supervisorLogsEndpoint) {
                try {
                    const svRes = await axios.get(supervisorLogsEndpoint, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    supervisorLogs = svRes.data.map(log => ({ ...log, type: 'supervisor_log' }));
                } catch (err) {
                    // Ignore supervisor log fetch errors (optional feature)
                }
            }

            // Merge and Sort
            const progressLogs = progressRes.data.map(log => ({ ...log, type: 'student_log' }));
            const combinedLogs = [...progressLogs, ...supervisorLogs].sort((a, b) => {
                const dateA = new Date(a.meetingDate || a.weekStartDate || a.createdAt);
                const dateB = new Date(b.meetingDate || b.weekStartDate || b.createdAt);
                return dateB - dateA;
            });

            setLogs(combinedLogs);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
            const status = err.response?.status;
            let msg = err.response?.data?.message || 'Failed to load progress logs';

            if (status === 403) {
                msg = `${msg}. If you believe this is an error, please try logging out and logging back in.`;
            }

            setError(msg);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(
                '/api/progress',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setLogs([data, ...logs]);
            setSuccess(`Week ${formData.weekNumber} log submitted successfully!`);
            setFormData({
                weekNumber: formData.weekNumber + 1,
                weekStartDate: new Date().toISOString().split('T')[0],
                tasksCompleted: '',
                nextWeekTasks: '',
                challenges: '',
                hoursSpent: 0
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit log');
        }
    };

    const handleAddFeedback = async (logId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `/api/progress/${logId}/feedback`,
                { feedback: feedbackForm.feedback },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setLogs(logs.map(l =>
                l._id === logId
                    ? { ...l, supervisorFeedback: feedbackForm.feedback, status: 'Reviewed' }
                    : l
            ));
            setFeedbackForm({ logId: null, feedback: '' });
            setSuccess('Feedback added successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add feedback');
        }
    };

    const renderLogCard = (log) => {
        if (log.type === 'supervisor_log') {
            return (
                <div key={log._id} className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Meeting Log #{log.logNumber}</h3>
                                <p className="text-xs text-slate-500">
                                    {new Date(log.meetingDate).toLocaleDateString()} â€¢ {log.meetingType} Meeting
                                </p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${log.logStatus === 'Approved' ? 'bg-green-100 text-green-700' :
                            log.logStatus === 'Warning Issued' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                            {log.logStatus}
                        </span>
                    </div>
                    <div className="text-sm text-slate-600 mb-2">
                        <strong>Progress:</strong> {log.progressStatus}
                    </div>
                    <div className="text-sm text-slate-600">
                        <strong>Work Reviewed:</strong> {log.workReviewed}
                    </div>
                    {user.role === 'Student' && log.suggestionsGuidance && (
                        <div className="mt-3 p-3 bg-slate-50 rounded text-sm text-slate-700">
                            <strong>Guidance:</strong> {log.suggestionsGuidance}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div key={log._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Week {log.weekNumber} Report</h3>
                            <p className="text-xs text-slate-500">
                                {new Date(log.weekStartDate).toLocaleDateString()} - Submitted by {log.submittedBy?.name}
                            </p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${log.status === 'Reviewed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {log.status}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Completed</h4>
                        <p className="text-slate-700 text-sm whitespace-pre-wrap">{log.tasksCompleted}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Planned</h4>
                        <p className="text-slate-700 text-sm whitespace-pre-wrap">{log.nextWeekTasks}</p>
                    </div>
                </div>

                {log.challenges && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <h4 className="text-xs font-bold text-orange-700 uppercase mb-1">Challenges</h4>
                        <p className="text-orange-800 text-sm whitespace-pre-wrap">{log.challenges}</p>
                    </div>
                )}

                {log.hoursSpent > 0 && (
                    <div className="mb-4 flex items-center space-x-2 text-sm text-slate-600">
                        <Award size={16} className="text-indigo-600" />
                        <span><strong>{log.hoursSpent}</strong> hours spent this week</span>
                    </div>
                )}

                {log.supervisorFeedback && (
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 flex items-start space-x-3">
                        <MessageSquare size={18} className="text-indigo-600 mt-1" />
                        <div>
                            <h4 className="text-sm font-bold text-indigo-900">Supervisor Feedback</h4>
                            <p className="text-indigo-800 text-sm mt-1 whitespace-pre-wrap">{log.supervisorFeedback}</p>
                        </div>
                    </div>
                )}

                {/* Supervisor Feedback Form */}
                {user.role === 'Supervisor' && !log.supervisorFeedback && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Add Feedback
                        </label>
                        <textarea
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
                            rows="3"
                            placeholder="Provide feedback to the student..."
                            value={feedbackForm.logId === log._id ? feedbackForm.feedback : ''}
                            onChange={(e) => setFeedbackForm({ logId: log._id, feedback: e.target.value })}
                        ></textarea>
                        <button
                            onClick={() => handleAddFeedback(log._id)}
                            disabled={!feedbackForm.feedback || feedbackForm.logId !== log._id}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            Submit Feedback
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Coordinator Group List View
    if ((user.role === 'Coordinator' || user.role === 'Admin') && !selectedGroup) {
        if (loading) return <div className="flex justify-center p-12">Loading groups...</div>;

        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-6 rounded-xl shadow-lg text-white">
                    <h1 className="text-2xl font-bold flex items-center space-x-2">
                        <Users size={28} />
                        <span>Project Groups Progress</span>
                    </h1>
                    <p className="mt-1 text-slate-300">
                        Select a group to view their weekly progress logs and supervisor meeting records.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.filter(g => g.members && g.members.length > 0).map(group => (
                        <div key={group._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                                    {group.classification || 'FYP'}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">{group.leader?.studentId || 'No ID'}</span>
                            </div>
                            <h3 className="font-bold text-slate-800 mb-2 truncate" title={group.proposal?.title || 'Untitled Project'}>
                                {group.proposal?.title || 'Untitled Project'}
                            </h3>
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center text-sm text-slate-600">
                                    <Users size={16} className="mr-2 text-slate-400" />
                                    <span>{group.members?.length || 0} Members</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <FileText size={16} className="mr-2 text-slate-400" />
                                    <span>Supervisor: {group.supervisorRequest?.name || 'Not assigned'}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedGroup(group)}
                                className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                            >
                                View Progress Logs
                            </button>
                        </div>
                    ))}
                    {groups.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            No groups found.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Default / Detail View
    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 rounded-xl shadow-lg text-white relative">
                {selectedGroup && (
                    <button
                        onClick={() => setSelectedGroup(null)}
                        className="absolute top-6 right-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        title="Back to Groups"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                    <Calendar size={28} />
                    <span>{selectedGroup ? `Progress: ${selectedGroup.proposal?.title || 'Untitled Project'}` : 'Weekly Progress Logs'}</span>
                </h1>
                <p className="mt-1 text-purple-100">
                    {user.role === 'Student'
                        ? 'Track your weekly progress and receive supervisor feedback'
                        : user.role === 'Supervisor'
                            ? 'Review and provide feedback on student progress'
                            : `Viewing logs for group ${selectedGroup?.leader?.studentId || ''}`}
                </p>
            </div>

            {/* Messages */}
            {error && (
                <div data-testid="progress-error-msg" className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                    {error}
                </div>
            )}
            {success && (
                <div data-testid="progress-success-msg" className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded flex items-center space-x-2">
                    <CheckCircle size={20} />
                    <span>{success}</span>
                </div>
            )}

            {/* Submission Form (Students Only) */}
            {user.role === 'Student' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Submit New Weekly Log</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Week Number
                                </label>
                                <input
                                    type="number"
                                    data-testid="progress-week-num"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.weekNumber}
                                    onChange={(e) => setFormData({ ...formData, weekNumber: parseInt(e.target.value) })}
                                    required
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Week Start Date
                                </label>
                                <input
                                    type="date"
                                    data-testid="progress-date"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.weekStartDate}
                                    onChange={(e) => setFormData({ ...formData, weekStartDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Tasks Completed This Week
                            </label>
                            <textarea
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                data-testid="progress-tasks-completed"
                                rows="4"
                                value={formData.tasksCompleted}
                                onChange={(e) => setFormData({ ...formData, tasksCompleted: e.target.value })}
                                placeholder="List the tasks you completed this week..."
                                required
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Tasks Planned for Next Week
                            </label>
                            <textarea
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                data-testid="progress-tasks-planned"
                                rows="4"
                                value={formData.nextWeekTasks}
                                onChange={(e) => setFormData({ ...formData, nextWeekTasks: e.target.value })}
                                placeholder="What do you plan to work on next week..."
                                required
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Challenges/Issues Faced (Optional)
                            </label>
                            <textarea
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                rows="3"
                                value={formData.challenges}
                                onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                                placeholder="Any challenges or blockers you encountered..."
                            ></textarea>
                        </div>

                        <div className="md:w-1/3">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Hours Spent This Week
                            </label>
                            <input
                                type="number"
                                data-testid="progress-hours"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                value={formData.hoursSpent}
                                onChange={(e) => setFormData({ ...formData, hoursSpent: parseInt(e.target.value) })}
                                min="0"
                            />
                        </div>

                        <button
                            type="submit"
                            data-testid="progress-submit"
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium shadow-lg"
                        >
                            Submit Progress Log
                        </button>
                    </form>
                </div>
            )}

            {/* Logs List */}
            <div className="space-y-4">
                {logs.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                        <Clock className="mx-auto text-slate-300" size={64} />
                        <h3 className="text-xl font-semibold text-slate-700 mt-4">No Activity Yet</h3>
                        <p className="text-slate-500 mt-2">
                            Logs submitted by students and meeting records from supervisors will appear here.
                        </p>
                    </div>
                ) : (
                    logs.map((log) => renderLogCard(log))
                )}
            </div>
        </div>
    );
};

export default ProgressLog;
