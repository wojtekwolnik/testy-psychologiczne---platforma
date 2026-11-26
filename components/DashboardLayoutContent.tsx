'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BrandingContext } from '../contexts/BrandingContext';
import SideNav from './common/SideNav';
import { Notification } from './types';
import { useRouter, usePathname } from 'next/navigation';
import { getNotificationsForUser } from '@/app/actions/notificationActions';

export default function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuth();
    const { branding } = useContext(BrandingContext);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user?.id) {
            getNotificationsForUser(user.id)
                .then(setNotifications)
                .catch(err => console.error('Failed to load notifications:', err));
        }
    }, [user?.id]);

    if (isLoading || !user) {
        return <div className="flex h-screen items-center justify-center">Ładowanie...</div>;
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[var(--background-color)] overflow-hidden">
            {/* Mobile Top Header (< 768px) */}
            <header
                className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 shadow-md z-30 flex-shrink-0"
                style={{
                    backgroundColor: branding.sidebarBackground || '#1e293b',
                    color: branding.sidebarTextColor || '#f1f5f9',
                }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {branding.logoUrl ? (
                        <div className="bg-white/10 p-1.5 rounded-lg flex-shrink-0">
                            <img src={branding.logoUrl} alt="Logo" className="h-6 w-auto max-w-[100px] object-contain" />
                        </div>
                    ) : null}
                    <span className="font-bold text-sm truncate">{branding.appName || 'Real Moment'}</span>
                </div>
                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(prev => !prev)}
                    aria-label="Otwórz menu nawigacji"
                    className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-xs font-semibold"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isMobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                    <span>Menu</span>
                    {unreadCount > 0 && (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                    )}
                </button>
            </header>

            {/* Mobile Drawer Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar (Desktop fixed + Mobile Slide-over Drawer) */}
            <div
                className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:z-40 flex-shrink-0 ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <SideNav
                    user={user}
                    notifications={notifications}
                    setNotifications={setNotifications}
                    onLogout={logout}
                    onCloseMobile={() => setIsMobileMenuOpen(false)}
                />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-0 min-w-0">
                {children}
            </main>
        </div>
    );
}
