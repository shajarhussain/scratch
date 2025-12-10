import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Mail, IdCard, UserCircle, Check, X } from 'lucide-react';

const GroupsDashboard = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://127.0.0.1:5000/api/groups', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch groups');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-500">Loading groups...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                            <Users className="text-blue-600" size={28} />
                            <span>FYP Groups</span>
                        </h1>
                        <p className="text-slate-500 mt-1">View all registered FYP groups and their members</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-blue-600">{groups.length}</p>
                        <p className="text-sm text-slate-500">Total Groups</p>
                    </div>
                </div>
            </div>

            {/* Groups List */}
            {groups.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                    <Users className="mx-auto text-slate-300" size={64} />
                    <h3 className="text-xl font-semibold text-slate-700 mt-4">No Groups Yet</h3>
                    <p className="text-slate-500 mt-2">Groups will appear here once students create them</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {groups.map((group, index) => (
                        <div key={group._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            {/* Group Header */}
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold">Group #{index + 1}</h3>
                                        <p className="text-blue-100 text-sm">ID: {group._id.slice(-8)}</p>
                                    </div>
                                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                                        {group.members?.length || 0} {(group.members?.length || 0) === 1 ? 'Member' : 'Members'}
                                    </div>
                                </div>
                            </div>

                            {/* Group Details */}
                            <div className="p-4 space-y-4">
                                {/* Leader Info */}
                                {group.leader ? (
                                    <div className="pb-3 border-b border-slate-200">
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Group Leader</p>
                                        <div className="flex items-center space-x-2">
                                            <UserCircle className="text-green-600" size={20} />
                                            <div>
                                                <p className="font-semibold text-slate-800">{group.leader.name}</p>
                                                <p className="text-sm text-slate-500">{group.leader.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pb-3 border-b border-slate-200">
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Group Leader</p>
                                        <p className="text-sm text-slate-400 italic">No leader assigned yet</p>
                                    </div>
                                )}

                                {/* Members List */}
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Members</p>
                                    {group.members && group.members.length > 0 ? (
                                        <div className="space-y-2">
                                            {group.members.map((member, idx) => (
                                                <div key={member._id || idx} className="flex items-start space-x-3 p-2 bg-slate-50 rounded-lg">
                                                    <div className="bg-blue-100 p-1.5 rounded-full mt-0.5">
                                                        <Users className="text-blue-600" size={14} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-800 truncate">
                                                            {member.name || 'Unknown'}
                                                        </p>
                                                        {member.studentId && (
                                                            <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                                                                <IdCard size={12} />
                                                                <span>{member.studentId}</span>
                                                            </p>
                                                        )}
                                                        {member.email && (
                                                            <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                                                                <Mail size={12} />
                                                                <span className="truncate">{member.email}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No members in this group</p>
                                    )}
                                </div>

                                {/* Group Status */}
                                <div className="pt-3 border-t border-slate-200">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">Status:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${group.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                group.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            {group.status || 'Active'}
                                        </span>
                                    </div>
                                    {group.createdAt && (
                                        <p className="text-xs text-slate-400 mt-2">
                                            Created: {new Date(group.createdAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GroupsDashboard;
