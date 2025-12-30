'use client';
import TemplateEditor from '@/components/TemplateEditor';
import { useParams } from 'next/navigation';

export default function EditTemplatePage() {
    const params = useParams();
    const templateId = params.templateId as string;

    return <TemplateEditor templateId={templateId} />;
}
