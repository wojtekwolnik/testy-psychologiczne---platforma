'use client';

import React, { useContext, useEffect } from 'react';
import {
    BrandingContext,
    DEFAULT_TERMS_OF_TESTING_CONTENT,
    DEFAULT_TERMS_OF_TESTING_TITLE,
} from '@/contexts/BrandingContext';
import DOMPurify from 'isomorphic-dompurify';

interface TermsOfTestingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TermsOfTestingModal: React.FC<TermsOfTestingModalProps> = ({ isOpen, onClose }) => {
    const { branding } = useContext(BrandingContext);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const title = branding.termsOfTestingTitle || DEFAULT_TERMS_OF_TESTING_TITLE;
    const content = branding.termsOfTestingContent || DEFAULT_TERMS_OF_TESTING_CONTENT;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-modal-title"
            onClick={onClose}
        >
            <div
                className="bg-surface border border-border rounded-3xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden text-text"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="px-6 sm:px-8 py-5 bg-background/70 border-b border-border flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-0.5">
                            {branding.appName || 'Real Moment'}
                        </p>
                        <h2 id="terms-modal-title" className="text-xl sm:text-2xl font-bold text-text">
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface border border-transparent hover:border-border transition-colors"
                        aria-label="Zamknij okno warunków wykonywania badań"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-left leading-relaxed">
                    <div
                        className="prose prose-invert max-w-none text-text text-sm sm:text-base [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-primary [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-text"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                    />
                </div>

                <footer className="px-6 sm:px-8 py-4 bg-background/70 border-t border-border flex flex-wrap items-center justify-between gap-3">
                    <a
                        href="/warunki-badania"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-text-muted hover:text-primary underline transition-colors"
                    >
                        Otwórz na osobnej karcie (/warunki-badania)
                    </a>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-primary text-primary-contrast font-bold rounded-xl shadow hover:opacity-90 transition-all text-sm"
                    >
                        Rozumiem, zamknij
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default TermsOfTestingModal;
