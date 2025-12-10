import { useState } from 'react';
import axios from 'axios';
import { Users, Plus, Trash2, Check, AlertCircle, UserCheck } from 'lucide-react';

const GroupCreation = () => {
    const [members, setMembers] = useState([{ studentId: '', verified: false, name: '', id: '' }]);
    const [supervisor, setSupervisor] = useState({ registrationId: '', verified: false, name: '', id: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddMember = () => {
        if (members.length < 3) {
            setMembers([...members, { studentId: '', verified: false, name: '', id: '' }]);
        }
    };

    const handleRemoveMember = (index) => {
        const newMembers = [...members];
        newMembers.splice(index, 1);
        setMembers(newMembers);
    };

    const handleChange = (index, value) => {
        const newMembers = [...members];
        newMembers[index].studentId = value;
        newMembers[index].verified = false;
        setMembers(newMembers);
    };

    const handleSupervisorChange = (value) => {
        setSupervisor({ ...supervisor, registrationId: value, verified: false });
    };

    const verifyMember = async (index) => {
        try {
            setError('');
            const studentId = members[index].studentId;
            const token = localStorage.getItem('token');
            const res = await axios.post('http://127.0.0.1:5000/api/groups/verify-member',
                { studentId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const newMembers = [...members];
            newMembers[index].verified = true;
            newMembers[index].name = res.data.user.name;
            newMembers[index].id = res.data.user._id;
            setMembers(newMembers);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        }
    };

    const verifySupervisor = async () => {
        try {
            setError('');
            const token = localStorage.getItem('token');
            const res = await axios.post('http://127.0.0.1:5000/api/groups/verify-supervisor',
                { registrationId: supervisor.registrationId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSupervisor({
                ...supervisor,
                verified: true,
                name: res.data.supervisor.name,
                id: res.data.supervisor._id
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Supervisor verification failed');
        }
    };

    const createGroup = async () => {
        try {
            setError('');
            setSuccess('');
            setLoading(true);

            if (members.some(m => !m.verified)) {
                setError('All members must be verified first.');
                setLoading(false);
                return;
            }

            if (!supervisor.verified) {
                setError('Supervisor must be verified first.');
                setLoading(false);
                return;
            }

            const memberIds = members.map(m => m.id);
            const token = localStorage.getItem('token');

            const res = await axios.post('http://127.0.0.1:5000/api/groups',
                { memberIds, supervisorId: supervisor.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess(`Group created successfully! Waiting for supervisor approval from ${supervisor.name}.`);
            console.log(res.data);

            // Reset form
            setMembers([{ studentId: '', verified: false, name: '', id: '' }]);
            setSupervisor({ registrationId: '', verified: false, name: '', id: '' });
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Group creation failed');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <Users className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Form Your Group</h2>
                        <p className="text-sm text-slate-500">Add up to 3 members and select your supervisor.</p>
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

                    {/* Members Section */}
                    <div className="space-y-6 mb-8">
                        <h3 className="text-lg font-semibold text-slate-700">Group Members</h3>
                        {members.map((member, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200 transition-all hover:shadow-md">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-700">Member {index + 1}</label>
                                    {index > 0 && (
                                        <button
                                            onClick={() => handleRemoveMember(index)}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={member.studentId}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Enter Student ID (e.g. S12345)"
                                    />
                                    <button
                                        onClick={() => verifyMember(index)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${member.verified
                                            ? 'bg-green-100 text-green-700 cursor-default'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                                            }`}
                                        disabled={member.verified}
                                    >
                                        {member.verified ? <Check size={18} /> : <span>Verify</span>}
                                    </button>
                                </div>
                                {member.verified && (
                                    <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                                        <Check size={14} />
                                        <span>Verified: <strong>{member.name}</strong></span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add Member Button */}
                    {members.length < 3 && (
                        <button
                            onClick={handleAddMember}
                            className="mb-8 flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                            <Plus size={18} />
                            <span>Add another member</span>
                        </button>
                    )}

                    {/* Supervisor Section */}
                    <div className="border-t border-slate-200 pt-8">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4">Select Supervisor</h3>
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={supervisor.registrationId}
                                    onChange={(e) => handleSupervisorChange(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter Supervisor Registration ID"
                                />
                                <button
                                    onClick={verifySupervisor}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${supervisor.verified
                                        ? 'bg-green-100 text-green-700 cursor-default'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20'
                                        }`}
                                    disabled={supervisor.verified}
                                >
                                    {supervisor.verified ? (
                                        <>
                                            <UserCheck size={18} />
                                            <span>Verified</span>
                                        </>
                                    ) : (
                                        <span>Verify Supervisor</span>
                                    )}
                                </button>
                            </div>
                            {supervisor.verified && (
                                <div className="mt-3 flex items-center space-x-2 text-sm text-green-600">
                                    <UserCheck size={14} />
                                    <span>Supervisor: <strong>{supervisor.name}</strong></span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Create Group Button */}
                    <div className="mt-8">
                        <button
                            onClick={createGroup}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Group...' : 'Create Group'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupCreation;
