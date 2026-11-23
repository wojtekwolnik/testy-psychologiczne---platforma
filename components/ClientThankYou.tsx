
import React, { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BrandingContext,
    DEFAULT_CLIENT_THANK_YOU_SAFETY_NOTE,
    DEFAULT_PRIVACY_POLICY_TITLE,
    DEFAULT_TERMS_OF_TESTING_TITLE,
} from '../contexts/BrandingContext';
import type { TestResult, Test } from './types';
import DOMPurify from 'isomorphic-dompurify';
import TermsOfTestingModal from './TermsOfTestingModal';

interface ClientThankYouProps {
    result?: TestResult;
    test: Test;
}

export const ClientThankYou: React.FC<ClientThankYouProps> = ({ result, test }) => {
    const router = useRouter();
    const { branding } = useContext(BrandingContext);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [termsModalTab, setTermsModalTab] = useState<'terms' | 'privacy'>('terms');

    const formattedTitle = branding.clientThankYouTitle.replace(/{appName}/g, branding.appName);
    const formattedMessage = branding.clientThankYouMessage.replace(/{appName}/g, branding.appName);
    const safetyNote = branding.clientThankYouSafetyNote ?? DEFAULT_CLIENT_THANK_YOU_SAFETY_NOTE;

    return (
        <div className="min-h-screen bg-[var(--background-color)] flex flex-col items-center justify-center p-4">
            <div className="bg-[var(--secondary-color)] text-[var(--text-color)] rounded-3xl border border-border shadow-2xl p-8 sm:p-12 text-center max-w-xl w-full animate-fade-in-up">
                <h1 className="text-3xl sm:text-4xl font-bold text-[var(--primary-color)] mb-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formattedTitle) }}></h1>
                <div className="text-base sm:text-lg mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formattedMessage) }}></div>

                {safetyNote && (
                    <div
                        className="bg-background/60 border border-border/80 rounded-xl p-4 mb-6 text-xs sm:text-sm text-text-muted leading-relaxed text-left"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(safetyNote) }}
                    />
                )}

                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="no-underline px-6 py-3 bg-primary text-primary-contrast font-bold rounded-xl shadow-md hover:opacity-90 transition-colors"
                    >
                        {branding.clientThankYouButtonText}
                    </button>
                </div>
            </div>

            <footer className="mt-6 text-center text-xs text-text-muted flex flex-wrap items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={() => {
                        setTermsModalTab('terms');
                        setIsTermsModalOpen(true);
                    }}
                    className="text-primary hover:underline font-semibold"
                >
                    {branding.termsOfTestingTitle || DEFAULT_TERMS_OF_TESTING_TITLE}
                </button>
                <span className="opacity-40">&bull;</span>
                <button
                    type="button"
                    onClick={() => {
                        setTermsModalTab('privacy');
                        setIsTermsModalOpen(true);
                    }}
                    className="text-primary hover:underline font-semibold"
                >
                    {branding.privacyPolicyTitle || DEFAULT_PRIVACY_POLICY_TITLE}
                </button>
            </footer>

            <TermsOfTestingModal
                isOpen={isTermsModalOpen}
                onClose={() => setIsTermsModalOpen(false)}
                initialTab={termsModalTab}
            />
        </div>
    );
};
