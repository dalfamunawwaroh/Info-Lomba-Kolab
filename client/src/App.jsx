import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

// Admin Pages
import AdminDashboardPage from '@/pages/admin/DashboardPage';
import ManageUsersPage from '@/pages/admin/ManageUsersPage';
import ManageStartupsPage from '@/pages/admin/ManageStartupsPage';
import ManageLombaPage from '@/pages/admin/ManageLombaPage';
import ManageTimPage from '@/pages/admin/ManageTimPage';
import DetailTimAdminPage from '@/pages/admin/DetailTimAdminPage';
import PengajuanPage from '@/pages/admin/PengajuanPage';

// Dosen Pages
import DosenDashboardPage from '@/pages/dosen/DashboardPage';
import TambahLombaPage from '@/pages/dosen/TambahLombaPage';
import EditLombaPage from '@/pages/dosen/EditLombaPage';
import PengajuanMasukPage from '@/pages/dosen/PengajuanMasukPage';
import TimBimbinganPage from '@/pages/dosen/TimBimbinganPage';
import SelfAssignPage from '@/pages/dosen/SelfAssignPage';
import TeamChangeRequestsPage from '@/pages/dosen/TeamChangeRequestsPage';

// Mahasiswa Pages
import MhsDashboardPage from '@/pages/mahasiswa/DashboardPage';
import DaftarLombaPage from '@/pages/mahasiswa/DaftarLombaPage';
import DetailLombaPage from '@/pages/mahasiswa/DetailLombaPage';
import RegisterLombaPage from '@/pages/mahasiswa/RegisterLombaPage';
import HistoryPage from '@/pages/mahasiswa/HistoryPage';

// Shared Pages
import ProfilePage from '@/pages/shared/ProfilePage';
import DirektoriPage from '@/pages/shared/DirektoriPage';
import NotFoundPage from '@/pages/shared/NotFoundPage';
import LandingPage from '@/pages/LandingPage';

// Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground mt-4">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashMap = { admin: '/admin', dosen: '/dosen', mahasiswa: '/mahasiswa' };
    return <Navigate to={dashMap[user.role] || '/login'} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { loading, isAuthenticated, user } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center auth-bg">
        <div className="text-center animate-fade-in">
          <LoadingSpinner size="lg" className="[&>div]:border-white/30 [&>div]:border-t-white" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const dashMap = { admin: '/admin', dosen: '/dosen', mahasiswa: '/mahasiswa' };
    return <Navigate to={dashMap[user.role] || '/'} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<ManageUsersPage />} />
        <Route path="startups" element={<ManageStartupsPage />} />
        <Route path="competitions" element={<ManageLombaPage />} />
        <Route path="competitions/add" element={<TambahLombaPage />} />
        <Route path="competitions/:id" element={<DetailLombaPage />} />
        <Route path="competitions/:id/edit" element={<EditLombaPage />} />
        <Route path="teams" element={<ManageTimPage />} />
        <Route path="teams/:id" element={<DetailTimAdminPage />} />
        <Route path="submissions" element={<PengajuanPage />} />
        <Route path="directory" element={<DirektoriPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
      </Route>

      {/* Dosen Routes */}
      <Route
        path="/dosen"
        element={
          <ProtectedRoute allowedRoles={['dosen']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DosenDashboardPage />} />
        <Route path="competitions" element={<DaftarLombaPage />} />
        <Route path="competitions/add" element={<TambahLombaPage />} />
        <Route path="competitions/:id" element={<DetailLombaPage />} />
        <Route path="competitions/:id/edit" element={<EditLombaPage />} />
        <Route path="advisor-requests" element={<PengajuanMasukPage />} />
        <Route path="my-teams" element={<TimBimbinganPage />} />
        <Route path="self-assign" element={<SelfAssignPage />} />
        <Route path="team-change-requests" element={<TeamChangeRequestsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="directory" element={<DirektoriPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
      </Route>

      {/* Mahasiswa Routes */}
      <Route
        path="/mahasiswa"
        element={
          <ProtectedRoute allowedRoles={['mahasiswa']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MhsDashboardPage />} />
        <Route path="competitions" element={<DaftarLombaPage />} />
        <Route path="competitions/:id" element={<DetailLombaPage />} />
        <Route path="competitions/:id/register" element={<RegisterLombaPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="directory" element={<DirektoriPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
      </Route>

      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}