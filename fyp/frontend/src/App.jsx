import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import GroupCreation from './components/GroupCreation';
import GroupsDashboard from './components/GroupsDashboard';
import StudentDashboard from './components/StudentDashboard';
import SupervisorGroupRequests from './components/SupervisorGroupRequests';
import ProposalSubmission from './components/ProposalSubmission';
import HODDashboard from './components/HODDashboard';
import ProposalReview from './components/ProposalReview';
import ProgressLog from './components/ProgressLog';
import ExternalEvaluation from './components/ExternalEvaluation';
import ExternalCallback from './components/ExternalCallback';
import AdminDashboard from './components/AdminDashboard';
import ForgotPassword from './components/ForgotPassword';
import AttendanceLog from './components/AttendanceLog';
import CoordinatorInsights from './components/CoordinatorInsights';
import SupervisorLogEntry from './components/SupervisorLogEntry';
import StudentLogView from './components/StudentLogView';
import CoordinatorLogAnalytics from './components/CoordinatorLogAnalytics';
import Schedules from './components/Schedules';
import MySchedules from './components/MySchedules';
import InternalEvaluatorDashboard from './components/InternalEvaluatorDashboard';
import ExternalEvaluatorAccess from './components/ExternalEvaluatorAccess';
import ExternalEvaluatorPortal from './components/ExternalEvaluatorPortal';
import ExternalEvaluatorManagement from './components/ExternalEvaluatorManagement';
import SRSDocument from './components/SRSDocument';


const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const MainContent = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('');

  // Set default active tab based on role
  useEffect(() => {
    if (user) {
      setActiveTab('dashboard');
    }
  }, [user]);

  if (!user) {
    return <Login />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'my-group' && <StudentDashboard />}
      {activeTab === 'group' && <GroupCreation />}
      {activeTab === 'groups' && <GroupsDashboard />}
      {activeTab === 'group-requests' && <SupervisorGroupRequests />}
      {activeTab === 'proposal' && <ProposalSubmission />}
      {activeTab === 'hod' && <HODDashboard />}
      {activeTab === 'review' && <ProposalReview />}
      {activeTab === 'progress' && <ProgressLog />}
      {activeTab === 'attendance' && <AttendanceLog />}
      {activeTab === 'insights' && <CoordinatorInsights />}
      {activeTab === 'supervisor-logs' && <SupervisorLogEntry />}
      {activeTab === 'student-logs' && <StudentLogView />}
      {activeTab === 'coordinator-logs' && <CoordinatorLogAnalytics />}
      {activeTab === 'schedules' && <Schedules />}
      {activeTab === 'srs-document' && <SRSDocument view="Interim" />}
      {activeTab === 'mid-term' && <SRSDocument view="MidTerm" />}
      {activeTab === 'final-report' && <SRSDocument view="FinalReport" />}
      {activeTab === 'my-schedules' && <MySchedules />}
      {activeTab === 'evaluator-dashboard' && <InternalEvaluatorDashboard />}
      {activeTab === 'external-evaluators' && <ExternalEvaluatorManagement />}
      {activeTab === 'admin' && <AdminDashboard />}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/external/access/:token" element={<ExternalEvaluatorAccess />} />
          <Route path="/external-portal" element={<ExternalEvaluatorPortal />} />
          <Route path="/external/callback" element={<ExternalCallback />} />
          <Route path="/external/evaluate/:groupId" element={<ExternalEvaluation />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainContent />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
