'use client';

import React, { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validateAccessCode } from '@/app/actions/accessCodeActions';
import { BrandingContext, DEFAULT_TERMS_OF_TESTING_TITLE } from '@/contexts/BrandingContext';
import { SpinnerIcon } from './common/Icons';
import DOMPurify from 'isomorphic-dompurify';
import TermsOfTestingModal from './TermsOfTestingModal';

const ClientCodeEntry: React.FC = () => {
    const [clientCode, setClientCode] = useState('');
    const [isClientLoading, setIsClientLoading] = useState(false);
    const [clientError, setClientError] = useState('');
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

    const router = useRouter();
    const { branding } = useContext(BrandingContext);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlCode = params.get('code') || params.get('clientCode');
            if (urlCode) {
                setClientCode(urlCode.trim().toUpperCase());
            }
        }
    }, []);

    const handleStartTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientCode) {
            setClientError('Proszę wprowadzić kod.');
            return;
        }
        setIsClientLoading(true);
        setClientError('');
        try {
            const result = await validateAccessCode(clientCode);
            if (result.isValid && result.testId) {
                router.push(`/test-confirmation?testId=${result.testId}&clientCode=${clientCode}`);
            } else {
                setClientError(result.error || 'Nieprawidłowy lub wygasły kod.');
            }
        } catch (err) {
            setClientError('Wystąpił błąd podczas weryfikacji kodu.');
        } finally {
            setIsClientLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4 text-text transition-all duration-500">
            <div className="w-full max-w-md animate-fade-in-up">
                <main className="bg-[var(--secondary-color)]/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl p-8 md:p-12 text-center transition-all duration-300">
                    <div className="mb-10 transform transition-transform hover:scale-105 duration-300">
                        {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" className="max-h-20 mx-auto object-contain drop-shadow-md" />}
                    </div>
                    
                    <h1 className="text-3xl font-bold mb-3 text-text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(branding.clientPageTitle) }}></h1>
                    <div className="text-text-muted mb-8 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(branding.clientPageDescription) }}></div>

                    <div className="mt-8">
                        <form onSubmit={handleStartTest} className="space-y-6">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Wpisz swój kod..."
                                    value={clientCode}
                                    onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                                    className="w-full p-4 text-xl border-2 border-border rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-center font-mono tracking-widest bg-input-bg text-input-text shadow-inner"
                                    aria-label="Kod dostępu do testu"
                                />
                            </div>
                            {clientError && (
                                <div className="text-error bg-error/10 border border-error/20 rounded-lg p-3 text-sm animate-shake" role="alert">
                                    {clientError}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={isClientLoading}
                                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-contrast font-bold text-lg rounded-xl shadow-lg hover:shadow-primary/30 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all duration-300"
                            >
                                {isClientLoading && <SpinnerIcon />}
                                {isClientLoading ? 'Sprawdzanie...' : branding.clientPageButtonText}
                            </button>
                        </form>
                    </div>
                </main>

                {/* Staff Login Button */}
                <div className="text-center mt-8">
                    <button
                        onClick={() => router.push('/login')}
                        className="text-[var(--text-color)] opacity-70 hover:opacity-100 font-semibold transition-colors hover:text-[var(--primary-color)]"
                    >
                        Logowanie dla personelu
                    </button>
                </div>
            </div>

            <footer className="mt-8 sm:absolute sm:bottom-4 sm:left-0 sm:right-0 text-center text-[var(--text-color)] text-xs space-y-1.5 px-4">
                <p className="opacity-65">
                    <span className="font-bold">Bezpieczeństwo i Zgodność:</span> Wszystkie dane są szyfrowane i przetwarzane zgodnie z RODO.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <button
                        type="button"
                        onClick={() => setIsTermsModalOpen(true)}
                        className="text-primary hover:underline font-semibold opacity-90 hover:opacity-100 transition-opacity"
                    >
                        {branding.termsOfTestingTitle || DEFAULT_TERMS_OF_TESTING_TITLE}
                    </button>
                </div>
            </footer>

            <TermsOfTestingModal
                isOpen={isTermsModalOpen}
                onClose={() => setIsTermsModalOpen(false)}
            />
        </div>
    );
};

export default ClientCodeEntry;
