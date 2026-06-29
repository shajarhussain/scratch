import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Shield, GraduationCap, Calendar, FileText, BarChart3, UserPlus, Trash2, Edit } from 'lucide-react';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [studentForm, setStudentForm] = useState({
        name: '',
        email: '',
        password: '',
        studentId: '',
        department: ''
    });

    const [staffForm, setStaffForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Coordinator',
        registrationNumber: '',
        department: '',
        affiliation: ''
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (activeTab === 'overview') {
            fetchStats();
        } else if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const { data } = await axios.get('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const { data } = await axios.post(
                '/api/admin/users',
                { ...studentForm, role: 'Student' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(data.message || 'Student created successfully');
            setStudentForm({ name: '', email: '', password: '', studentId: '', department: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create student');
        } finally {
            setLoading(false);
        }
    };

    const handleStaffSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const { data } = await axios.post(
                '/api/admin/users',
                staffForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(data.message || 'Staff created successfully');
            setStaffForm({
                name: '',
                email: '',
                password: '',
                role: 'Coordinator',
                registrationNumber: '',
                department: '',
                affiliation: ''
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create staff');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await axios.delete(`/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('User deleted successfully');
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete user');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Admin Dashboard</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e5e7eb' }}>
                {['overview', 'users', 'register-student', 'register-staff'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: activeTab === tab ? '#3b82f6' : 'transparent',
                            color: activeTab === tab ? 'white' : '#374151',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab === 'overview' && 'System Overview'}
                        {tab === 'users' && 'All Users'}
                        {tab === 'register-student' && 'Register Student'}
                        {tab === 'register-staff' && 'Register Staff'}
                    </button>
                ))}
            </div>

            {message && (
                <div style={{
                    padding: '12px',
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    color: '#155724',
                    marginBottom: '20px'
                }}>
                    {message}
                </div>
            )}

            {error && (
                <div style={{
                    padding: '12px',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    color: '#721c24',
                    marginBottom: '20px'
                }}>
                    {error}
                </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <StatCard icon={<Users size={32} />} label="Total Users" value={stats.totalUsers} color="#3b82f6" />
                    <StatCard icon={<GraduationCap size={32} />} label="Students" value={stats.totalStudents} color="#10b981" />
                    <StatCard icon={<Shield size={32} />} label="Supervisors" value={stats.totalSupervisors} color="#f59e0b" />
                    <StatCard icon={<Users size={32} />} label="Coordinators" value={stats.totalCoordinators} color="#8b5cf6" />
                    <StatCard icon={<Users size={32} />} label="Groups" value={stats.totalGroups} color="#ec4899" />
                    <StatCard icon={<FileText size={32} />} label="Total Proposals" value={stats.totalProposals} color="#14b8a6" />
                    <StatCard icon={<Calendar size={32} />} label="Approved Proposals" value={stats.approvedProposals} color="#22c55e" />
                    <StatCard icon={<Calendar size={32} />} label="Pending Proposals" value={stats.pendingProposals} color="#f97316" />
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f3f4f6' }}>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Email</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Role</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Student ID / Reg No</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Department</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '12px' }}>{user.name}</td>
                                    <td style={{ padding: '12px' }}>{user.email}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            backgroundColor: getRoleColor(user.role),
                                            color: 'white',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>{user.studentId || user.registrationNumber || '-'}</td>
                                    <td style={{ padding: '12px' }}>{user.department || '-'}</td>
                                    <td style={{ padding: '12px' }}>
                                        <button
                                            onClick={() => handleDeleteUser(user._id)}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Register Student Tab */}
            {activeTab === 'register-student' && (
                <div style={{ maxWidth: '600px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: '600' }}>Register New Student</h2>
                    <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <FormField
                            label="Full Name"
                            type="text"
                            value={studentForm.name}
                            onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                            required
                        />
                        <FormField
                            label="Email"
                            type="email"
                            value={studentForm.email}
                            onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                            required
                        />
                        <FormField
                            label="Password"
                            type="password"
                            value={studentForm.password}
                            onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                            required
                        />
                        <FormField
                            label="Student ID / Enrollment Number"
                            type="text"
                            value={studentForm.studentId}
                            onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                            required
                            placeholder="e.g., S1001"
                        />
                        <FormField
                            label="Department"
                            type="text"
                            value={studentForm.department}
                            onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                            required
                            placeholder="e.g., CS, SE"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '12px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: '500',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                marginTop: '10px'
                            }}
                        >
                            {loading ? 'Creating...' : 'Create Student'}
                        </button>
                    </form>
                </div>
            )}

            {/* Register Staff Tab */}
            {activeTab === 'register-staff' && (
                <div style={{ maxWidth: '600px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: '600' }}>Register New Staff</h2>
                    <form onSubmit={handleStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Role</label>
                            <select
                                value={staffForm.role}
                                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="Coordinator">Coordinator</option>
                                <option value="HOD">Head of Department</option>
                                <option value="Supervisor">Supervisor</option>
                                <option value="InternalEvaluator">Internal Evaluator</option>
                                <option value="ExternalEvaluator">External Evaluator</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <FormField
                            label="Full Name"
                            type="text"
                            value={staffForm.name}
                            onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                            required
                        />
                        <FormField
                            label="Email"
                            type="email"
                            value={staffForm.email}
                            onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                            required
                        />
                        <FormField
                            label="Password"
                            type="password"
                            value={staffForm.password}
                            onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                            required
                        />
                        <FormField
                            label="Registration Number"
                            type="text"
                            value={staffForm.registrationNumber}
                            onChange={(e) => setStaffForm({ ...staffForm, registrationNumber: e.target.value })}
                            required
                            placeholder="e.g., REG12345"
                        />
                        <FormField
                            label="Department"
                            type="text"
                            value={staffForm.department}
                            onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                            placeholder="e.g., CS, SE (optional)"
                        />
                        <FormField
                            label="Affiliation"
                            type="text"
                            value={staffForm.affiliation}
                            onChange={(e) => setStaffForm({ ...staffForm, affiliation: e.target.value })}
                            placeholder="University/Company (optional)"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '12px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: '500',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                marginTop: '10px'
                            }}
                        >
                            {loading ? 'Creating...' : 'Create Staff Member'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

// Helper Components
const StatCard = ({ icon, label, value, color }) => (
    <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    }}>
        <div style={{ color: color }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{value}</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>{label}</div>
        </div>
    </div>
);

const FormField = ({ label, type, value, onChange, required, placeholder }) => (
    <div>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            {label} {required && <span style={{ color: 'red' }}>*</span>}
        </label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
            }}
        />
    </div>
);

const getRoleColor = (role) => {
    const colors = {
        Student: '#3b82f6',
        Supervisor: '#10b981',
        Coordinator: '#8b5cf6',
        HOD: '#f59e0b',
        InternalEvaluator: '#ec4899',
        ExternalEvaluator: '#14b8a6',
        Admin: '#ef4444'
    };
    return colors[role] || '#6b7280';
};

export default AdminDashboard;
