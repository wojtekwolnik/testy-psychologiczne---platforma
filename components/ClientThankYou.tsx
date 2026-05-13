
import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { BrandingContext } from '../contexts/BrandingContext';
import type { TestResult, Test } from './types';
import { generatePdf } from './pdfGenerator';

interface ClientThankYouProps {
    result?: TestResult;
    test: Test;
}

export const ClientThankYou: React.FC<ClientThankYouProps> = ({ result, test }) => {
    const router = useRouter();
    const { branding } = useContext(BrandingContext);

    const formattedTitle = branding.clientThankYouTitle.replace(/{appName}/g, branding.appName);
    const formattedMessage = branding.clientThankYouMessage.replace(/{appName}/g, branding.appName);

    const handleDownload = async () => {
        if (!result) return;
        try {
            // We pass undefined for template (defaults to standard report) and empty string for customInterpretation
            const pdfBytes = await generatePdf(result, test, branding, undefined, '');
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Wynik_${test.title.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("PDF Generation Error:", e);
            alert("Wystąpił błąd podczas generowania pliku PDF.");
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center p-4">
            <div className="bg-[var(--secondary-color)] text-[var(--text-color)] rounded-xl shadow-2xl p-12 text-center max-w-lg prose">
                <h1 className="text-4xl font-bold text-[var(--primary-color)] mb-4" dangerouslySetInnerHTML={{ __html: formattedTitle }}></h1>
                <div className="text-lg mb-6" dangerouslySetInnerHTML={{ __html: formattedMessage }}></div>

                <div className="flex flex-col gap-4">
                    {result && (
                        <button
                            onClick={handleDownload}
                            className="px-6 py-2 bg-[var(--accent-color)] text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-colors"
                        >
                            Pobierz Raport PDF
                        </button>
                    )}
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
