'use client';

import ClientTestView from '@/components/ClientTestView';
import { useSearchParams } from 'next/navigation';

// Note: In Next.js App Router, [testId] param is passed to props, but we also need clientCode.
// clientCode is passed via query param from confirmation page usually?
// Check ClientTestConfirmationPage logic. It navigates to where?
// Legacy App.tsx switched View.
// We need to ensure navigation passes clientCode.
// If not, we might need to store it or pass it.
// Assuming URL: /test/[testId]?clientCode=XYZ

export default function TestPage({ params }: { params: { testId: string } }) {
    const searchParams = useSearchParams();
    const clientCode = searchParams.get('clientCode') || '';

    return <ClientTestView testId={params.testId} clientCode={clientCode} />;
}
