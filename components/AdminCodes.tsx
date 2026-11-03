'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchActiveCodes, deleteAccessCode } from '@/app/actions/accessCodeActions';
import { fetchTests } from '@/app/actions/testActions';
import { AccessCode, Test } from './types';
import { ClipboardCopyIcon, TrashIcon, LinkIcon } from './common/Icons';
import ActionConfirmModal from './common/ActionConfirmModal';

const AdminCodes = () => {
    const [codes, setCodes] = useState<AccessCode[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState<string>('');
    const [copyLinkSuccess, setCopyLinkSuccess] = useState<string>('');
    const [codeToDelete, setCodeToDelete] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTherapist, setFilterTherapist] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const fetchedCodes = await fetchActiveCodes();
            const fetchedTests = await fetchTests();
            setCodes(fetchedCodes);
            setTests(fetchedTests);
        } catch (err) {
            setError('Nie udało się załadować listy kodów.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopySuccess(code);
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    const handleCopyLink = (codeObj: AccessCode) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const link = `${origin}/test-confirmation?testId=${encodeURIComponent(codeObj.testId)}&clientCode=${encodeURIComponent(codeObj.code)}`;
        navigator.clipboard.writeText(link).then(() => {
            setCopyLinkSuccess(codeObj.code);
            setTimeout(() => setCopyLinkSuccess(''), 2000);
        });
    };

    const confirmDeleteCode = async (code: string) => {
        try {
            await deleteAccessCode(code);
            await loadData();
        } catch {
            setError("Nie udało się unieważnić kodu.");
        }
    };

    const filteredCodes = useMemo(() => {
        return codes.filter(code => {
            const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTherapist = filterTherapist === 'all' || code.therapistName === filterTherapist || code.therapistEmail === filterTherapist;
            return matchesSearch && matchesTherapist;
        });
    }, [codes, searchTerm, filterTherapist]);

    // Extract unique therapists for the filter dropdown
    const uniqueTherapists = useMemo(() => {
        const therapists = new Set<string>();
        codes.forEach(c => {
            if (c.therapistName) therapists.add(c.therapistName);
            else if (c.therapistEmail) therapists.add(c.therapistEmail);
        });
        return Array.from(therapists);
    }, [codes]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">Zarządzanie Kodami Dostępu</h1>
            <p className="opacity-80 mb-8">Podgląd wszystkich wygenerowanych, ale jeszcze niewykorzystanych anonimowych kodów na platformie.</p>

            <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg border border-[var(--border-color)] overflow-hidden">
                <div className="p-4 bg-[var(--background-color)] border-b border-[var(--border-color)] flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-grow w-full sm:w-auto">
                        <label className="block text-xs font-medium text-text-muted mb-1">Szukaj po Kodzie</label>
                        <input
                            type="text"
                            placeholder="Wpisz kod..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-[42px] px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)] text-sm"
                        />
                    </div>
                    <div className="flex-grow w-full sm:w-auto">
                        <label className="block text-xs font-medium text-text-muted mb-1">Filtruj po Terapeucie</label>
                        <select
                            value={filterTherapist}
                            onChange={e => setFilterTherapist(e.target.value)}
                            className="w-full h-[42px] px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)] text-sm"
                        >
                            <option value="all">Wszyscy terapeuci</option>
                            {uniqueTherapists.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">Ładowanie kodów...</div>
                ) : error ? (
                    <div className="p-8 text-center text-[var(--error-color)]">{error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--background-color)] font-semibold opacity-70 border-b border-[var(--border-color)]">
                                <tr>
                                    <th className="p-4">Kod dostępu</th>
                                    <th className="p-4">Przypisany Test</th>
                                    <th className="p-4">Wygenerowany przez</th>
                                    <th className="p-4">Ważny do</th>
                                    <th className="p-4 text-right">Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCodes.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center opacity-60">
                                            Brak aktywnych kodów pasujących do kryteriów.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCodes.map(code => {
                                        const associatedTest = tests.find(t => t.id === code.testId);
                                        const isExpired = new Date(code.expiresAt) < new Date();

                                        return (
                                            <tr key={code.code} className="border-b border-[var(--border-color)]/50 hover:bg-[var(--background-color)]">
                                                <td className="p-4 font-mono font-semibold text-[var(--primary-color)]">{code.code}</td>
                                                <td className="p-4">{associatedTest?.title} <span className="text-xs opacity-50">(v{associatedTest?.version})</span></td>
                                                <td className="p-4 font-medium">{code.therapistName || code.therapistEmail || 'Nieznany'}</td>
                                                <td className={`p-4 ${isExpired ? 'text-red-500 font-bold' : ''}`}>
                                                    {new Date(code.expiresAt).toLocaleDateString()} {isExpired && '(Wygasł)'}
                                                </td>
                                                <td className="p-4 flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleCopyCode(code.code)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-border/30 text-text font-semibold rounded-lg transition-colors text-xs border border-border"
                                                        title="Kopiuj sam kod"
                                                    >
                                                        {copySuccess === code.code ? <span className="text-primary">Skopiowano kod!</span> : <><ClipboardCopyIcon className="w-4 h-4" /> Kopiuj kod</>}
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopyLink(code)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 hover:bg-primary/25 text-primary font-semibold rounded-lg transition-colors text-xs border border-primary/30"
                                                        title="Kopiuj bezpośredni link do badania (bez konieczności wpisywania kodu przez klienta)"
                                                    >
                                                        {copyLinkSuccess === code.code ? <span>Skopiowano link!</span> : <><LinkIcon className="w-4 h-4" /> Kopiuj link</>}
                                                    </button>
                                                    <button
                                                        onClick={() => setCodeToDelete(code.code)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 hover:bg-error/20 text-error font-semibold rounded-lg transition-colors text-xs border border-error/20"
                                                        title="Unieważnij ten kod"
                                                    >
                                                        <TrashIcon className="w-4 h-4" /> Unieważnij
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ActionConfirmModal
                isOpen={!!codeToDelete}
                onCancel={() => setCodeToDelete(null)}
                onConfirm={() => {
                    if (codeToDelete) confirmDeleteCode(codeToDelete);
                    setCodeToDelete(null);
                }}
                title="Unieważnienie kodu"
                message="Czy na pewno chcesz unieważnić ten kod dostępu? Zostanie on trwale usunięty z bazy."
                confirmText="Unieważnij"
            />
        </div>
    );
};

export default AdminCodes;
