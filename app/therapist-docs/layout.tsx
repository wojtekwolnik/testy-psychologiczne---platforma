import React from 'react';
import DashboardLayoutContent from '@/components/DashboardLayoutContent';

export default function TherapistDocsLayout({
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
