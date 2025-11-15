
import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole, User, Notification } from '../types';
import { ClipboardListIcon, UserGroupIcon, CogIcon, UserManagementIcon, BrandingIcon, ChartPieIcon, LogoutIcon, DocumentationIcon, SparklesIcon, HeartIcon, BellIcon, EnvelopeIcon } from './Icons';
import { BrandingContext } from '../../contexts/BrandingContext';
import { markNotificationsAsRead } from '../../services/apiService';

interface SideNavProps {
    user: User;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    onLogout: () => void;
}

// NavLink is now a wrapper around React Router's Link component
const NavLink: React.FC<{ icon: React.ReactNode, label: string, to: string }> = ({ icon, label, to }) => (
    <Link to={to} className="w-full flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-slate-700 rounded-md transition-colors text-left">
        {icon}
        <span className="font-medium">{label}</span>
    </Link>
);

const NotificationBell: React.FC<Pick<SideNavProps, 'user' | 'notifications' | 'setNotifications'> & { onNavigate: (path: string, state?: any) => void }> = ({ user, notifications, setNotifications, onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
            markNotificationsAsRead(user.id, unreadIds).then(() => {
                const newNotifications = notifications.map(n => ({ ...n, isRead: true }));
                setNotifications(newNotifications);
            });
        }
    };
    
    const handleNotificationClick = (notification: Notification) => {
        setIsOpen(false);
        if (notification.context && notification.context.view) { // Legacy context support
            // This part needs a robust mapping from old View enum to new URL paths
            // For now, we will handle a specific case, e.g., ReportView
            const { view, params } = notification.context;
            if (view === 'ReportView' && params.resultId) {
                onNavigate(`/report/${params.resultId}`);
            } // Add other mappings here as needed
        }
    };

    return (
        <div className="relative">
            <button onClick={handleToggle} className="relative p-2 text-slate-400 hover:text-white">
                <BellIcon />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-slate-800" />
                )}
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-slate-700 rounded-lg shadow-xl z-20 text-white">
                    <div className="p-3 font-semibold border-b border-slate-600">Powiadomienia</div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="p-4 text-sm text-slate-400">Brak nowych powiadomień.</p>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-3 border-b border-slate-600 ${n.context ? 'cursor-pointer hover:bg-slate-600' : ''}`}>
                                    <p className="text-sm">{n.message}</p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


const SideNav: React.FC<SideNavProps> = ({ user, notifications, setNotifications, onLogout }) => {
    const { branding } = useContext(BrandingContext);
    const navigate = useNavigate();

    // Mapping from abstract view to concrete URL path
    const adminLinks = [
        { to: '/admin/dashboard', label: 'Panel Główny', icon: <CogIcon className="h-5 w-5"/> },
        { to: '/admin/users', label: 'Użytkownicy', icon: <UserManagementIcon /> },
        { to: '/admin/branding', label: 'Branding', icon: <BrandingIcon /> },
        { to: '/admin/settings/email', label: 'Ustawienia E-mail', icon: <EnvelopeIcon /> },
        { to: '/admin/templates', label: 'Szablony PDF', icon: <ClipboardListIcon className="h-5 w-5" /> },
        { to: '/admin/data', label: 'Dane Zbiorcze', icon: <ChartPieIcon /> },
        { to: '/admin/docs', label: 'Dokumentacja', icon: <DocumentationIcon /> },
        { to: '/admin/settings/ai', label: 'Ustawienia AI', icon: <SparklesIcon className="h-6 w-6" /> },
        { to: '/admin/health', label: 'Stan Systemu', icon: <HeartIcon /> },
    ];
    
    const therapistLinks = [
         { to: '/therapist/dashboard', label: 'Panel Główny', icon: <UserGroupIcon className="h-5 w-5"/> },
         { to: '/therapist-docs', label: 'Instrukcja', icon: <DocumentationIcon /> },
    ];

    const links = user.role === UserRole.Admin ? adminLinks : therapistLinks;

    return (
        <nav className="w-64 bg-slate-800 text-white flex flex-col p-4 shadow-lg h-full">
            <div className="flex items-center justify-between p-2 mb-6 border-b border-slate-700 pb-4">
                <div className="flex items-center gap-3 flex-shrink min-w-0">
                    {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" className="h-8 w-auto flex-shrink-0" />}
                    <h1 className="text-xl font-bold truncate">{branding.appName}</h1>
                </div>
                {user.role === UserRole.Therapist && (
                   <div className="flex-shrink-0">
                     <NotificationBell 
                        user={user} 
                        notifications={notifications} 
                        setNotifications={setNotifications} 
                        onNavigate={(path, state) => navigate(path, { state })} // Pass navigate function
                     />
                   </div>
                )}
            </div>
            <div className="flex-grow space-y-2">
                {links.map(link => (
                    <NavLink
                        key={link.to}
                        label={link.label}
                        icon={link.icon}
                        to={link.to} // Use the `to` prop for the Link component
                    />
                ))}
            </div>
             <div className="mt-auto">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-slate-700 rounded-md transition-colors text-left"
                >
                    <LogoutIcon />
                    <span className="font-medium">Wyloguj</span>
                </button>
            </div>
        </nav>
    );
};

export default SideNav;
