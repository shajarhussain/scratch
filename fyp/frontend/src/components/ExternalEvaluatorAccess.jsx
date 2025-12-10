import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

const ExternalEvaluatorAccess = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [verifying, setVerifying] = useState(true);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');
    const [evaluatorData, setEvaluatorData] = useState(null);
    const [expiryDate, setExpiryDate] = useState(null);

    useEffect(() => {
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const res = await axios.get(`http://127.0.0.1:5000/api/evaluator/external/verify/${token}`);

            if (res.data.valid) {
                setVerified(true);
                setEvaluatorData(res.data.evaluator);
                setExpiryDate(res.data.expiresAt);
            } else {
                setError('Invalid or expired token');
            }
        } catch (err) {
            console.error('Verify Token Error:', err);
            const errMsg = err.response?.data?.message || err.message || 'Failed to verify access token';
            setError(`${errMsg} (Status: ${err.response?.status})`);
        } finally {
            setVerifying(false);
        }
    };

    const handleLogin = async () => {
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/evaluator/external/login', {
                token
            });

            // Store external token
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            localStorage.setItem('expiresAt', res.data.expiresAt);
            localStorage.setItem('isExternal', 'true');

            // Redirect to external portal
            window.location.href = '/external-portal';
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
                    <Loader className="mx-auto text-indigo-600 animate-spin mb-4" size={48} />
                    <h2 className="text-2xl font-bold text-slate-800">Verifying Access...</h2>
                    <p className="text-slate-500 mt-2">Please wait while we verify your credentials</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-100 via-pink-50 to-orange-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-lg w-full">
                    <div className="text-center mb-6">
                        <XCircle className="mx-auto text-red-600 mb-4" size={64} />
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Access Denied</h2>
                        <p className="text-slate-600">{error}</p>
                    </div>

                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <p className="text-sm text-red-700">
                            <strong>Possible reasons:</strong>
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-600 mt-2 space-y-1">
                            <li>The access link has expired</li>
                            <li>The link has already been used</li>
                            <li>The link is invalid or corrupted</li>
                        </ul>
                    </div>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        Please contact the coordinator for a new access link.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl w-full">
                <div className="text-center mb-8">
                    <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
                    <h1 className="text-4xl font-bold text-slate-800 mb-2">Welcome, External Evaluator</h1>
                    <p className="text-lg text-slate-600">Access verified successfully</p>
                </div>

                {evaluatorData && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
                        <h3 className="font-bold text-slate-800 mb-4">Evaluator Information</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Name:</strong> {evaluatorData.name}</p>
                            <p><strong>Email:</strong> {evaluatorData.email}</p>
                        </div>
                    </div>
                )}

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-6">
                    <div className="flex items-start space-x-3">
                        <Clock className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
                        <div>
                            <p className="font-semibold text-yellow-800">Time-Limited Access</p>
                            <p className="text-sm text-yellow-700 mt-1">
                                Your access expires on: <strong>{new Date(expiryDate).toLocaleString()}</strong>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-8">
                    <div className="flex items-start space-x-3">
                        <Lock className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                        <div>
                            <p className="font-semibold text-blue-800">Secure Access Notice</p>
                            <p className="text-sm text-blue-700 mt-1">
                                You will have read-only access to assigned Final Viva evaluations only.
                                All submissions are securely logged and tracked.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                    Proceed to Evaluation Portal →
                </button>

                <p className="text-center text-xs text-slate-400 mt-6">
                    By proceeding, you acknowledge that your evaluation activities will be logged for security and audit purposes.
                </p>
            </div>
        </div>
    );
};

export default ExternalEvaluatorAccess;
