'use client';

import React, { useState, useEffect, useMemo, useContext } from 'react';
import type { Test, TestResult } from '../types';
import { calculateTestScores } from '@/lib/scoring/scoreCalculator';
import {
    buildKeyInterpretation,
    resolveScaleLevel,
    isBigFiveFacetScale,
} from '@/lib/interpretationBuilder';
import { OnlineRadarChart } from '../report/ReportCharts';
import { BrandingContext } from '@/contexts/BrandingContext';
import { DownloadIcon } from '../common/Icons';
import DOMPurify from 'isomorphic-dompurify';

interface TestSimulatorModalProps {
    isOpen: boolean;
    test: Test | null;
    onClose: () => void;
}

type SimulationPreset = 'random' | 'min' | 'mid' | 'max';

export const TestSimulatorModal: React.FC<TestSimulatorModalProps> = ({
    isOpen,
    test,
    onClose,
}) => {
    const { branding } = useContext(BrandingContext);
    const [activeTab, setActiveTab] = useState<'report' | 'client'>('report');
    const [simulatedAnswers, setSimulatedAnswers] = useState<Record<string, string>>({});
    const [activePreset, setActivePreset] = useState<SimulationPreset>('random');
    const [previewPageIndex, setPreviewPageIndex] = useState(0);
    const [showScoringBadges, setShowScoringBadges] = useState(true);
    const [chartMode, setChartMode] = useState<'bars' | 'radar'>('bars');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const applyPreset = (preset: SimulationPreset, targetTest: Test) => {
        const nextAnswers: Record<string, string> = {};
        for (const section of targetTest.sections) {
            for (const q of section.questions) {
                if (!q.options || q.options.length === 0) continue;
                let chosenIdx = 0;
                if (preset === 'min') {
                    chosenIdx = 0;
                } else if (preset === 'max') {
                    chosenIdx = q.options.length - 1;
                } else if (preset === 'mid') {
                    chosenIdx = Math.floor((q.options.length - 1) / 2);
                } else {
                    chosenIdx = Math.floor(Math.random() * q.options.length);
                }
                nextAnswers[q.id] = q.options[chosenIdx].id;
            }
        }
        setActivePreset(preset);
        setSimulatedAnswers(nextAnswers);
    };

    useEffect(() => {
        if (isOpen && test) {
            setPreviewPageIndex(0);
            applyPreset('random', test);
        }
    }, [isOpen, test]);

    const simulatedScores = useMemo(() => {
        if (!test) return {};
        try {
            return calculateTestScores(test, simulatedAnswers);
        } catch {
            return {};
        }
    }, [test, simulatedAnswers]);

    const simulatedInterpretationHtml = useMemo(() => {
        if (!test || Object.keys(simulatedScores).length === 0) return '';
        return buildKeyInterpretation(test, simulatedScores);
    }, [test, simulatedScores]);

    const primaryScales = useMemo(() => {
        if (!test) return [];
        const nonFacets = test.scales.filter(s => !isBigFiveFacetScale(s));
        return nonFacets.length > 0 ? nonFacets : test.scales;
    }, [test]);

    if (!isOpen || !test) return null;

    const totalQuestions = test.sections.reduce((acc, s) => acc + s.questions.length, 0);
    const currentSection = test.sections[previewPageIndex] || test.sections[0];
    const questionStartIndex = test.sections
        .slice(0, previewPageIndex)
        .reduce((acc, s) => acc + s.questions.length, 0);

    const handleDownloadSimulatedPdf = async () => {
        if (!test || !branding) return;
        setIsGeneratingPdf(true);
        try {
            const { generatePdf } = await import('@/lib/pdf/pdfGenerator');
            const mockResult: TestResult = {
                id: 'symulacja-podglad',
                testId: test.id,
                testTitle: test.title,
                testVersion: test.version,
                therapistId: 'admin-preview',
                clientIdentifier: `SYMULACJA (${activePreset.toUpperCase()})`,
                completedAt: new Date().toISOString(),
                scores: simulatedScores,
                answers: simulatedAnswers,
                analysis: simulatedInterpretationHtml,
            };
            const pdfBytes = await generatePdf(
                mockResult,
                test,
                branding,
                undefined,
                simulatedInterpretationHtml
            );
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Symulacja_${test.title.replace(/\s+/g, '_')}_v${test.version}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Błąd generowania próbnego PDF:', err);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`Symulator testu: ${test.title}`}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto"
        >
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-5xl text-text max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 sm:p-6 bg-background/80 border-b border-border flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                                Tryb Testowy (Bez zapisu w bazie)
                            </span>
                            <h2 className="text-xl sm:text-2xl font-bold text-text">
                                {test.title} <span className="text-sm font-mono text-text-muted">(v{test.version})</span>
                            </h2>
                        </div>
                        <p className="text-xs text-text-muted mt-1">
                            {totalQuestions} pytań w {test.sections.length} sekcjach &bull; {test.scales.length} skal
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex rounded-xl bg-surface border border-border p-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('report')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === 'report'
                                        ? 'bg-primary text-primary-contrast shadow-sm'
                                        : 'text-text-muted hover:text-text'
                                }`}
                            >
                                📊 Symulator Raportu
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('client')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === 'client'
                                        ? 'bg-primary text-primary-contrast shadow-sm'
                                        : 'text-text-muted hover:text-text'
                                }`}
                            >
                                👁️ Widok Klienta ({totalQuestions} pytań)
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-text-muted hover:text-text font-bold text-lg rounded-lg hover:bg-background"
                            title="Zamknij podgląd"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Preset Bar */}
                <div className="px-6 py-3 bg-background/40 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-text-muted mr-1">Symuluj odpowiedzi:</span>
                        <button
                            type="button"
                            onClick={() => applyPreset('random', test)}
                            className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                                activePreset === 'random'
                                    ? 'bg-primary text-primary-contrast border-primary'
                                    : 'bg-surface text-text border-border hover:border-primary/50'
                            }`}
                        >
                            🎲 Losowe odpowiedzi
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset('min', test)}
                            className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                                activePreset === 'min'
                                    ? 'bg-primary text-primary-contrast border-primary'
                                    : 'bg-surface text-text border-border hover:border-primary/50'
                            }`}
                        >
                            📉 Minimum (1. opcja)
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset('mid', test)}
                            className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                                activePreset === 'mid'
                                    ? 'bg-primary text-primary-contrast border-primary'
                                    : 'bg-surface text-text border-border hover:border-primary/50'
                            }`}
                        >
                            ⚖️ Środek skali
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset('max', test)}
                            className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                                activePreset === 'max'
                                    ? 'bg-primary text-primary-contrast border-primary'
                                    : 'bg-surface text-text border-border hover:border-primary/50'
                            }`}
                        >
                            📈 Maksimum (ostatnia opcja)
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleDownloadSimulatedPdf}
                        disabled={isGeneratingPdf}
                        className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-contrast font-bold rounded-lg shadow hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        <DownloadIcon />
                        {isGeneratingPdf ? 'Generowanie PDF...' : 'Pobierz próbny PDF'}
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {activeTab === 'report' ? (
                        <>
                            {/* Charts & Scales Summary */}
                            <div className="bg-background/60 border border-border rounded-2xl p-5">
                                <div className="flex flex-wrap justify-between items-center gap-3 mb-4 border-b border-border pb-3">
                                    <h3 className="text-lg font-bold text-text">
                                        Wyliczone wyniki skal ({test.scales.length})
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setChartMode('bars')}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                                                chartMode === 'bars'
                                                    ? 'bg-primary text-primary-contrast border-primary'
                                                    : 'bg-surface text-text-muted border-border hover:text-text'
                                            }`}
                                        >
                                            Wykres słupkowy
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setChartMode('radar')}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                                                chartMode === 'radar'
                                                    ? 'bg-primary text-primary-contrast border-primary'
                                                    : 'bg-surface text-text-muted border-border hover:text-text'
                                            }`}
                                        >
                                            Wykres radarowy
                                        </button>
                                    </div>
                                </div>

                                {chartMode === 'radar' && primaryScales.length >= 3 ? (
                                    <div className="py-4">
                                        <OnlineRadarChart
                                            items={primaryScales.map(s => {
                                                const val = simulatedScores[s.id] ?? 0;
                                                const max = s.maxScore || 100;
                                                return {
                                                    name: s.abbreviation || s.name,
                                                    value: val,
                                                    maxScore: max,
                                                    percentage: Math.min(100, Math.max(0, (val / max) * 100)),
                                                };
                                            })}
                                            primaryColor={branding.primaryColor}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {test.scales.map(scale => {
                                            const score = simulatedScores[scale.id] ?? 0;
                                            const max = scale.maxScore || 100;
                                            const pct = Math.min(100, Math.max(0, Math.round((score / max) * 100)));
                                            const levelInfo = resolveScaleLevel(score, scale);
                                            return (
                                                <div key={scale.id} className="p-3 rounded-xl bg-surface border border-border">
                                                    <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm text-text">{scale.name}</span>
                                                            {scale.abbreviation && (
                                                                <span className="text-xs font-mono text-text-muted">({scale.abbreviation})</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                                                                style={{
                                                                    backgroundColor: `${levelInfo.color}25`,
                                                                    color: levelInfo.color,
                                                                    border: `1px solid ${levelInfo.color}55`,
                                                                }}
                                                            >
                                                                {levelInfo.label}
                                                            </span>
                                                            <span className="font-mono font-bold text-sm text-text">
                                                                {Number.isInteger(score) ? score : score.toFixed(1)} / {max} pkt ({pct}%)
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-background rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-300"
                                                            style={{
                                                                width: `${pct}%`,
                                                                backgroundColor: levelInfo.color || 'var(--primary-color)',
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Automatic Key Interpretation Preview */}
                            <div className="bg-background/60 border border-border rounded-2xl p-5">
                                <h3 className="text-lg font-bold text-text mb-3 border-b border-border pb-2">
                                    Automatyczna interpretacja wygenerowana z klucza testu
                                </h3>
                                {simulatedInterpretationHtml ? (
                                    <div
                                        className="prose prose-sm prose-invert max-w-none text-text space-y-2 leading-relaxed"
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(simulatedInterpretationHtml),
                                        }}
                                    />
                                ) : (
                                    <p className="text-xs text-text-muted italic">
                                        Brak opisów interpretacyjnych w progach skal tego testu.
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Client View Tab */
                        <div className="space-y-6">
                            {test.instructions && (
                                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-sm text-text leading-relaxed">
                                    <strong className="text-primary block mb-1">Instrukcja wyświetlana badanemu:</strong>
                                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(test.instructions) }} />
                                </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-3 bg-background/60 p-3.5 rounded-xl border border-border">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {test.sections.map((sec, idx) => {
                                        const rawTitle = (sec.title || '').trim();
                                        const startsWithPrefix = /^(część|czesc|sekcja)\s*\d+/i.test(rawTitle);
                                        const btnLabel = startsWithPrefix
                                            ? `${rawTitle} (${sec.questions.length})`
                                            : `Część ${idx + 1}: ${rawTitle || `Sekcja ${idx + 1}`} (${sec.questions.length})`;
                                        return (
                                            <button
                                                key={sec.id}
                                                type="button"
                                                onClick={() => setPreviewPageIndex(idx)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                                    previewPageIndex === idx
                                                        ? 'bg-primary text-primary-contrast border-primary'
                                                        : 'bg-surface text-text-muted border-border hover:text-text'
                                                }`}
                                            >
                                                {btnLabel}
                                            </button>
                                        );
                                    })}
                                </div>

                                <label className="flex items-center gap-2 text-xs font-semibold text-text cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showScoringBadges}
                                        onChange={e => setShowScoringBadges(e.target.checked)}
                                        className="h-4 w-4 accent-[var(--primary-color)]"
                                    />
                                    Pokaż punktację opcji (diagnostyka klucza)
                                </label>
                            </div>

                            {currentSection && (
                                <div className="space-y-6 bg-background/40 border border-border rounded-2xl p-6">
                                    {currentSection.questions.map((q, qIdx) => {
                                        const selectedOptId = simulatedAnswers[q.id];
                                        return (
                                            <div key={q.id} className="border-b border-border/60 pb-6 last:border-b-0 last:pb-0">
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <p className="font-semibold text-base text-text">
                                                        {questionStartIndex + qIdx + 1}.{' '}
                                                        <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(q.text.replace(/^\s*\d+[\.\)]\s*/, '')) }} />
                                                    </p>
                                                    {q.isReversed && (
                                                        <span className="shrink-0 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                                            Odwrócone
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                                                    {q.options.map(opt => {
                                                        const isSelected = selectedOptId === opt.id;
                                                        const rules = q.scoring?.[opt.id] || [];
                                                        return (
                                                            <button
                                                                key={opt.id}
                                                                type="button"
                                                                onClick={() =>
                                                                    setSimulatedAnswers(prev => ({
                                                                        ...prev,
                                                                        [q.id]: opt.id,
                                                                    }))
                                                                }
                                                                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                                                                    isSelected
                                                                        ? 'bg-primary/20 border-primary text-text shadow-md'
                                                                        : 'bg-surface border-border text-text-muted hover:text-text hover:border-primary/40'
                                                                }`}
                                                            >
                                                                <span className="text-xs font-semibold leading-snug">{opt.text}</span>
                                                                {showScoringBadges && rules.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 pt-1 border-t border-border/50">
                                                                        {rules.map((r, rIdx) => {
                                                                            const sc = test.scales.find(s => s.id === r.scaleId);
                                                                            return (
                                                                                <span
                                                                                    key={rIdx}
                                                                                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background text-primary border border-border"
                                                                                >
                                                                                    {sc?.abbreviation || sc?.name || r.scaleId}: {r.points >= 0 ? `+${r.points}` : r.points}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-background/80 border-t border-border flex justify-between items-center">
                    <p className="text-xs text-text-muted">
                        Zmiana odpowiedzi w zakładce „Widok Klienta” na żywo przelicza wykresy i interpretację w „Symulatorze Raportu”.
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-primary text-primary-contrast font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
                    >
                        Zamknij podgląd
                    </button>
                </div>
            </div>
        </div>
    );
};
export default TestSimulatorModal;
