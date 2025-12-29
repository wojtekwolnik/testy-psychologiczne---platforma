'use client';

import ClientTestConfirmationPage from '@/components/ClientTestConfirmationPage';
import { useSearchParams } from 'next/navigation';

export default function TestConfirmationPage() {
    const searchParams = useSearchParams();
    const testId = searchParams.get('testId');
    const clientCode = searchParams.get('clientCode');

    if (!testId || !clientCode) return <div>Brak danych testu.</div>;

    return <ClientTestConfirmationPage testId={testId} clientCode={clientCode} />;
}
