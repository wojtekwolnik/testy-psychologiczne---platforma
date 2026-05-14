
import React, { useContext, useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserRole, User, Notification } from '../types';
import { ClipboardListIcon, UserGroupIcon, CogIcon, UserManagementIcon, BrandingIcon, ChartPieIcon, LogoutIcon, DocumentationIcon, SparklesIcon, HeartIcon, BellIcon, EnvelopeIcon, ChartBarIcon } from './Icons';
import { BrandingContext } from '../../contexts/BrandingContext';
import { markNotificationsAsRead } from '@/app/actions/notificationActions';

interface SideNavProps {
    user: User;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    onLogout: () => void;
}

const NavLink: React.FC<{ icon: React.ReactNode, label: string, to: string, isActive: boolean, colors: any }> = ({ icon, label, to, isActive, colors }) => {
    return (
        <Link href={to}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all text-left group"
            style={{
                backgroundColor: isActive ? colors.activeBg : 'transparent',
                color: isActive ? colors.activeText : colors.text
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.hoverBg;
                    e.currentTarget.style.color = colors.hoverText;
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.text;
                }
            }}
        >
            <span className={`${isActive ? '' : 'opacity-80 group-hover:opacity-100'}`}>{icon}</span>
            <span className="font-medium">{label}</span>
        </Link>
    );
};

const NotificationBell: React.FC<Pick<SideNavProps, 'user' | 'notifications' | 'setNotifications'> & { onNavigate: (path: string) => void }> = ({ user, notifications, setNotifications, onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        if (nextState && unreadCount > 0) {
            const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
            markNotificationsAsRead(user.id, unreadIds).then(() => {
                const newNotifications = notifications.map(n => ({ ...n, isRead: true }));
                setNotifications(newNotifications);
            });
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        setIsOpen(false);
        if (notification.context && notification.context.view) {
            const { view, params } = notification.context;
            if (view === 'ReportView' && params.resultId) {
                onNavigate(`/report/${params.resultId}`);
            }
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button onClick={handleToggle} className="relative p-2 text-slate-400 hover:text-white" title="Powiadomienia">
                <BellIcon />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-slate-800" />
                )}
            </button>
            {isOpen && (
                <div className="fixed top-16 left-64 mt-1 w-80 bg-slate-800 border border-slate-700 rounded-r-lg shadow-2xl z-50 text-white overflow-hidden">
                    <div className="p-3 font-semibold bg-slate-900 border-b border-slate-700 flex items-center justify-between">
                        <span>Powiadomienia</span>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                            title="Zamknij"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-700/50 bg-slate-800/95 backdrop-blur">
                        {notifications.length === 0 ? (
                            <p className="p-4 text-sm text-slate-400 text-center py-8">Brak nowych powiadomień.</p>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-3 transition-colors ${n.context ? 'cursor-pointer hover:bg-slate-700' : ''}`}>
                                    <p className="text-sm font-medium leading-snug">{n.message}</p>
                                    <p className="text-xs text-slate-400 mt-1.5 font-normal">{new Date(n.createdAt).toLocaleString()}</p>
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
    const router = useRouter();
    const pathname = usePathname();

    // Mapping from abstract view to concrete URL path
    const adminLinks = [
        { to: '/admin/dashboard', label: 'Testy', icon: <ClipboardListIcon className="h-5 w-5" /> },
        { to: '/admin/codes', label: 'Kody dostępu', icon: <UserManagementIcon /> }, // Using existing icon for now, or maybe a Key icon if available. I'll use UserManagementIcon since it relates to giving access.
        { to: '/admin/users', label: 'Użytkownicy', icon: <UserGroupIcon className="h-5 w-5" /> },
        { to: '/admin/results', label: 'Wyniki Testów', icon: <ChartBarIcon /> },
        { to: '/admin/branding', label: 'Ustawienia Platformy', icon: <CogIcon className="h-5 w-5" /> },
        { to: '/admin/report-settings', label: 'Ustawienia Raportów', icon: <CogIcon className="h-5 w-5" /> },
        { to: '/admin/templates', label: 'Konfiguracja Raportów', icon: <ClipboardListIcon className="h-5 w-5" /> },
        { to: '/admin/docs', label: 'Dokumentacja', icon: <DocumentationIcon /> },
    ];

    const therapistLinks = [
        { to: '/therapist/dashboard', label: 'Panel Główny', icon: <UserGroupIcon className="h-5 w-5" /> },
        { to: '/therapist-docs', label: 'Instrukcja', icon: <DocumentationIcon /> },
    ];

    const links = user.role === UserRole.Admin ? adminLinks : therapistLinks;

    const sidebarColors = {
        bg: branding.sidebarBackground || '#1e293b',
        text: branding.sidebarTextColor || '#f1f5f9',
        activeBg: branding.sidebarActiveBackground || '#334155',
        activeText: branding.sidebarActiveText || '#ffffff',
        hoverBg: branding.sidebarHoverBackground || '#334155',
        hoverText: branding.sidebarHoverText || '#ffffff',
    };

    return (
        <nav className="w-64 flex flex-col p-4 shadow-lg h-full transition-colors duration-300 relative"
            style={{ backgroundColor: sidebarColors.bg, color: sidebarColors.text }}>

            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundColor: branding.primaryColor }}></div>

            <div className="relative flex items-start justify-between p-2 mb-8 border-b border-white/10 pb-6">
                <div className="flex flex-col items-start gap-2.5 flex-shrink min-w-0">
                    {branding.logoUrl ? (
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                            <img src={branding.logoUrl} alt="Logo" className="h-8 w-auto max-w-[120px] object-contain flex-shrink-0" />
                        </div>
                    ) : (
                        <div className="h-10 w-10 bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {branding.appName.substring(0, 1)}
                        </div>
                    )}
                    <h1 className="text-base font-bold leading-tight tracking-tight break-words max-w-[180px]">{branding.appName}</h1>
                </div>
                {user.role === UserRole.Therapist && (
                    <div className="flex-shrink-0 mt-1">
                        <NotificationBell
                            user={user}
                            notifications={notifications}
                            setNotifications={setNotifications}
                            onNavigate={(path) => router.push(path)}
                        />
                    </div>
                )}
            </div>

            <div className="flex-grow space-y-1 relative">
                <p className="px-4 text-xs font-semibold opacity-50 uppercase tracking-wider mb-2">Menu</p>
                {links.map(link => {
                    const isReportView = pathname?.startsWith('/report/');
                    const isResultLink = link.to === '/admin/results' || link.to === '/therapist/dashboard';
                    const isActive = (pathname === link.to) ||
                        (link.to !== '/' && pathname?.startsWith(link.to)) ||
                        (isReportView && isResultLink);

                    return (
                        <NavLink
                            key={link.to}
                            label={link.label}
                            icon={link.icon}
                            to={link.to}
                            isActive={isActive}
                            colors={sidebarColors}
                        />
                    );
                })}
            </div>

            <div className="mt-auto relative">
                <div className="border-t border-gray-700/50 pt-4">
                    <div className="flex items-center gap-3 px-4 py-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-xs">
                            {user.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.username}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-300 hover:bg-slate-700/50 hover:text-red-200 rounded-md transition-colors text-left text-sm"
                    >
                        <LogoutIcon />
                        <span className="font-medium">Wyloguj</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default SideNav;
