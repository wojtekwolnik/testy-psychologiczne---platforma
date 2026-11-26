'use client';

import React, { useState, useEffect, useMemo, useContext } from 'react';
import type { Test, TestResult, Scale } from '../types';
import { resolveScaleLevel, isBigFiveFacetScale } from '@/lib/interpretationBuilder';
import { BrandingContext } from '@/contexts/BrandingContext';
import DOMPurify from 'isomorphic-dompurify';
import { toast } from 'react-toastify';

interface ResultComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialResultA: TestResult | null;
    initialResultB?: TestResult | null;
    availableResults: TestResult[];
    test: Test | null;
    onAppendComparisonToNotes?: (htmlSummary: string) => void;
}

interface DualRadarItem {
    name: string;
    fullName: string;
    scoreA: number;
    scoreB: number;
    maxScore: number;
}

const ComparisonRadarChart: React.FC<{
    items: DualRadarItem[];
    labelA: string;
    labelB: string;
    colorA?: string;
    colorB?: string;
}> = ({ items, labelA, labelB, colorA = '#60a5fa', colorB = '#2f7a3e' }) => {
    const width = 500;
    const height = 380;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 112;
    const count = items.length;

    if (count < 3) {
        return (
            <div className="p-6 text-center text-text-muted text-sm">
                Wykres radarowy wymaga co najmniej 3 skal z określonym wynikiem maksymalnym.
            </div>
        );
    }

    const getPoint = (index: number, ratio: number) => {
        const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
        const r = radius * Math.max(0, Math.min(1, ratio));
        return {
            x: centerX + r * Math.cos(angle),
            y: centerY + r * Math.sin(angle),
        };
    };

    const rings = [0.25, 0.5, 0.75, 1];
    const polygonPointsA = items
        .map((item, idx) => {
            const pt = getPoint(idx, item.maxScore ? item.scoreA / item.maxScore : 0);
            return `${pt.x},${pt.y}`;
        })
        .join(' ');

    const polygonPointsB = items
        .map((item, idx) => {
            const pt = getPoint(idx, item.maxScore ? item.scoreB / item.maxScore : 0);
            return `${pt.x},${pt.y}`;
        })
        .join(' ');

    return (
        <div className="flex flex-col items-center justify-center py-4 px-2">
            <div className="flex flex-wrap items-center justify-center gap-6 mb-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-1.5 rounded-full" style={{ backgroundColor: colorA }} />
                    <span className="text-text">Badanie 1 (Pre): {labelA}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-1.5 rounded-full" style={{ backgroundColor: colorB }} />
                    <span className="text-text">Badanie 2 (Post): {labelB}</span>
                </div>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[480px] h-auto overflow-visible">
                {rings.map(ring => {
                    const ringPts = items
                        .map((_, idx) => {
                            const pt = getPoint(idx, ring);
                            return `${pt.x},${pt.y}`;
                        })
                        .join(' ');
                    return (
                        <polygon
                            key={ring}
                            points={ringPts}
                            fill="none"
                            stroke="var(--border-color)"
                            strokeWidth="1"
                            strokeDasharray={ring < 1 ? '3 3' : undefined}
                        />
                    );
                })}

                {items.map((item, idx) => {
                    const end = getPoint(idx, 1);
                    const angle = (Math.PI * 2 * idx) / count - Math.PI / 2;
                    const cosA = Math.cos(angle);
                    const labelDist = radius + 22;
                    const labelX = centerX + labelDist * Math.cos(angle);
                    const labelY = centerY + labelDist * Math.sin(angle);
                    const anchor = cosA > 0.35 ? 'start' : cosA < -0.35 ? 'end' : 'middle';
                    const delta = item.scoreB - item.scoreA;
                    const deltaStr = delta > 0 ? `+${Number.isInteger(delta) ? delta : delta.toFixed(1)}` : `${Number.isInteger(delta) ? delta : delta.toFixed(1)}`;
                    const shortName = item.name.length > 24 ? item.name.slice(0, 22) + '…' : item.name;
                    return (
                        <g key={item.name + idx}>
                            <line
                                x1={centerX}
                                y1={centerY}
                                x2={end.x}
                                y2={end.y}
                                stroke="var(--border-color)"
                                strokeWidth="1"
                            />
                            <text
                                x={labelX}
                                y={labelY}
                                textAnchor={anchor}
                                dominantBaseline="middle"
                                className="fill-current text-text text-[10px] font-bold"
                            >
                                {shortName} ({item.scoreA}→{item.scoreB}{delta !== 0 ? ` [${deltaStr}]` : ''})
                            </text>
                        </g>
                    );
                })}

                {/* Pre-test polygon (A) */}
                <polygon
                    points={polygonPointsA}
                    fill={colorA}
                    fillOpacity="0.16"
                    stroke={colorA}
                    strokeWidth="2.2"
                    strokeDasharray="5 3"
                />
                {/* Post-test polygon (B) */}
                <polygon
                    points={polygonPointsB}
                    fill={colorB}
                    fillOpacity="0.24"
                    stroke={colorB}
                    strokeWidth="2.6"
                />

                {items.map((item, idx) => {
                    const ptA = getPoint(idx, item.maxScore ? item.scoreA / item.maxScore : 0);
                    const ptB = getPoint(idx, item.maxScore ? item.scoreB / item.maxScore : 0);
                    return (
                        <g key={`dots-${idx}`}>
                            <circle cx={ptA.x} cy={ptA.y} r="3.5" fill={colorA} />
                            <circle cx={ptB.x} cy={ptB.y} r="4" fill={colorB} />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export const ResultComparisonModal: React.FC<ResultComparisonModalProps> = ({
    isOpen,
    onClose,
    initialResultA,
    initialResultB,
    availableResults,
    test,
    onAppendComparisonToNotes,
}) => {
    const { branding } = useContext(BrandingContext);
    const [resultAId, setResultAId] = useState<string>('');
    const [resultBId, setResultBId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'scales' | 'radar' | 'questions'>('scales');
    const [scaleFilterMode, setScaleFilterMode] = useState<'all' | 'primary' | 'changed-level'>('all');
    const [onlyChangedAnswers, setOnlyChangedAnswers] = useState<boolean>(true);
    const [questionScaleFilter, setQuestionScaleFilter] = useState<string>('all');
    const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

    // Filter available results to same test (by testId or testTitle)
    const matchingResults = useMemo(() => {
        if (!initialResultA && !test) return availableResults;
        const targetTestId = test?.id || initialResultA?.testId;
        const targetTitle = test?.title || initialResultA?.testTitle;
        return availableResults
            .filter(r => r.testId === targetTestId || (targetTitle && r.testTitle === targetTitle))
            .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
    }, [availableResults, initialResultA, test]);

    useEffect(() => {
        if (!isOpen || matchingResults.length === 0) return;

        if (initialResultA && initialResultB && initialResultA.id !== initialResultB.id) {
            const timeA = new Date(initialResultA.completedAt).getTime();
            const timeB = new Date(initialResultB.completedAt).getTime();
            if (timeA <= timeB) {
                setResultAId(initialResultA.id);
                setResultBId(initialResultB.id);
            } else {
                setResultAId(initialResultB.id);
                setResultBId(initialResultA.id);
            }
            return;
        }

        if (initialResultA) {
            const other = matchingResults.find(r => r.id !== initialResultA.id);
            if (other) {
                const timeInit = new Date(initialResultA.completedAt).getTime();
                const timeOther = new Date(other.completedAt).getTime();
                if (timeInit <= timeOther) {
                    setResultAId(initialResultA.id);
                    setResultBId(other.id);
                } else {
                    setResultAId(other.id);
                    setResultBId(initialResultA.id);
                }
            } else {
                setResultAId(initialResultA.id);
                setResultBId(initialResultA.id);
            }
        } else if (matchingResults.length >= 2) {
            setResultAId(matchingResults[0].id);
            setResultBId(matchingResults[matchingResults.length - 1].id);
        } else if (matchingResults.length === 1) {
            setResultAId(matchingResults[0].id);
            setResultBId(matchingResults[0].id);
        }
    }, [isOpen, initialResultA, initialResultB, matchingResults]);

    const resultA = useMemo(
        () => matchingResults.find(r => r.id === resultAId) || initialResultA || null,
        [matchingResults, resultAId, initialResultA]
    );
    const resultB = useMemo(
        () => matchingResults.find(r => r.id === resultBId) || initialResultB || resultA,
        [matchingResults, resultBId, initialResultB, resultA]
    );

    const hasFacets = useMemo(() => {
        if (!test) return false;
        return test.scales.some(s => isBigFiveFacetScale(s));
    }, [test]);

    const scaleComparisons = useMemo(() => {
        if (!test || !resultA || !resultB) return [];
        return test.scales.map((scale: Scale) => {
            const scoreA = Number(resultA.scores?.[scale.id] ?? 0);
            const scoreB = Number(resultB.scores?.[scale.id] ?? 0);
            const max = scale.maxScore || 100;
            const pctA = Math.min(100, Math.max(0, Math.round((scoreA / max) * 100)));
            const pctB = Math.min(100, Math.max(0, Math.round((scoreB / max) * 100)));
            const delta = Number((scoreB - scoreA).toFixed(2));
            const deltaPct = pctB - pctA;
            const levelA = resolveScaleLevel(scoreA, scale);
            const levelB = resolveScaleLevel(scoreB, scale);
            const levelChanged = levelA.label !== levelB.label;

            return {
                scale,
                scoreA,
                scoreB,
                max,
                pctA,
                pctB,
                delta,
                deltaPct,
                levelA,
                levelB,
                levelChanged,
                isFacet: isBigFiveFacetScale(scale),
            };
        });
    }, [test, resultA, resultB]);

    const filteredScaleComparisons = useMemo(() => {
        return scaleComparisons.filter(item => {
            if (scaleFilterMode === 'primary') return !item.isFacet;
            if (scaleFilterMode === 'changed-level') return item.levelChanged;
            return true;
        });
    }, [scaleComparisons, scaleFilterMode]);

    const radarItems = useMemo(() => {
        const base = hasFacets ? scaleComparisons.filter(i => !i.isFacet) : scaleComparisons;
        return base.map(i => ({
            name: i.scale.abbreviation || i.scale.name,
            fullName: i.scale.name,
            scoreA: i.scoreA,
            scoreB: i.scoreB,
            maxScore: i.max,
        }));
    }, [scaleComparisons, hasFacets]);

    const stats = useMemo(() => {
        let increased = 0;
        let decreased = 0;
        let unchanged = 0;
        let levelShifts = 0;
        scaleComparisons.forEach(item => {
            if (item.delta > 0) increased++;
            else if (item.delta < 0) decreased++;
            else unchanged++;
            if (item.levelChanged) levelShifts++;
        });
        return { increased, decreased, unchanged, levelShifts };
    }, [scaleComparisons]);

    if (!isOpen || !test || !resultA || !resultB) return null;

    const formatResultLabel = (r: TestResult) => {
        const dateStr = new Date(r.completedAt).toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        return `${r.clientIdentifier} (${dateStr})`;
    };

    const handleSwapResults = () => {
        const prevA = resultAId;
        setResultAId(resultBId);
        setResultBId(prevA);
    };

    const buildComparisonHtmlSummary = () => {
        const labelA = formatResultLabel(resultA);
        const labelB = formatResultLabel(resultB);
        const rowsToSummarize = hasFacets ? scaleComparisons.filter(i => !i.isFacet) : scaleComparisons;

        const lines = rowsToSummarize.map(item => {
            const sign = item.delta > 0 ? `+${item.delta}` : `${item.delta}`;
            const shiftNote = item.levelChanged
                ? ` <em>(zmiana poziomu: ${item.levelA.label} &rarr; ${item.levelB.label})</em>`
                : ` (${item.levelB.label})`;
            return `<li><strong>${item.scale.name}:</strong> ${item.scoreA} pkt &rarr; <strong>${item.scoreB} pkt</strong> (różnica: <strong>${sign} pkt</strong>)${shiftNote}</li>`;
        });

        return `<p><br></p><p><strong>PORÓWNANIE WYNIKÓW (PRE-TEST vs POST-TEST): ${test.title}</strong></p><p>Badanie 1 (Pre): <strong>${labelA}</strong> &bull; Badanie 2 (Post): <strong>${labelB}</strong></p><ul>${lines.join('')}</ul>`;
    };

    const handleDownloadComparisonPdf = async () => {
        if (!resultA || !resultB || !test || !branding) return;
        setIsDownloadingPdf(true);
        try {
            const { generateComparisonPdf } = await import('@/lib/pdf/pdfGenerator');
            const pdfBytes = await generateComparisonPdf(resultA, resultB, test, branding);
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const safeA = (resultA.clientIdentifier || 'Pre').replace(/[^a-zA-Z0-9\-_]/g, '_');
            const safeB = (resultB.clientIdentifier || 'Post').replace(/[^a-zA-Z0-9\-_]/g, '_');
            link.download = `Raport-Porownawczy-${safeA}-vs-${safeB}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Wygenerowano raport porównawczy PDF!');
        } catch (err) {
            console.error('Błąd generowania raportu porównawczego PDF:', err);
            toast.error('Nie udało się wygenerować raportu porównawczego PDF.');
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const handleCopySummary = async () => {
        const labelA = formatResultLabel(resultA);
        const labelB = formatResultLabel(resultB);
        const textLines = scaleComparisons.map(item => {
            const sign = item.delta > 0 ? `+${item.delta}` : `${item.delta}`;
            const shift = item.levelChanged ? ` [Zmiana progu: ${item.levelA.label} -> ${item.levelB.label}]` : ` [${item.levelB.label}]`;
            return `- ${item.scale.name}: ${item.scoreA}/${item.max} pkt -> ${item.scoreB}/${item.max} pkt (${sign} pkt)${shift}`;
        });
        const fullText = `PORÓWNANIE WYNIKÓW: ${test.title}\nBadanie 1 (Pre): ${labelA}\nBadanie 2 (Post): ${labelB}\n\n${textLines.join('\n')}`;
        try {
            await navigator.clipboard.writeText(fullText);
            toast.success('Skopiowano podsumowanie porównania do schowka!');
        } catch {
            toast.error('Nie udało się skopiować do schowka.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-5xl text-text max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 sm:p-6 bg-background/80 border-b border-border flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                                ⇄ Porównanie Pre-test / Post-test
                            </span>
                            <h2 className="text-xl sm:text-2xl font-bold text-text">
                                {test.title} <span className="text-sm font-mono text-text-muted">(v{test.version})</span>
                            </h2>
                        </div>
                        <p className="text-xs text-text-muted mt-1">
                            Zestawienie zmian punktowych (Δ), przesunięć między progami interpretacyjnymi oraz różnic w odpowiedziach.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-text-muted hover:text-text font-bold text-lg rounded-lg hover:bg-background"
                        title="Zamknij porównanie"
                    >
                        ✕
                    </button>
                </div>

                {/* Selector Bar for Result A & Result B */}
                <div className="px-6 py-4 bg-background/50 border-b border-border grid grid-cols-1 md:grid-cols-11 gap-3 items-end">
                    <div className="md:col-span-5">
                        <label className="block text-xs font-bold text-blue-400 mb-1">
                            Badanie 1 (Bazowe / Pre-test)
                        </label>
                        <select
                            value={resultA.id}
                            onChange={e => setResultAId(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-border bg-input-bg text-input-text text-xs sm:text-sm font-medium"
                        >
                            {matchingResults.map(r => (
                                <option key={r.id} value={r.id}>
                                    {formatResultLabel(r)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-1 flex justify-center">
                        <button
                            type="button"
                            onClick={handleSwapResults}
                            className="px-3 py-2.5 rounded-xl bg-surface border border-border hover:border-primary text-text font-bold text-sm transition-colors"
                            title="Zamień miejscami Badanie 1 i Badanie 2"
                        >
                            ⇄
                        </button>
                    </div>

                    <div className="md:col-span-5">
                        <label className="block text-xs font-bold text-primary mb-1">
                            Badanie 2 (Porównawcze / Post-test)
                        </label>
                        <select
                            value={resultB.id}
                            onChange={e => setResultBId(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-border bg-input-bg text-input-text text-xs sm:text-sm font-medium"
                        >
                            {matchingResults.map(r => (
                                <option key={r.id} value={r.id}>
                                    {formatResultLabel(r)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Summary Stats & View Tabs */}
                <div className="px-6 py-3 bg-background/30 border-b border-border flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-surface border border-border text-text">
                            Wzrost w skalach: <strong className="text-amber-400">{stats.increased}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-surface border border-border text-text">
                            Spadek w skalach: <strong className="text-emerald-400">{stats.decreased}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-surface border border-border text-text">
                            Bez zmian: <strong>{stats.unchanged}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary font-semibold">
                            Zmiana progu interpretacyjnego: <strong>{stats.levelShifts}</strong>
                        </span>
                    </div>

                    <div className="flex rounded-xl bg-surface border border-border p-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('scales')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'scales'
                                    ? 'bg-primary text-primary-contrast shadow-sm'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            📊 Skale i Różnice (Δ)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('radar')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'radar'
                                    ? 'bg-primary text-primary-contrast shadow-sm'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            🕸️ Wykres Radarowy
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('questions')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'questions'
                                    ? 'bg-primary text-primary-contrast shadow-sm'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            📝 Odpowiedzi na Pytania
                        </button>
                    </div>
                </div>

                {/* Main Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    {resultA.id === resultB.id && (
                        <div className="p-3.5 rounded-xl bg-warning/15 border border-warning/30 text-warning text-xs font-semibold">
                            Uwaga: Jako Badanie 1 i Badanie 2 wybrano ten sam rekord wyniku ({resultA.clientIdentifier}). Wybierz dwa różne badania z listy powyżej, aby zobaczyć różnice.
                        </div>
                    )}

                    {activeTab === 'scales' && (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs text-text-muted">
                                    Wyświetlono <strong>{filteredScaleComparisons.length}</strong> z {scaleComparisons.length} skal
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setScaleFilterMode('all')}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                                            scaleFilterMode === 'all'
                                                ? 'bg-primary text-primary-contrast border-primary'
                                                : 'bg-background text-text-muted border-border hover:text-text'
                                        }`}
                                    >
                                        Wszystkie skale ({scaleComparisons.length})
                                    </button>
                                    {hasFacets && (
                                        <button
                                            type="button"
                                            onClick={() => setScaleFilterMode('primary')}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                                                scaleFilterMode === 'primary'
                                                    ? 'bg-primary text-primary-contrast border-primary'
                                                    : 'bg-background text-text-muted border-border hover:text-text'
                                            }`}
                                        >
                                            Tylko domeny główne ({scaleComparisons.filter(i => !i.isFacet).length})
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setScaleFilterMode('changed-level')}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                                            scaleFilterMode === 'changed-level'
                                                ? 'bg-primary text-primary-contrast border-primary'
                                                : 'bg-background text-text-muted border-border hover:text-text'
                                        }`}
                                    >
                                        Tylko ze zmianą progu ({stats.levelShifts})
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {filteredScaleComparisons.map(item => {
                                    const deltaSign = item.delta > 0 ? `+${item.delta}` : `${item.delta}`;
                                    const deltaPctSign = item.deltaPct > 0 ? `+${item.deltaPct}%` : `${item.deltaPct}%`;
                                    return (
                                        <div
                                            key={item.scale.id}
                                            className={`p-4 rounded-xl border transition-all ${
                                                item.levelChanged
                                                    ? 'bg-background/80 border-primary/50 shadow-md'
                                                    : 'bg-background/40 border-border'
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                                <div>
                                                    <h4 className="font-bold text-text text-sm sm:text-base flex items-center gap-2">
                                                        {item.scale.name}
                                                        {item.scale.abbreviation && (
                                                            <span className="text-xs font-mono text-text-muted">
                                                                ({item.scale.abbreviation})
                                                            </span>
                                                        )}
                                                        {item.levelChanged && (
                                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/20 text-primary border border-primary/40">
                                                                Zmiana progu: {item.levelA.label} &rarr; {item.levelB.label}
                                                            </span>
                                                        )}
                                                    </h4>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`px-3 py-1 rounded-lg font-mono text-xs font-bold border ${
                                                            item.delta > 0
                                                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                                                : item.delta < 0
                                                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                                                : 'bg-surface text-text-muted border-border'
                                                        }`}
                                                    >
                                                        Δ: {deltaSign} pkt ({deltaPctSign})
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Dual Bars */}
                                            <div className="space-y-2 text-xs">
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <span className="col-span-3 sm:col-span-2 text-blue-400 font-semibold truncate">
                                                        Pre ({resultA.clientIdentifier}):
                                                    </span>
                                                    <div className="col-span-6 sm:col-span-7 h-2.5 bg-surface rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-blue-500 transition-all duration-300"
                                                            style={{ width: `${item.pctA}%` }}
                                                        />
                                                    </div>
                                                    <div className="col-span-3 text-right font-mono font-semibold text-text">
                                                        {item.scoreA}/{item.max} pkt{' '}
                                                        <span className="text-text-muted font-sans">({item.levelA.label})</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <span className="col-span-3 sm:col-span-2 text-primary font-semibold truncate">
                                                        Post ({resultB.clientIdentifier}):
                                                    </span>
                                                    <div className="col-span-6 sm:col-span-7 h-2.5 bg-surface rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-300"
                                                            style={{
                                                                width: `${item.pctB}%`,
                                                                backgroundColor: item.levelB.color || 'var(--primary-color)',
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-span-3 text-right font-mono font-bold text-text">
                                                        {item.scoreB}/{item.max} pkt{' '}
                                                        <span
                                                            className="font-sans font-bold"
                                                            style={{ color: item.levelB.color }}
                                                        >
                                                            ({item.levelB.label})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {activeTab === 'radar' && (
                        <div className="bg-background/50 border border-border rounded-2xl p-6">
                            <ComparisonRadarChart
                                items={radarItems}
                                labelA={formatResultLabel(resultA)}
                                labelB={formatResultLabel(resultB)}
                            />
                        </div>
                    )}

                    {activeTab === 'questions' && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 bg-background/50 p-3.5 rounded-xl border border-border">
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-text cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={onlyChangedAnswers}
                                            onChange={e => setOnlyChangedAnswers(e.target.checked)}
                                            className="h-4 w-4 accent-[var(--primary-color)]"
                                        />
                                        Pokaż tylko pytania, w których odpowiedź uległa zmianie
                                    </label>
                                </div>

                                <select
                                    value={questionScaleFilter}
                                    onChange={e => setQuestionScaleFilter(e.target.value)}
                                    className="p-2 rounded-lg border border-border bg-input-bg text-input-text text-xs font-medium"
                                >
                                    <option value="all">Wszystkie skale</option>
                                    {test.scales
                                        .filter(s => s.type === 'standard')
                                        .map(s => (
                                            <option key={s.id} value={s.id}>
                                                Skala: {s.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                {(() => {
                                    const rows = test.sections
                                        .flatMap(sec => sec.questions)
                                        .map((question, idx) => {
                                            const rawA = resultA.answers?.[question.id];
                                            const rawB = resultB.answers?.[question.id];
                                            const strA = Array.isArray(rawA) ? rawA.join(',') : String(rawA ?? '');
                                            const strB = Array.isArray(rawB) ? rawB.join(',') : String(rawB ?? '');
                                            const isChanged = strA !== strB;

                                            const textA = Array.isArray(rawA)
                                                ? rawA.map(v => question.options.find(o => o.id === v)?.text || v).join(', ')
                                                : question.options.find(o => o.id === rawA)?.text || String(rawA ?? 'Brak');
                                            const textB = Array.isArray(rawB)
                                                ? rawB.map(v => question.options.find(o => o.id === v)?.text || v).join(', ')
                                                : question.options.find(o => o.id === rawB)?.text || String(rawB ?? 'Brak');

                                            const questionScales = new Set<string>();
                                            Object.values(question.scoring || {}).forEach(rules => {
                                                (rules || []).forEach(r => {
                                                    if (r?.scaleId) questionScales.add(r.scaleId);
                                                });
                                            });

                                            return {
                                                question,
                                                number: idx + 1,
                                                isChanged,
                                                textA,
                                                textB,
                                                questionScales,
                                            };
                                        })
                                        .filter(item => {
                                            if (onlyChangedAnswers && !item.isChanged) return false;
                                            if (questionScaleFilter !== 'all' && !item.questionScales.has(questionScaleFilter)) {
                                                return false;
                                            }
                                            return true;
                                        });

                                    if (rows.length === 0) {
                                        return (
                                            <div className="p-8 text-center text-text-muted text-sm bg-background/30 rounded-xl border border-border">
                                                Brak różnic w odpowiedziach spełniających wybrane kryteria filtra.
                                            </div>
                                        );
                                    }

                                    return rows.map(({ question, number, isChanged, textA, textB }) => (
                                        <div
                                            key={question.id}
                                            className={`p-3.5 rounded-xl border text-xs sm:text-sm ${
                                                isChanged
                                                    ? 'bg-background/70 border-primary/40'
                                                    : 'bg-background/30 border-border/60'
                                            }`}
                                        >
                                            <p className="font-semibold text-text mb-2">
                                                {number}.{' '}
                                                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.text.replace(/^\s*\d+[\.\)]\s*/, '')) }} />
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
                                                <div className="p-2 rounded-lg bg-surface border border-border">
                                                    <span className="text-[11px] font-bold text-blue-400 block">
                                                        Pre ({resultA.clientIdentifier}):
                                                    </span>
                                                    <span className="text-text">{textA}</span>
                                                </div>
                                                <div className="p-2 rounded-lg bg-surface border border-border">
                                                    <span className="text-[11px] font-bold text-primary block">
                                                        Post ({resultB.clientIdentifier}):
                                                    </span>
                                                    <span className="text-text font-semibold">{textB}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-background/80 border-t border-border flex flex-wrap justify-between items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDownloadComparisonPdf}
                            disabled={isDownloadingPdf}
                            className="px-4 py-2 bg-primary text-primary-contrast font-bold rounded-xl text-xs hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
                        >
                            {isDownloadingPdf ? 'Generowanie PDF...' : '📥 Pobierz Raport Porównawczy PDF'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCopySummary}
                            className="px-4 py-2 bg-surface border border-border hover:border-primary text-text font-semibold rounded-xl text-xs transition-colors"
                        >
                            📋 Kopiuj podsumowanie do schowka
                        </button>
                        {onAppendComparisonToNotes && (
                            <button
                                type="button"
                                onClick={() => {
                                    onAppendComparisonToNotes(buildComparisonHtmlSummary());
                                    toast.success('Dołączono zestawienie Pre/Post do notatek raportu!');
                                    onClose();
                                }}
                                className="px-4 py-2 bg-primary/25 border border-primary text-white font-bold rounded-xl text-xs hover:bg-primary/35 transition-colors"
                            >
                                ➕ Dołącz zestawienie Pre/Post do notatek raportu
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-primary text-primary-contrast font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
                    >
                        Zamknij
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultComparisonModal;
