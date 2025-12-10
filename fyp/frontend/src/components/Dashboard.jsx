import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, FileText, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon size={24} className="text-white" />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        // Student
        groupStatus: 'Loading...',
        proposalStatus: 'Loading...',
        defenseDate: 'Loading...',
        srsStatus: 'None',
        // Coordinator
        totalGroups: 0,
        scheduledDefenses: 0, // We need to fetch this or derive it
        pendingApprovals: 0,
        // Supervisor (Existing)
        myGroupsCount: 0,
        pendingProposalsCount: 0,
        completedEvalsCount: 0
    });

    const [srsFile, setSrsFile] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const baseUrl = 'http://127.0.0.1:5000';

            try {
                if (user.role === 'Student') {
                    // 1. Fetch Group
                    let group = null;
                    try {
                        const { data } = await axios.get(`${baseUrl}/api/groups/my-group`, config);
                        group = data;
                    } catch (e) {
                        setStats(prev => ({ ...prev, groupStatus: 'Not Formed', proposalStatus: '-', defenseDate: '-' }));
                        return; // Stop if no group
                    }

                    if (group) {
                        const groupStatus = group.supervisorApprovalStatus === 'Approved' ? 'Formed & Approved' : group.supervisorApprovalStatus;

                        // 2. Fetch Proposal
                        let proposalStatus = 'Pending Submission';
                        try {
                            const { data } = await axios.get(`${baseUrl}/api/proposals/group/${group._id}`, config);
                            if (data && data.length > 0) {
                                proposalStatus = data[0].status;
                            }
                        } catch (e) { }

                        // 3. Fetch Schedules & Check SRS
                        let defenseDate = 'TBD';
                        let srsStatus = 'None';
                        let srsScheduleId = null;

                        try {
                            const { data: schedules } = await axios.get(`${baseUrl}/api/schedules`, config);

                            const now = new Date();
                            now.setHours(0, 0, 0, 0);

                            const future = schedules
                                .filter(s => new Date(s.eventDate) >= now)
                                .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

                            if (future.length > 0) {
                                defenseDate = `${new Date(future[0].eventDate).toLocaleDateString()} (${future[0].eventType})`;
                            }

                            // SRS Logic
                            const interim = schedules.find(s => s.eventType === 'Interim Evaluation I');
                            if (interim) {
                                const uploadStart = interim.srsUploadStartDate ? new Date(interim.srsUploadStartDate) : null;
                                const deadline = new Date(interim.eventDate);
                                const isSubmitted = interim.srsDeliverable && interim.srsDeliverable.status !== 'Pending';

                                if (isSubmitted) {
                                    srsStatus = interim.srsDeliverable.status; // Submitted | Approved
                                } else if (uploadStart && now >= uploadStart && now < deadline) {
                                    srsStatus = 'Open';
                                    srsScheduleId = interim._id;
                                } else if (uploadStart && now > deadline) {
                                    srsStatus = 'Missed';
                                } else {
                                    srsStatus = 'Scheduled';
                                }
                            }

                        } catch (e) {
                            console.error("Schedule fetch error", e);
                        }

                        setStats(prev => ({
                            ...prev,
                            groupStatus,
                            proposalStatus,
                            defenseDate,
                            srsStatus,
                            srsScheduleId
                        }));
                    }
                } else if (user.role === 'Coordinator') {
                    const { data } = await axios.get(`${baseUrl}/api/attendance/insights`, config);

                    setStats(prev => ({
                        ...prev,
                        totalGroups: data.overallStats.totalGroups || 0,
                        scheduledDefenses: data.overallStats.lowAttendanceCount ? `${data.overallStats.lowAttendanceCount} Flags` : '0',
                        pendingApprovals: data.importantFeedback?.length || 0
                    }));

                } else if (user.role === 'InternalEvaluator') {
                    const { data } = await axios.get(`${baseUrl}/api/evaluator/assignments`, config);
                    const total = data.length;
                    const completed = data.filter(a => a.hasSubmitted).length;
                    setStats(prev => ({
                        ...prev,
                        totalAssignments: total,
                        pendingEvaluations: total - completed,
                        completedEvaluations: completed
                    }));
                } else if (['Supervisor', 'ExternalEvaluator'].includes(user.role)) {
                    const { data } = await axios.get(`${baseUrl}/api/groups/supervisor/stats`, config);

                    // Fetch Pending SRS for Supervisor
                    let pendingSRS = [];
                    if (user.role === 'Supervisor') {
                        try {
                            const { data: schedules } = await axios.get(`${baseUrl}/api/schedules/upcoming`, config); // Or a specific 'pending-reviews' endpoint
                            // Filter schedules that have SRS submitted but not approved
                            pendingSRS = schedules.filter(s =>
                                s.eventType === 'Interim Evaluation I' &&
                                s.srsDeliverable &&
                                s.srsDeliverable.status === 'Submitted' &&
                                !s.srsDeliverable.supervisorApproved &&
                                s.supervisor === user._id // Ensure it's this supervisor
                            );
                        } catch (e) { console.error("SRS Fetch error", e); }
                    }

                    setStats(prev => ({ ...prev, ...data, pendingSRS }));
                }
            } catch (error) {
                console.error("Dashboard Fetch Error", error);
            }
        };
        fetchDashboardData();
    }, [user.role]);

    const renderStudentDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={Users} title="Group Status" value={stats.groupStatus} color="bg-blue-500" />
                <StatCard icon={FileText} title="Proposal" value={stats.proposalStatus} color={stats.proposalStatus === 'Approved' ? 'bg-green-500' : 'bg-yellow-500'} />
                <StatCard icon={Calendar} title="Next Event" value={stats.defenseDate} color="bg-purple-500" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-sm">
                        <Clock size={16} className="text-slate-400" />
                        <span className="text-slate-600">You logged in successfully.</span>
                        <span className="text-slate-400 ml-auto">Just now</span>
                    </div>
                </div>
            </div>
        </div>
    );
    const renderCoordinatorDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={Users} title="Total Groups" value={stats.totalGroups} color="bg-blue-500" />
                <StatCard icon={Clock} title="At Risk Groups" value={stats.scheduledDefenses} color="bg-orange-500" />
                <StatCard icon={AlertCircle} title="Flagged Feedback" value={stats.pendingApprovals} color="bg-red-500" />
            </div>
        </div>
    );

    const renderSupervisorDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={Users} title="My Groups" value={stats.myGroupsCount} color="bg-indigo-500" />
                <StatCard icon={FileText} title="Pending Proposals" value={stats.pendingProposalsCount} color="bg-orange-500" />
                <StatCard icon={CheckCircle} title="Completed Evals" value={stats.completedEvalsCount} color="bg-teal-500" />
            </div>

            {/* Note: SRS Reviews moved to SRSDocument component */}
        </div>
    );

    const renderEvaluatorDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={Calendar} title="Assigned Evaluations" value={stats.totalAssignments || 0} color="bg-blue-500" />
                <StatCard icon={Clock} title="Pending" value={stats.pendingEvaluations || 0} color="bg-orange-500" />
                <StatCard icon={CheckCircle} title="Completed" value={stats.completedEvaluations || 0} color="bg-green-500" />
            </div>

        </div>
    );

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500">Welcome back, {user.name}</p>
            </div>

            {user.role === 'Student' && renderStudentDashboard()}
            {user.role === 'Coordinator' && renderCoordinatorDashboard()}
            {user.role === 'InternalEvaluator' && renderEvaluatorDashboard()}
            {['Supervisor', 'ExternalEvaluator'].includes(user.role) && renderSupervisorDashboard()}
        </div>
    );
};

export default Dashboard;
