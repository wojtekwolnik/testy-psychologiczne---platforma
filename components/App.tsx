
import React, { useState, useContext, useCallback, useEffect } from 'react';
import LoginPage from './components/LoginPage';
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
import ConfirmModal from './components/common/ConfirmModal';
import ActionConfirmModal from './components/common/ActionConfirmModal';
import ToastContainer from './components/common/ToastContainer';
import EmailSettingsPage from './components/EmailSettingsPage';
import { UserRole, View, User, Notification } from './components/types';
import { authenticateUser, fetchNotifications } from './services/apiClient';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Branding);
  const [context, setContext] = useState<any>({});
  const [loggedInUser, setLoggedInUser] = useState<User | null>({ id: 'user-1', name: 'Jan Kowalski', email: 'admin@example.com', role: UserRole.Admin, twoFactorEnabled: true });
  
  // State for unsaved changes confirmation
  const [isDirty, setIsDirty] = useState(false);
  const [saveAction, setSaveAction] = useState<{ handler: () => Promise<any> } | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<{ view: View, context?: any } | null>(null);
  
  // State for logout confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // State for notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Fetch notifications if a therapist is logged in
    if (loggedInUser?.role === UserRole.Therapist) {
        const loadNotifications = async () => {
            const fetchedNotifications = await fetchNotifications(loggedInUser.id);
            setNotifications(fetchedNotifications);
        };
        loadNotifications();
        // Optional: set up polling for new notifications
        const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    } else {
        setNotifications([]); // Clear notifications for admin or logged out users
    }
  }, [loggedInUser]);


  const handleStaffLogin = async (email: string, password: string): Promise<string | null> => {
    const user = await authenticateUser(email, password);
    if (user) {
        if (user.twoFactorEnabled) {
            setContext({ userToAuth: user });
            setCurrentView(View.TwoFactorAuth);
            return null;
        } else {
            // Log in directly if 2FA is not enabled
            setLoggedInUser(user);
            setCurrentView(user.role === UserRole.Admin ? View.AdminDashboard : View.TherapistDashboard);
            return null;
        }
    } else {
        return "Nieprawidłowy e-mail lub hasło.";
    }
  };

  const handle2FASuccess = () => {
    const user: User = context.userToAuth;
    if (user) {
        setLoggedInUser(user);
        setCurrentView(user.role === UserRole.Admin ? View.AdminDashboard : View.TherapistDashboard);
        setContext({});
    }
  };
  
  const performNavigation = useCallback((view: View, newContext: any = {}) => {
    setIsDirty(false); // Reset dirty state on navigation
    setSaveAction(null);
    setCurrentView(view);
    setContext(newContext);
  }, []);
  
  const handleNavigate = useCallback((view: View, newContext: any = {}) => {
    if (isDirty && saveAction) {
        setNavigationTarget({ view, context: newContext });
    } else {
        performNavigation(view, newContext);
    }
  }, [isDirty, saveAction, performNavigation]);
  
  const performLogout = () => {
    setLoggedInUser(null);
    setContext({});
    performNavigation(View.ClientCodeEntry);
  };
  
  const handleLogout = () => {
    if(isDirty) {
      setShowLogoutConfirm(true);
    } else {
      performLogout();
    }
  };
  
  const onConfirmSave = async () => {
    if (saveAction && navigationTarget) {
      const success = await saveAction.handler();
      // Only navigate if save was successful (e.g. passed validation)
      if (success) {
        performNavigation(navigationTarget.view, navigationTarget.context);
        setNavigationTarget(null);
      } else {
        // If save failed (e.g. validation), just close the modal
        setNavigationTarget(null);
      }
    }
  };

  const onConfirmDiscard = () => {
    if (navigationTarget) {
      performNavigation(navigationTarget.view, navigationTarget.context);
      setNavigationTarget(null);
    }
  };

  const onConfirmCancel = () => {
    setNavigationTarget(null);
  };
  
  const renderView = () => {
    const editorProps = {
      onNavigate: handleNavigate,
      setIsDirty,
      setSaveAction,
    };

    switch (currentView) {
      case View.ClientCodeEntry: return <LoginPage onNavigate={handleNavigate} />;
      case View.StaffLogin: return <StaffLoginPage onLogin={handleStaffLogin} onNavigate={handleNavigate} />;
      case View.TwoFactorAuth: return <TwoFactorAuthPage onVerify={handle2FASuccess} onBack={() => handleNavigate(View.ClientCodeEntry)} />;
      
      // Staff views are rendered inside the layout
      case View.AdminDashboard: return <AdminDashboard onNavigate={handleNavigate} />;
      case View.TestEditor: return <TestEditor testId={context.testId} importedTest={context.importedTest} {...editorProps} />;
      case View.UserManagement: return <UserManagement onNavigate={handleNavigate} />;
      case View.Branding: return <BrandingSettings {...editorProps} />;
      case View.AggregatedData: return <AggregatedDataView onNavigate={handleNavigate} />;
      case View.TemplateManager: return <TemplateManager onNavigate={handleNavigate} />;
      case View.TemplateEditor: return <TemplateEditor templateId={context.templateId} {...editorProps} />;
      case View.TestImporter: return <TestImporter onNavigate={handleNavigate} />;
      case View.Documentation: return <DocumentationPage />;
      case View.AiSettings: return <AiSettingsPage {...editorProps} />;
      case View.EmailSettings: return <EmailSettingsPage {...editorProps} />;
      case View.HealthDashboard: return <HealthDashboardPage />;
      case View.TherapistDashboard: return <TherapistDashboard onNavigate={handleNavigate} />;
      case View.ReportView: return <ReportView resultId={context.resultId} />;
      case View.TherapistDocumentation: return <TherapistDocumentationPage />;
      
      // Client views
      case View.ClientTestConfirmation: return <ClientTestConfirmationPage testId={context.testId} clientCode={context.clientCode} onNavigate={handleNavigate} />;
      case View.ClientTest: return <ClientTestView testId={context.testId} clientCode={context.clientCode} onNavigate={handleNavigate} />;
      case View.ClientThankYou: return <ClientThankYou onNavigate={handleNavigate}/>;
      default: return <LoginPage onNavigate={handleNavigate} />;
    }
  };
  
  const isStaffView = loggedInUser && [
      View.AdminDashboard, View.TestEditor, View.UserManagement, View.Branding, View.AggregatedData, View.TemplateManager, View.TemplateEditor, View.TestImporter,
      View.TherapistDashboard, View.ReportView, View.Documentation, View.TherapistDocumentation, View.AiSettings, View.HealthDashboard, View.EmailSettings
  ].includes(currentView);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)'}}>
        <BrandingStyles/>
        <ToastContainer />
        {navigationTarget && <ConfirmModal onSave={onConfirmSave} onDiscard={onConfirmDiscard} onCancel={onConfirmCancel} />}
        
        <ActionConfirmModal 
          isOpen={showLogoutConfirm}
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            setShowLogoutConfirm(false);
            performLogout();
          }}
          title="Potwierdź wylogowanie"
          message="Masz niezapisane zmiany. Czy na pewno chcesz się wylogować i odrzucić zmiany?"
          confirmText="Wyloguj i odrzuć zmiany"
        />

        {isStaffView && loggedInUser ? (
          <div className="flex h-screen">
            <SideNav 
                user={loggedInUser} 
                notifications={notifications}
                setNotifications={setNotifications}
                onNavigate={handleNavigate} 
                onLogout={handleLogout} 
            />
            <main className="flex-1 overflow-y-auto">
              {renderView()}
            </main>
          </div>
        ) : (
          <main>
            {renderView()}
          </main>
        )}
    </div>
  );
};

export default App;
