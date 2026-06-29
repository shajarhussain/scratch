import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Check, X, AlertCircle, Clock } from 'lucide-react';

const SupervisorGroupRequests = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionModal, setActionModal] = useState({ show: false, group: null, type: '' });
    const [rejectionReason, setRejectionReason] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchGroupRequests();
    }, []);

    const fetchGroupRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('/api/groups/supervisor/requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch group requests:', error);
            setLoading(false);
        }
    };

    const handleApprove = async (group) => {
        setActionModal({ show: true, group, type: 'Approved' });
    };

    const handleReject = async (group) => {
        setActionModal({ show: true, group, type: 'Rejected' });
    };

    const confirmAction = async () => {
        try {
            const token = localStorage.getItem('token');
            const payload = {
                status: actionModal.type,
                ...(actionModal.type === 'Rejected' && rejectionReason && { rejectionReason })
            };

            await axios.patch(
                `/api/groups/${actionModal.group._id}/supervisor-approval`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage(`Group ${actionModal.type.toLowerCase()} successfully!`);
            setActionModal({ show: false, group: null, type: '' });
            setRejectionReason('');
            fetchGroupRequests(); // Refresh list
        } catch (error) {
            setMessage(`Error: ${error.response?.data?.message || 'Failed to update group'}`);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                    <Users className="text-indigo-600" size={28} />
                    <span>Group Assignment Requests</span>
                </h1>
                <p className="text-slate-500 mt-1">Review and approve groups requesting you as their supervisor</p>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 border-l-4 rounded flex items-center space-x-2 ${message.includes('Error') ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'
                    }`}>
                    {message.includes('Error') ? <AlertCircle size={20} /> : <Check size={20} />}
                    <span>{message}</span>
                </div>
            )}

            {/* Group Requests List */}
            {groups.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                    <Clock className="mx-auto text-slate-300" size={64} />
                    <h3 className="text-xl font-semibold text-slate-700 mt-4">No Pending Requests</h3>
                    <p className="text-slate-500 mt-2">Groups requesting you as supervisor will appear here</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {groups.map((group) => (
                        <div key={group._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold">Group Request</h3>
                                        <p className="text-indigo-100 text-sm">ID: {group._id.slice(-8)}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${group.supervisorApprovalStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                            group.supervisorApprovalStatus === 'Approved' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {group.supervisorApprovalStatus}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase mb-3">Group Members ({group.members?.length || 0})</h4>
                                <div className="space-y-2 mb-4">
                                    {group.members?.map((member, idx) => (
                                        <div key={member._id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="bg-indigo-100 p-2 rounded-full">
                                                <Users className="text-indigo-600" size={16} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{member.name}</p>
                                                <p className="text-xs text-slate-500">Student ID: {member.studentId}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {group.supervisorApprovalStatus === 'Pending' && (
                                    <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                                        <button
                                            onClick={() => handleApprove(group)}
                                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                        >
                                            <Check size={20} />
                                            <span>Approve</span>
                                        </button>
                                        <button
                                            onClick={() => handleReject(group)}
                                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                        >
                                            <X size={20} />
                                            <span>Reject</span>
                                        </button>
                                    </div>
                                )}

                                {group.supervisorApprovalStatus === 'Rejected' && group.rejectionReason && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-700"><strong>Rejection Reason:</strong> {group.rejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Modal */}
            {actionModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">
                            Confirm {actionModal.type}
                        </h3>

                        {actionModal.type === 'Rejected' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Rejection Reason (Optional)
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="Provide a reason for rejection..."
                                    rows="3"
                                ></textarea>
                            </div>
                        )}

                        <p className="text-slate-600 mb-4">
                            Are you sure you want to {actionModal.type.toLowerCase()} this group?
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setActionModal({ show: false, group: null, type: '' });
                                    setRejectionReason('');
                                }}
                                className="px-4 py-2 text-slate-500 hover:text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className={`px-4 py-2 rounded-lg text-white font-medium ${actionModal.type === 'Approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisorGroupRequests;
