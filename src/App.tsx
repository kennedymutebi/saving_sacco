import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import DashboardPage from './pages/DashboardPage';
import SignupPage from './pages/SignupPage';
import AddSavingsPage from './pages/AddSavingsPage';
import ManageMembersPage from './pages/ManageMembersPage';
import MonthlySavingsPage from './pages/MonthlySavingsPage';
import Layout from './components/Pagelayout';
import ViewSavingsPage from './pages/ViewSavingsPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* OTP Verification Route */}
          <Route path="/verify-otp" element={<OtpVerificationPage />} />

          {/* Protected Change Password Route (outside Layout) */}
          <Route 
            path="/reset-password" 
            element={
              <ProtectedRoute>
                <ResetPassword />
              </ProtectedRoute>
            } 
          />

          {/* Protected routes wrapped in Layout */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="ViewSavingsPage" element={<ViewSavingsPage />} />
            <Route path="AddSavingsPage" element={<AddSavingsPage />} />
            <Route path="manage-member" element={<ManageMembersPage />} />
            <Route path="MonthlySavingsPage" element={<MonthlySavingsPage />} />
          </Route>

          {/* Default route */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;