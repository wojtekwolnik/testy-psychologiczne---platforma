'use client';

import React, { Suspense } from 'react';
import ClientTestView from '@/components/ClientTestView';
import { useSearchParams } from 'next/navigation';

function TestPageInner({ testId }: { testId: string }) {
    const searchParams = useSearchParams();
    const clientCode = searchParams.get('clientCode') || '';
    const View = ClientTestView as any;
    return <View testId={testId} clientCode={clientCode} />;
}

export default function TestPage({ params }: { params: { testId: string } }) {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center h-screen bg-background">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                </div>
            }
        >
            <TestPageInner testId={params.testId} />
        </Suspense>
    );
}
