import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    FileText,
    Calendar,
    ClipboardCheck,
    Mail,

    LogOut,
    Layers,
    BookOpen
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const { user, logout } = useAuth();

    const getLinks = () => {
        const commonLinks = [
            { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' }
        ];

        switch (user.role) {
            case 'Student':
                return [
                    ...commonLinks,
                    { name: 'My Group', icon: Users, id: 'my-group' },
                    { name: 'Group Creation', icon: Users, id: 'group' },
                    { name: 'Proposal', icon: FileText, id: 'proposal' },
                    { name: 'SRS Document', icon: FileText, id: 'srs-document' },
                    { name: 'Mid-Term Evaluation', icon: Layers, id: 'mid-term' },
                    { name: 'Final Report', icon: BookOpen, id: 'final-report' },
                    { name: 'Attendance Log', icon: Calendar, id: 'attendance' },
                    { name: 'Supervisor Logs', icon: FileText, id: 'student-logs' },
                    { name: 'My Schedules', icon: Calendar, id: 'my-schedules' },
                ];
            case 'Coordinator':
                return [
                    ...commonLinks,
                    { name: 'View Groups', icon: Users, id: 'groups' },
                    { name: 'Weekly Progress Logs', icon: Calendar, id: 'progress' },
                    { name: 'Attendance Insights', icon: ClipboardCheck, id: 'insights' },
                    { name: 'Supervisor Logs Analytics', icon: FileText, id: 'coordinator-logs' },
                    { name: 'Schedules', icon: Calendar, id: 'schedules' },
                    { name: 'External Evaluators', icon: Mail, id: 'external-evaluators' },
                ];
            case 'HOD':
                return [
                    ...commonLinks,
                    { name: 'HOD Oversight', icon: LayoutDashboard, id: 'hod' },
                ];
            case 'Supervisor':
            case 'InternalEvaluator':
            case 'ExternalEvaluator':
                return [
                    ...commonLinks,
                    ...(user.role === 'Supervisor' ? [{ name: 'Group Requests', icon: Users, id: 'group-requests' }] : []),
                    ...(user.role === 'Supervisor' ? [{ name: 'SRS Document', icon: FileText, id: 'srs-document' }] : []),
                    ...(user.role === 'Supervisor' ? [{ name: 'Mid-Term Evaluation', icon: Layers, id: 'mid-term' }] : []),
                    ...(user.role === 'InternalEvaluator' ? [{ name: 'Evaluator Dashboard', icon: ClipboardCheck, id: 'evaluator-dashboard' }] : []),
                    ...(user.role === 'Supervisor' ? [{ name: 'Review Proposals', icon: FileText, id: 'review' }] : []),
                    ...(user.role === 'Supervisor' ? [{ name: 'Student Progress', icon: Calendar, id: 'progress' }] : []),
                    ...(user.role === 'Supervisor' ? [{ name: 'Supervisor Logs', icon: FileText, id: 'supervisor-logs' }] : []),
                    { name: 'My Evaluation Schedule', icon: Calendar, id: 'my-schedules' },
                ];
            case 'Admin':
                return [
                    ...commonLinks,
                    { name: 'Admin Panel', icon: Users, id: 'admin' },
                ];
            default:
                return commonLinks;
        }
    };

    const links = getLinks();

    return (
        <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 shadow-xl">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    FYP Manager
                </h1>
                <p className="text-xs text-slate-400 mt-1">Academic System</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <button
                            key={link.id}
                            onClick={() => setActiveTab(link.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === link.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{link.name}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center space-x-3 px-4 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
                        {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <LogOut size={18} />
                    <span className="text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
