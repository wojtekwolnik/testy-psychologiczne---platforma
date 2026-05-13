'use client';

import React, { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { validateAccessCode } from '@/app/actions/accessCodeActions';
import { BrandingContext } from '@/contexts/BrandingContext';
import { SpinnerIcon } from './common/Icons';
import DOMPurify from 'isomorphic-dompurify';

const ClientCodeEntry: React.FC = () => {
    const [clientCode, setClientCode] = useState('');
    const [isClientLoading, setIsClientLoading] = useState(false);
    const [clientError, setClientError] = useState('');

    const router = useRouter();
    const { branding } = useContext(BrandingContext);

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
                // Navigate to the confirmation/start page
                // We can pass data via URL params or just redirect and let next page fetch
                // ClientTestConfirmationPage usually expects testId and clientCode.
                // Let's use URL query params for now as it's simplest for server components or client components reading params.
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 p-4 text-[var(--text-color)] transition-all duration-500">
            <div className="w-full max-w-md">
                <main className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-xl p-8 md:p-12 text-center">
                    {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" className="h-16 w-auto mx-auto mb-6 object-contain" />}
                    <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(branding.clientPageTitle) }}></h1>
                    <div className="mt-4 text-base lg:text-lg opacity-80 max-w-xl mx-auto prose" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(branding.clientPageDescription) }}></div>

                    <div className="mt-8">
                        <form onSubmit={handleStartTest} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Wpisz swój kod..."
                                    value={clientCode}
                                    onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                                    className="w-full p-4 text-lg border-2 border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition text-center font-mono tracking-widest bg-[var(--input-background-color)] text-[var(--input-text-color)]"
                                    aria-label="Kod dostępu do testu"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isClientLoading}
                                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold text-lg rounded-lg shadow-md hover:opacity-90 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg"
                            >
                                {isClientLoading && <SpinnerIcon />}
                                {isClientLoading ? 'Sprawdzanie...' : branding.clientPageButtonText}
                            </button>
                        </form>
                        {clientError && <p className="text-[var(--error-color)] mt-4 text-sm font-semibold">{clientError}</p>}
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

            <footer className="absolute bottom-4 left-0 right-0 text-center text-[var(--text-color)] opacity-60 text-xs">
                <p>
                    <span className="font-bold">Bezpieczeństwo i Zgodność:</span> Wszystkie dane są szyfrowane i przetwarzane zgodnie z RODO.
                </p>
            </footer>
        </div>
    );
};

export default ClientCodeEntry;
