import { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Calendar, Clock, FileText, Plus, ChevronDown, ChevronUp, CheckCircle, MessageSquare, AlertCircle, Users } from 'lucide-react';

const WeeklyLog = () => {
    const [user, setUser] = useState(null);
    const [myGroup, setMyGroup] = useState(null);
    const [allGroups, setAllGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [logs, setLogs] = useState([]);
    const [expandedLogId, setExpandedLogId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        weekNumber: 1,
        weekStartDate: '',
        tasksCompleted: '',
        nextWeekTasks: '',
        challenges: '',
        hoursSpent: 0
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Decode token to get user info
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser(payload);

            if (payload.role === 'Student') {
                fetchMyGroupAndLogs();
            } else if (payload.role === 'Coordinator' || payload.role === 'Admin') {
                fetchAllGroups();
            }
        }
    }, []);

    const fetchMyGroupAndLogs = async () => {
        try {
            const token = localStorage.getItem('token');

            // Fetch my group using the correct endpoint
            const { data: myGroupData } = await axios.get('http://127.0.0.1:5000/api/groups/my-group', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyGroup(myGroupData);

            // Fetch logs for my group
            const logsRes = await axios.get('http://127.0.0.1:5000/api/progress/my-group', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(logsRes.data);

            // Set next week number
            if (logsRes.data.length > 0) {
                const maxWeek = Math.max(...logsRes.data.map(log => log.weekNumber));
                setFormData(prev => ({ ...prev, weekNumber: maxWeek + 1 }));
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage('Error loading data: ' + (error.response?.data?.message || error.message));
            setLoading(false);
        }
    };

    const fetchAllGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://127.0.0.1:5000/api/groups/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllGroups(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching groups:', error);
            setMessage('Error loading groups');
            setLoading(false);
        }
    };

    const fetchGroupLogs = async (groupId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/progress/group/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(res.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setMessage('Error loading logs');
        }
    };

    const handleGroupChange = (e) => {
        const groupId = e.target.value;
        setSelectedGroupId(groupId);
        if (groupId) {
            fetchGroupLogs(groupId);
        } else {
            setLogs([]);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://127.0.0.1:5000/api/progress', {
                ...formData,
                weekNumber: Number(formData.weekNumber),
                hoursSpent: Number(formData.hoursSpent)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('Weekly log submitted successfully!');
            setShowCreateForm(false);

            // Reset form and increment week
            setFormData({
                weekNumber: formData.weekNumber + 1,
                weekStartDate: '',
                tasksCompleted: '',
                nextWeekTasks: '',
                challenges: '',
                hoursSpent: 0
            });

            // Refresh logs
            fetchMyGroupAndLogs();
        } catch (err) {
            setMessage(`Error: ${err.response?.data?.message || err.message}`);
        }
    };

    const toggleLogExpansion = (logId) => {
        setExpandedLogId(expandedLogId === logId ? null : logId);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto flex items-center justify-center h-64">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <BookOpen className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Weekly Progress Logs</h2>
                            <p className="text-sm text-slate-600">
                                {user?.role === 'Student'
                                    ? 'Track your weekly progress and view previous submissions'
                                    : 'Monitor weekly progress logs from all groups'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Student View: Group Info */}
                {user?.role === 'Student' && myGroup && (
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Users size={18} className="text-slate-600" />
                            <span className="text-sm font-medium text-slate-700">
                                Your Group: <span className="text-blue-600">{myGroup.members?.map(m => m.name).join(', ')}</span>
                            </span>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                        >
                            <Plus size={18} />
                            <span>{showCreateForm ? 'Cancel' : 'New Log'}</span>
                        </button>
                    </div>
                )}

                {/* Coordinator View: Group Selector */}
                {(user?.role === 'Coordinator' || user?.role === 'Admin') && (
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Group to View Logs</label>
                        <select
                            value={selectedGroupId}
                            onChange={handleGroupChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="">-- Select a Group --</option>
                            {allGroups.map(group => (
                                <option key={group._id} value={group._id}>
                                    {group.members?.map(m => m.name).join(', ')}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Message Display */}
                {message && (
                    <div className={`mx-6 mt-6 p-4 border-l-4 rounded flex items-center space-x-2 ${message.includes('Error')
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-green-50 border-green-500 text-green-700'
                        }`}>
                        {message.includes('Error') ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                        <span>{message}</span>
                    </div>
                )}

                {/* Create Log Form (Students Only) */}
                {user?.role === 'Student' && showCreateForm && (
                    <div className="p-6 bg-blue-50 border-b border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Create New Weekly Log</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Week Number</label>
                                    <input
                                        type="number"
                                        name="weekNumber"
                                        value={formData.weekNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Week Start Date</label>
                                    <input
                                        type="date"
                                        name="weekStartDate"
                                        value={formData.weekStartDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Hours Spent</label>
                                    <input
                                        type="number"
                                        name="hoursSpent"
                                        value={formData.hoursSpent}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        min="0"
                                        step="0.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Tasks Completed This Week</label>
                                <textarea
                                    name="tasksCompleted"
                                    value={formData.tasksCompleted}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="Describe what you accomplished this week..."
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Next Week's Planned Tasks</label>
                                <textarea
                                    name="nextWeekTasks"
                                    value={formData.nextWeekTasks}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="What do you plan to work on next week..."
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Challenges Faced (Optional)</label>
                                <textarea
                                    name="challenges"
                                    value={formData.challenges}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="Any challenges or blockers..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2"
                            >
                                <Plus size={20} />
                                <span>Submit Log</span>
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">
                        {user?.role === 'Student' ? 'Your Group\'s Logs' : 'Progress Logs'}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {logs.length} log{logs.length !== 1 ? 's' : ''} submitted
                    </p>
                </div>

                {logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500">
                            {user?.role === 'Student'
                                ? 'No logs yet. Create your first weekly log!'
                                : selectedGroupId
                                    ? 'This group has not submitted any logs yet.'
                                    : 'Select a group to view their logs'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {logs.map(log => (
                            <div key={log._id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => toggleLogExpansion(log._id)}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-blue-100 p-2 rounded-lg">
                                            <BookOpen className="text-blue-600" size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800">Week {log.weekNumber}</h4>
                                            <div className="flex items-center space-x-4 text-sm text-slate-500">
                                                <span className="flex items-center space-x-1">
                                                    <Calendar size={14} />
                                                    <span>{formatDate(log.weekStartDate)}</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <Clock size={14} />
                                                    <span>{log.hoursSpent || 0}h</span>
                                                </span>
                                                {log.submittedBy && (
                                                    <span>By: {log.submittedBy.name}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${log.status === 'Reviewed'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {log.status}
                                        </span>
                                        {expandedLogId === log._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {expandedLogId === log._id && (
                                    <div className="mt-4 pl-12 space-y-3 text-sm">
                                        <div>
                                            <h5 className="font-medium text-slate-700 mb-1">Tasks Completed:</h5>
                                            <p className="text-slate-600 whitespace-pre-wrap">{log.tasksCompleted}</p>
                                        </div>
                                        <div>
                                            <h5 className="font-medium text-slate-700 mb-1">Next Week's Tasks:</h5>
                                            <p className="text-slate-600 whitespace-pre-wrap">{log.nextWeekTasks}</p>
                                        </div>
                                        {log.challenges && (
                                            <div>
                                                <h5 className="font-medium text-slate-700 mb-1">Challenges:</h5>
                                                <p className="text-slate-600 whitespace-pre-wrap">{log.challenges}</p>
                                            </div>
                                        )}
                                        {log.supervisorFeedback && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <MessageSquare size={16} className="text-green-600" />
                                                    <h5 className="font-medium text-green-700">Supervisor Feedback:</h5>
                                                </div>
                                                <p className="text-green-700 whitespace-pre-wrap">{log.supervisorFeedback}</p>
                                            </div>
                                        )}
                                        <div className="text-xs text-slate-400 mt-2">
                                            Submitted: {formatDate(log.createdAt)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeeklyLog;
