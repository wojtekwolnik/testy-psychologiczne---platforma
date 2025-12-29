'use client';

import ClientTestConfirmationPage from '@/components/ClientTestConfirmationPage';
import { useSearchParams } from 'next/navigation';

export default function TestConfirmationPage() {
    const searchParams = useSearchParams();
    const testId = searchParams.get('testId');
    const clientCode = searchParams.get('clientCode');

    return <ClientTestConfirmationPage />;
}
