'use client';

import React, { Suspense } from 'react';
import ClientTestConfirmationPage from '@/components/ClientTestConfirmationPage';

export default function TestConfirmationPage() {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center h-screen bg-background">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                </div>
            }
        >
            <ClientTestConfirmationPage />
        </Suspense>
    );
}
