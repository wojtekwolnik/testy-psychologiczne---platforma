'use client';

import React, { useState, useEffect } from 'react';
import type { AccessCode } from '../types';
import { ClipboardCopyIcon, LinkIcon } from './Icons';

interface AccessCodeQrModalProps {
    codeObj: AccessCode | null;
    testTitle?: string;
    onClose: () => void;
}

export const AccessCodeQrModal: React.FC<AccessCodeQrModalProps> = ({ codeObj, testTitle, onClose }) => {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);

    const directLink =
        codeObj && typeof window !== 'undefined'
            ? `${window.location.origin}/test-confirmation?testId=${encodeURIComponent(codeObj.testId)}&clientCode=${encodeURIComponent(codeObj.code)}`
            : '';

    useEffect(() => {
        if (!codeObj || !directLink) {
            setQrDataUrl('');
            return;
        }
        let cancelled = false;
        import('qrcode')
            .then(QRCode => {
                return QRCode.toDataURL(directLink, {
                    width: 280,
                    margin: 2,
                    color: {
                        dark: '#111827',
                        light: '#ffffff',
                    },
                });
            })
            .then(url => {
                if (!cancelled) setQrDataUrl(url);
            })
            .catch(err => {
                console.error('Błąd generowania kodu QR:', err);
            });

        return () => {
            cancelled = true;
        };
    }, [codeObj, directLink]);

    if (!codeObj) return null;

    const handleCopy = (type: 'code' | 'link') => {
        const text = type === 'code' ? codeObj.code : directLink;
        navigator.clipboard.writeText(text).then(() => {
            setCopiedType(type);
            setTimeout(() => setCopiedType(null), 2000);
        });
    };

    return (
        <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 text-text animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 border-b border-border pb-4 mb-5">
                    <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                            📱 Szybkie uruchomienie na telefonie
                        </span>
                        <h3 className="text-xl font-bold text-text mt-1.5">
                            Kod QR do badania
                        </h3>
                        {testTitle && (
                            <p className="text-xs text-text-muted mt-0.5">{testTitle}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-text-muted hover:text-text font-bold rounded-lg hover:bg-background"
                        title="Zamknij"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center bg-white rounded-2xl p-5 shadow-inner mx-auto max-w-[280px]">
                    {qrDataUrl ? (
                        <img
                            src={qrDataUrl}
                            alt={`Kod QR dla kodu ${codeObj.code}`}
                            className="w-56 h-56 object-contain"
                        />
                    ) : (
                        <div className="w-56 h-56 flex items-center justify-center text-gray-500 text-xs">
                            Generowanie kodu QR...
                        </div>
                    )}
                </div>

                <div className="mt-5 text-center">
                    <p className="text-xs text-text-muted uppercase tracking-wider">Jednorazowy kod dostępu</p>
                    <p className="text-2xl font-mono font-extrabold text-primary tracking-widest mt-1">
                        {codeObj.code}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                        Ważny do: <strong>{new Date(codeObj.expiresAt).toLocaleDateString('pl-PL')}</strong>
                    </p>
                    <p className="text-xs text-text-muted mt-3 leading-relaxed">
                        Poproś osobę badaną o skierowanie aparatu w telefonie na powyższy kod QR. Badanie otworzy się automatycznie bez konieczności ręcznego przepisywania kodu.
                    </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => handleCopy('code')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-background hover:bg-border/30 text-text font-semibold rounded-xl text-xs border border-border transition-colors"
                    >
                        <ClipboardCopyIcon className="w-4 h-4" />
                        {copiedType === 'code' ? 'Skopiowano kod!' : 'Kopiuj kod'}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCopy('link')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary/15 hover:bg-primary/25 text-primary font-semibold rounded-xl text-xs border border-primary/30 transition-colors"
                    >
                        <LinkIcon className="w-4 h-4" />
                        {copiedType === 'link' ? 'Skopiowano link!' : 'Kopiuj link'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-5 py-2 bg-primary text-primary-contrast font-bold rounded-xl text-xs hover:opacity-90 transition-opacity"
                    >
                        Zamknij
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccessCodeQrModal;
