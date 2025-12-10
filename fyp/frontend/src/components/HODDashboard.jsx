import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Users, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

const HODDashboard = () => {
    const [stats, setStats] = useState({
        totalGroups: 0,
        totalProposals: 0,
        pendingApprovals: 0,
        flaggedPlagiarism: 0
    });

    // Calculate academic year dynamically
    const getAcademicYear = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0 = January, 11 = December

        // Academic year typically starts in July/August (month 6/7)
        // If current month is July (6) or later, academic year is current-next
        // If before July, academic year is previous-current
        if (currentMonth >= 6) {
            return `${currentYear}-${currentYear + 1}`;
        } else {
            return `${currentYear - 1}-${currentYear}`;
        }
    };

    useEffect(() => {
        // Mock fetching stats
        // In a real app, we'd have an endpoint like /api/admin/stats
        setStats({
            totalGroups: 15,
            totalProposals: 12,
            pendingApprovals: 3,
            flaggedPlagiarism: 1
        });
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">HOD Oversight</h1>
                    <p className="text-slate-500">System-wide monitoring and controls.</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium text-sm">
                    Academic Year {getAcademicYear()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="text-blue-600" size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Total Groups</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800">{stats.totalGroups}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <FileText className="text-purple-600" size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Proposals</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800">{stats.totalProposals}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <AlertTriangle className="text-yellow-600" size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Pending</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800">{stats.pendingApprovals}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <BarChart className="text-red-600" size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Flagged</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800">{stats.flaggedPlagiarism}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Recent Audit Logs</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {[
                                { action: 'Grade Override', user: 'Dr. Smith', time: '2 mins ago' },
                                { action: 'Proposal Approved', user: 'Prof. Johnson', time: '1 hour ago' },
                                { action: 'Defense Scheduled', user: 'Coordinator', time: '3 hours ago' }
                            ].map((log, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                        <span className="font-medium text-slate-700">{log.action}</span>
                                        <span className="text-slate-500">by {log.user}</span>
                                    </div>
                                    <span className="text-slate-400">{log.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Quick Actions</h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-4">
                        <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors">
                            <h4 className="font-bold text-slate-700 mb-1">Generate Reports</h4>
                            <p className="text-xs text-slate-500">Download PDF summary of all groups.</p>
                        </button>
                        <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors">
                            <h4 className="font-bold text-slate-700 mb-1">Manage Deadlines</h4>
                            <p className="text-xs text-slate-500">Extend submission dates for students.</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HODDashboard;
