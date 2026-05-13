'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SideNav from './common/SideNav';
import { Notification } from './types';
import { useRouter } from 'next/navigation';

export default function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const router = useRouter();

    useEffect(() => {
        // Redirect if not logged in is handled by AuthContext usually, but double check
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return <div className="flex h-screen items-center justify-center">Ładowanie...</div>;
    }

    return (
        <div className="flex h-screen bg-[var(--background-color)] overflow-hidden">
            {/* Sidebar */}
            <SideNav
                user={user}
                notifications={notifications}
                setNotifications={setNotifications}
                onLogout={logout}
            />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-0">
                {children}
            </main>
        </div>
    );
}
