
import React from 'react';
import DashboardLayoutContent from '@/components/DashboardLayoutContent';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DashboardLayoutContent>
            {children}
        </DashboardLayoutContent>
    );
}
