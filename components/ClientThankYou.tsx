
import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { BrandingContext } from '../contexts/BrandingContext';
import type { TestResult, Test } from './types';
import DOMPurify from 'isomorphic-dompurify';

interface ClientThankYouProps {
    result?: TestResult;
    test: Test;
}

export const ClientThankYou: React.FC<ClientThankYouProps> = ({ result, test }) => {
    const router = useRouter();
    const { branding } = useContext(BrandingContext);

    const formattedTitle = branding.clientThankYouTitle.replace(/{appName}/g, branding.appName);
    const formattedMessage = branding.clientThankYouMessage.replace(/{appName}/g, branding.appName);

    return (
        <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center p-4">
            <div className="bg-[var(--secondary-color)] text-[var(--text-color)] rounded-xl shadow-2xl p-12 text-center max-w-lg prose">
                <h1 className="text-4xl font-bold text-[var(--primary-color)] mb-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formattedTitle) }}></h1>
                <div className="text-lg mb-6" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formattedMessage) }}></div>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="no-underline px-6 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-semibold rounded-lg shadow-md hover:opacity-90 transition-colors"
                    >
                        {branding.clientThankYouButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};
