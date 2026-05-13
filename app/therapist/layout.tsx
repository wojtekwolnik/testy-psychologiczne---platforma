
import React from 'react';
import DashboardLayoutContent from '@/components/DashboardLayoutContent';

export default function TherapistLayout({
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
