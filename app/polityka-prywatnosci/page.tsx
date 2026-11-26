'use client';

import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import {
    BrandingContext,
    DEFAULT_PRIVACY_POLICY_CONTENT,
    DEFAULT_PRIVACY_POLICY_TITLE,
} from '@/contexts/BrandingContext';
import DOMPurify from 'isomorphic-dompurify';

export default function PrivacyPolicyPage() {
    const router = useRouter();
    const { branding } = useContext(BrandingContext);

    const title = branding.privacyPolicyTitle || DEFAULT_PRIVACY_POLICY_TITLE;
    const content = branding.privacyPolicyContent || DEFAULT_PRIVACY_POLICY_CONTENT;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background py-10 px-4 text-text">
            <div className="max-w-3xl mx-auto">
                <div className="bg-surface/95 backdrop-blur-xl border border-border rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
                    <header className="px-5 sm:px-10 py-6 sm:py-8 bg-background/60 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
                            {branding.logoUrl && (
                                <img
                                    src={branding.logoUrl}
                                    alt={branding.appName || 'Logo'}
                                    className="h-10 sm:h-12 w-auto max-w-[160px] object-contain self-start sm:self-auto flex-shrink-0"
                                />
                            )}
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-primary break-words">
                                    {branding.appName || 'Real Moment'} – Przestrzeń Diagnostyczna
                                </p>
                                <h1 className="text-xl sm:text-3xl font-bold text-text mt-0.5 leading-snug break-words">
                                    {title}
                                </h1>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            className="self-start sm:self-auto flex-shrink-0 px-4 py-2 bg-surface border border-border hover:border-primary text-text text-sm font-semibold rounded-xl transition-colors"
                        >
                            ← Powrót do strony głównej
                        </button>
                    </header>

                    <main className="p-6 sm:p-10 text-left leading-relaxed">
                        <div
                            className="prose prose-invert max-w-none text-text text-sm sm:text-base [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-primary [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-text [&_a]:text-primary [&_a]:underline"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                        />
                    </main>

                    <footer className="px-6 sm:px-10 py-5 bg-background/60 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
                        <span>
                            {branding.reportFooterText || 'Real Moment – Przestrzeń Rozwojowa i Diagnostyczna | www.realmoment.pl'}
                        </span>
                        <div className="flex items-center gap-3">
                            <a
                                href="/warunki-badania"
                                className="text-text-muted hover:text-primary underline font-semibold"
                            >
                                Warunki wykonywania badań
                            </a>
                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="px-5 py-2 bg-primary text-primary-contrast font-bold rounded-xl shadow hover:opacity-90 transition-all text-xs"
                            >
                                Przejdź do wpisania kodu badania
                            </button>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
