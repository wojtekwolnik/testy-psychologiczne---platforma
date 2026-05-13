
import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole, Notification } from './components/types';
import SideNav from './components/common/SideNav';
import ToastContainer from './components/common/ToastContainer';
import BrandingStyles from './components/BrandingStyles';

// --- Lazy Load Page Components ---
const SetupWizard = React.lazy(() => import('./components/SetupWizard'));
const ClientCodeEntry = React.lazy(() => import('./components/ClientCodeEntry'));
const StaffLoginPage = React.lazy(() => import('./components/StaffLoginPage').then(module => ({ default: module.StaffLoginPage })) );
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const TherapistDashboard = React.lazy(() => import('./components/TherapistDashboard'));
const ClientTestView = React.lazy(() => import('./components/ClientTestView')); 
const ClientThankYou = React.lazy(() => import('./components/ClientTestView').then(module => ({ default: module.ClientThankYou })) );
const ClientTestConfirmationPage = React.lazy(() => import('./components/ClientTestConfirmationPage'));
const ReportView = React.lazy(() => import('./components/ReportView'));
const TestEditor = React.lazy(() => import('./components/TestEditor'));
const TwoFactorAuthPage = React.lazy(() => import('./components/TwoFactorAuthPage'));
const UserManagement = React.lazy(() => import('./components/UserManagement'));
const BrandingSettings = React.lazy(() => import('./components/BrandingSettings'));
const AggregatedDataView = React.lazy(() => import('./components/AggregatedDataView'));
const TemplateManager = React.lazy(() => import('./components/TemplateManager'));
const TemplateEditor = React.lazy(() => import('./components/TemplateEditor'));
const TestImporter = React.lazy(() => import('./components/TestImporter'));
const DocumentationPage = React.lazy(() => import('./components/DocumentationPage'));
const TherapistDocumentationPage = React.lazy(() => import('./components/TherapistDocumentationPage'));
const AiSettingsPage = React.lazy(() => import('./components/AiSettingsPage'));
const HealthDashboardPage = React.lazy(() => import('./components/HealthDashboardPage'));
const EmailSettingsPage = React.lazy(() => import('./components/EmailSettingsPage'));

// --- Loading Spinner Fallback ---
const LoadingFallback = () => (
    <div className="flex justify-center items-center h-screen w-full">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-indigo-600"></div>
    </div>
);

// --- Type Definitions ---
interface SetupStatus {
  needsSetup: boolean;
}
type SaveAction = { handler: () => Promise<boolean> } | null;
export type StaffLayoutContext = {
  onNavigate: (path: string, state?: any) => void;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveAction: React.Dispatch<React.SetStateAction<SaveAction>>;
  isDirty: boolean;
  saveAction: SaveAction;
};

// --- Setup Check Component ---
const SetupChecker = () => {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/setup/status').then(res => res.json()).then((data: SetupStatus) => {
      setNeedsSetup(data.needsSetup);
    }).catch(err => {
      console.error("Error checking setup status:", err);
      setNeedsSetup(null);
    });
  }, []);

  if (needsSetup === null) return <LoadingFallback />;
  return needsSetup ? <Navigate to="/setup" replace /> : <Outlet />;
};

// --- Staff Layout using Outlet Context ---
const StaffLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saveAction, setSaveAction] = useState<SaveAction>(null);

  if (!user) return <Navigate to="/login" replace />;

  const context: StaffLayoutContext = {
    onNavigate: (path: string, state?: any) => navigate(path, { state }),
    setNotifications, setIsDirty, setSaveAction, isDirty, saveAction
  };

  return (
    <div className="flex h-screen bg-[var(--background-color)]">
      <SideNav user={user} onLogout={logout} notifications={notifications} setNotifications={setNotifications} />
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<LoadingFallback />}>
            <Outlet context={context} />
        </Suspense>
      </main>
    </div>
  );
};

// --- Protected Route for Staff Roles ---
type ProtectedRouteProps = { roles: UserRole[] };
const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!roles.includes(user.role)) {
    // Redirect based on user's actual role
    const defaultPath = user.role === UserRole.Admin ? '/admin/dashboard' : '/therapist/dashboard';
    return <Navigate to={defaultPath} replace />;
  }
  return <Outlet />;
};

// --- Main App Router ---
const AppRouter = () => (
    <Routes>
      <Route path="/setup" element={<SetupWizard />} />
      <Route element={<SetupChecker />}>
        {/* Public Routes */}
        <Route path="/" element={<ClientCodeEntry />} />
        <Route path="/start-test" element={<ClientTestConfirmationPage />} />
        <Route path="/test/:testId/:clientCode" element={<ClientTestView />} />
        <Route path="/thank-you" element={<ClientThankYou />} />
        <Route path="/login" element={<StaffLoginPage />} />
        <Route path="/2fa" element={<TwoFactorAuthPage />} />

        {/* Authenticated Staff Routes */}
        <Route element={<StaffLayout />}>
          <Route element={<ProtectedRoute roles={[UserRole.Admin]} />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/tests" element={<TestImporter />} />
            <Route path="/admin/test/edit/:testId" element={<TestEditor />} />
            <Route path="/admin/test/new" element={<TestEditor />} />
            <Route path="/admin/test/import" element={<TestImporter />} />
            <Route path="/admin/branding" element={<BrandingSettings />} />
            <Route path="/admin/data" element={<AggregatedDataView />} />
            <Route path="/admin/templates" element={<TemplateManager />} />
            <Route path="/admin/template/edit/:templateId" element={<TemplateEditor />} />
            <Route path="/admin/template/new" element={<TemplateEditor />} />
            <Route path="/admin/docs" element={<DocumentationPage />} />
            <Route path="/admin/settings/ai" element={<AiSettingsPage />} />
            <Route path="/admin/settings/email" element={<EmailSettingsPage />} />
            <Route path="/admin/health" element={<HealthDashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={[UserRole.Therapist]} />}>
            <Route path="/therapist" element={<Navigate to="/therapist/dashboard" replace />} />
            <Route path="/therapist/dashboard" element={<TherapistDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={[UserRole.Admin, UserRole.Therapist]} />}>
            <Route path="/report/:resultId" element={<ReportView />} />
            <Route path="/therapist-docs" element={<TherapistDocumentationPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
);

// --- Main App Component ---
const App = () => (
  <BrowserRouter>
    <AuthProvider>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }}>
            <BrandingStyles />
            <ToastContainer />
            <Suspense fallback={<LoadingFallback />}>
                <AppRouter />
            </Suspense>
        </div>
   </AuthProvider>
  </BrowserRouter>
);

export default App;
