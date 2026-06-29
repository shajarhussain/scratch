import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Users, AlertTriangle, Flag, Calendar, X } from 'lucide-react';

const CoordinatorInsights = () => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/attendance/insights', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInsights(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching insights:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading insights...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                    <TrendingUp size={28} />
                    <span>Attendance & Performance Insights</span>
                </h1>
                <p className="mt-1 text-indigo-100">Monitor attendance trends and student performance across all groups</p>
            </div>

            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-sm">Total Groups</div>
                            <div className="text-3xl font-bold text-slate-800 mt-1">
                                {insights?.overallStats?.totalGroups || 0}
                            </div>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <Users className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-sm">Average Attendance</div>
                            <div className="text-3xl font-bold text-green-600 mt-1">
                                {insights?.overallStats?.averageAttendance?.toFixed(1) || 0}%
                            </div>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-sm">Students Below 75%</div>
                            <div className="text-3xl font-bold text-red-600 mt-1">
                                {insights?.overallStats?.lowAttendanceCount || 0}
                            </div>
                        </div>
                        <div className="bg-red-100 p-3 rounded-lg">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Attendance */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800">Today's Attendance</h3>
                        <div className="text-sm text-slate-500">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-slate-200">
                    {insights?.todayAttendance?.length === 0 ? (
                        <div className="p-12 text-center">
                            <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500">No attendance recorded today</p>
                        </div>
                    ) : (
                        insights?.todayAttendance?.map((group, index) => (
                            <div key={index} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${group.present === group.totalMembers
                                            ? 'bg-green-100'
                                            : group.present === 0
                                                ? 'bg-red-100'
                                                : 'bg-yellow-100'
                                            }`}>
                                            <span className={`text-lg font-bold ${group.present === group.totalMembers
                                                ? 'text-green-600'
                                                : group.present === 0
                                                    ? 'text-red-600'
                                                    : 'text-yellow-600'
                                                }`}>
                                                {group.groupCode?.split('-').pop() || 'N/A'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-800">
                                                Group {group.groupCode}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {group.present}/{group.totalMembers} Present
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        {group.present === group.totalMembers ? (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                All Present
                                            </span>
                                        ) : group.absent.length > 0 ? (
                                            <div className="text-right">
                                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                                    {group.absent.length} Absent
                                                </span>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {group.absent.join(', ')}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Important Feedback */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center space-x-2">
                        <Flag className="text-indigo-600" size={20} />
                        <h3 className="text-lg font-bold text-slate-800">Important Feedback (Flagged)</h3>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Feedback flagged by supervisors for coordinator attention</p>
                </div>

                <div className="divide-y divide-slate-200">
                    {insights?.importantFeedback?.length === 0 ? (
                        <div className="p-12 text-center">
                            <Flag className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500">No flagged feedback</p>
                        </div>
                    ) : (
                        insights?.importantFeedback?.map((feedback) => (
                            <div key={feedback._id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className="bg-red-100 p-2 rounded-lg mt-1">
                                            <Flag className="text-red-600" size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-slate-800">
                                                    Group {feedback.group?.groupCode}
                                                </span>
                                                <span className="text-slate-500">â€¢</span>
                                                <span className="text-slate-600">{feedback.student?.name}</span>
                                            </div>
                                            <div className="mt-2 text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">
                                                "{feedback.supervisorFeedback}"
                                            </div>
                                            <div className="mt-2 text-xs text-slate-500">
                                                {new Date(feedback.sessionDate).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                                {feedback.grade && (
                                                    <span className="ml-3 px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                        Grade: {feedback.grade}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoordinatorInsights;
