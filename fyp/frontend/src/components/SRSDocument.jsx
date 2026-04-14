import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Upload, CheckCircle, Clock, Trash2, Layers, Send, AlertTriangle, BookOpen } from 'lucide-react';

const DeliverablesDashboard = ({ view = 'Interim' }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [interimSchedule, setInterimSchedule] = useState(null);
    const [midTermSchedule, setMidTermSchedule] = useState(null);
    const [finalSchedule, setFinalSchedule] = useState(null);
    const [srsFile, setSrsFile] = useState(null);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            const baseUrl = 'http://127.0.0.1:5000';
            const config = { headers: { Authorization: `Bearer ${token}` } };

            try {
                const { data: schedules } = await axios.get(`${baseUrl}/api/schedules`, config);

                // Helper to find relevant schedule
                const findRelevant = (type) => {
                    if (user.role === 'Student') {
                        // Prioritize Active (Scheduled/Open) over Completed
                        const active = schedules.filter(s => s.eventType === type && s.status !== 'Completed' && s.status !== 'Cancelled');
                        if (active.length > 0) return active[0];
                        // Fallback to completed if no active one exists
                        return schedules.find(s => s.eventType === type);
                    }
                    return null;
                };

                if (user.role === 'Student') {
                    setInterimSchedule(findRelevant('Interim Evaluation I'));
                    setMidTermSchedule(findRelevant('Mid-Term Evaluation II'));
                    setFinalSchedule(findRelevant('Final Viva'));
                } else {
                    setInterimSchedule(schedules); // Supervisor/Evaluator gets all
                }

            } catch (error) {
                console.error("Error fetching schedules", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.role]);

    // --- ACTIONS ---
    const reload = () => window.location.reload();

    const uploadSRS = async () => {
        if (!srsFile || !interimSchedule) return;
        const formData = new FormData();
        formData.append('file', srsFile);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/api/schedules/${interimSchedule._id}/srs/upload`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            alert("SRS Document Submitted!");
            reload();
        } catch (e) { alert(e.response?.data?.message || e.message); }
    };

    const deleteSRS = async () => {
        if (!confirm("Delete SRS?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://127.0.0.1:5000/api/schedules/${interimSchedule._id}/srs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            reload();
        } catch (e) { alert(e.response?.data?.message || e.message); }
    };

    const uploadArtifact = async (file, type, scheduleId) => {
        if (!confirm(`Upload ${type}?`)) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', `${type}: ${file.name}`);
        formData.append('type', type);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/api/schedules/${scheduleId}/artifacts`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            reload();
        } catch (e) { alert(e.response?.data?.message || e.message); }
    };

    const deleteArtifact = async (artifactId, scheduleId) => {
        if (!confirm("Delete artifact?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://127.0.0.1:5000/api/schedules/${scheduleId}/artifacts/${artifactId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            reload();
        } catch (e) { alert(e.response?.data?.message || e.message); }
    };

    const submitDeliverableHandler = async (scheduleId, eventType) => {
        const msg = eventType === 'Final Viva'
            ? "Submit Final Viva deliverables to External Evaluator? This cannot be undone."
            : "Submit Mid-Term deliverables for review?";

        if (!confirm(msg)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/api/schedules/${scheduleId}/deliverable/submit`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Submitted Successfully!");
            reload();
        } catch (e) { alert(e.response?.data?.message || e.message); }
    };

    const handleReview = async (scheduleId, status, comments) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://127.0.0.1:5000/api/schedules/${scheduleId}/srs/review`,
                { status, comments },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Review Submitted");
            reload();
        } catch (e) { alert(e.response?.data?.message || e.message); }
    };


    // --- RENDERERS ---

    const renderSRSSection = (schedule) => {
        if (!schedule) return (
            <div data-testid="srs-no-schedule-msg" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 text-center text-slate-500 font-medium">
                <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-3" />
                No active schedule mapped for Interim Evaluation I. Upload window is currently unavailable.
            </div>
        );

        const status = schedule.srsDeliverable?.status || 'Open';
        const isSubmitted = status === 'Submitted' || status === 'Approved' || status === 'Changes Requested';
        const fileUrl = schedule.srsDeliverable?.fileUrl;

        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                        <FileText className="text-indigo-600" size={24} />
                        <h3 className="text-lg font-bold text-slate-800">SRS Document (Interim Evaluation I)</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${status === 'Approved' ? 'bg-green-100 text-green-700' :
                        status === 'Changes Requested' ? 'bg-red-100 text-red-700' :
                            status === 'Submitted' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {status}
                    </span>
                </div>

                {!isSubmitted ? (
                    <div className="border-2 border-dashed border-indigo-200 bg-indigo-50 rounded-lg p-8 text-center">
                        <Upload size={40} className="mx-auto text-indigo-400 mb-3" />
                        <p className="text-indigo-800 font-medium mb-4">Upload your SRS Document (PDF/DOC)</p>
                        <input type="file" accept=".pdf,.doc,.docx" data-testid="srs-file-input" onChange={(e) => setSrsFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mx-auto max-w-xs" />
                        <button onClick={uploadSRS} data-testid="srs-submit-button" disabled={!srsFile} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                            Submit SRS
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between border border-slate-200">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="text-green-500" />
                                <div>
                                    <p className="font-bold text-slate-700">Document Submitted</p>
                                    <a href={fileUrl} target="_blank" className="text-sm text-indigo-600 hover:underline">View Document</a>
                                </div>
                            </div>
                            {status === 'Changes Requested' && (
                                <div className="text-red-600 text-sm max-w-md mx-4 bg-red-50 p-2 rounded">
                                    <strong>Feedback:</strong> {schedule.srsDeliverable?.supervisorComments}
                                </div>
                            )}
                            {status !== 'Approved' && (
                                <button onClick={deleteSRS} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                            )}
                        </div>

                        {/* --- ARTIFACTS FOR INTERIM (Available after Approval) --- */}
                        {status === 'Approved' && (
                            <div className="border-t border-slate-100 pt-4 mt-4">
                                <h4 className="font-bold text-slate-700 mb-3 flex items-center">
                                    <Layers size={16} className="mr-2" /> Supplementary Artifacts
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {['Report', 'Presentation', 'Code'].map(type => {
                                        const existing = schedule.artifacts?.find(a => a.type === type);
                                        if (existing) {
                                            return (
                                                <div key={type} className="flex items-center justify-between bg-green-50 p-3 rounded border border-green-100">
                                                    <span className="text-green-800 text-sm font-medium">{type}</span>
                                                    <div className="flex space-x-2">
                                                        <a href={existing.fileUrl} target="_blank" className="text-indigo-600 text-xs hover:underline">View</a>
                                                        <button onClick={() => deleteArtifact(existing._id, schedule._id)} className="text-red-500"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={type} className="border border-slate-200 rounded p-3 text-center hover:bg-slate-50">
                                                <p className="text-xs font-bold text-slate-600 mb-2">{type}</p>
                                                <label className="cursor-pointer bg-indigo-50 text-indigo-700 px-3 py-1 rounded text-xs hover:bg-indigo-100">
                                                    Upload
                                                    <input type="file" className="hidden" onChange={(e) => uploadArtifact(e.target.files[0], type, schedule._id)} />
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderMidTermSection = (schedule) => {
        if (!schedule) return null;

        const status = schedule.srsDeliverable?.status || 'Open';
        const isApproving = status === 'Submitted';
        const isLocked = status === 'Approved';

        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                        <Layers className="text-teal-600" size={24} />
                        <h3 className="text-lg font-bold text-slate-800">Mid-Term Deliverables (Mid-Term Evaluation II)</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${status === 'Approved' ? 'bg-green-100 text-green-700' :
                        status === 'Submitted' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {status === 'Open' ? 'Pending Uploads' : status}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Presentation Slot */}
                    <div className="border border-slate-200 rounded-lg p-4">
                        <h4 className="font-bold text-slate-700 mb-3">Presentation Slides</h4>
                        {schedule.artifacts?.find(a => a.type === 'Presentation') ? (
                            <div className="flex items-center justify-between bg-green-50 p-3 rounded border border-green-100">
                                <span className="text-green-800 text-sm truncate max-w-[150px]">{schedule.artifacts.find(a => a.type === 'Presentation').name}</span>
                                <div className="flex space-x-2">
                                    <a href={schedule.artifacts.find(a => a.type === 'Presentation').fileUrl} target="_blank" className="text-indigo-600 text-xs">View</a>
                                    {!isLocked && <button onClick={() => deleteArtifact(schedule.artifacts.find(a => a.type === 'Presentation')._id, schedule._id)} className="text-red-500"><Trash2 size={14} /></button>}
                                </div>
                            </div>
                        ) : (
                            !isLocked && (
                                <label className="block w-full p-2 border-2 border-dashed border-slate-300 rounded text-center cursor-pointer hover:bg-slate-50">
                                    <span className="text-sm text-slate-500">Upload PPT</span>
                                    <input type="file" className="hidden" onChange={(e) => uploadArtifact(e.target.files[0], 'Presentation', schedule._id)} />
                                </label>
                            )
                        )}
                    </div>

                    {/* Code Slot */}
                    <div className="border border-slate-200 rounded-lg p-4">
                        <h4 className="font-bold text-slate-700 mb-3">Source Code</h4>
                        {schedule.artifacts?.find(a => a.type === 'Code') ? (
                            <div className="flex items-center justify-between bg-green-50 p-3 rounded border border-green-100">
                                <span className="text-green-800 text-sm truncate max-w-[150px]">{schedule.artifacts.find(a => a.type === 'Code').name}</span>
                                <div className="flex space-x-2">
                                    <a href={schedule.artifacts.find(a => a.type === 'Code').fileUrl} target="_blank" className="text-indigo-600 text-xs">Download</a>
                                    {!isLocked && <button onClick={() => deleteArtifact(schedule.artifacts.find(a => a.type === 'Code')._id, schedule._id)} className="text-red-500"><Trash2 size={14} /></button>}
                                </div>
                            </div>
                        ) : (
                            !isLocked && (
                                <label className="block w-full p-2 border-2 border-dashed border-slate-300 rounded text-center cursor-pointer hover:bg-slate-50">
                                    <span className="text-sm text-slate-500">Upload Zip</span>
                                    <input type="file" className="hidden" onChange={(e) => uploadArtifact(e.target.files[0], 'Code', schedule._id)} />
                                </label>
                            )
                        )}
                    </div>
                </div>

                {/* Submit Action */}
                {!isLocked && status !== 'Submitted' && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => submitDeliverableHandler(schedule._id, 'Mid-Term Evaluation II')}
                            data-testid="mid-term-submit-button"
                            disabled={!schedule.artifacts?.some(a => a.type === 'Presentation') || !schedule.artifacts?.some(a => a.type === 'Code')}
                            className="bg-teal-600 text-white px-8 py-3 rounded-lg font-bold shadow hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                        >
                            <Send size={18} className="mr-2" /> Submit Mid-Term for Review
                        </button>
                    </div>
                )}
                {status === 'Submitted' && (
                    <div className="mt-4 text-center text-slate-500 italic">
                        Awaiting Supervisor Approval...
                    </div>
                )}
            </div>
        )
    };

    const renderFinalReportSection = (schedule) => {
        if (!schedule) return null;

        const requiredDocs = [
            { label: 'Project Report (PDF)', type: 'Report', accept: '.pdf' },
            { label: 'SRS Document (PDF)', type: 'SRS', accept: '.pdf' },
            { label: 'SDS Document (PDF)', type: 'SDS', accept: '.pdf' },
            { label: 'Source Code (ZIP)', type: 'Code', accept: '.zip,.rar,.tar' },
            { label: 'Plagiarism Report (PDF)', type: 'Plagiarism', accept: '.pdf' },
            { label: 'Final Viva Slides (PPT/PDF)', type: 'Presentation', accept: '.ppt,.pptx,.pdf' }
        ];

        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                        <BookOpen className="text-purple-600" size={24} />
                        <h3 className="text-lg font-bold text-slate-800">Final Viva Deliverables</h3>
                    </div>
                    <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs font-bold">
                        {new Date(schedule.eventDate).toLocaleDateString()}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredDocs.map((doc) => {
                        const uploaded = schedule.artifacts?.find(a => a.type === doc.type);

                        // Handler for direct upload from this view
                        const handleDirectUpload = async (e, type) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            await uploadArtifact(file, type, schedule._id);
                        };

                        return (
                            <div key={doc.type} className={`p-4 rounded-lg border ${uploaded ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-slate-700">{doc.label}</h3>
                                    {uploaded ? (
                                        <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded flex items-center">
                                            <CheckCircle size={12} className="mr-1" /> Uploaded
                                        </span>
                                    ) : (
                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Required</span>
                                    )}
                                </div>

                                {uploaded ? (
                                    <div className="text-sm text-slate-600">
                                        <p className="truncate w-full mb-2">{uploaded.name}</p>
                                        <div className="flex space-x-3">
                                            <a
                                                href={uploaded.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:underline text-xs"
                                            >
                                                View Document
                                            </a>
                                            <button
                                                onClick={() => deleteArtifact(uploaded._id, schedule._id)}
                                                className="text-red-500 hover:text-red-700 text-xs flex items-center"
                                            >
                                                <Trash2 size={12} className="mr-1" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-2">
                                        <label className="block w-full cursor-pointer">
                                            <input
                                                type="file"
                                                accept={doc.accept}
                                                onChange={(e) => handleDirectUpload(e, doc.type)}
                                                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Submit Logic */}
                <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                    {schedule.srsDeliverable?.status === 'Submitted' ? (
                        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg inline-block">
                            <h4 className="font-bold flex items-center justify-center">
                                <CheckCircle size={20} className="mr-2" />
                                Submitted to External Evaluator
                            </h4>
                            <p className="text-sm mt-1">Your deliverables have been sent.</p>
                        </div>
                    ) : (
                        <button
                            onClick={() => submitDeliverableHandler(schedule._id, 'Final Viva')}
                            data-testid="final-submit-button"
                            disabled={!requiredDocs.every(d => schedule.artifacts?.some(a => a.type === d.type))}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                        >
                            Submit Final Deliverables
                        </button>
                    )}
                    {!requiredDocs.every(d => schedule.artifacts?.some(a => a.type === d.type)) && schedule.srsDeliverable?.status !== 'Submitted' && (
                        <p className="text-red-500 text-sm mt-2">Please upload all required documents to enable submission.</p>
                    )}
                </div>
            </div>
        );
    };

    const renderSupervisorView = () => {
        // Filter Pending Reviews
        const pending = interimSchedule?.filter(s => {
            const isRelevant = ['Interim Evaluation I', 'Mid-Term Evaluation II'].includes(s.eventType);
            const hasSubmission = s.srsDeliverable && s.srsDeliverable.status === 'Submitted';
            const isMyGroup = s.supervisor && (s.supervisor._id === user._id || s.supervisor === user._id);
            return isRelevant && hasSubmission && isMyGroup && !s.srsDeliverable.supervisorApproved;
        }) || [];

        if (pending.length === 0) return <div className="p-12 text-center text-slate-500 bg-white rounded-xl border">No pending reviews.</div>;

        return (
            <div className="space-y-4">
                {pending.map(s => (
                    <div key={s._id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between font-bold text-slate-800 mb-2">
                            <span>{s.group?.groupCode}</span>
                            <span className="text-teal-600">{s.eventType}</span>
                        </div>

                        {/* Content */}
                        {s.eventType === 'Interim Evaluation I' && (
                            <div className="mb-4 space-y-2">
                                <a href={s.srsDeliverable?.fileUrl} target="_blank" className="text-indigo-600 hover:underline flex items-center">
                                    <FileText size={16} className="mr-2" /> View SRS Document
                                </a>
                                {s.artifacts?.length > 0 && (
                                    <div className="flex gap-2">
                                        <span className="text-xs font-bold text-slate-500">Artifacts:</span>
                                        {s.artifacts.map(a => (
                                            <a key={a._id} href={a.fileUrl} target="_blank" className="px-2 py-0.5 bg-slate-100 border rounded text-xs text-slate-600">{a.name}</a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {s.eventType === 'Mid-Term Evaluation II' && (
                            <div className="flex gap-2 mb-4">
                                {s.artifacts?.map(a => (
                                    <a key={a._id} href={a.fileUrl} target="_blank" className="px-3 py-1 bg-slate-100 rounded text-sm text-slate-700 hover:bg-slate-200 border">
                                        {a.name}
                                    </a>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button onClick={() => {
                                const c = prompt("Comments for revisions:");
                                if (c) handleReview(s._id, 'Changes Requested', c);
                            }} className="text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-50">Request Changes</button>

                            <button onClick={() => confirm("Approve?") && handleReview(s._id, 'Approved', 'Approved')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Approve</button>
                        </div>
                    </div>
                ))}
            </div>
        )
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 rounded-xl shadow-lg text-white">
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                    <Layers size={28} />
                    <span>Project Deliverables</span>
                </h1>
                <p className="opacity-90">Manage SRS and Mid-Term submissions.</p>
            </div>

            {user.role === 'Student' ? (
                <>
                    {/* Only show sections based requested VIEW props */}
                    {view === 'Interim' && (interimSchedule ? renderSRSSection(interimSchedule) : <div className="text-slate-400 p-4 text-center">Interim Evaluation not scheduled.</div>)}

                    {view === 'MidTerm' && (midTermSchedule ? renderMidTermSection(midTermSchedule) : <div className="text-slate-400 p-4 text-center">Mid-Term Evaluation not scheduled.</div>)}

                    {view === 'FinalReport' && (finalSchedule ? renderFinalReportSection(finalSchedule) : <div className="text-slate-400 p-4 text-center">Final Viva not scheduled.</div>)}
                </>
            ) : (
                renderSupervisorView()
            )}
        </div>
    );
};

export default DeliverablesDashboard;
