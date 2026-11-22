import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import StudentLayout from './components/layout/StudentLayout';
import AdminLayout from './components/layout/AdminLayout';

// Student Pages
import HomePage from './pages/student/HomePage';
import WashroomDetailPage from './pages/student/WashroomDetailPage';
import RankingsPage from './pages/student/RankingsPage';
import IssueTrackerPage from './pages/student/IssueTrackerPage';
import ScanPage from './pages/student/ScanPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import BuildingsPage from './pages/admin/BuildingsPage';
import IssuesPage from './pages/admin/IssuesPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import QRCodesPage from './pages/admin/QRCodesPage';

// Loading component
import { PageLoader } from './components/common/LoadingSpinner';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

// Student Routes
function StudentRoutes() {
  return (
    <StudentLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/washroom/:id" element={<WashroomDetailPage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/issues" element={<IssueTrackerPage />} />
        <Route path="/scan" element={<ScanPage />} />
      </Routes>
    </StudentLayout>
  );
}

// Admin Routes
function AdminRoutes() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminDashboardPage />} />
          <Route path="/buildings" element={<BuildingsPage />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/qrcodes" element={<QRCodesPage />} />
        </Routes>
      </AdminLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin Login - No layout */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminRoutes />} />
          
          {/* Student Routes */}
          <Route path="/*" element={<StudentRoutes />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
