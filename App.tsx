
import React, { useState, useEffect, ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';

// --- Import Components ---
import ClientCodeEntry from './components/ClientCodeEntry';
import { StaffLoginPage } from './components/StaffLoginPage';
import AdminDashboard from './components/AdminDashboard';
import TherapistDashboard from './components/TherapistDashboard';
import ClientTestView, { ClientThankYou } from './components/ClientTestView';
import ClientTestConfirmationPage from './components/ClientTestConfirmationPage';
import ReportView from './components/ReportView';
import TestEditor from './components/TestEditor';
import TwoFactorAuthPage from './components/TwoFactorAuthPage';
import UserManagement from './components/UserManagement';
import BrandingSettings from './components/BrandingSettings';
import AggregatedDataView from './components/AggregatedDataView';
import BrandingStyles from './components/BrandingStyles';
import TemplateManager from './components/TemplateManager';
import TemplateEditor from './components/TemplateEditor';
import TestImporter from './components/TestImporter';
import DocumentationPage from './components/DocumentationPage';
import TherapistDocumentationPage from './components/TherapistDocumentationPage';
import AiSettingsPage from './components/AiSettingsPage';
import HealthDashboardPage from './components/HealthDashboardPage';
import SideNav from './components/common/SideNav';
import ToastContainer from './components/common/ToastContainer';
import EmailSettingsPage from './components/EmailSettingsPage';
import SetupWizard from './components/SetupWizard';

// --- Import API & Types ---
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole, Notification } from './components/types';

// --- Type Definitions ---
interface SetupStatus {
  needsSetup: boolean;
}

// Generic type for the save action passed from child components
type SaveAction = { handler: () => Promise<boolean> } | null;

// This context provides layout-level state and actions to nested routes.
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
    const check = async () => {
      try {
        const response = await fetch('/api/setup/status');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: SetupStatus = await response.json();
        setNeedsSetup(data.needsSetup);
      } catch (error) {
        console.error("Error checking setup status:", error);
        setNeedsSetup(null); // Keep loading state on error
      }
    };
    check();
  }, []);

  if (needsSetup === null) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        <p className='ml-4 text-slate-700'>Weryfikacja konfiguracji aplikacji...</p>
      </div>
    );
  }

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

  const handleNavigate = (path: string, state?: any) => {
    navigate(path, { state });
  };
  
  // The context object that will be passed down to all nested components
  const context: StaffLayoutContext = {
    onNavigate: handleNavigate,
    setNotifications,
    setIsDirty,
    setSaveAction,
    isDirty,
    saveAction
  };

  return (
    <div className="flex h-screen bg-[var(--background-color)]">
      <SideNav 
        user={user} 
        onLogout={logout} 
        notifications={notifications} 
        setNotifications={setNotifications}
      />
      <main className="flex-1 overflow-y-auto">
        {/* Outlet now receives the context, making it available to all child routes */}
        <Outlet context={context} />
      </main>
    </div>
  );
};

// --- Protected Route for Staff Roles ---
type ProtectedRouteProps = { roles: UserRole[] };

const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div>Weryfikacja sesji...</div>;

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (!roles.includes(user.role)) {
    const defaultPath = user.role === UserRole.Admin ? '/admin/dashboard' : '/therapist/dashboard';
    return <Navigate to={defaultPath} replace />;
  }

  return <Outlet />;
};

// --- Main App Router ---
const AppRouter = () => {
  const handleVerify = () => console.log("Verify action triggered");
  const handleBack = () => console.log("Back action triggered");

  return (
    <Routes>
      <Route path="/setup" element={<SetupWizard />} />
      <Route element={<SetupChecker />}>
        <Route path="/" element={<ClientCodeEntry />} />
        <Route path="/start-test" element={<ClientTestConfirmationPage />} />
        <Route path="/test/:testId/:clientCode" element={<ClientTestView />} />
        <Route path="/thank-you" element={<ClientThankYou />} />
        <Route path="/login" element={<StaffLoginPage />} />
        <Route path="/2fa" element={<TwoFactorAuthPage onVerify={handleVerify} onBack={handleBack} />} />

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
};

// --- Main App Component ---
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }}>
        <BrandingStyles />
        <ToastContainer />
        <AppRouter />
      </div>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
