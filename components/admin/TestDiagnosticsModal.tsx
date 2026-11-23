'use client';

import React, { useMemo, useState } from 'react';
import type { Test } from '@/components/types';
import { auditTestIntegrity, type TestAuditReport } from '@/lib/scoring/testAuditor';

interface TestDiagnosticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tests: Test[];
    onEditTest?: (testId: string) => void;
}

export const TestDiagnosticsModal: React.FC<TestDiagnosticsModalProps> = ({
    isOpen,
    onClose,
    tests,
    onEditTest,
}) => {
    const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

    const reports: TestAuditReport[] = useMemo(() => {
        if (!isOpen) return [];
        return tests.map(t => auditTestIntegrity(t));
    }, [isOpen, tests]);

    if (!isOpen) return null;

    const totalErrors = reports.reduce((acc, r) => acc + r.errorCount, 0);
    const totalWarnings = reports.reduce((acc, r) => acc + r.warningCount, 0);
    const healthyCount = reports.filter(r => r.errorCount === 0 && r.warningCount === 0).length;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="bg-surface border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-text"
                onClick={e => e.stopPropagation()}
            >
                <header className="px-6 py-5 bg-background/70 border-b border-border flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">
                            Tryb bezpieczny (100% Read-Only — bez modyfikacji bazy danych)
                        </p>
                        <h2 className="text-2xl font-bold text-text mt-0.5">
                            Diagnostyka spójności i kluczy testów ({reports.length})
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-text-muted hover:text-text font-bold text-xl px-2"
                        aria-label="Zamknij"
                    >
                        ✕
                    </button>
                </header>

                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Summary Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                            <p className="text-xs text-text-muted uppercase font-semibold">W pełni spójne</p>
                            <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                                {healthyCount} / {reports.length}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <p className="text-xs text-text-muted uppercase font-semibold">Ostrzeżenia</p>
                            <p className="text-2xl font-extrabold text-amber-400 mt-1">{totalWarnings}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                            <p className="text-xs text-text-muted uppercase font-semibold">Błędy krytyczne klucza</p>
                            <p className="text-2xl font-extrabold text-red-400 mt-1">{totalErrors}</p>
                        </div>
                    </div>

                    {/* Per-Test Audit Cards */}
                    <div className="space-y-3">
                        {reports.map(report => {
                            const isExpanded = expandedTestId === report.testId || report.issues.length > 0;
                            return (
                                <div
                                    key={report.testId}
                                    className="bg-background/60 border border-border rounded-xl overflow-hidden"
                                >
                                    <div
                                        className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-background/90 transition-colors"
                                        onClick={() =>
                                            setExpandedTestId(prev =>
                                                prev === report.testId ? null : report.testId
                                            )
                                        }
                                    >
                                        <div>
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <h3 className="font-bold text-base text-text">{report.title}</h3>
                                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                                                    v{report.version}
                                                </span>
                                                <span
                                                    className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                                                        report.status === 'PUBLISHED'
                                                            ? 'bg-emerald-500/20 text-emerald-300'
                                                            : 'bg-amber-500/20 text-amber-300'
                                                    }`}
                                                >
                                                    {report.status === 'PUBLISHED' ? 'Opublikowany' : 'Szkic'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-muted mt-1">
                                                {report.questionCount} pytań &bull; {report.scaleCount} skal
                                                {report.simulationSummary && (
                                                    <>
                                                        {' '}
                                                        &bull; Symulacja silnika liczącego i interpretacji:{' '}
                                                        <strong className="text-emerald-400">OK</strong> (
                                                        {report.simulationSummary.interpretationLength} znaków HTML)
                                                    </>
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {report.errorCount === 0 && report.warningCount === 0 ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                    ✓ Spójny (0 błędów)
                                                </span>
                                            ) : (
                                                <>
                                                    {report.errorCount > 0 && (
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                                            ✕ {report.errorCount} błędów
                                                        </span>
                                                    )}
                                                    {report.warningCount > 0 && (
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                            ⚠ {report.warningCount} ostrzeżeń
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                            {onEditTest && (
                                                <button
                                                    type="button"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onEditTest(report.testId);
                                                    }}
                                                    className="px-3 py-1 text-xs font-semibold bg-surface border border-border hover:border-primary rounded-lg transition-colors"
                                                >
                                                    Otwórz w edytorze
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="px-4 pb-4 pt-2 border-t border-border/60 text-xs space-y-2">
                                            {report.issues.length === 0 ? (
                                                <p className="text-emerald-400 font-medium">
                                                    ✓ Wszystkie pytania mają przypisane skale, progi punktowe pokrywają pełny zakres bez luk, a symulacja obliczeniowa zakończyła się sukcesem.
                                                </p>
                                            ) : (
                                                <ul className="space-y-1.5">
                                                    {report.issues.map((issue, idx) => (
                                                        <li
                                                            key={idx}
                                                            className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                                                                issue.severity === 'error'
                                                                    ? 'bg-red-500/10 border-red-500/30 text-red-200'
                                                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                                            }`}
                                                        >
                                                            <span className="font-bold uppercase shrink-0">
                                                                [{issue.severity === 'error' ? 'BŁĄD' : 'UWAGA'}]
                                                            </span>
                                                            <span>{issue.message}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <footer className="px-6 py-4 bg-background/70 border-t border-border flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-primary text-primary-contrast font-bold rounded-xl shadow hover:opacity-90 transition-all text-sm"
                    >
                        Zamknij raport diagnostyczny
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default TestDiagnosticsModal;
