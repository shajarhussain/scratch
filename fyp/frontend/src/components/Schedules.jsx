import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Plus, Filter, Clock, MapPin, Users, Edit, Trash2, CheckCircle, AlertTriangle, X, Ban } from 'lucide-react';

const Schedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [groups, setGroups] = useState([]);
    const [evaluators, setEvaluators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEventType, setSelectedEventType] = useState('');
    const [filterEventType, setFilterEventType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [message, setMessage] = useState('');

    // Evaluation View Modal State
    const [viewEvaluation, setViewEvaluation] = useState(null);
    const [showEvalModal, setShowEvalModal] = useState(false);
    const [loadingEval, setLoadingEval] = useState(false);

    const [formData, setFormData] = useState({
        eventType: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        venue: '',
        isOnline: false,
        meetingLink: '',
        groupId: '',
        supervisorId: '',
        internalEvaluatorIds: [],
        externalEvaluatorId: '',
        accessStartDate: '',
        accessEndDate: '',
        deadlineType: '',
        allowExtensions: false,
        resultPublicationDate: '',
        gradeLockDate: '',
        notes: '',
        description: '',
        requirements: '',
        srsUploadStartDate: ''
    });

    const eventTypes = [
        { value: 'Proposal Defense', icon: '🎯', color: 'green' },
        { value: 'Interim Evaluation I', icon: '📊', color: 'blue' },
        { value: 'Mid-Term Evaluation II', icon: '📈', color: 'blue' },
        { value: 'Final Viva', icon: '🎓', color: 'purple' },
        { value: 'External Evaluator Access', icon: '🔑', color: 'yellow' },
        { value: 'Rescheduled Defense', icon: '🔄', color: 'orange' },
        { value: 'Submission Deadline', icon: '📅', color: 'orange' },
        { value: 'Re-Evaluation', icon: '🔍', color: 'red' },
        { value: 'Result Publication', icon: '📢', color: 'gray' }
    ];

    useEffect(() => {
        fetchSchedules();
        fetchGroups();
        fetchEvaluators();
    }, [filterEventType, filterStatus]);

    const fetchSchedules = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = {};
            if (filterEventType) params.eventType = filterEventType;
            if (filterStatus) params.status = filterStatus;

            const res = await axios.get('http://127.0.0.1:5000/api/schedules', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setSchedules(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching schedules:', error);
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://127.0.0.1:5000/api/groups/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(res.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchEvaluators = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://127.0.0.1:5000/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter users by evaluator roles
            const evaluatorUsers = res.data.filter(u =>
                u.role === 'Supervisor' || u.role === 'InternalEvaluator' || u.role === 'ExternalEvaluator'
            );
            setEvaluators(evaluatorUsers);
        } catch (error) {
            console.error('Error fetching evaluators:', error);
        }
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const token = localStorage.getItem('token');

            // Sanitize payload: Remove empty strings to prevent backend validation errors (e.g. Enums/Dates)
            const payload = Object.fromEntries(
                Object.entries(formData).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
            );

            if (isEditing) {
                console.log('Sending UPDATE payload:', payload);
                await axios.put(`http://127.0.0.1:5000/api/schedules/${editId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessage('Schedule updated successfully!');
            } else {
                console.log('Sending CREATE payload:', payload);
                await axios.post('http://127.0.0.1:5000/api/schedules', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessage('Schedule created successfully!');
            }

            setShowCreateModal(false);
            resetForm();
            window.location.reload(); // Force reload to ensure all states (student views etc) are synced
        } catch (error) {
            setMessage(`Error: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleEdit = (schedule) => {
        setIsEditing(true);
        setEditId(schedule._id);
        setSelectedEventType(schedule.eventType);
        // Debugging: Log the schedule object being loaded
        console.log('Loading schedule for edit:', schedule);
        console.log('External Evaluator in schedule:', schedule.externalEvaluator);

        // Populate form data
        setFormData({
            eventType: schedule.eventType || '',
            eventDate: schedule.eventDate ? new Date(schedule.eventDate).toISOString().split('T')[0] : '',
            startTime: schedule.startTime || '',
            endTime: schedule.endTime || '',
            venue: schedule.venue || '',
            isOnline: schedule.isOnline || false,
            meetingLink: schedule.meetingLink || '',
            groupId: schedule.group?._id || '',
            supervisorId: schedule.supervisor?._id || '',
            internalEvaluatorIds: schedule.internalEvaluators ? schedule.internalEvaluators.map(e => e._id) : [],
            externalEvaluatorId: schedule.externalEvaluator?._id || '',
            accessStartDate: schedule.accessStartDate ? new Date(schedule.accessStartDate).toISOString().split('T')[0] : '',
            accessEndDate: schedule.accessEndDate ? new Date(schedule.accessEndDate).toISOString().split('T')[0] : '',
            deadlineType: schedule.deadlineType || '',
            allowExtensions: schedule.allowExtensions || false,
            resultPublicationDate: schedule.resultPublicationDate ? new Date(schedule.resultPublicationDate).toISOString().split('T')[0] : '',
            gradeLockDate: schedule.gradeLockDate ? new Date(schedule.gradeLockDate).toISOString().split('T')[0] : '',
            notes: schedule.notes || '',
            description: schedule.description || '',
            requirements: schedule.requirements || '',
            srsUploadStartDate: schedule.srsUploadStartDate ? new Date(schedule.srsUploadStartDate).toISOString().split('T')[0] : '',
            isNewEvaluator: false,
            newEvaluatorName: '',
            newEvaluatorEmail: '',
            emailSubject: '',
            emailMessage: '',
            coordinatorEmail: schedule.coordinatorEmail || '' // If we saved it before, or let them type it
        });

        setShowCreateModal(true);
    };

    const resetForm = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({
            eventType: '',
            eventDate: '',
            startTime: '',
            endTime: '',
            venue: '',
            isOnline: false,
            meetingLink: '',
            groupId: '',
            supervisorId: '',
            internalEvaluatorIds: [],
            externalEvaluatorId: '',
            accessStartDate: '',
            accessEndDate: '',
            deadlineType: '',
            allowExtensions: false,
            resultPublicationDate: '',
            gradeLockDate: '',
            notes: '',
            description: '',
            requirements: '',
            srsUploadStartDate: ''
        });
        setSelectedEventType('');
    };

    const handleDelete = async (id, isPermanent = false) => {
        const action = isPermanent ? 'remove' : 'cancel';
        const message = isPermanent
            ? "Remove this schedule from your list? This cannot be undone."
            : "Are you sure you want to Cancel this schedule?";

        if (!confirm(message)) return;

        // Optimistic Update
        const previousSchedules = [...schedules];
        if (isPermanent) {
            setSchedules(prev => prev.filter(s => s._id !== id));
        } else {
            setSchedules(prev => prev.map(s => s._id === id ? { ...s, status: 'Cancelled' } : s));
        }

        try {
            const token = localStorage.getItem('token');
            const url = `http://127.0.0.1:5000/api/schedules/${id}`;

            await axios.delete(url, {
                headers: { Authorization: `Bearer ${token}` },
                params: { permanent: isPermanent }
            });
            setMessage(`Schedule ${isPermanent ? 'removed' : 'cancelled'} successfully!`);
            // fetchSchedules(); // Optional if optimistic update is accurate, but good to sync eventually. 
            // We can skip immediate re-fetch to avoid UI jumping, or debounce it. 
            // For safety, let's strictly rely on the optimistic update for the user interaction and let the background/next load sync it.
        } catch (error) {
            // Revert on error
            setSchedules(previousSchedules);
            setMessage(`Error: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleComplete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/api/schedules/${id}/complete`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Schedule marked as completed!');
            fetchSchedules();
        } catch (error) {
            setMessage(`Error: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleViewEvaluation = async (scheduleId, evaluatorId) => {
        setLoadingEval(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/evaluations/schedule/${scheduleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const evaluation = res.data;
            const evaluatorData = evaluation.evaluators.find(e => String(e.evaluator?._id) === String(evaluatorId));

            if (evaluatorData) {
                setViewEvaluation({
                    ...evaluatorData,
                    evaluatorName: typeof evaluatorData.evaluator === 'object' ? evaluatorData.evaluator.name : 'Unknown',
                    totalScore: evaluatorData.scores?.total || 0,
                    recommendation: evaluatorData.recommendation || 'Pending'
                });
                setShowEvalModal(true);
            } else {
                alert("No evaluation data found for this evaluator yet.");
            }
        } catch (error) {
            console.error(error);
            alert("Could not fetch evaluation details.");
        } finally {
            setLoadingEval(false);
        }
    };

    // Helper functions for UI
    const getEventColor = (eventType) => {
        const event = eventTypes.find(e => e.value === eventType);
        return event ? event.color : 'gray';
    };

    const getEventIcon = (eventType) => {
        const event = eventTypes.find(e => e.value === eventType);
        return event ? event.icon : '📋';
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading schedules...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                    <CalendarIcon size={28} />
                    <span>Schedules Management</span>
                </h1>
                <p className="mt-1 text-indigo-100">Manage all FYP events, defenses, evaluations, and deadlines</p>
            </div>

            {message && (
                <div className={`p-4 border-l-4 rounded ${message.includes('Error')
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-green-50 border-green-500 text-green-700'
                    }`}>
                    {message}
                </div>
            )}

            {/* Filters & Create Button */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                    <Plus size={20} />
                    <span>Create Schedule</span>
                </button>

                <div className="flex items-center space-x-2 flex-1">
                    <Filter size={18} className="text-slate-500" />
                    <select
                        value={filterEventType}
                        onChange={(e) => setFilterEventType(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Event Types</option>
                        {eventTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.icon} {type.value}</option>
                        ))}
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Status</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Rescheduled">Rescheduled</option>
                    </select>
                </div>
            </div>

            {/* Schedules List */}
            <div className="space-y-4">
                {schedules.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                        <CalendarIcon className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500">No schedules found</p>
                        <p className="text-sm text-slate-400 mt-2">Create your first schedule to get started</p>
                    </div>
                ) : (
                    schedules.map(schedule => (
                        <div key={schedule._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className={`p-4 border-l-4 border-${getEventColor(schedule.eventType)}-500`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="text-2xl">{getEventIcon(schedule.eventType)}</span>
                                            <h3 className="text-lg font-bold text-slate-800">{schedule.eventType}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${schedule.status === 'Scheduled' ? 'bg-blue-100 text-blue-700'
                                                : schedule.status === 'Completed' ? 'bg-green-100 text-green-700'
                                                    : schedule.status === 'Cancelled' ? 'bg-red-100 text-red-700'
                                                        : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {schedule.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                                            {schedule.eventDate && (
                                                <div className="flex items-center space-x-2">
                                                    <CalendarIcon size={16} />
                                                    <span>{new Date(schedule.eventDate).toLocaleDateString()}</span>
                                                    {schedule.startTime && <span>• {schedule.startTime} - {schedule.endTime}</span>}
                                                </div>
                                            )}
                                            {schedule.venue && (
                                                <div className="flex items-center space-x-2">
                                                    <MapPin size={16} />
                                                    <span>{schedule.venue}</span>
                                                </div>
                                            )}
                                            {schedule.group && (
                                                <div className="flex items-center space-x-2">
                                                    <Users size={16} />
                                                    <span>Group: {schedule.group.groupCode}</span>
                                                </div>
                                            )}
                                        </div>

                                        {schedule.description && (
                                            <p className="mt-2 text-sm text-slate-600">{schedule.description}</p>
                                        )}

                                        {schedule.internalEvaluators && schedule.internalEvaluators.length > 0 && (
                                            <div className="mt-2 text-sm text-slate-600">
                                                <strong>Panel:</strong>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {schedule.internalEvaluators.map(evaluator => {
                                                        const status = schedule.evaluationDetails?.evaluators?.find(ev => String(ev.evaluatorId) === String(evaluator._id));
                                                        const isSubmitted = status?.submitted;

                                                        return (
                                                            <button
                                                                key={evaluator._id}
                                                                onClick={() => isSubmitted && handleViewEvaluation(schedule._id, evaluator._id)}
                                                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border transition-colors ${isSubmitted
                                                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer'
                                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200 cursor-default'}`}
                                                                title={isSubmitted ? "Click to View Evaluation" : "Pending Submission"}
                                                            >
                                                                {evaluator.name}
                                                                {isSubmitted
                                                                    ? <CheckCircle size={12} className="ml-1 text-green-600" aria-label="Evaluated" />
                                                                    : <Clock size={12} className="ml-1 text-yellow-600" aria-label="Pending" />
                                                                }
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Prominent Evaluation Notification Banner */}
                                        {schedule.evaluationDetails?.evaluators?.some(e => e.submitted) && (
                                            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 animate-pulse-slow">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="relative flex h-3 w-3">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                                        </span>
                                                        <span className="font-bold text-green-800">
                                                            Evaluation Received!
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-sm text-green-700">
                                                    Evaluators have submitted marks. Click to review:
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {schedule.internalEvaluators.map(evaluator => {
                                                        const status = schedule.evaluationDetails?.evaluators?.find(ev => String(ev.evaluatorId) === String(evaluator._id));
                                                        if (!status?.submitted) return null;

                                                        return (
                                                            <button
                                                                key={evaluator._id}
                                                                onClick={() => handleViewEvaluation(schedule._id, evaluator._id)}
                                                                className="flex items-center space-x-2 bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 shadow-sm transition-all text-sm font-semibold"
                                                            >
                                                                <CheckCircle size={16} />
                                                                <span>Review {evaluator.name}</span>
                                                            </button>
                                                        )
                                                    })}

                                                    {/* Check for External Evaluator Submission */}
                                                    {(() => {
                                                        const extId = schedule.externalEvaluator?._id || schedule.externalEvaluator;
                                                        if (extId) {
                                                            const status = schedule.evaluationDetails?.evaluators?.find(ev => String(ev.evaluatorId) === String(extId));

                                                            if (status?.submitted) {
                                                                return (
                                                                    <button
                                                                        key="external"
                                                                        onClick={() => handleViewEvaluation(schedule._id, extId)}
                                                                        className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 shadow-sm transition-all text-sm font-semibold"
                                                                    >
                                                                        <CheckCircle size={16} />
                                                                        <span>Review External ({schedule.externalEvaluator?.name || 'Evaluator'})</span>
                                                                    </button>
                                                                );
                                                            }
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {/* Complete - Only for Scheduled */}
                                        {schedule.status === 'Scheduled' && (
                                            <button
                                                onClick={() => handleComplete(schedule._id)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Mark as Completed"
                                            >
                                                <CheckCircle size={20} />
                                            </button>
                                        )}

                                        {/* Edit - Available for ALL statuses */}
                                        <button
                                            onClick={() => handleEdit(schedule)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Schedule"
                                        >
                                            <Edit size={20} />
                                        </button>

                                        {/* Cancel (Visual Only) vs Remove Rules */}
                                        {schedule.status === 'Scheduled' ? (
                                            <button
                                                onClick={() => handleDelete(schedule._id, false)}
                                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                title="Cancel Schedule"
                                            >
                                                <Ban size={20} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleDelete(schedule._id, true)}
                                                className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                                title="Remove Notification"
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Schedule Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0">
                                <h3 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit Schedule' : 'Create New Schedule'}</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-slate-500 hover:text-slate-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Event Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Event Type *</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {eventTypes.map(type => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, eventType: type.value });
                                                    setSelectedEventType(type.value);
                                                }}
                                                className={`p-3 rounded-lg border-2 transition-all text-left ${formData.eventType === type.value
                                                    ? `border-${type.color}-500 bg-${type.color}-50`
                                                    : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-1">{type.icon}</div>
                                                <div className="text-xs font-medium">{type.value}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Common Fields */}
                                {selectedEventType && selectedEventType !== 'External Evaluator Access' && selectedEventType !== 'Result Publication' && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Event Date *</label>
                                                <input
                                                    type="date"
                                                    value={formData.eventDate}
                                                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                                    required
                                                />
                                            </div>



                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Group *</label>
                                                <select
                                                    value={formData.groupId}
                                                    onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                                    required
                                                >
                                                    <option value="">Select Group</option>
                                                    {groups.map(group => (
                                                        <option key={group._id} value={group._id}>
                                                            {group.groupCode} - {group.members?.map(m => m.name).join(', ')}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Supervisor</label>
                                                <select
                                                    value={formData.supervisorId}
                                                    onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="">Select Supervisor</option>
                                                    {evaluators.filter(e => e.role === 'Supervisor').map(sup => (
                                                        <option key={sup._id} value={sup._id}>
                                                            {sup.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                                                <input
                                                    type="time"
                                                    value={formData.startTime}
                                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                                                <input
                                                    type="time"
                                                    value={formData.endTime}
                                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Venue</label>
                                                <input
                                                    type="text"
                                                    value={formData.venue}
                                                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Room 101 or Online"
                                                />
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isOnline}
                                                    onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
                                                    className="mr-2"
                                                />
                                                <label className="text-sm font-medium text-slate-700">Online Meeting</label>
                                            </div>
                                        </div>

                                        {formData.isOnline && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Link</label>
                                                <input
                                                    type="url"
                                                    value={formData.meetingLink}
                                                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="https://meet.google.com/..."
                                                />
                                            </div>
                                        )}



                                        {/* Internal Evaluators - for evaluation events */}
                                        {(selectedEventType === 'Proposal Defense' ||
                                            selectedEventType === 'Interim Evaluation I' ||
                                            selectedEventType === 'Mid-Term Evaluation II' ||
                                            selectedEventType === 'Final Viva') && (
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Internal Evaluators
                                                    </label>
                                                    {/* Selected Evaluators Tags - Professional Look */}
                                                    <div className="min-h-[50px] p-3 border border-slate-200 rounded-lg bg-slate-50 mb-3">
                                                        {formData.internalEvaluatorIds.length === 0 ? (
                                                            <p className="text-sm text-slate-400 italic flex items-center justify-center py-2">
                                                                <Users size={16} className="mr-2" /> No evaluators selected
                                                            </p>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-2">
                                                                {formData.internalEvaluatorIds.map(id => {
                                                                    const evaluator = evaluators.find(e => e._id === id);
                                                                    if (!evaluator) return null;

                                                                    const isInternal = evaluator.role === 'InternalEvaluator';
                                                                    const initials = evaluator.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                                                                    return (
                                                                        <div key={id} className={`flex items-center pl-1 pr-2 py-1 rounded-full border shadow-sm transition-all ${isInternal ? 'bg-white border-blue-200 text-blue-800' : 'bg-white border-purple-200 text-purple-800'
                                                                            }`}>
                                                                            {/* Avatar Circle */}
                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-2 text-white shadow-sm ${isInternal ? 'bg-blue-500' : 'bg-purple-500'
                                                                                }`}>
                                                                                {initials}
                                                                            </div>

                                                                            <div className="flex flex-col mr-2">
                                                                                <span className="text-xs font-bold leading-tight">{evaluator.name}</span>
                                                                                <span className="text-[10px] opacity-70 leading-tight uppercase tracking-wider">
                                                                                    {isInternal ? 'Internal Eval' : 'Supervisor'}
                                                                                </span>
                                                                            </div>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newIds = formData.internalEvaluatorIds.filter(eid => eid !== id);
                                                                                    setFormData({ ...formData, internalEvaluatorIds: newIds });
                                                                                }}
                                                                                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
                                                                                title="Remove"
                                                                            >
                                                                                <X size={14} />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Selection Dropdown - Improved */}
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Plus size={16} className="text-indigo-500" />
                                                        </div>
                                                        <select
                                                            value=""
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    setFormData({
                                                                        ...formData,
                                                                        internalEvaluatorIds: [...formData.internalEvaluatorIds, e.target.value]
                                                                    });
                                                                }
                                                            }}
                                                            className="block w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-all hover:border-indigo-300 cursor-pointer appearance-none"
                                                        >
                                                            <option value="">Add an Evaluator to Panel...</option>
                                                            {evaluators
                                                                .filter(e =>
                                                                    (e.role === 'InternalEvaluator' || e.role === 'Supervisor') &&
                                                                    !formData.internalEvaluatorIds.includes(e._id)
                                                                )
                                                                .map(evaluator => (
                                                                    <option key={evaluator._id} value={evaluator._id}>
                                                                        {evaluator.name}  —  {evaluator.role}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                        {/* Custom Arrow */}
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        {/* External Evaluator - for Final Viva only */}
                                        {selectedEventType === 'Final Viva' && (
                                            <>
                                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <label className="block text-sm font-medium text-slate-700">
                                                            External Evaluator
                                                        </label>
                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id="isNewEvaluator"
                                                                checked={formData.isNewEvaluator || false}
                                                                onChange={(e) => setFormData({ ...formData, isNewEvaluator: e.target.checked })}
                                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                            />
                                                            <label htmlFor="isNewEvaluator" className="ml-2 text-xs text-slate-600 cursor-pointer select-none">
                                                                Invite New Evaluator
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {!formData.isNewEvaluator ? (
                                                        <select
                                                            value={formData.externalEvaluatorId}
                                                            onChange={(e) => setFormData({ ...formData, externalEvaluatorId: e.target.value })}
                                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                                        >
                                                            <option value="">Select Existing Evaluator</option>
                                                            {evaluators
                                                                .filter(e => e.role === 'ExternalEvaluator')
                                                                .map(evaluator => (
                                                                    <option key={evaluator._id} value={evaluator._id}>
                                                                        {evaluator.name} - {evaluator.email}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Evaluator Name"
                                                                    value={formData.newEvaluatorName || ''}
                                                                    onChange={(e) => setFormData({ ...formData, newEvaluatorName: e.target.value })}
                                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <input
                                                                    type="email"
                                                                    placeholder="Evaluator Email"
                                                                    value={formData.newEvaluatorEmail || ''}
                                                                    onChange={(e) => setFormData({ ...formData, newEvaluatorEmail: e.target.value })}
                                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-slate-500 mt-2 flex items-center">
                                                        <span className="mr-1">🔐</span>
                                                        {formData.isNewEvaluator
                                                            ? "A temporary account and magic link will be created for this user."
                                                            : "Magic link will be auto-generated for the selected evaluator."}
                                                    </p>
                                                </div>

                                                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                                    <h4 className="font-semibold text-indigo-900 mb-3 text-sm">Email Invitation Settings</h4>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Send On Behalf Of (Coordinator Email)</label>
                                                            <input
                                                                type="email"
                                                                value={formData.coordinatorEmail || ''}
                                                                onChange={(e) => setFormData({ ...formData, coordinatorEmail: e.target.value })}
                                                                className="w-full px-3 py-2 border border-indigo-200 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                                                                placeholder="Enter your email to receive replies..."
                                                            />
                                                            <p className="text-[10px] text-indigo-600 mt-1">Replies to the invitation will be sent to this address.</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Email Subject</label>
                                                            <input
                                                                type="text"
                                                                value={formData.emailSubject || 'Invitation to evaluate Final Viva'}
                                                                onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                                                                className="w-full px-3 py-2 border border-indigo-200 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                                                                placeholder="Subject line..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Custom Message</label>
                                                            <textarea
                                                                value={formData.emailMessage || ''}
                                                                onChange={(e) => setFormData({ ...formData, emailMessage: e.target.value })}
                                                                rows="3"
                                                                className="w-full px-3 py-2 border border-indigo-200 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                                                                placeholder="Add a personal note... (Magic Link is added automatically)"
                                                            ></textarea>
                                                        </div>
                                                    </div>

                                                    {/* Manual Resend Button */}
                                                    {isEditing && (
                                                        <div className="mt-4 pt-3 border-t border-indigo-100 flex justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    if (!confirm("Send invitation email now?")) return;
                                                                    try {
                                                                        const token = localStorage.getItem('token');
                                                                        await axios.post(`http://127.0.0.1:5000/api/schedules/${editId}/resend-invite`,
                                                                            {
                                                                                subject: formData.emailSubject,
                                                                                message: formData.emailMessage,
                                                                                coordinatorEmail: formData.coordinatorEmail,
                                                                                newEvaluatorEmail: formData.isNewEvaluator ? formData.newEvaluatorEmail : undefined,
                                                                                newEvaluatorName: formData.isNewEvaluator ? formData.newEvaluatorName : undefined,
                                                                                externalEvaluatorId: !formData.isNewEvaluator ? formData.externalEvaluatorId : undefined
                                                                            },
                                                                            { headers: { Authorization: `Bearer ${token}` } }
                                                                        );
                                                                        alert("Invitation Sent Successfully!");
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                        alert("Failed to send: " + (err.response?.data?.message || err.message));
                                                                    }
                                                                }}
                                                                className="text-xs bg-indigo-600 text-white px-3 py-2 rounded shadow hover:bg-indigo-700 transition"
                                                            >
                                                                📧 Resend Invitation Email Now
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}



                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                                            <textarea
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                rows="2"
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Additional information..."
                                            ></textarea>
                                        </div>
                                    </>
                                )}

                                <div className="flex space-x-3 pt-4 border-t border-slate-200">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                                    >
                                        {isEditing ? 'Update Schedule' : 'Create Schedule'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-6 bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form >
                        </div >
                    </div >
                )
            }

            {/* View Evaluation Modal */}
            {
                showEvalModal && viewEvaluation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Evaluation Feedback</h3>
                                    <p className="text-sm text-slate-500">Evaluator: {viewEvaluation.evaluatorName}</p>
                                </div>
                                <button
                                    onClick={() => setShowEvalModal(false)}
                                    className="text-slate-400 hover:text-slate-600 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Score Summary */}
                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div>
                                        <p className="text-sm text-blue-600 font-medium">Total Score</p>
                                        <h4 className="text-3xl font-bold text-blue-900">{viewEvaluation.totalScore}<span className="text-lg text-blue-400">/100</span></h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-blue-600 font-medium">Recommendation</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-1 ${viewEvaluation.recommendation === 'Excellent' || viewEvaluation.recommendation === 'Good' ? 'bg-green-200 text-green-800' :
                                            viewEvaluation.recommendation === 'Fail' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                                            }`}>
                                            {viewEvaluation.recommendation}
                                        </span>
                                    </div>
                                </div>

                                {/* Rubric Scores */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Rubric Breakdown</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                                            <span className="block text-xs text-slate-500">Technical</span>
                                            <strong className="text-slate-800">{viewEvaluation.scores?.technical}</strong>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                                            <span className="block text-xs text-slate-500">Implementation</span>
                                            <strong className="text-slate-800">{viewEvaluation.scores?.implementation}</strong>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                                            <span className="block text-xs text-slate-500">Presentation</span>
                                            <strong className="text-slate-800">{viewEvaluation.scores?.presentation}</strong>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                                            <span className="block text-xs text-slate-500">Documentation</span>
                                            <strong className="text-slate-800">{viewEvaluation.scores?.documentation}</strong>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                                            <span className="block text-xs text-slate-500">Innovation</span>
                                            <strong className="text-slate-800">{viewEvaluation.scores?.innovation}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Comments */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-700 mb-1">Strengths</h4>
                                        <p className="text-sm text-slate-600 bg-green-50 p-3 rounded-lg border border-green-100">
                                            {viewEvaluation.strengths || "No specific strengths noted."}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-700 mb-1">Weaknesses</h4>
                                        <p className="text-sm text-slate-600 bg-red-50 p-3 rounded-lg border border-red-100">
                                            {viewEvaluation.weaknesses || "No specific weaknesses noted."}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-700 mb-1">General Comments</h4>
                                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            {viewEvaluation.comments || "No general comments."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* End of Modals */}
        </div >
    );
};

export default Schedules;
