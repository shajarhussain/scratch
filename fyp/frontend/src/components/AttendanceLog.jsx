import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Check, X, Clock, TrendingUp, AlertCircle } from 'lucide-react';

const AttendanceLog = () => {
    const [groupCode, setGroupCode] = useState('');
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [statistics, setStatistics] = useState({ total: 0, present: 0, absent: 0, attendanceRate: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGroupCode();
        fetchMyLogs();
    }, []);

    const fetchGroupCode = async () => {
        try {
            const token = localStorage.getItem('token');
            // Use the correct endpoint to fetch only the user's group
            const { data: myGroup } = await axios.get('/api/groups/my-group', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (myGroup) {
                setGroupCode(myGroup.groupCode || 'N/A');
            }
        } catch (error) {
            console.error('Error fetching group:', error);
            // If 404 or other error, groupCode stays default
        }
    };

    const fetchMyLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/attendance/my-logs', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setAttendanceLogs(res.data.logs);
            setStatistics(res.data.statistics);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLoading(false);
        }
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center space-x-2">
                            <Calendar size={28} />
                            <span>My Attendance Record</span>
                        </h1>
                        <p className="mt-1 text-blue-100">View your attendance history (Marked by Supervisor)</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-blue-100">Group Code</div>
                        <div className="text-2xl font-bold">{groupCode}</div>
                    </div>
                </div>
            </div>

            {/* Info Notice */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-center space-x-2">
                    <AlertCircle className="text-blue-600" size={20} />
                    <div>
                        <div className="font-medium text-blue-900">Attendance is marked by your Supervisor</div>
                        <div className="text-sm text-blue-700 mt-1">
                            Your supervisor will record your attendance during each session. Check here to view your attendance history.
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div className="text-slate-500 text-sm">Total Sessions</div>
                    <div className="text-2xl font-bold text-slate-800">{statistics.total}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
                    <div className="text-green-600 text-sm">Present</div>
                    <div className="text-2xl font-bold text-green-700">{statistics.present}</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200">
                    <div className="text-red-600 text-sm">Absent</div>
                    <div className="text-2xl font-bold text-red-700">{statistics.absent}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
                    <div className="text-blue-600 text-sm flex items-center space-x-1">
                        <TrendingUp size={14} />
                        <span>Attendance Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{statistics.attendanceRate}%</div>
                </div>
            </div>

            {/* Attendance History */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">Your Attendance History</h3>
                    <p className="text-sm text-slate-500 mt-1">{attendanceLogs.length} sessions recorded</p>
                </div>

                <div className="divide-y divide-slate-200">
                    {attendanceLogs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500">No attendance records yet</p>
                            <p className="text-sm text-slate-400 mt-2">Your supervisor will mark your attendance during sessions</p>
                        </div>
                    ) : (
                        attendanceLogs.map(log => (
                            <div key={log._id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-lg ${log.attendanceStatus === 'Present' ? 'bg-green-100'
                                            : log.attendanceStatus === 'Absent' ? 'bg-red-100'
                                                : 'bg-yellow-100'
                                            }`}>
                                            {log.attendanceStatus === 'Present' ? (
                                                <Check className="text-green-600" size={20} />
                                            ) : log.attendanceStatus === 'Absent' ? (
                                                <X className="text-red-600" size={20} />
                                            ) : (
                                                <Clock className="text-yellow-600" size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-800">
                                                {formatDate(log.sessionDate)}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Marked at: {formatDateTime(log.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${log.attendanceStatus === 'Present' ? 'bg-green-100 text-green-700'
                                        : log.attendanceStatus === 'Absent' ? 'bg-red-100 text-red-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {log.attendanceStatus}
                                    </div>
                                </div>
                                {log.remarks && (
                                    <div className="mt-2 ml-12 text-sm text-slate-600 italic">
                                        "{log.remarks}"
                                    </div>
                                )}
                                {log.supervisorFeedback && (
                                    <div className="mt-2 ml-12 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="text-xs font-medium text-blue-700 mb-1">Supervisor Feedback</div>
                                        <div className="text-sm text-blue-800">{log.supervisorFeedback}</div>
                                        {log.totalMarks && (
                                            <div className="mt-2 text-sm font-medium text-blue-900">
                                                Grade: {log.grade} ({log.totalMarks}/300)
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceLog;
