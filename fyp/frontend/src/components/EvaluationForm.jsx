import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Save, Send, AlertCircle, FileText, History, Info, Users, Download } from 'lucide-react';

const EvaluationForm = ({ assignment, onSubmit, onCancel }) => {
    const [activeTab, setActiveTab] = useState('evaluate');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [proposalData, setProposalData] = useState(null);
    const [historyData, setHistoryData] = useState([]);

    const [scheduleData, setScheduleData] = useState(null);

    // Form State
    const [scores, setScores] = useState({
        technical: 0,
        implementation: 0,
        presentation: 0,
        documentation: 0,
        innovation: 0
    });

    const [feedback, setFeedback] = useState({
        comments: '',
        strengths: '',
        weaknesses: '',
        suggestions: ''
    });

    const [recommendation, setRecommendation] = useState('');

    // Per-student scores: { [studentId]: { vivaScore: 0, contributionScore: 0, comments: '' } }
    const [studentScores, setStudentScores] = useState({});

    // Rubric definitions
    const rubrics = {
        technical: {
            label: 'Technical Feasibility', max: 30,
            criteria: ['Technical approach is sound', 'Technology stack appropriate', 'Challenges identified', 'Architecture quality']
        },
        implementation: {
            label: 'Implementation Quality', max: 25,
            criteria: ['Code quality', 'Feature completeness', 'Testing', 'Deployment readiness']
        },
        presentation: {
            label: 'Presentation', max: 20,
            criteria: ['Clarity', 'Organization', 'Q&A response', 'Time management']
        },
        documentation: {
            label: 'Documentation', max: 15,
            criteria: ['Completeness', 'Clarity', 'Diagrams/Models', 'Formatting']
        },
        innovation: {
            label: 'Innovation', max: 10,
            criteria: ['Novelty', 'Creativity', 'Value proposition', 'Differentiation']
        }
    };

    useEffect(() => {
        console.log('EvaluationForm mounted with assignment:', assignment);
        fetchDetails();
        // Initialize student scores
        if (assignment.students) {
            const initial = {};
            assignment.students.forEach(s => {
                initial[s._id] = { vivaScore: 0, contributionScore: 0, comments: '' };
            });
            setStudentScores(initial);
        }
    }, []);

    const fetchDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `/api/evaluator/assignments/${assignment._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setProposalData(res.data.proposal);
            setHistoryData(res.data.history || []);
            // Merge evaluation into scheduleData for UI access
            setScheduleData({
                ...res.data.schedule,
                evaluation: res.data.evaluation
            });

            // If existing evaluation found (draft or submitted), load it
            const existingEval = res.data.evaluation?.evaluators?.find(e => e.evaluator === res.data.user?._id); // We might need user ID check here, but backend filters assigned
            // Actually payload returns full evaluation object, we need to find OUR entry
            // Backend `getAssignmentDetails` returns `evaluation` with `evaluators` array.
            // Since we don't have user ID in easy scope without context, we rely on backend having verified us.
            // A better way is to check the `evaluators` array if we have the user ID from context. 
            // For now, let's assume we start fresh or load if backend passes it specific to us.
            // The backend returns the whole evaluation doc. We need to find our entry.
            // We'll rely on the user to re-enter or implemented "load draft" if `res.data.evaluation` exists.

            if (res.data.evaluation && res.data.evaluation.evaluators) {
                // We need strict user ID matching which we might not have in this component props. 
                // We will skip auto-fill for now to be safe, or we can assume the ONLY entry if it's 1-on-1 logic (but it's panel).
                // Ideally we pass `user` prop to this component.
            }

        } catch (error) {
            console.error('Error fetching details:', error);
        }
    };

    const handleScoreChange = (category, value) => {
        const numValue = parseInt(value) || 0;
        const maxValue = rubrics[category].max;
        if (numValue >= 0 && numValue <= maxValue) {
            setScores(prev => ({ ...prev, [category]: numValue }));
        }
    };

    const handleStudentScoreChange = (studentId, field, value) => {
        setStudentScores(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    const calculateTotal = () => Object.values(scores).reduce((sum, val) => sum + val, 0);

    const handleSubmit = async (isDraft = false) => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        const total = calculateTotal();

        // Validation for Final Submission
        if (!isDraft) {
            if (total === 0) {
                setMessage({ type: 'error', text: 'Please enter scores before submitting.' });
                setLoading(false);
                return;
            }
            if (!recommendation) {
                setMessage({ type: 'error', text: 'Please select a recommendation.' });
                setLoading(false);
                return;
            }
        }

        try {
            const token = localStorage.getItem('token');
            const studentScoresArray = Object.entries(studentScores).map(([student, data]) => ({
                student,
                ...data
            }));

            await axios.post(
                `/api/evaluator/assignments/${assignment._id}/evaluate`,
                {
                    scores: { ...scores, total },
                    comments: feedback.comments,
                    strengths: feedback.strengths,
                    weaknesses: feedback.weaknesses,
                    suggestions: feedback.suggestions,
                    recommendation,
                    studentScores: studentScoresArray,
                    isDraft
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage({
                type: 'success',
                text: isDraft ? 'Draft saved successfully!' : 'Evaluation submitted successfully!'
            });

            if (!isDraft) {
                setTimeout(onSubmit, 1500);
            } else {
                setLoading(false);
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Submission failed' });
            setLoading(false);
        }
    };

    // Use scheduleData if available (from detailed fetch), otherwise fallback to assignment prop
    const displayArtifacts = scheduleData?.artifacts || assignment.artifacts;
    const srsInfo = scheduleData?.srsDeliverable || assignment.srsDeliverable;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header / Nav */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex justify-between items-center">
                    <div>
                        <div className="flex items-center space-x-2 text-slate-300 mb-1">
                            <button onClick={onCancel} className="hover:text-white flex items-center transition-colors">
                                <ArrowLeft size={16} className="mr-1" /> Back
                            </button>
                            <span>/</span>
                            <span>Evaluation</span>
                        </div>
                        <h1 className="text-2xl font-bold">{assignment.evaluationType}</h1>
                        <p className="text-slate-400">{assignment.group?.groupCode}</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => handleSubmit(true)}
                            disabled={loading}
                            className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600"
                        >
                            <Save size={18} />
                            <span>Save Draft</span>
                        </button>
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={loading}
                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors font-bold shadow-lg"
                        >
                            <Send size={18} />
                            <span>Submit Final</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    {[
                        { id: 'evaluate', label: 'Evaluation Form', icon: FileText },
                        { id: 'info', label: 'Group Info & Artifacts', icon: Info },
                        { id: 'panel', label: 'Panel Reviews', icon: Users },
                        { id: 'history', label: 'Previous History', icon: History },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${activeTab === tab.id
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                                : 'border-transparent text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications */}
            {message.text && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                    <AlertCircle size={20} />
                    <span>{message.text}</span>
                </div>
            )}

            {/* TAB CONTENT: EVALUATE */}
            {activeTab === 'evaluate' && (
                <div className="space-y-6">
                    {/* Rubrics */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Rubric Grading</h2>
                        <div className="space-y-8">
                            {Object.entries(rubrics).map(([key, r]) => (
                                <div key={key}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <h3 className="font-semibold text-slate-700">{r.label}</h3>
                                            <p className="text-xs text-slate-500">Max: {r.max} pts</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number" min="0" max={r.max}
                                                value={scores[key]}
                                                onChange={(e) => handleScoreChange(key, e.target.value)}
                                                className="w-16 p-2 border rounded text-center font-bold"
                                            />
                                            <span className="text-slate-400">/ {r.max}</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range" min="0" max={r.max}
                                        value={scores[key]}
                                        onChange={(e) => handleScoreChange(key, e.target.value)}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-2">
                                        {r.criteria.map((c, i) => (
                                            <span key={i} className="bg-slate-100 px-2 py-1 rounded">âœ“ {c}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-4 border-t flex justify-between items-center">
                            <span className="text-xl font-bold text-slate-800">Total Group Score</span>
                            <span className="text-4xl font-bold text-indigo-600">{calculateTotal()} / 100</span>
                        </div>
                    </div>

                    {/* Student Individual Scores */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Individual Assessment</h2>
                        {assignment.students && assignment.students.length > 0 ? (
                            <div className="space-y-4">
                                {assignment.students.map(student => (
                                    <div key={student._id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="bg-indigo-100 p-2 rounded-full text-indigo-700">
                                                    <Users size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-700">{student.name}</div>
                                                    <div className="text-xs text-slate-500">{student.studentId}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 uppercase">Viva Score (0-10)</label>
                                                <input
                                                    type="number" min="0" max="10"
                                                    value={studentScores[student._id]?.vivaScore || 0}
                                                    onChange={(e) => handleStudentScoreChange(student._id, 'vivaScore', parseInt(e.target.value))}
                                                    className="w-full mt-1 p-2 border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 uppercase">Contribution (0-10)</label>
                                                <input
                                                    type="number" min="0" max="10"
                                                    value={studentScores[student._id]?.contributionScore || 0}
                                                    onChange={(e) => handleStudentScoreChange(student._id, 'contributionScore', parseInt(e.target.value))}
                                                    className="w-full mt-1 p-2 border rounded"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <input
                                                type="text" placeholder="Individual comments (optional)..."
                                                value={studentScores[student._id]?.comments || ''}
                                                onChange={(e) => handleStudentScoreChange(student._id, 'comments', e.target.value)}
                                                className="w-full p-2 border rounded text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">No students linked to this group.</p>
                        )}
                    </div>

                    {/* Feedback */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Feedback & Recommendation</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Strengths</label>
                                <textarea
                                    rows="3" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={feedback.strengths} onChange={e => setFeedback({ ...feedback, strengths: e.target.value })}
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Areas for Improvement</label>
                                <textarea
                                    rows="3" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={feedback.weaknesses} onChange={e => setFeedback({ ...feedback, weaknesses: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-1">General Comments</label>
                            <textarea
                                rows="3" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={feedback.comments} onChange={e => setFeedback({ ...feedback, comments: e.target.value })}
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Final Recommendation</label>
                            <div className="flex flex-wrap gap-2">
                                {['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Fail'].map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setRecommendation(opt)}
                                        className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all ${recommendation === opt
                                            ? 'bg-slate-800 text-white border-slate-800'
                                            : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: INFO */}
            {activeTab === 'info' && (
                <div className="space-y-6">
                    {proposalData ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">{proposalData.title}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase">Description</h4>
                                        <p className="text-slate-700 text-sm">{proposalData.description}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase">Objectives</h4>
                                        <p className="text-slate-700 text-sm whitespace-pre-wrap">{proposalData.objectives}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase">Scope</h4>
                                        <p className="text-slate-700 text-sm">{proposalData.scope}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase">Technologies</h4>
                                        <p className="text-slate-700 text-sm">{proposalData.technologies}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-slate-50 rounded-xl">
                            <p className="text-slate-500">Proposal details not available.</p>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Submitted Artifacts</h2>
                        <div className="space-y-3">
                            {/* SRS Document (Real) */}
                            {srsInfo && srsInfo.status === 'Approved' && (
                                <div className="flex items-center justify-between p-3 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-indigo-600 rounded text-white">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-indigo-900 block">SRS Document</span>
                                            <span className="text-xs text-indigo-700">Approved by Supervisor</span>
                                        </div>
                                    </div>
                                    <a
                                        href={srsInfo.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-700 font-medium hover:underline text-sm flex items-center"
                                    >
                                        <Download size={16} className="mr-1" /> View Document
                                    </a>
                                </div>
                            )}

                            {/* Real Artifacts Logic */}
                            {displayArtifacts && displayArtifacts.length > 0 ? (
                                displayArtifacts.map(artifact => (
                                    <div key={artifact._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                                        <div className="flex items-center space-x-3">
                                            {artifact.type === 'Report' && <FileText className="text-blue-500" />}
                                            {artifact.type === 'Presentation' && <FileText className="text-orange-500" />}
                                            {artifact.type === 'Code' && <Download className="text-green-500" />}
                                            {artifact.type === 'Other' && <FileText className="text-slate-500" />}
                                            <div>
                                                <span className="font-medium text-slate-700 block">{artifact.name}</span>
                                                <span className="text-xs text-slate-400 capitalize">{artifact.type}</span>
                                            </div>
                                        </div>
                                        <a href={artifact.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm">Download/View</a>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 italic text-center py-2">No additional artifacts uploaded.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: HISTORY */}
            {activeTab === 'history' && (
                <div className="space-y-6">
                    {historyData.length > 0 ? (
                        historyData.map((hist) => (
                            <div key={hist._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{hist.evaluationType}</h3>
                                        <p className="text-sm text-slate-500">{new Date(hist.evaluationDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-indigo-600">{hist.finalGrade}</div>
                                        <div className="text-xs text-slate-500">{hist.averageScore}% Avg</div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700">
                                    <p className="italic">"Feedback content would appear here if user has permission to view detailed history comments."</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                            <History className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500">No previous evaluation history found.</p>
                        </div>
                    )}
                </div>
            )}
            {/* TAB CONTENT: PANEL REVIEWS */}
            {activeTab === 'panel' && (
                <div className="space-y-6">
                    {scheduleData?.evaluation?.evaluators?.length > 0 ? (
                        scheduleData.evaluation.evaluators
                            // Filter out current user's evaluation if needed, or show all
                            // .filter(e => e.evaluator !== currentUser._id) // We don't have currentUser._id easily here without prop/decoding token
                            // For now show all, users can see their own submitted feedback too which is fine.
                            .map((evalItem, index) => (
                                <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                    <div className="flex justify-between items-start mb-4 border-b pb-4">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-bold text-lg text-slate-800">
                                                    {evalItem.role === 'External' ? 'External Evaluator' : 'Internal Evaluator'}
                                                </h3>
                                                {evalItem.role === 'External' && (
                                                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-bold">External</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                Submitted: {new Date(evalItem.submittedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-indigo-600">{evalItem.scores?.total} / 100</div>
                                            <div className="text-xs text-slate-500 font-medium">{evalItem.recommendation}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-700 mb-2">Detailed Scores</h4>
                                            <ul className="text-sm text-slate-600 space-y-1">
                                                <li className="flex justify-between"><span>Technical:</span> <span>{evalItem.scores?.technical}</span></li>
                                                <li className="flex justify-between"><span>Implementation:</span> <span>{evalItem.scores?.implementation}</span></li>
                                                <li className="flex justify-between"><span>Presentation:</span> <span>{evalItem.scores?.presentation}</span></li>
                                                <li className="flex justify-between"><span>Documentation:</span> <span>{evalItem.scores?.documentation}</span></li>
                                                <li className="flex justify-between"><span>Innovation:</span> <span>{evalItem.scores?.innovation}</span></li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-700 mb-2">Feedback</h4>
                                            <div className="space-y-2 text-sm">
                                                {evalItem.strengths && (
                                                    <div><span className="font-semibold text-green-600">Strengths:</span> {evalItem.strengths}</div>
                                                )}
                                                {evalItem.weaknesses && (
                                                    <div><span className="font-semibold text-red-600">Weaknesses:</span> {evalItem.weaknesses}</div>
                                                )}
                                                {evalItem.comments && (
                                                    <div className="bg-slate-50 p-3 rounded italic">"{evalItem.comments}"</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                    ) : (
                        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                            <Users className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500">No other evaluations submitted yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EvaluationForm;
