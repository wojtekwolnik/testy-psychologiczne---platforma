'use client';

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchReportBundle, fetchResults, saveAnalysis } from '@/app/actions/resultActions';
import type { TestResult, Test, PdfTemplate, Question } from './types';
import { DownloadIcon, SparklesIcon, ChevronLeftIcon } from './common/Icons';
import { BrandingContext, DEFAULT_REPORT_DISCLAIMER_TEXT } from '@/contexts/BrandingContext';
import RichTextInput from './common/RichTextInput';
import ResultComparisonModal from './report/ResultComparisonModal';
import { toast } from 'react-toastify';
import DOMPurify from 'isomorphic-dompurify';
import {
    buildKeyInterpretation,
    resolveScaleLevel,
    isBigFiveFacetScale,
    getBigFiveFacetParentDomain,
    getBigFiveDomainCode,
} from '@/lib/interpretationBuilder';
import { analyzeResponseQuality } from '@/lib/scoring/responseQualityAnalyzer';
import { OnlineRadarChart, formatAiTextToHtml } from './report/ReportCharts';

interface ReportViewProps {
    resultId: string;
}

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
    const [answerScaleFilter, setAnswerScaleFilter] = useState<string>('all');
    const [answerSortHighFirst, setAnswerSortHighFirst] = useState<boolean>(false);
    const [sameTestResults, setSameTestResults] = useState<TestResult[]>([]);
    const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
    const [isQualityExpanded, setIsQualityExpanded] = useState<boolean>(false);

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

                // Load other results of the same test for Pre-test / Post-test comparison
                fetchResults()
                    .then(all => {
                        const matching = all.filter(
                            r => r.testId === fetchedTest.id || r.testTitle === fetchedTest.title
                        );
                        setSameTestResults(matching);
                    })
                    .catch(() => {});
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

    const handleGeneratePdf = async (audience: 'therapist' | 'client' = 'therapist') => {
        if (!result || !test || !branding) return;
        setIsGenerating(true);
        try {
            const { generatePdf } = await import('@/lib/pdf/pdfGenerator');
            const templateToUse = pdfTemplates.find(t => t.id === selectedTemplate);
            const pdfBytes = await generatePdf(result, test, branding, templateToUse, customInterpretation, { audience });

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const suffix = audience === 'client' ? '-Dla-Klienta' : '-Pelny';
            const safeFilename = `Raport-${(result.clientIdentifier || 'wynik').replace(/[^a-zA-Z0-9\-_]/g, '_')}${suffix}.pdf`;
            link.download = safeFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(
                audience === 'client'
                    ? 'Wygenerowano skrócony raport PDF dla klienta.'
                    : 'Wygenerowano pełny raport gabinetowy PDF.'
            );
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

    const qualityReport = useMemo(() => {
        if (!test || !result) return null;
        return analyzeResponseQuality(test, result.answers);
    }, [test, result]);

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
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-text">{test.title}</h2>
                                    <p className="text-lg text-text-muted mt-1">Identyfikator klienta (kod): <span className="font-mono font-bold text-primary">{result.clientIdentifier}</span></p>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsComparisonOpen(true)}
                                        className="px-4 py-2 bg-primary/15 border border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/25 transition-colors text-xs sm:text-sm"
                                        title="Porównaj ten wynik z innym badaniem tego samego testu (Pre-test / Post-test)"
                                    >
                                        ⇄ Porównaj z innym wynikiem (Pre / Post)
                                    </button>
                                    <div className="text-right">
                                        <p className="text-sm text-text-muted">Data Ukończenia</p>
                                        <p className="font-semibold text-text">{new Date(result.completedAt).toLocaleDateString('pl-PL')}</p>
                                    </div>
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
                                    const domainAbbr = getBigFiveDomainCode(scale);
                                    const childFacets = domainAbbr
                                        ? test.scales.filter(
                                              s => getBigFiveFacetParentDomain(s) === domainAbbr && result.scores[s.id] !== undefined
                                          )
                                        : [];

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

                        {branding.reportDisclaimerEnabled !== false && (
                            <div className="mt-6 p-4 bg-background/50 border border-border/70 rounded-xl text-xs text-text-muted leading-relaxed">
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(
                                            branding.reportDisclaimerText || DEFAULT_REPORT_DISCLAIMER_TEXT
                                        ),
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="bg-surface/90 border border-[var(--border-color)] p-6 rounded-2xl shadow-xl self-start sticky top-24">
                        <div className="border-b border-border pb-4 mb-4">
                            <h3 className="text-xl font-semibold text-text mb-3">Opcje Eksportu PDF</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleGeneratePdf('therapist')}
                                    disabled={isGenerating}
                                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-primary text-primary-contrast font-bold rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 transition-all text-xs"
                                    title="Pełny raport zawierający Twoje notatki robocze, syntezę oraz konfigurację szablonu"
                                >
                                    <DownloadIcon /> {isGenerating ? 'Generowanie...' : 'PDF Gabinetowy (Pełny)'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleGeneratePdf('client')}
                                    disabled={isGenerating}
                                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-surface border border-primary/40 text-primary font-bold rounded-xl hover:bg-primary/15 disabled:opacity-50 transition-all text-xs"
                                    title="Bezpieczny wydruk dla osoby badanej: zawiera wykres profilu i neutralne opisy skal z klucza, bez prywatnych notatek terapeuty i bez surowej listy pytań"
                                >
                                    <DownloadIcon /> PDF dla Klienta
                                </button>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="template-select" className="block text-xs font-medium text-text-muted mb-2">Szablon PDF</label>
                            <select id="template-select" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="w-full p-2.5 border border-[var(--border-color)] rounded-lg bg-[var(--input-background-color)] text-[var(--input-text-color)] text-sm">
                                <option value="default">Domyślny wygląd raportu</option>
                                {pdfTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>

                        {/* Response Quality & Style Diagnostic Card */}
                        {qualityReport && qualityReport.answeredQuestions > 0 && (
                            <div className="mb-4 rounded-xl border border-border bg-background/60 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setIsQualityExpanded(prev => !prev)}
                                    className="w-full p-3.5 flex items-center justify-between gap-2 text-left hover:bg-background/90 transition-colors"
                                >
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">
                                            Wskaźniki stylu odpowiedzi
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                                    qualityReport.overallStatus === 'attention'
                                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                                }`}
                                            >
                                                {qualityReport.overallStatus === 'attention'
                                                    ? `⚠ Wymaga uwagi (${qualityReport.warnings.length})`
                                                    : '✓ Spójny profil odpowiedzi'}
                                            </span>
                                            <span className="text-[11px] text-text-muted font-mono">
                                                Seria max: {qualityReport.maxLongstring}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-primary">
                                        {isQualityExpanded ? 'Ukryj ▲' : 'Szczegóły ▼'}
                                    </span>
                                </button>

                                {isQualityExpanded && (
                                    <div className="px-3.5 pb-3.5 pt-2 border-t border-border/60 space-y-3 text-xs">
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="p-2 rounded-lg bg-surface border border-border">
                                                <span className="block text-[10px] text-text-muted">Skrajne</span>
                                                <strong className="text-sm font-mono text-text">
                                                    {qualityReport.extremePercent}%
                                                </strong>
                                            </div>
                                            <div className="p-2 rounded-lg bg-surface border border-border">
                                                <span className="block text-[10px] text-text-muted">Środkowe</span>
                                                <strong className="text-sm font-mono text-text">
                                                    {qualityReport.neutralMiddlePercent}%
                                                </strong>
                                            </div>
                                            <div className="p-2 rounded-lg bg-surface border border-border">
                                                <span className="block text-[10px] text-text-muted">Najdłuższa seria</span>
                                                <strong className="text-sm font-mono text-text">
                                                    {qualityReport.maxLongstring} pyt.
                                                </strong>
                                            </div>
                                        </div>

                                        {qualityReport.warnings.length > 0 ? (
                                            <div className="space-y-2">
                                                {qualityReport.warnings.map(w => (
                                                    <div
                                                        key={w.id}
                                                        className={`p-2.5 rounded-lg border ${
                                                            w.severity === 'warning'
                                                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                                                : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                                                        }`}
                                                    >
                                                        <p className="font-bold mb-0.5">{w.title}</p>
                                                        <p className="text-[11px] opacity-90 leading-relaxed">
                                                            {w.description}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-text-muted leading-relaxed">
                                                Nie wykryto długich serii klikania jednej odpowiedzi (longstring), nadmiernej tendencji centralnej ani sprzeczności w pytaniach odwróconych.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex items-center justify-between border-b border-border pb-3 my-4 gap-2">
                            <h3 className="text-lg font-semibold text-text">Udzielone Odpowiedzi</h3>
                            <button
                                type="button"
                                onClick={() => setAnswerSortHighFirst(prev => !prev)}
                                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                                    answerSortHighFirst
                                        ? 'bg-primary/20 border-primary/40 text-primary'
                                        : 'bg-background border-border text-text-muted hover:text-text'
                                }`}
                                title="Przełącz sortowanie między kolejnością pytań a najwyżej punktowanymi odpowiedziami"
                            >
                                {answerSortHighFirst ? '↓ Najwyżej punktowane' : 'Kolejność pytań'}
                            </button>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="answer-scale-filter" className="block text-xs font-medium text-text-muted mb-1.5">
                                Filtruj odpowiedzi według skali
                            </label>
                            <select
                                id="answer-scale-filter"
                                value={answerScaleFilter}
                                onChange={e => setAnswerScaleFilter(e.target.value)}
                                className="w-full p-2 border border-border rounded-lg bg-input-bg text-input-text text-xs font-medium"
                            >
                                <option value="all">
                                    Wszystkie pytania ({test.sections.reduce((acc, s) => acc + s.questions.length, 0)})
                                </option>
                                {test.scales
                                    .filter(s => s.type === 'standard')
                                    .map(scale => {
                                        const scScore = result.scores[scale.id] ?? 0;
                                        return (
                                            <option key={scale.id} value={scale.id}>
                                                {scale.name} — wynik: {scScore}{scale.maxScore ? `/${scale.maxScore}` : ''} pkt
                                            </option>
                                        );
                                    })}
                            </select>
                        </div>

                        <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-2">
                            {(() => {
                                const allNumberedQuestions = test.sections
                                    .flatMap(sec => sec.questions)
                                    .map((question, index) => {
                                        const answerValue = result.answers[question.id];
                                        const selectedIds = Array.isArray(answerValue)
                                            ? answerValue.map(String)
                                            : answerValue !== undefined
                                            ? [String(answerValue)]
                                            : [];

                                        // Determine all scales associated with this question and points earned
                                        const questionScalesSet = new Set<string>();
                                        const maxPointsByScale: Record<string, number> = {};
                                        Object.values(question.scoring || {}).forEach(rules => {
                                            (rules || []).forEach(r => {
                                                if (r?.scaleId) {
                                                    questionScalesSet.add(r.scaleId);
                                                    maxPointsByScale[r.scaleId] = Math.max(
                                                        maxPointsByScale[r.scaleId] ?? 0,
                                                        Number(r.points) || 0
                                                    );
                                                }
                                            });
                                        });

                                        const earnedByScale: Record<string, number> = {};
                                        questionScalesSet.forEach(sid => {
                                            earnedByScale[sid] = 0;
                                        });
                                        selectedIds.forEach(optId => {
                                            const rules = question.scoring?.[optId] || [];
                                            rules.forEach(r => {
                                                if (r?.scaleId) {
                                                    earnedByScale[r.scaleId] = (earnedByScale[r.scaleId] ?? 0) + (Number(r.points) || 0);
                                                }
                                            });
                                        });

                                        const totalPointsEarned =
                                            answerScaleFilter !== 'all'
                                                ? earnedByScale[answerScaleFilter] ?? 0
                                                : Object.values(earnedByScale).reduce((acc, v) => acc + v, 0);

                                        return {
                                            question,
                                            number: index + 1,
                                            answerValue,
                                            questionScalesSet,
                                            earnedByScale,
                                            maxPointsByScale,
                                            totalPointsEarned,
                                        };
                                    })
                                    .filter(item => {
                                        if (item.answerValue === undefined) return false;
                                        if (answerScaleFilter === 'all') return true;
                                        return item.questionScalesSet.has(answerScaleFilter);
                                    });

                                if (answerSortHighFirst) {
                                    allNumberedQuestions.sort((a, b) => b.totalPointsEarned - a.totalPointsEarned || a.number - b.number);
                                }

                                if (allNumberedQuestions.length === 0) {
                                    return (
                                        <p className="text-xs text-text-muted italic py-4 text-center">
                                            Brak pytań przypisanych bezpośrednio do wybranej skali.
                                        </p>
                                    );
                                }

                                return allNumberedQuestions.map(({ question, number, answerValue, earnedByScale, maxPointsByScale }) => {
                                    let answerText = '';
                                    if (Array.isArray(answerValue)) {
                                        answerText = answerValue.map(val => question.options.find(opt => opt.id === val)?.text || val).join(', ');
                                    } else {
                                        answerText = question.options.find(opt => opt.id === answerValue)?.text || String(answerValue);
                                    }

                                    const relevantScaleIds =
                                        answerScaleFilter !== 'all'
                                            ? [answerScaleFilter]
                                            : Object.keys(earnedByScale).filter(sid => {
                                                  const sc = test.scales.find(s => s.id === sid);
                                                  return sc && !isBigFiveFacetScale(sc);
                                              });

                                    const displayScaleIds =
                                        relevantScaleIds.length > 0 ? relevantScaleIds : Object.keys(earnedByScale).slice(0, 2);

                                    return (
                                        <div key={question.id} className="text-sm border-b border-border/40 pb-3">
                                            <p className="font-semibold text-text leading-snug">
                                                {number}. <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.text.replace(/^\s*\d+[\.\)]\s*/, '')) }} />
                                            </p>
                                            <div className="flex flex-wrap items-center justify-between gap-2 pl-4 mt-1.5">
                                                <p className="text-primary font-medium text-xs sm:text-sm">
                                                    Odpowiedź: <strong>{answerText}</strong>
                                                </p>
                                                <div className="flex flex-wrap items-center gap-1">
                                                    {displayScaleIds.map(sid => {
                                                        const sc = test.scales.find(s => s.id === sid);
                                                        const pts = earnedByScale[sid] ?? 0;
                                                        const maxPts = maxPointsByScale[sid] ?? 0;
                                                        const isHigh = maxPts > 0 && pts >= maxPts * 0.75;
                                                        return (
                                                            <span
                                                                key={sid}
                                                                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                                                                    isHigh
                                                                        ? 'bg-accent/20 text-accent border-accent/40'
                                                                        : 'bg-background text-text-muted border-border'
                                                                }`}
                                                                title={sc?.name || sid}
                                                            >
                                                                {sc?.abbreviation || sc?.name || sid}: +{pts}{maxPts ? `/${maxPts}` : ''} pkt
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            </main>

            <ResultComparisonModal
                isOpen={isComparisonOpen}
                onClose={() => setIsComparisonOpen(false)}
                initialResultA={result}
                availableResults={sameTestResults.length > 0 ? sameTestResults : [result]}
                test={test}
                onAppendComparisonToNotes={(htmlSummary) => {
                    const nextContent = customInterpretation
                        ? `${customInterpretation}${htmlSummary}`
                        : htmlSummary;
                    setCustomInterpretation(nextContent);
                    handleSaveNotes(nextContent);
                }}
            />
        </div>
    );
};

export default ReportView;
