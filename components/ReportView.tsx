'use client';

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchReportBundle, saveAnalysis } from '@/app/actions/resultActions';
import type { TestResult, Test, PdfTemplate, Question } from './types';
import { DownloadIcon, SparklesIcon, ChevronLeftIcon } from './common/Icons';
import { BrandingContext } from '@/contexts/BrandingContext';
import RichTextInput from './common/RichTextInput';
import { toast } from 'react-toastify';
import DOMPurify from 'isomorphic-dompurify';
import {
    buildKeyInterpretation,
    resolveScaleLevel,
    isBigFiveFacetScale,
    getBigFiveFacetParentDomain,
} from '@/lib/interpretationBuilder';

interface ReportViewProps {
    resultId: string;
}

const OnlineRadarChart: React.FC<{
    items: { name: string; value: number; maxScore: number; percentage: number }[];
    primaryColor: string;
}> = ({ items, primaryColor }) => {
    const size = 340;
    const center = size / 2;
    const radius = 115;
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
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
        };
    };

    const rings = [0.25, 0.5, 0.75, 1];
    const polygonPoints = items
        .map((item, idx) => {
            const pt = getPoint(idx, item.maxScore ? item.value / item.maxScore : 0);
            return `${pt.x},${pt.y}`;
        })
        .join(' ');

    return (
        <div className="flex flex-col items-center justify-center py-4">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[360px] h-auto overflow-visible">
                {/* Grid rings */}
                {rings.map((ring) => {
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
                            stroke="currentColor"
                            className="text-border"
                            strokeWidth={1}
                            strokeDasharray={ring < 1 ? '3 3' : undefined}
                        />
                    );
                })}

                {/* Axes */}
                {items.map((item, idx) => {
                    const outer = getPoint(idx, 1);
                    const labelPt = getPoint(idx, 1.24);
                    return (
                        <g key={item.name}>
                            <line
                                x1={center}
                                y1={center}
                                x2={outer.x}
                                y2={outer.y}
                                stroke="currentColor"
                                className="text-border"
                                strokeWidth={1}
                            />
                            <text
                                x={labelPt.x}
                                y={labelPt.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-current text-text text-[10px] font-semibold"
                            >
                                {item.name.length > 18 ? item.name.slice(0, 16) + '…' : item.name} ({Math.round(item.percentage)}%)
                            </text>
                        </g>
                    );
                })}

                {/* Data polygon */}
                <polygon
                    points={polygonPoints}
                    fill={primaryColor}
                    fillOpacity={0.28}
                    stroke={primaryColor}
                    strokeWidth={2.5}
                />

                {/* Data vertices */}
                {items.map((item, idx) => {
                    const pt = getPoint(idx, item.maxScore ? item.value / item.maxScore : 0);
                    return (
                        <circle
                            key={item.name}
                            cx={pt.x}
                            cy={pt.y}
                            r={4.5}
                            fill={primaryColor}
                            stroke="#14161d"
                            strokeWidth={1.5}
                        />
                    );
                })}
            </svg>
        </div>
    );
};

const ReportView: React.FC<ReportViewProps> = ({ resultId }) => {
    const router = useRouter();
    const { branding } = useContext(BrandingContext);
    const [result, setResult] = useState<TestResult | null>(null);
    const [test, setTest] = useState<Test | null>(null);
    const [pdfTemplates, setPdfTemplates] = useState<PdfTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
    const [isInterpretationLoading, setIsInterpretationLoading] = useState(false);
    const [customInterpretation, setCustomInterpretation] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [chartMode, setChartMode] = useState<'bars' | 'radar'>('bars');

    useEffect(() => {
        if (!resultId) {
            setError("Nie znaleziono ID wyniku.");
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const bundle = await fetchReportBundle(resultId);
                if (!bundle) throw new Error("Result or Test not found");

                const { result: fetchedResult, test: fetchedTest, templates: testTemplates } = bundle;
                setResult(fetchedResult);

                if (fetchedResult.analysis) {
                    setCustomInterpretation(fetchedResult.analysis);
                }

                setTest(fetchedTest);
                setPdfTemplates(testTemplates);

                if (fetchedTest.defaultTemplateId) {
                    setSelectedTemplate(fetchedTest.defaultTemplateId);
                }
            } catch (err: any) {
                console.error(err);
                setError("Wystąpił błąd podczas ładowania danych.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [resultId]);

    const handleSaveNotes = async (textToSave?: string) => {
        if (!result) return;
        const content = textToSave !== undefined ? textToSave : customInterpretation;
        setIsSavingNotes(true);
        try {
            await saveAnalysis(result.id, content);
            toast.success("Notatki i interpretacja zostały zapisane w bazie.");
        } catch (err) {
            console.error("Błąd zapisu interpretacji:", err);
            toast.error("Nie udało się zapisać notatek.");
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleGeneratePdf = async () => {
        if (!result || !test || !branding) return;
        setIsGenerating(true);
        try {
            const { generatePdf } = await import('./pdfGenerator');
            const templateToUse = pdfTemplates.find(t => t.id === selectedTemplate);
            const pdfBytes = await generatePdf(result, test, branding, templateToUse, customInterpretation);

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const safeFilename = `Raport-${(result.clientIdentifier || 'wynik').replace(/[^a-zA-Z0-9\-_]/g, '_')}.pdf`;
            link.download = safeFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Raport wygenerowany.");
        } catch (err) {
            console.error("Błąd generowania PDF:", err);
            toast.error("Nie udało się wygenerować raportu PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGetAiInterpretation = async () => {
        if (!result) return;
        setIsInterpretationLoading(true);
        setAiInterpretation(null);
        try {
            const { triggerAnalysis } = await import('@/app/actions/resultActions');
            const analysis = await triggerAnalysis(result.id);
            if (analysis) {
                setAiInterpretation(analysis);
                toast.success("Interpretacja AI wygenerowana.");
            } else {
                toast.warning("Nie udało się wygenerować analizy. Sprawdź konfigurację AI w ustawieniach.");
            }
        } catch (error) {
            console.error('Błąd pobierania interpretacji AI:', error);
            toast.error("Wystąpił błąd podczas komunikacji z AI.");
        } finally {
            setIsInterpretationLoading(false);
        }
    };

    const questionsMap = useMemo(() => {
        if (!test) return new Map<string, Question>();
        const map = new Map<string, Question>();
        test.sections.forEach(sec => sec.questions.forEach(q => map.set(q.id, q)));
        return map;
    }, [test]);

    if (isLoading) return <div className="flex justify-center items-center h-screen text-text"><div>Ładowanie danych raportu...</div></div>;
    if (error) return <div className="p-8 text-center text-error font-semibold">{error}</div>;
    if (!result || !test) return <div className="p-8 text-center text-text">Nie znaleziono danych wyniku lub testu.</div>;

    const getScaleDetails = (scaleId: string) => {
        const scale = test.scales.find(s => s.id === scaleId);
        return scale ? { name: scale.name, description: scale.description } : { name: scaleId, description: 'Brak opisu.' };
    };

    const getScoreLevel = (val: number, scale: any) => {
        return resolveScaleLevel(val, scale);
    };

    const handleInsertKeyInterpretation = async () => {
        const generated = buildKeyInterpretation(test, result.scores);
        if (!generated) {
            toast.info('Brak zdefiniowanych skal lub opisów w kluczu tego testu.');
            return;
        }
        setCustomInterpretation(generated);
        await handleSaveNotes(generated);
    };

    const formatAiTextToHtml = (rawText: string) => {
        const cleaned = rawText
            .replace(/^```html\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
        if (cleaned.includes('<p>') || cleaned.includes('<ul>') || cleaned.includes('<strong>')) {
            return cleaned;
        }
        return cleaned
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .split(/\n{2,}/)
            .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
            .join('');
    };

    const nonFacetScales = test.scales.filter(s => !isBigFiveFacetScale(s));
    const primaryScales = nonFacetScales.length > 0 ? nonFacetScales : test.scales;

    // Group scales dynamically by matched threshold (supports 2, 3, 4, 5, 10... thresholds)
    const profileLevelGroups = (() => {
        const map = new Map<
            string,
            {
                label: string;
                color: string;
                textColor: string;
                maxRelativeRank: number;
                items: { name: string; value: number; maxScore?: number }[];
            }
        >();

        for (const scale of primaryScales) {
            const value = result.scores[scale.id];
            if (value === undefined) continue;
            const lvl = resolveScaleLevel(value, scale);
            const relRank =
                lvl.totalLevels > 1
                    ? lvl.rankIndex / (lvl.totalLevels - 1)
                    : scale.maxScore
                      ? value / scale.maxScore
                      : 0.5;
            const key = lvl.label.trim();
            const existing = map.get(key);
            if (existing) {
                existing.items.push({ name: scale.name, value, maxScore: scale.maxScore });
                if (relRank > existing.maxRelativeRank) existing.maxRelativeRank = relRank;
            } else {
                map.set(key, {
                    label: lvl.label,
                    color: lvl.color,
                    textColor: lvl.textColor,
                    maxRelativeRank: relRank,
                    items: [{ name: scale.name, value, maxScore: scale.maxScore }],
                });
            }
        }

        return Array.from(map.values()).sort((a, b) => b.maxRelativeRank - a.maxRelativeRank);
    })();

    const chartItems = primaryScales
        .map(scale => {
            const value = result.scores[scale.id];
            if (value === undefined) return null;
            const maxScore = scale.maxScore || 0;
            const percentage = maxScore ? Math.min(100, Math.max(0, (value / maxScore) * 100)) : 0;
            return {
                scaleId: scale.id,
                name: scale.name || scale.id,
                value,
                maxScore,
                percentage,
            };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null && item.maxScore > 0);

    return (
        <div className="min-h-screen text-[var(--text-color)]">
            <header className="bg-surface/90 backdrop-blur-md shadow-sm sticky top-0 z-10 p-4 border-b border-[var(--border-color)]">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text transition-colors">
                    <ChevronLeftIcon />
                    Powrót do listy wyników
                </button>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-surface/90 border border-[var(--border-color)] p-8 rounded-2xl shadow-xl">
                        <div className="border-b border-border pb-6 mb-6">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-text">{test.title}</h2>
                                    <p className="text-lg text-text-muted mt-1">Identyfikator klienta (kod): <span className="font-mono font-bold text-primary">{result.clientIdentifier}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-text-muted">Data Ukończenia</p>
                                    <p className="font-semibold text-text">{new Date(result.completedAt).toLocaleDateString('pl-PL')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Profile Visualization */}
                        {chartItems.length >= 2 && (
                            <div className="mb-8 bg-background/60 border border-border rounded-xl p-6">
                                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                                    <h3 className="text-xl font-semibold text-text">Wizualizacja profilu</h3>
                                    {chartItems.length >= 3 && (
                                        <div className="inline-flex rounded-lg bg-surface p-1 border border-border text-xs font-semibold">
                                            <button
                                                type="button"
                                                onClick={() => setChartMode('bars')}
                                                className={`px-3 py-1.5 rounded-md transition-colors ${chartMode === 'bars' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text'}`}
                                            >
                                                Wykres słupkowy
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setChartMode('radar')}
                                                className={`px-3 py-1.5 rounded-md transition-colors ${chartMode === 'radar' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text'}`}
                                            >
                                                Wykres radarowy
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {chartMode === 'radar' && chartItems.length >= 3 ? (
                                    <OnlineRadarChart items={chartItems} primaryColor={branding.primaryColor || '#4e9054'} />
                                ) : (
                                    <div className="space-y-3">
                                        {chartItems.map(item => (
                                            <div key={item.scaleId}>
                                                <div className="flex justify-between text-xs font-medium mb-1">
                                                    <span className="text-text">{item.name}</span>
                                                    <span className="text-text-muted font-mono">{item.value} / {item.maxScore} ({Math.round(item.percentage)}%)</span>
                                                </div>
                                                <div className="w-full bg-surface rounded-full h-3 border border-border/60 overflow-hidden">
                                                    <div
                                                        className="bg-primary h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${item.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Dynamic N-level Profile Summary */}
                        {profileLevelGroups.length > 0 && (
                            <div className="mb-8 bg-background/60 border border-border rounded-xl p-5">
                                <h3 className="text-lg font-semibold text-text mb-3">Podsumowanie profilu wg progów klucza</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {profileLevelGroups.map(group => (
                                        <div key={group.label} className="bg-surface/80 border border-border rounded-lg p-3.5">
                                            <div className="flex items-center justify-between mb-2">
                                                <span
                                                    className="px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-sm"
                                                    style={{ backgroundColor: group.color, borderColor: group.color, color: group.textColor }}
                                                >
                                                    {group.label}
                                                </span>
                                                <span className="text-xs text-text-muted font-mono">
                                                    {group.items.length} {group.items.length === 1 ? 'skala' : 'skale'}
                                                </span>
                                            </div>
                                            <ul className="space-y-1 text-xs text-text">
                                                {group.items.map(it => (
                                                    <li key={it.name} className="flex justify-between gap-2">
                                                        <span className="font-medium truncate">{it.name}</span>
                                                        <span className="font-mono text-text-muted shrink-0">
                                                            {it.value}{it.maxScore ? `/${it.maxScore}` : ''}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-2xl font-semibold text-text mb-4">Szczegółowe wyniki skal</h3>
                            <div className="space-y-4">
                                {primaryScales.map(scale => {
                                    const scaleId = scale.id;
                                    const value = result.scores[scaleId];
                                    if (value === undefined) return null;
                                    const { name, description } = getScaleDetails(scaleId);
                                    const maxScore = scale.maxScore;
                                    const percentage = maxScore ? Math.min(100, Math.max(0, (value / maxScore) * 100)) : 0;
                                    const levelInfo = getScoreLevel(value, scale);
                                    const domainAbbr = (scale.abbreviation || scale.id || '').trim().toUpperCase();
                                    const childFacets = test.scales.filter(
                                        s => getBigFiveFacetParentDomain(s) === domainAbbr && result.scores[s.id] !== undefined
                                    );

                                    return (
                                        <div key={scaleId} className="bg-background/60 p-5 rounded-xl border border-border">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <p className="font-bold text-lg text-primary">{name}</p>
                                                    <span 
                                                        className="px-3 py-0.5 rounded-full text-xs font-bold border shadow-sm"
                                                        style={{ backgroundColor: levelInfo.color, borderColor: levelInfo.color, color: levelInfo.textColor }}
                                                    >
                                                        {levelInfo.label}
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-extrabold text-text font-mono">{value}{maxScore ? ` / ${maxScore}` : ''}</p>
                                            </div>
                                            {maxScore && (
                                                <div className="w-full bg-surface rounded-full h-2.5 mt-2 border border-border/50 overflow-hidden">
                                                    <div className="bg-primary h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                            )}
                                            <div className="text-text-muted text-sm mt-2 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description || '') }} />
                                            {levelInfo.description && (
                                                <div className="mt-4 p-4 bg-surface border-l-4 border-primary rounded-r-lg">
                                                    <h5 className="font-bold text-primary mb-1">Interpretacja wyniku ({levelInfo.label}):</h5>
                                                    <div className="text-text text-sm prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(levelInfo.description) }} />
                                                </div>
                                            )}

                                            {childFacets.length > 0 && (
                                                <div className="mt-5 pt-4 border-t border-border/70">
                                                    <h5 className="text-sm font-bold text-text uppercase tracking-wider mb-3">
                                                        Podskale (aspekty wymiaru {name})
                                                    </h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {childFacets.map(facet => {
                                                            const facetVal = result.scores[facet.id];
                                                            const facetMax = facet.maxScore || 20;
                                                            const facetPct = facetMax ? Math.min(100, Math.max(0, (facetVal / facetMax) * 100)) : 0;
                                                            const facetLvl = getScoreLevel(facetVal, facet);
                                                            return (
                                                                <div key={facet.id} className="bg-surface/80 p-3.5 rounded-lg border border-border/80 flex flex-col justify-between">
                                                                    <div>
                                                                        <div className="flex justify-between items-start gap-2 mb-1.5">
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span className="font-semibold text-sm text-text">{facet.name}</span>
                                                                                <span
                                                                                    className="px-2 py-0.5 rounded-full text-[11px] font-bold border"
                                                                                    style={{
                                                                                        backgroundColor: facetLvl.color,
                                                                                        borderColor: facetLvl.color,
                                                                                        color: facetLvl.textColor,
                                                                                    }}
                                                                                >
                                                                                    {facetLvl.label}
                                                                                </span>
                                                                            </div>
                                                                            <span className="font-mono font-bold text-sm text-text shrink-0">
                                                                                {facetVal} / {facetMax}
                                                                            </span>
                                                                        </div>
                                                                        <div className="w-full bg-background rounded-full h-2 mb-2 border border-border/40 overflow-hidden">
                                                                            <div className="bg-primary/85 h-full rounded-full" style={{ width: `${facetPct}%` }} />
                                                                        </div>
                                                                        {facet.description && (
                                                                            <p className="text-xs text-text-muted mb-1.5">{facet.description}</p>
                                                                        )}
                                                                    </div>
                                                                    {facetLvl.description && (
                                                                        <p className="text-xs text-text bg-background/60 p-2.5 rounded border-l-2 border-primary/70 mt-1">
                                                                            {facetLvl.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-semibold text-text mb-4">Interpretacja i notatki terapeuty</h3>
                            <div className="bg-background/60 p-5 rounded-xl border border-border">
                                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                                    <div>
                                        <h4 className="font-semibold text-text">Treść interpretacji do raportu</h4>
                                        <p className="text-xs text-text-muted">Bazowa interpretacja budowana jest automatycznie z klucza testu. Możesz ją edytować lub wzbogacić syntezą AI.</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleInsertKeyInterpretation}
                                            disabled={isSavingNotes}
                                            className="px-3.5 py-2 bg-surface text-text border border-border font-semibold rounded-lg hover:bg-surface/80 transition-colors text-xs disabled:opacity-50"
                                            title="Odtwórz bazową interpretację bezpośrednio z progów punktowych klucza testu"
                                        >
                                            Wstaw z klucza testu
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleGetAiInterpretation}
                                            disabled={isInterpretationLoading}
                                            className="flex items-center gap-2 px-3.5 py-2 bg-accent/15 text-accent border border-accent/30 font-semibold rounded-lg hover:bg-accent/25 transition-colors text-xs disabled:opacity-50"
                                        >
                                            <SparklesIcon className="w-4 h-4" />
                                            {isInterpretationLoading ? 'Syntetyzowanie...' : 'Synteza profilu z AI'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSaveNotes()}
                                            disabled={isSavingNotes}
                                            className="px-4 py-2 bg-primary text-primary-contrast font-semibold rounded-lg hover:opacity-90 transition-opacity text-xs shadow-sm disabled:opacity-50"
                                        >
                                            {isSavingNotes ? 'Zapisywanie...' : 'Zapisz notatki w bazie'}
                                        </button>
                                    </div>
                                </div>
                                {isInterpretationLoading && <div className="text-center p-4 text-text-muted">Analizowanie interakcji między skalami i hipotez przez model AI...</div>}
                                {aiInterpretation && (
                                    <div className="prose prose-sm prose-invert max-w-none p-4 mb-4 bg-surface rounded-xl border border-accent/40">
                                        <h5 className="font-semibold text-accent mb-2">Synteza profilu i hipotezy na sesję (AI):</h5>
                                        <div
                                            className="text-text text-sm space-y-2"
                                            dangerouslySetInnerHTML={{
                                                __html: DOMPurify.sanitize(formatAiTextToHtml(aiInterpretation)),
                                            }}
                                        />
                                        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border/60">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const formattedAi = `<p><br></p><p><strong>SYNTEZA PROFILU I HIPOTEZY KLINICZNE (AI)</strong></p>${formatAiTextToHtml(aiInterpretation)}`;
                                                    const combined = customInterpretation
                                                        ? `${customInterpretation}${formattedAi}`
                                                        : formattedAi;
                                                    setCustomInterpretation(combined);
                                                    setAiInterpretation(null);
                                                    handleSaveNotes(combined);
                                                }}
                                                className="px-3 py-1.5 bg-primary text-primary-contrast text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                                            >
                                                Dołącz pod obecną interpretacją i zapisz
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const formattedAi = formatAiTextToHtml(aiInterpretation);
                                                    setCustomInterpretation(formattedAi);
                                                    setAiInterpretation(null);
                                                    handleSaveNotes(formattedAi);
                                                }}
                                                className="px-3 py-1.5 bg-surface border border-border text-text text-xs font-semibold rounded-lg hover:bg-background transition-colors"
                                            >
                                                Zastąp całość i zapisz
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAiInterpretation(null)}
                                                className="text-xs text-text-muted hover:text-text ml-auto"
                                            >
                                                Odrzuć
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <RichTextInput value={customInterpretation} onChange={setCustomInterpretation} />
                                <p className="text-xs text-text-muted mt-2">Ta interpretacja jest zapisywana przy wyniku oraz dołączana do raportu PDF.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface/90 border border-[var(--border-color)] p-6 rounded-2xl shadow-xl self-start sticky top-24">
                        <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
                            <h3 className="text-xl font-semibold text-text">Opcje Raportu</h3>
                            <button
                                onClick={handleGeneratePdf}
                                disabled={isGenerating}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-contrast font-bold rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 transition-all text-sm"
                            >
                                <DownloadIcon /> {isGenerating ? 'Generowanie...' : 'Pobierz PDF'}
                            </button>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="template-select" className="block text-xs font-medium text-text-muted mb-2">Szablon PDF</label>
                            <select id="template-select" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="w-full p-2.5 border border-[var(--border-color)] rounded-lg bg-[var(--input-background-color)] text-[var(--input-text-color)] text-sm">
                                <option value="default">Domyślny wygląd raportu</option>
                                {pdfTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <h3 className="text-lg font-semibold text-text border-b border-border pb-3 my-4">Udzielone Odpowiedzi</h3>
                        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                            {test.sections.flatMap(sec => sec.questions).map((question, index) => {
                                const answerValue = result.answers[question.id];
                                if (answerValue === undefined) return null;

                                let answerText = '';
                                if (Array.isArray(answerValue)) {
                                    answerText = answerValue.map(val => question.options.find(opt => opt.id === val)?.text || val).join(', ');
                                } else {
                                    answerText = question.options.find(opt => opt.id === answerValue)?.text || String(answerValue);
                                }

                                return (
                                    <div key={question.id} className="text-sm border-b border-border/40 pb-2.5">
                                        <p className="font-semibold text-text">
                                            {index + 1}. <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.text) }} />
                                        </p>
                                        <p className="text-primary font-medium pl-4 mt-1">Odpowiedź: {answerText}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReportView;
