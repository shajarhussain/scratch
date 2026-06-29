import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const SupervisorLogEntry = () => {
    const [groups, setGroups] = useState([]);
    const [myLogs, setMyLogs] = useState([]);
    const [message, setMessage] = useState('');
    const [editingLog, setEditingLog] = useState(null);

    const [formData, setFormData] = useState({
        groupId: '',
        studentId: '',
        logNumber: '',
        meetingDate: new Date().toISOString().split('T')[0],
        meetingType: 'Weekly',
        attendanceStatus: 'Present',
        absenceReason: '',
        workReviewed: '',
        progressStatus: 'On Track',
        qualityAssessment: 'Good',
        strengthsObserved: '',
        issuesIdentified: '',
        correctionsRequired: '',
        suggestionsGuidance: '',
        internalRemarks: '',
        tasksAssigned: '',
        expectedDeliverables: '',
        nextReviewDeadline: '',
        logStatus: 'Approved',
        warningDetails: ''
    });

    useEffect(() => {
        fetchGroups();
        fetchMyLogs();
    }, []);

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/groups/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(res.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchMyLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/supervisor-logs/my-logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyLogs(res.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const token = localStorage.getItem('token');

            if (editingLog) {
                await axios.put(`/api/supervisor-logs/${editingLog._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessage('Log updated successfully!');
            } else {
                await axios.post('/api/supervisor-logs', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessage('Log created successfully!');
            }

            resetForm();
            fetchMyLogs();
        } catch (error) {
            setMessage(`Error: ${error.response?.data?.message || error.message}`);
        }
    };

    const resetForm = () => {
        setFormData({
            groupId: '',
            studentId: '',
            logNumber: '',
            meetingDate: new Date().toISOString().split('T')[0],
            meetingType: 'Weekly',
            attendanceStatus: 'Present',
            absenceReason: '',
            workReviewed: '',
            progressStatus: 'On Track',
            qualityAssessment: 'Good',
            strengthsObserved: '',
            issuesIdentified: '',
            correctionsRequired: '',
            suggestionsGuidance: '',
            internalRemarks: '',
            tasksAssigned: '',
            expectedDeliverables: '',
            nextReviewDeadline: '',
            logStatus: 'Approved',
            warningDetails: ''
        });
        setEditingLog(null);
    };

    const loadLogForEdit = (log) => {
        setEditingLog(log);
        setFormData({
            groupId: log.group._id,
            studentId: log.student?._id || '',
            logNumber: log.logNumber,
            meetingDate: new Date(log.meetingDate).toISOString().split('T')[0],
            meetingType: log.meetingType,
            attendanceStatus: log.attendanceStatus,
            absenceReason: log.absenceReason || '',
            workReviewed: log.workReviewed,
            progressStatus: log.progressStatus,
            qualityAssessment: log.qualityAssessment,
            strengthsObserved: log.strengthsObserved || '',
            issuesIdentified: log.issuesIdentified || '',
            correctionsRequired: log.correctionsRequired || '',
            suggestionsGuidance: log.suggestionsGuidance || '',
            internalRemarks: log.internalRemarks || '',
            tasksAssigned: log.tasksAssigned || '',
            expectedDeliverables: log.expectedDeliverables || '',
            nextReviewDeadline: log.nextReviewDeadline ? new Date(log.nextReviewDeadline).toISOString().split('T')[0] : '',
            logStatus: log.logStatus,
            warningDetails: log.warningDetails || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const selectedGroup = groups.find(g => g._id === formData.groupId);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                    <FileText size={28} />
                    <span>{editingLog ? 'Edit Supervisor Log' : 'Create Supervisor Log Entry'}</span>
                </h1>
                <p className="mt-1 text-purple-100">Maintain official academic records of student progress</p>
            </div>

            {message && (
                <div className={`p-4 border-l-4 rounded flex items-center space-x-2 ${message.includes('Error')
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-green-50 border-green-500 text-green-700'
                    }`}>
                    {message.includes('Error') ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    <span>{message}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                        <Calendar size={20} />
                        <span>Meeting Details</span>
                    </h2>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Group *</label>
                            <select
                                value={formData.groupId}
                                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            >
                                <option value="">-- Select Group --</option>
                                {groups.map(group => (
                                    <option key={group._id} value={group._id}>
                                        {group.groupCode} - {group.members?.map(m => m.name).join(', ')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Student (Optional)</label>
                            <select
                                value={formData.studentId}
                                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                disabled={!selectedGroup}
                            >
                                <option value="">Group Log (All Members)</option>
                                {selectedGroup?.members?.map(member => (
                                    <option key={member._id} value={member._id}>{member.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Log Number *</label>
                            <input
                                type="number"
                                value={formData.logNumber}
                                onChange={(e) => setFormData({ ...formData, logNumber: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                                min="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Date *</label>
                            <input
                                type="date"
                                value={formData.meetingDate}
                                onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Type *</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {['Weekly', 'Bi-weekly', 'Online', 'In-person', 'Ad-hoc'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, meetingType: type })}
                                    className={`px-3 py-2 rounded-lg font-medium transition-all ${formData.meetingType === type
                                        ? 'bg-purple-600 text-white shadow-lg'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">Attendance</h2>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        {['Present', 'Absent', 'Late'].map(status => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setFormData({ ...formData, attendanceStatus: status })}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${formData.attendanceStatus === status
                                    ? status === 'Present' ? 'bg-green-600 text-white shadow-lg'
                                        : status === 'Absent' ? 'bg-red-600 text-white shadow-lg'
                                            : 'bg-yellow-600 text-white shadow-lg'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {formData.attendanceStatus === 'Absent' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Absence Reason</label>
                            <input
                                type="text"
                                value={formData.absenceReason}
                                onChange={(e) => setFormData({ ...formData, absenceReason: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="Illness, emergency, etc."
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">Progress Evaluation</h2>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Work Reviewed *</label>
                        <textarea
                            value={formData.workReviewed}
                            onChange={(e) => setFormData({ ...formData, workReviewed: e.target.value })}
                            rows="3"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Code, report section, demo, research..."
                            required
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Progress Status *</label>
                            <select
                                value={formData.progressStatus}
                                onChange={(e) => setFormData({ ...formData, progressStatus: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            >
                                <option value="On Track">On Track</option>
                                <option value="Slightly Delayed">Slightly Delayed</option>
                                <option value="Seriously Delayed">Seriously Delayed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Quality Assessment *</label>
                            <select
                                value={formData.qualityAssessment}
                                onChange={(e) => setFormData({ ...formData, qualityAssessment: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            >
                                <option value="Excellent">Excellent</option>
                                <option value="Good">Good</option>
                                <option value="Satisfactory">Satisfactory</option>
                                <option value="Poor">Poor</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">Supervisor Feedback</h2>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Strengths Observed</label>
                        <textarea
                            value={formData.strengthsObserved}
                            onChange={(e) => setFormData({ ...formData, strengthsObserved: e.target.value })}
                            rows="2"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Positive aspects of work..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Issues Identified</label>
                        <textarea
                            value={formData.issuesIdentified}
                            onChange={(e) => setFormData({ ...formData, issuesIdentified: e.target.value })}
                            rows="2"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Problems or gaps identified..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Corrections Required
                            <span className="text-xs text-slate-500 ml-2">(Hidden from students)</span>
                        </label>
                        <textarea
                            value={formData.correctionsRequired}
                            onChange={(e) => setFormData({ ...formData, correctionsRequired: e.target.value })}
                            rows="2"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Specific corrections needed..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Suggestions & Guidance</label>
                        <textarea
                            value={formData.suggestionsGuidance}
                            onChange={(e) => setFormData({ ...formData, suggestionsGuidance: e.target.value })}
                            rows="2"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Advice and recommendations..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Internal Notes
                            <span className="text-xs text-slate-500 ml-2">(Coordinator & You only)</span>
                        </label>
                        <textarea
                            value={formData.internalRemarks}
                            onChange={(e) => setFormData({ ...formData, internalRemarks: e.target.value })}
                            rows="2"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Private notes for your records..."
                        ></textarea>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">Next Actions</h2>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tasks Assigned</label>
                        <textarea
                            value={formData.tasksAssigned}
                            onChange={(e) => setFormData({ ...formData, tasksAssigned: e.target.value })}
                            rows="2"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Tasks for next period..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Expected Deliverables</label>
                        <textarea
                            value={formData.expectedDeliverables}
                            onChange={(e) => setFormData({ ...formData, expectedDeliverables: e.target.value })}
                            rows="2"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="What should be completed..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Next Review Deadline</label>
                        <input
                            type="date"
                            value={formData.nextReviewDeadline}
                            onChange={(e) => setFormData({ ...formData, nextReviewDeadline: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">Decision</h2>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        {['Approved', 'Needs Revision', 'Warning Issued'].map(status => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setFormData({ ...formData, logStatus: status })}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${formData.logStatus === status
                                    ? status === 'Approved' ? 'bg-green-600 text-white shadow-lg'
                                        : status === 'Warning Issued' ? 'bg-red-600 text-white shadow-lg'
                                            : 'bg-yellow-600 text-white shadow-lg'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {formData.logStatus === 'Warning Issued' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Warning Details</label>
                            <textarea
                                value={formData.warningDetails}
                                onChange={(e) => setFormData({ ...formData, warningDetails: e.target.value })}
                                rows="2"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="Reason for warning..."
                            ></textarea>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 flex space-x-3">
                    <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center space-x-2"
                    >
                        <CheckCircle size={20} />
                        <span>{editingLog ? 'Update Log' : 'Submit Log'}</span>
                    </button>
                    {editingLog && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-6 bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-all"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">My Recent Logs</h2>
                    <p className="text-sm text-slate-500 mt-1">{myLogs.length} logs created</p>
                </div>

                <div className="divide-y divide-slate-200">
                    {myLogs.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500">No logs created yet</p>
                        </div>
                    ) : (
                        myLogs.slice(0, 10).map(log => (
                            <div key={log._id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-semibold text-slate-800">
                                                Log #{log.logNumber} - {log.group.groupCode}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.logStatus === 'Approved' ? 'bg-green-100 text-green-700'
                                                : log.logStatus === 'Warning Issued' ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {log.logStatus}
                                            </span>
                                            {log.version > 1 && (
                                                <span className="text-xs text-slate-500">v{log.version}</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-slate-600 mt-1">
                                            {new Date(log.meetingDate).toLocaleDateString()} â€¢ {log.meetingType} â€¢ {log.progressStatus}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => loadLogForEdit(log)}
                                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors text-sm font-medium"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupervisorLogEntry;
