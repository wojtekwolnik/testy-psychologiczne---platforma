'use client';

import ClientTestView from '@/components/ClientTestView';
import { useSearchParams } from 'next/navigation';

export default function TestPage({ params }: { params: { testId: string } }) {
    const searchParams = useSearchParams();
    const clientCode = searchParams.get('clientCode') || '';

    // Casting to any to avoid stubborn build error regarding IntrinsicAttributes
    const View = ClientTestView as any;

    return <View testId={params.testId} clientCode={clientCode} />;
}
