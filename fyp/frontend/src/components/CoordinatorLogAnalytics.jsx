import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, AlertTriangle, FileText, Users, Calendar } from 'lucide-react';

const CoordinatorLogAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [atRiskGroups, setAtRiskGroups] = useState([]);
    const [selectedGroupLogs, setSelectedGroupLogs] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
        fetchAtRiskGroups();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://127.0.0.1:5000/api/supervisor-logs/coordinator/analytics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnalytics(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setLoading(false);
        }
    };

    const fetchAtRiskGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://127.0.0.1:5000/api/supervisor-logs/coordinator/at-risk', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAtRiskGroups(res.data);
        } catch (error) {
            console.error('Error fetching at-risk groups:', error);
        }
    };

    const viewGroupLogs = async (groupId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/supervisor-logs/coordinator/group/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedGroupLogs(res.data);
        } catch (error) {
            console.error('Error fetching group logs:', error);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
    }

    const totalProgress = analytics?.progressDistribution ?
        Object.values(analytics.progressDistribution).reduce((a, b) => a + b, 0) : 1;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                    <TrendingUp size={28} />
                    <span>Supervisor Log Analytics</span>
                </h1>
                <p className="mt-1 text-indigo-100">Monitor progress and supervisor compliance across all groups</p>
            </div>

            {/* Overview Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-sm">Total Groups</div>
                            <div className="text-3xl font-bold text-slate-800 mt-1">
                                {analytics?.overview?.totalGroups || 0}
                            </div>
                        </div>
                        <Users className="text-blue-600" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-sm">Logs This Week</div>
                            <div className="text-3xl font-bold text-green-600 mt-1">
                                {analytics?.overview?.logsThisWeek || 0}
                            </div>
                        </div>
                        <FileText className="text-green-600" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-sm">Warnings Issued</div>
                            <div className="text-3xl font-bold text-red-600 mt-1">
                                {analytics?.overview?.warningsIssued || 0}
                            </div>
                        </div>
                        <AlertTriangle className="text-red-600" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-sm">At-Risk Groups</div>
                            <div className="text-3xl font-bold text-orange-600 mt-1">
                                {analytics?.overview?.atRiskCount || 0}
                            </div>
                        </div>
                        <AlertTriangle className="text-orange-600" size={32} />
                    </div>
                </div>
            </div>

            {/* Progress Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Progress Trends</h2>
                <div className="space-y-3">
                    <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600">On Track</span>
                            <span className="font-semibold text-green-600">
                                {analytics?.progressDistribution?.['On Track'] || 0}
                                ({((analytics?.progressDistribution?.['On Track'] / totalProgress) * 100).toFixed(0)}%)
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                                className="bg-green-600 h-3 rounded-full"
                                style={{ width: `${((analytics?.progressDistribution?.['On Track'] / totalProgress) * 100) || 0}%` }}
                            ></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600">Slightly Delayed</span>
                            <span className="font-semibold text-yellow-600">
                                {analytics?.progressDistribution?.['Slightly Delayed'] || 0}
                                ({((analytics?.progressDistribution?.['Slightly Delayed'] / totalProgress) * 100).toFixed(0)}%)
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                                className="bg-yellow-600 h-3 rounded-full"
                                style={{ width: `${((analytics?.progressDistribution?.['Slightly Delayed'] / totalProgress) * 100) || 0}%` }}
                            ></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600">Seriously Delayed</span>
                            <span className="font-semibold text-red-600">
                                {analytics?.progressDistribution?.['Seriously Delayed'] || 0}
                                ({((analytics?.progressDistribution?.['Seriously Delayed'] / totalProgress) * 100).toFixed(0)}%)
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                                className="bg-red-600 h-3 rounded-full"
                                style={{ width: `${((analytics?.progressDistribution?.['Seriously Delayed'] / totalProgress) * 100) || 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* At-Risk Groups */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                        <AlertTriangle size={20} className="text-red-600" />
                        <span>Groups Requiring Attention</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Groups with warnings or serious delays</p>
                </div>

                <div className="divide-y divide-slate-200">
                    {atRiskGroups.length === 0 ? (
                        <div className="p-12 text-center">
                            <AlertTriangle className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500">No at-risk groups currently</p>
                        </div>
                    ) : (
                        atRiskGroups.map(log => (
                            <div key={log._id} className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className={`p-2 rounded-lg mt-1 ${log.progressStatus === 'Seriously Delayed' ? 'bg-red-100'
                                            : 'bg-yellow-100'
                                            }`}>
                                            <AlertTriangle
                                                className={log.progressStatus === 'Seriously Delayed' ? 'text-red-600' : 'text-yellow-600'}
                                                size={20}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-slate-800">
                                                    Group {log.group?.groupCode}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.progressStatus === 'Seriously Delayed'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {log.progressStatus}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-600 mt-1">
                                                Last Log: {new Date(log.meetingDate).toLocaleDateString()} •
                                                Supervisor: {log.supervisor?.name}
                                            </div>
                                            {log.warningDetails && (
                                                <div className="mt-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                                                    ⚠ {log.warningDetails}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => viewGroupLogs(log.group._id)}
                                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors text-sm font-medium"
                                    >
                                        View Logs
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Supervisor Compliance */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Supervisor Compliance</h2>
                <div className="space-y-3">
                    {analytics?.supervisorCompliance?.map((sup, index) => (
                        <div key={index} className="flex items-center justify between">
                            <div className="flex-1">
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="font-medium text-slate-700">{sup.name}</span>
                                    <span className="text-slate-600">
                                        {sup.totalLogs} logs • {sup.groupCount} groups
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${Math.min((sup.totalLogs / (sup.groupCount * 5)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selected Group Logs Modal */}
            {selectedGroupLogs && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">Group Logs (Read-Only)</h3>
                            <button
                                onClick={() => setSelectedGroupLogs(null)}
                                className="text-slate-500 hover:text-slate-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {selectedGroupLogs.map(log => (
                                <div key={log._id} className="border border-slate-200 rounded-lg p-4">
                                    <div className="font-semibold text-slate-800">
                                        Log #{log.logNumber} - {new Date(log.meetingDate).toLocaleDateString()}
                                    </div>
                                    <div className="text-sm text-slate-600 mt-1">
                                        {log.progressStatus} • {log.qualityAssessment} • {log.logStatus}
                                    </div>
                                    {log.internalRemarks && (
                                        <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 rounded p-2">
                                            <span className="font-medium">Internal:</span> {log.internalRemarks}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoordinatorLogAnalytics;
