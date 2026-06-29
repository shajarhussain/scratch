import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Link, Send, Copy, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

const ExternalEvaluatorManagement = () => {
    const [externalEvaluators, setExternalEvaluators] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [magicLinks, setMagicLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [copiedLink, setCopiedLink] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');

            // Fetch external evaluators
            const evalRes = await axios.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const extEvals = evalRes.data.filter(u => u.role === 'ExternalEvaluator');
            setExternalEvaluators(extEvals);

            // Fetch schedules with external evaluators
            const schedRes = await axios.get('/api/schedules', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const finalVivaSchedules = schedRes.data.filter(s =>
                s.eventType === 'Final Viva' && s.externalEvaluator
            );
            setSchedules(finalVivaSchedules);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const copyToClipboard = (link) => {
        navigator.clipboard.writeText(link);
        setCopiedLink(link);
        setMessage('Magic link copied to clipboard!');
        setTimeout(() => {
            setCopiedLink('');
            setMessage('');
        }, 3000);
    };

    const getExpiryStatus = (schedule) => {
        if (!schedule.accessEndDate) return { status: 'unknown', text: 'No expiry set', color: 'gray' };

        const now = new Date();
        const expiry = new Date(schedule.accessEndDate);
        const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: 'expired', text: 'Expired', color: 'red' };
        if (diffDays === 0) return { status: 'today', text: 'Expires today', color: 'orange' };
        if (diffDays <= 2) return { status: 'soon', text: `${diffDays} days left`, color: 'orange' };
        return { status: 'active', text: `${diffDays} days left`, color: 'green' };
    };

    const generateMagicLinkPreview = (tokenPreview) => {
        return `${window.location.origin}/external/access/${tokenPreview || '[token]'}`;
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading external evaluator data...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center space-x-3">
                    <Link size={28} />
                    <div>
                        <h2 className="text-2xl font-bold">External Evaluator Management</h2>
                        <p className="text-purple-100 mt-1">Manage magic links and external evaluator invitations</p>
                    </div>
                </div>
            </div>

            {message && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded flex items-center space-x-2">
                    <CheckCircle size={20} />
                    <span>{message}</span>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">External Evaluators</p>
                            <p className="text-3xl font-bold text-indigo-600 mt-1">{externalEvaluators.length}</p>
                        </div>
                        <Users className="text-indigo-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Final Viva Schedules</p>
                            <p className="text-3xl font-bold text-purple-600 mt-1">{schedules.length}</p>
                        </div>
                        <Link className="text-purple-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Active Links</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">
                                {schedules.filter(s => {
                                    const status = getExpiryStatus(s);
                                    return status.status === 'active' || status.status === 'soon' || status.status === 'today';
                                }).length}
                            </p>
                        </div>
                        <CheckCircle className="text-green-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                    <ExternalLink size={20} />
                    <span>How Magic Links Work</span>
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                    <p>â€¢ <strong>Automatic Generation:</strong> Magic links are automatically created when you assign an external evaluator to a Final Viva schedule</p>
                    <p>â€¢ <strong>Secure Access:</strong> Each link contains a unique 64-character crypto-secure token</p>
                    <p>â€¢ <strong>Time-Limited:</strong> Links expire 2 days after the evaluation date</p>
                    <p>â€¢ <strong>No Account Needed:</strong> External evaluators don't need to create an account - they just click the link</p>
                </div>
            </div>

            {/* Magic Links List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">Generated Magic Links</h3>
                    <p className="text-sm text-slate-600 mt-1">
                        {schedules.length > 0
                            ? `${schedules.length} invitation${schedules.length !== 1 ? 's' : ''} to external evaluators`
                            : 'No magic links generated yet'}
                    </p>
                </div>

                <div className="divide-y divide-slate-200">
                    {schedules.length === 0 ? (
                        <div className="p-12 text-center">
                            <Link className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500 font-medium">No External Evaluator Invitations Yet</p>
                            <p className="text-sm text-slate-400 mt-2">
                                Magic links will appear here when you create a Final Viva schedule<br />
                                with an external evaluator assigned
                            </p>
                            <div className="mt-6">
                                <a
                                    href="#schedules"
                                    className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <span>Create Final Viva Schedule</span>
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>
                    ) : (
                        schedules.map((schedule) => {
                            const expiryStatus = getExpiryStatus(schedule);
                            const evaluator = schedule.externalEvaluator;
                            const magicLink = schedule.magicLink || generateMagicLinkPreview('auto-generated');

                            return (
                                <div key={schedule._id} className="p-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Evaluator Info */}
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="bg-purple-100 p-2 rounded-lg">
                                                    <Users className="text-purple-600" size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800">
                                                        {evaluator?.name || 'External Evaluator'}
                                                    </h4>
                                                    <p className="text-sm text-slate-600">{evaluator?.email}</p>
                                                </div>
                                            </div>

                                            {/* Schedule Details */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
                                                <div>
                                                    <span className="text-slate-500">Event:</span>
                                                    <span className="ml-2 font-medium text-slate-700">
                                                        {schedule.eventType}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Date:</span>
                                                    <span className="ml-2 font-medium text-slate-700">
                                                        {new Date(schedule.eventDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Group:</span>
                                                    <span className="ml-2 font-medium text-slate-700">
                                                        {schedule.group?.groupCode || 'N/A'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Venue:</span>
                                                    <span className="ml-2 font-medium text-slate-700">
                                                        {schedule.venue || 'TBD'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Magic Link */}
                                            <div className="bg-slate-100 rounded-lg p-4 mb-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-slate-600 flex items-center space-x-1">
                                                        <Link size={14} />
                                                        <span>MAGIC LINK</span>
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium bg-${expiryStatus.color}-100 text-${expiryStatus.color}-700`}>
                                                        {expiryStatus.text}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <code className="flex-1 text-xs bg-white border border-slate-200 rounded px-3 py-2 text-slate-700 overflow-x-auto">
                                                        {magicLink}
                                                    </code>
                                                    <button
                                                        onClick={() => copyToClipboard(magicLink)}
                                                        className={`p-2 rounded-lg transition-colors ${copiedLink === magicLink
                                                                ? 'bg-green-100 text-green-600'
                                                                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                                                            }`}
                                                        title="Copy to clipboard"
                                                    >
                                                        {copiedLink === magicLink ? (
                                                            <CheckCircle size={18} />
                                                        ) : (
                                                            <Copy size={18} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expiry Info */}
                                            {schedule.accessEndDate && (
                                                <div className="flex items-center space-x-2 text-sm text-slate-600">
                                                    <Clock size={14} />
                                                    <span>
                                                        Access expires: {new Date(schedule.accessEndDate).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Badge */}
                                        <div>
                                            {expiryStatus.status === 'expired' ? (
                                                <span className="inline-flex items-center space-x-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                                                    <XCircle size={16} />
                                                    <span>Expired</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center space-x-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                                    <CheckCircle size={16} />
                                                    <span>Active</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Help Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Need Help?</h3>
                <div className="space-y-2 text-sm text-slate-600">
                    <p><strong>Q: How do I create a magic link?</strong></p>
                    <p>A: Go to Schedules â†’ Create Schedule â†’ Select "Final Viva" â†’ Assign an External Evaluator. The magic link will be auto-generated!</p>

                    <p className="mt-3"><strong>Q: How do I send the link to the evaluator?</strong></p>
                    <p>A: Click the copy button next to the magic link, then send it via email or your preferred communication method.</p>

                    <p className="mt-3"><strong>Q: What if the link expires?</strong></p>
                    <p>A: You'll need to create a new Final Viva schedule with the external evaluator to generate a fresh link.</p>
                </div>
            </div>
        </div>
    );
};

export default ExternalEvaluatorManagement;
