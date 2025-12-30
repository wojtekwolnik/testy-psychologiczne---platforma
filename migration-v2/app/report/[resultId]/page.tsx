'use client';

import ReportView from '@/components/ReportView';
import { useParams } from 'next/navigation';

export default function ResultReportPage() {
    const params = useParams();
    const resultId = params.resultId as string;

    return <ReportView resultId={resultId} />;
}
