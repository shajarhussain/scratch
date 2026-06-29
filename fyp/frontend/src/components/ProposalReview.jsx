import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Check, X, AlertCircle, Trash2 } from 'lucide-react';

const ProposalReview = () => {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [action, setAction] = useState({ id: null, type: '' }); // type: 'Approved', 'Rejected', 'Changes Requested'
    const [comment, setComment] = useState('');
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const fetchProposals = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/proposals', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProposals(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchProposals();
    }, []);

    const handleAction = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`/api/proposals/${action.id}/status`, {
                status: action.type,
                comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            setProposals(proposals.map(p =>
                p._id === action.id ? { ...p, status: action.type } : p
            ));
            setAction({ id: null, type: '' });
            setComment('');
        } catch (err) {
            console.error('Error updating proposal:', err.response?.data);
            alert(`Error: ${err.response?.data?.message || 'Failed to update proposal'}`);
        }
    };

    const handleArchive = async (id) => {
        if (!window.confirm("Do you want to remove this proposal from your list?")) return;

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`/api/proposals/${id}/archive`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove from local state
            setProposals(proposals.filter(p => p._id !== id));
        } catch (err) {
            console.error('Error archiving proposal:', err);
            alert('Failed to remove proposal');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Review Proposals</h1>

            {proposals.length === 0 ? (
                <p className="text-slate-500">No proposals found.</p>
            ) : (
                <div className="grid gap-6">
                    {proposals.map((proposal) => (
                        <div key={proposal._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{proposal.title}</h3>
                                    <p className="text-sm text-slate-500">
                                        Group ID: {typeof proposal.group === 'object' ? proposal.group?._id : proposal.group}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${proposal.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                    proposal.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                        proposal.status === 'Changes Requested' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    {proposal.status || 'Pending Supervisor'}
                                </span>
                            </div>

                            <p className="text-slate-600 mb-4">{proposal.description}</p>

                            {proposal.fileUrl && (
                                <a href={`/${proposal.fileUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-2 text-blue-600 hover:underline mb-6">
                                    <FileText size={16} />
                                    <span>View Proposal Document</span>
                                </a>
                            )}

                            {proposal.plagiarismStatus && (
                                <div className="mb-4 flex items-center space-x-2 text-sm">
                                    <span className="font-semibold text-slate-700">Plagiarism Check:</span>
                                    <span className={`${proposal.plagiarismStatus === 'Flagged' ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                        {proposal.plagiarismStatus} ({proposal.plagiarismScore}%)
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center space-x-3 border-t border-slate-100 pt-4">
                                {proposal.status === 'Rejected' ? (
                                    <button
                                        onClick={() => handleArchive(proposal._id)}
                                        className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                        <span>Remove from List</span>
                                    </button>
                                ) : proposal.status === 'Approved' && editingId !== proposal._id ? (
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-sm text-slate-500 italic">Decision recorded.</span>
                                        <button
                                            onClick={() => setEditingId(proposal._id)}
                                            className="text-sm text-blue-600 hover:underline font-medium"
                                        >
                                            Change Decision
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setAction({ id: proposal._id, type: 'Approved' })}
                                            className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                                        >
                                            <Check size={18} />
                                            <span>Approve</span>
                                        </button>
                                        <button
                                            onClick={() => setAction({ id: proposal._id, type: 'Changes Requested' })}
                                            className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
                                        >
                                            <AlertCircle size={18} />
                                            <span>Request Changes</span>
                                        </button>
                                        <button
                                            onClick={() => setAction({ id: proposal._id, type: 'Rejected' })}
                                            className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                                        >
                                            <X size={18} />
                                            <span>Reject</span>
                                        </button>

                                        {editingId === proposal._id && (
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
                                            >
                                                <span>Done</span>
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Modal */}
            {action.id && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Confirm {action.type}</h3>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Add a comment (optional)..."
                            rows="3"
                        ></textarea>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => { setAction({ id: null, type: '' }); setComment(''); }}
                                className="px-4 py-2 text-slate-500 hover:text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

export default ProposalReview;
