import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, AlertCircle, Check, Clock, X, UserCheck } from 'lucide-react';

const StudentDashboard = () => {
    const [myGroup, setMyGroup] = useState(null);
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyGroup();
    }, []);

    const fetchMyGroup = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // 1. Fetch Group
            const { data: groupData } = await axios.get('/api/groups/my-group', config);
            setMyGroup(groupData || null);

            // 2. If group exists, fetch Proposal
            if (groupData && groupData._id) {
                try {
                    const { data: proposalData } = await axios.get(`/api/proposals/group/${groupData._id}`, config);
                    if (proposalData && proposalData.length > 0) {
                        setProposal(proposalData[0]); // Get latest proposal
                    }
                } catch (propError) {
                    console.log('No proposal found or error fetching', propError);
                }
            }

            setLoading(false);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setMyGroup(null);
            } else {
                console.error('Failed to fetch group:', error);
            }
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    if (!myGroup) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                    <Users className="mx-auto text-slate-300" size={64} />
                    <h3 className="text-xl font-semibold text-slate-700 mt-4">No Group Yet</h3>
                    <p className="text-slate-500 mt-2">You haven't created or joined a group. Go to Group Creation to form your FYP group!</p>
                </div>
            </div>
        );
    }

    const getStatusBadge = () => {
        const status = myGroup.supervisorApprovalStatus;
        if (status === 'Pending') {
            return (
                <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full">
                    <Clock size={18} />
                    <span className="font-medium">Pending Supervisor Approval</span>
                </div>
            );
        } else if (status === 'Approved') {
            return (
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                    <Check size={18} />
                    <span className="font-medium">Approved</span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-full">
                    <X size={18} />
                    <span className="font-medium">Rejected</span>
                </div>
            );
        }
    };

    const getProposalStatusBadge = (status) => {
        switch (status) {
            case 'Approved':
                return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Approved</span>;
            case 'Rejected':
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Rejected</span>;
            case 'Changes Requested':
                return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">Changes Requested</span>;
            default:
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Pending Review</span>;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-xl shadow-lg text-white">
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                    <Users size={28} />
                    <span>My FYP Group</span>
                </h1>
                <p className="mt-1 text-indigo-100">View your group details and status</p>
            </div>

            {/* Status Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Group Status</h2>
                    {getStatusBadge()}
                </div>

                {myGroup.supervisorApprovalStatus === 'Rejected' && myGroup.rejectionReason && (
                    <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                        <div className="flex items-start space-x-2">
                            <AlertCircle className="text-red-600 mt-0.5" size={20} />
                            <div>
                                <p className="font-semibold text-red-700">Rejection Reason:</p>
                                <p className="text-red-600 mt-1">{myGroup.rejectionReason}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Proposal Details Section (New) */}
            {proposal && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-bold text-slate-800">Project Proposal</h2>
                        {getProposalStatusBadge(proposal.status)}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Title</h3>
                            <p className="text-lg font-semibold text-slate-800 mt-1">{proposal.title}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Description</h3>
                            <p className="text-slate-600 mt-1 whitespace-pre-wrap">{proposal.description}</p>
                        </div>

                        {/* Supervisor Feedback */}
                        {proposal.comments && proposal.comments.length > 0 && (
                            <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                                    <UserCheck size={16} className="mr-2" />
                                    Supervisor Feedback
                                </h3>
                                <div className="space-y-3">
                                    {proposal.comments.map((comment, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                                            <p className="text-slate-700 text-sm">{comment.text}</p>
                                            <p className="text-xs text-slate-400 mt-2 text-right">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Supervisor Info */}
            {myGroup.supervisorRequest && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Supervisor</h2>
                    <div className="flex items-center space-x-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <UserCheck className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">{myGroup.supervisorRequest.name}</p>
                            <p className="text-sm text-slate-500">Reg ID: {myGroup.supervisorRequest.registrationNumber}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Members List */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Group Members ({myGroup.members?.length || 0})</h2>
                <div className="space-y-3">
                    {myGroup.members?.map((member, idx) => (
                        <div key={member._id} className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <Users className="text-blue-600" size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-800">{member.name}</p>
                                <p className="text-sm text-slate-500">Student ID: {member.studentId}</p>
                            </div>
                            {member.email && (
                                <p className="text-xs text-slate-400">{member.email}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Next Steps */}
            {!proposal && myGroup.supervisorApprovalStatus === 'Approved' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-start space-x-3">
                        <Check className="text-green-600 mt-1" size={24} />
                        <div>
                            <h3 className="font-bold text-green-900">Group Approved!</h3>
                            <p className="text-green-700 mt-1">
                                Your group has been approved by {myGroup.supervisorRequest?.name}.
                                You can now proceed with your FYP proposal submission.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Final Viva Deliverables Section */}
            <FinalVivaSection groupId={myGroup._id} />
        </div>
    );
};

// Sub-component for Final Viva Uploads
const FinalVivaSection = ({ groupId }) => {
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(null); // 'Report', 'Code', etc.

    const requiredDocs = [
        { label: 'Project Report (PDF)', type: 'Report', accept: '.pdf' },
        { label: 'SRS Document (PDF)', type: 'SRS', accept: '.pdf' },
        { label: 'SDS Document (PDF)', type: 'SDS', accept: '.pdf' },
        { label: 'Source Code (ZIP)', type: 'Code', accept: '.zip,.rar,.tar' },
        { label: 'Plagiarism Report (PDF)', type: 'Plagiarism', accept: '.pdf' },
        { label: 'Final Viva Slides (PPT/PDF)', type: 'Presentation', accept: '.ppt,.pptx,.pdf' }
    ];

    useEffect(() => {
        fetchSchedule();
    }, [groupId]);

    const fetchSchedule = async () => {
        try {
            const token = localStorage.getItem('token');
            // Find Final Viva schedule for this group
            const res = await axios.get(`/api/schedules?groupId=${groupId}&eventType=Final Viva`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.length > 0) {
                // Fetch full details including artifacts
                const fullRes = await axios.get(`/api/evaluator/assignments/${res.data[0]._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSchedule(fullRes.data.schedule);
            }
        } catch (error) {
            console.error("Error fetching Viva schedule", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file, type) => {
        if (!file || !schedule) return;
        setUploading(type);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('name', type); // Simple naming
        formData.append('description', `Final Viva ${type}`);

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/schedules/${schedule._id}/artifacts`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert(`${type} uploaded successfully!`);
            fetchSchedule(); // Refresh list
        } catch (error) {
            alert(`Failed to upload ${type}: ${error.response?.data?.message || error.message}`);
        } finally {
            setUploading(null);
        }
    };

    if (loading) return null;
    if (!schedule) return null; // Don't show if no Final Viva scheduled

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Final Viva Deliverables</h2>
                    <p className="text-sm text-slate-500">Upload all required documents for external evaluation.</p>
                </div>
                <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-xs font-bold">
                    {new Date(schedule.eventDate).toLocaleDateString()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredDocs.map((doc) => {
                    const uploaded = schedule.artifacts?.find(a => a.type === doc.type);
                    return (
                        <div key={doc.type} className={`p-4 rounded-lg border ${uploaded ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-slate-700">{doc.label}</h3>
                                {uploaded ? (
                                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded flex items-center">
                                        <Check size={12} className="mr-1" /> Uploaded
                                    </span>
                                ) : (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Required</span>
                                )}
                            </div>

                            {uploaded ? (
                                <div className="text-sm text-slate-600">
                                    <p className="truncate w-full mb-2">{uploaded.name}</p>
                                    <a
                                        href={uploaded.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:underline text-xs"
                                    >
                                        View Document
                                    </a>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <input
                                        type="file"
                                        accept={doc.accept}
                                        onChange={(e) => handleUpload(e.target.files[0], doc.type)}
                                        disabled={uploading}
                                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    {uploading === doc.type && <p className="text-xs text-indigo-600 mt-1">Uploading...</p>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StudentDashboard;
