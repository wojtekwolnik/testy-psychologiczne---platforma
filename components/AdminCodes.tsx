'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchActiveCodes, deleteAccessCode, reassignAccessCode, generateAccessCodesBatch } from '@/app/actions/accessCodeActions';
import { fetchTests } from '@/app/actions/testActions';
import { getUsers, UserData } from '@/app/actions/userActions';
import { AccessCode, Test } from './types';
import { ClipboardCopyIcon, TrashIcon, LinkIcon, PlusIcon } from './common/Icons';
import ActionConfirmModal from './common/ActionConfirmModal';

const AdminCodes = () => {
    const [codes, setCodes] = useState<(AccessCode & { therapistName?: string; therapistEmail?: string })[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState<string>('');
    const [copyLinkSuccess, setCopyLinkSuccess] = useState<string>('');
    const [reassignSuccess, setReassignSuccess] = useState<string>('');
    const [reassigningCode, setReassigningCode] = useState<string | null>(null);
    const [codeToDelete, setCodeToDelete] = useState<string | null>(null);

    // Batch generator state
    const [selectedTestId, setSelectedTestId] = useState<string>('');
    const [selectedTherapistId, setSelectedTherapistId] = useState<string>('');
    const [expiryDate, setExpiryDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
    });
    const [codeCount, setCodeCount] = useState<number>(1);
    const [lastBatchCodes, setLastBatchCodes] = useState<AccessCode[]>([]);
    const [batchCopyMessage, setBatchCopyMessage] = useState<string>('');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTherapist, setFilterTherapist] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [fetchedCodes, fetchedTests, fetchedUsers] = await Promise.all([
                fetchActiveCodes(),
                fetchTests(),
                getUsers()
            ]);
            setCodes(fetchedCodes);
            setTests(fetchedTests);
            setUsers(fetchedUsers);

            const published = fetchedTests.filter(t => t.status === 'PUBLISHED');
            if (published.length > 0 && !selectedTestId) {
                setSelectedTestId(published[0].id);
            }
            if (fetchedUsers.length > 0 && !selectedTherapistId) {
                setSelectedTherapistId(fetchedUsers[0].id);
            }
        } catch (err) {
            setError('Nie udało się załadować listy kodów.');
        } finally {
            setIsLoading(false);
        }
    };

    const publishedTests = useMemo(() => tests.filter(t => t.status === 'PUBLISHED'), [tests]);

    const handleGenerateBatch = async () => {
        if (!selectedTestId || !expiryDate || !selectedTherapistId) return;
        const expiry = new Date(expiryDate);
        expiry.setHours(23, 59, 59, 999);
        try {
            setError(null);
            const created = await generateAccessCodesBatch(selectedTestId, expiry, selectedTherapistId, codeCount);
            if (created && created.length > 0) {
                const targetUser = users.find(u => u.id === selectedTherapistId);
                const enriched = created.map(c => ({
                    ...c,
                    therapistName: targetUser?.username || undefined,
                    therapistEmail: targetUser?.email || undefined,
                }));
                setCodes(prev => [...enriched, ...prev]);
                setLastBatchCodes(created);
            }
        } catch (err: any) {
            setError(err?.message || 'Nie udało się wygenerować kodów dostępu.');
        }
    };

    const handleCopyBatch = (mode: 'codes' | 'links') => {
        if (lastBatchCodes.length === 0) return;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const text = lastBatchCodes
            .map(c => mode === 'codes'
                ? c.code
                : `${c.code}: ${origin}/test-confirmation?testId=${encodeURIComponent(c.testId)}&clientCode=${encodeURIComponent(c.code)}`)
            .join('\n');
        navigator.clipboard.writeText(text).then(() => {
            setBatchCopyMessage(mode === 'codes' ? 'Skopiowano wszystkie kody!' : 'Skopiowano wszystkie linki!');
            setTimeout(() => setBatchCopyMessage(''), 2500);
        });
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

    const handleReassignCode = async (code: string, newTherapistId: string) => {
        setReassigningCode(code);
        setError(null);
        try {
            await reassignAccessCode(code, newTherapistId);
            const targetUser = users.find(u => u.id === newTherapistId);
            setCodes(prev => prev.map(c => c.code === code ? {
                ...c,
                therapistId: newTherapistId,
                therapistName: targetUser?.username || undefined,
                therapistEmail: targetUser?.email || undefined,
            } : c));
            setReassignSuccess(code);
            setTimeout(() => setReassignSuccess(''), 2500);
        } catch (err: any) {
            setError(err?.message || 'Nie udało się przekazać kodu innemu terapeucie.');
        } finally {
            setReassigningCode(null);
        }
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
            const matchesTherapist = filterTherapist === 'all' || code.therapistId === filterTherapist || code.therapistName === filterTherapist || code.therapistEmail === filterTherapist;
            return matchesSearch && matchesTherapist;
        });
    }, [codes, searchTerm, filterTherapist]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">Zarządzanie Kodami Dostępu</h1>
            <p className="opacity-80 mb-8">Podgląd wszystkich aktywnych, niewykorzystanych kodów, seryjne generowanie kodów oraz możliwość przekazania kodu innemu terapeucie.</p>

            {/* Batch Code Generator */}
            <div className="bg-surface/60 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-border/50 mb-8 p-6">
                <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-grow w-full sm:w-auto">
                        <label className="block text-xs font-medium text-text-muted mb-1">Wybierz test</label>
                        <select
                            value={selectedTestId}
                            onChange={e => setSelectedTestId(e.target.value)}
                            className="w-full h-[46px] px-4 py-2 border border-border rounded-xl bg-input-bg text-input-text text-sm"
                        >
                            {publishedTests.length === 0 ? (
                                <option value="">Brak opublikowanych testów</option>
                            ) : (
                                publishedTests.map(t => <option key={t.id} value={t.id}>{t.title} (v{t.version})</option>)
                            )}
                        </select>
                    </div>
                    <div className="flex-grow w-full sm:w-auto">
                        <label className="block text-xs font-medium text-text-muted mb-1">Przypisz do terapeuty</label>
                        <select
                            value={selectedTherapistId}
                            onChange={e => setSelectedTherapistId(e.target.value)}
                            className="w-full h-[46px] px-4 py-2 border border-border rounded-xl bg-input-bg text-input-text text-sm"
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.username || u.email} ({u.role === 'admin' ? 'Admin' : 'Terapeuta'})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full sm:w-44">
                        <label className="block text-xs font-medium text-text-muted mb-1">Data ważności</label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={e => setExpiryDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full h-[46px] px-3 py-2 border border-border rounded-xl bg-input-bg text-input-text text-sm"
                        />
                    </div>
                    <div className="w-full sm:w-32">
                        <label className="block text-xs font-medium text-text-muted mb-1">Liczba kodów</label>
                        <select
                            value={codeCount}
                            onChange={e => setCodeCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                            className="w-full h-[46px] px-3 py-2 border border-border rounded-xl bg-input-bg text-input-text text-sm font-semibold"
                        >
                            {[1, 2, 3, 5, 10, 15, 20].map(n => (
                                <option key={n} value={n}>{n} {n === 1 ? 'kod' : n < 5 ? 'kody' : 'kodów'}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerateBatch}
                        className="flex items-center justify-center gap-2 px-6 bg-primary text-primary-contrast font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all h-[46px] w-full sm:w-auto flex-shrink-0 text-sm"
                    >
                        <PlusIcon /> {codeCount > 1 ? `Generuj (${codeCount})` : 'Generuj kod'}
                    </button>
                </div>

                {lastBatchCodes.length > 1 && (
                    <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/30 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-primary">
                                Wygenerowano serię {lastBatchCodes.length} kodów dostępu:
                            </p>
                            <p className="text-xs font-mono text-text-muted mt-1">
                                {lastBatchCodes.map(c => c.code).join(', ')}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {batchCopyMessage && (
                                <span className="text-xs font-semibold text-primary mr-2">{batchCopyMessage}</span>
                            )}
                            <button
                                type="button"
                                onClick={() => handleCopyBatch('codes')}
                                className="px-3 py-1.5 bg-surface border border-border hover:bg-white/5 text-text text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                                <ClipboardCopyIcon className="w-4 h-4" /> Kopiuj wszystkie kody
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCopyBatch('links')}
                                className="px-3 py-1.5 bg-primary text-background hover:bg-primary/90 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                                <LinkIcon className="w-4 h-4" /> Kopiuj wszystkie linki ({lastBatchCodes.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setLastBatchCodes([])}
                                className="px-2 py-1 text-xs text-text-muted hover:text-text"
                                title="Ukryj pasek serii"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}
            </div>

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
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.username || u.email} ({u.role === 'admin' ? 'Admin' : 'Terapeuta'})
                                </option>
                            ))}
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
                                    <th className="p-4">Przypisany Terapeuta (Przekaż kod)</th>
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
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={code.therapistId}
                                                            disabled={reassigningCode === code.code}
                                                            onChange={e => handleReassignCode(code.code, e.target.value)}
                                                            className="px-2.5 py-1.5 rounded-lg border border-border bg-input-bg text-input-text text-xs font-medium focus:ring-2 focus:ring-primary/50"
                                                            title="Przekaż ten kod innemu terapeucie"
                                                        >
                                                            {users.map(u => (
                                                                <option key={u.id} value={u.id}>
                                                                    {u.username || u.email} ({u.role === 'admin' ? 'Admin' : 'Terapeuta'})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {reassignSuccess === code.code && (
                                                            <span className="text-xs text-primary font-semibold">Przekazano!</span>
                                                        )}
                                                    </div>
                                                </td>
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
