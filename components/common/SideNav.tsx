import React, { useContext, useState, useEffect } from 'react';
import { UserRole, View, User, Notification } from '../types';
import { ClipboardListIcon, UserGroupIcon, CogIcon, UserManagementIcon, BrandingIcon, ChartPieIcon, LogoutIcon, DocumentationIcon, SparklesIcon, HeartIcon, BellIcon, EnvelopeIcon } from './Icons';
import { BrandingContext } from '../../contexts/BrandingContext';
import { markNotificationsAsRead } from '../../services/apiService';


interface SideNavProps {
    user: User;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    onNavigate: (view: View, context?: any) => void;
    onLogout: () => void;
}

const NavLink: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, children?: React.ReactNode }> = ({ icon, label, onClick, children }) => (
    <div className="relative">
        <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-slate-700 rounded-md transition-colors text-left">
            {icon}
            <span className="font-medium">{label}</span>
        </button>
        {children}
    </div>
);

const NotificationBell: React.FC<Omit<SideNavProps, 'onLogout'>> = ({ user, notifications, setNotifications, onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            // Mark all as read when opening
            const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
            markNotificationsAsRead(user.id, unreadIds);
            const newNotifications = notifications.map(n => ({...n, isRead: true }));
            setNotifications(newNotifications);
        }
    };
    
    const handleNotificationClick = (notification: Notification) => {
        setIsOpen(false);
        if (notification.context) {
            onNavigate(notification.context.view, notification.context.params);
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


const SideNav: React.FC<SideNavProps> = ({ user, notifications, setNotifications, onNavigate, onLogout }) => {
    const { branding } = useContext(BrandingContext);

    const adminLinks = [
        { view: View.AdminDashboard, label: 'Panel Główny', icon: <CogIcon className="h-5 w-5"/> },
        { view: View.UserManagement, label: 'Użytkownicy', icon: <UserManagementIcon /> },
        { view: View.Branding, label: 'Branding', icon: <BrandingIcon /> },
        { view: View.EmailSettings, label: 'Ustawienia E-mail', icon: <EnvelopeIcon /> },
        { view: View.TemplateManager, label: 'Szablony PDF', icon: <ClipboardListIcon className="h-5 w-5" /> },
        { view: View.AggregatedData, label: 'Dane Zbiorcze', icon: <ChartPieIcon /> },
        { view: View.Documentation, label: 'Dokumentacja', icon: <DocumentationIcon /> },
        { view: View.AiSettings, label: 'Ustawienia AI', icon: <SparklesIcon className="h-6 w-6" /> },
        { view: View.HealthDashboard, label: 'Stan Systemu', icon: <HeartIcon /> },
    ];
    
    const therapistLinks = [
         { view: View.TherapistDashboard, label: 'Panel Główny', icon: <UserGroupIcon className="h-5 w-5"/> },
         { view: View.TherapistDocumentation, label: 'Instrukcja', icon: <DocumentationIcon /> },
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
                     <NotificationBell user={user} notifications={notifications} setNotifications={setNotifications} onNavigate={onNavigate} />
                   </div>
                )}
            </div>
            <div className="flex-grow space-y-2">
                {links.map(link => (
                    <NavLink
                        key={link.view}
                        label={link.label}
                        icon={link.icon}
                        onClick={() => onNavigate(link.view)}
                    />
                ))}
            </div>
             <div className="mt-auto">
                <NavLink
                    label="Wyloguj"
                    icon={<LogoutIcon />}
                    onClick={onLogout}
                />
            </div>
        </nav>
    );
};

export default SideNav;