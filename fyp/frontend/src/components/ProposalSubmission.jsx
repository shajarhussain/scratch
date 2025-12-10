import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Upload, User, AlignLeft, Hash, Check, AlertCircle } from 'lucide-react';

const ProposalSubmission = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        supervisorId: '',
        groupId: ''
    });
    const [file, setFile] = useState(null);
    const [supervisors, setSupervisors] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                // Fetch Supervisors
                const supRes = await axios.get('http://127.0.0.1:5000/api/users/supervisors');
                setSupervisors(supRes.data);

                // Fetch User's Group (Auto-fill Group ID)
                try {
                    const groupRes = await axios.get('http://127.0.0.1:5000/api/groups/my-group', config);
                    if (groupRes.data && groupRes.data._id) {
                        setFormData(prev => ({
                            ...prev,
                            groupId: groupRes.data._id,
                            supervisorId: groupRes.data.supervisorRequest?._id || '' // Auto-select supervisor too!
                        }));
                    }
                } catch (groupErr) {
                    console.log('User not in a group or error fetching group', groupErr);
                }

            } catch (err) {
                console.error('Failed to fetch data', err);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.groupId) {
            setError('Please enter a Group ID (Simulating logged-in group)');
            return;
        }

        const data = new FormData();
        data.append('groupId', formData.groupId);
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('supervisorId', formData.supervisorId);
        if (file) {
            data.append('file', file);
        }

        try {
            const res = await axios.post('http://127.0.0.1:5000/api/proposals', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSuccess('Proposal submitted successfully!');
            console.log(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed');
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                        <FileText className="text-indigo-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Submit Project Proposal</h2>
                        <p className="text-sm text-slate-500">Outline your project idea and assign a supervisor.</p>
                    </div>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-center space-x-2">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded flex items-center space-x-2">
                            <Check size={20} />
                            <span>{success}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Group ID</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    name="groupId"
                                    value={formData.groupId}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-slate-100 cursor-not-allowed"
                                    placeholder="Fetching your Group ID..."
                                    readOnly
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Automatically detected from your group membership.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Project Title</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. AI-Powered Traffic Management"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                            <div className="relative">
                                <AlignLeft className="absolute left-3 top-3 text-slate-400" size={18} />
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Describe the problem, solution, and technologies..."
                                    required
                                ></textarea>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Proposal Document</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all border border-slate-300 rounded-lg"
                                        accept=".pdf,.doc,.docx,.zip,.rar"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Select Supervisor</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        name="supervisorId"
                                        value={formData.supervisorId}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                        required
                                    >
                                        <option value="">-- Select Supervisor --</option>
                                        {supervisors.map((sup) => (
                                            <option key={sup._id} value={sup._id}>
                                                {sup.name} ({sup.department})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center space-x-2"
                        >
                            <Upload size={20} />
                            <span>Submit Proposal</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProposalSubmission;
