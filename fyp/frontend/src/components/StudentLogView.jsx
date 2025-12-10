import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Calendar, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

const StudentLogView = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedLog, setExpandedLog] = useState(null);

    useEffect(() => {
        fetchMyLogs();
    }, []);

    const fetchMyLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://127.0.0.1:5000/api/supervisor-logs/student/my-logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                    <FileText size={28} />
                    <span>My Supervisor Logs</span>
                </h1>
                <p className="mt-1 text-blue-100">View feedback and progress tracking from your supervisor</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div className="text-slate-500 text-sm">Total Logs</div>
                    <div className="text-2xl font-bold text-slate-800">{logs.length}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
                    <div className="text-green-600 text-sm">Approved</div>
                    <div className="text-2xl font-bold text-green-700">
                        {logs.filter(log => log.logStatus === 'Approved').length}
                    </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
                    <div className="text-yellow-600 text-sm">Needs Attention</div>
                    <div className="text-2xl font-bold text-yellow-700">
                        {logs.filter(log => log.logStatus !== 'Approved').length}
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="space-y-4">
                {logs.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                        <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500">No supervisor logs yet</p>
                    </div>
                ) : (
                    logs.map(log => (
                        <div key={log._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            {/* Log Header */}
                            <div
                                className={`p-4 cursor-pointer transition-colors ${expandedLog === log._id ? 'bg-blue-50' : 'hover:bg-slate-50'
                                    }`}
                                onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${log.progressStatus === 'On Track' ? 'bg-green-100'
                                            : log.progressStatus === 'Slightly Delayed' ? 'bg-yellow-100'
                                                : 'bg-red-100'
                                            }`}>
                                            {log.progressStatus === 'On Track' ? (
                                                <CheckCircle className="text-green-600" size={20} />
                                            ) : log.progressStatus === 'Slightly Delayed' ? (
                                                <AlertTriangle className="text-yellow-600" size={20} />
                                            ) : (
                                                <AlertTriangle className="text-red-600" size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">
                                                Log #{log.logNumber} - {new Date(log.meetingDate).toLocaleDateString()}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {log.meetingType} Meeting • {log.supervisor?.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${log.logStatus === 'Approved' ? 'bg-green-100 text-green-700'
                                            : log.logStatus === 'Warning Issued' ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {log.logStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Log Details */}
                            {expandedLog === log._id && (
                                <div className="p-6 border-t border-slate-200 space-y-4">
                                    {/* Progress Status */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm font-medium text-slate-500">Progress Status</div>
                                            <div className={`text-lg font-semibold ${log.progressStatus === 'On Track' ? 'text-green-600'
                                                : log.progressStatus === 'Slightly Delayed' ? 'text-yellow-600'
                                                    : 'text-red-600'
                                                }`}>
                                                {log.progressStatus}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-500">Quality Assessment</div>
                                            <div className="text-lg font-semibold text-slate-800">{log.qualityAssessment}</div>
                                        </div>
                                    </div>

                                    {/* Strengths */}
                                    {log.strengthsObserved && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 text-green-700 font-medium mb-2">
                                                <CheckCircle size={18} />
                                                <span>Strengths Observed</span>
                                            </div>
                                            <p className="text-green-800">{log.strengthsObserved}</p>
                                        </div>
                                    )}

                                    {/* Issues */}
                                    {log.issuesIdentified && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 text-yellow-700 font-medium mb-2">
                                                <AlertTriangle size={18} />
                                                <span>Areas to Improve</span>
                                            </div>
                                            <p className="text-yellow-800">{log.issuesIdentified}</p>
                                        </div>
                                    )}

                                    {/* Suggestions */}
                                    {log.suggestionsGuidance && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 text-blue-700 font-medium mb-2">
                                                <TrendingUp size={18} />
                                                <span>Suggestions & Guidance</span>
                                            </div>
                                            <p className="text-blue-800">{log.suggestionsGuidance}</p>
                                        </div>
                                    )}

                                    {/* Next Tasks */}
                                    {(log.tasksAssigned || log.expectedDeliverables) && (
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                            <div className="font-medium text-purple-700 mb-2">📝 Next Tasks</div>
                                            {log.tasksAssigned && (
                                                <div className="mb-2">
                                                    <div className="text-sm font-medium text-purple-600">Tasks:</div>
                                                    <p className="text-purple-800">{log.tasksAssigned}</p>
                                                </div>
                                            )}
                                            {log.expectedDeliverables && (
                                                <div className="mb-2">
                                                    <div className="text-sm font-medium text-purple-600">Deliverables:</div>
                                                    <p className="text-purple-800">{log.expectedDeliverables}</p>
                                                </div>
                                            )}
                                            {log.nextReviewDeadline && (
                                                <div className="mt-2 flex items-center space-x-2 text-sm">
                                                    <Calendar size={14} className="text-purple-600" />
                                                    <span className="text-purple-700">
                                                        Next Review: {new Date(log.nextReviewDeadline).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Warning Details */}
                                    {log.logStatus === 'Warning Issued' && log.warningDetails && (
                                        <div className="bg-red-50 border-l-4 border-red-500 p-4">
                                            <div className="font-medium text-red-700 mb-1">⚠ Warning</div>
                                            <p className="text-red-800">{log.warningDetails}</p>
                                        </div>
                                    )}

                                    {/* Timestamp */}
                                    <div className="text-xs text-slate-500 border-t border-slate-200 pt-3">
                                        Submitted: {new Date(log.submittedAt).toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StudentLogView;
