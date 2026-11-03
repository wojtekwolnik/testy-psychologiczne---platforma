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
        if (!scale) return { label: 'Brak danych', color: '#313647', textColor: '#fbfaf7', description: null };
        if (scale.levels && scale.levels.length > 0) {
            const matched = scale.levels.find((l: any) => val >= l.minScore && val <= l.maxScore) || scale.levels[scale.levels.length - 1];
            
            let hexColor = matched.color;
            let textColor = '#ffffff';
            
            if (hexColor === 'red') hexColor = '#ef4444';
            else if (hexColor === 'yellow') { hexColor = '#fef08a'; textColor = '#854d0e'; }
            else if (hexColor === 'green') hexColor = '#4e9054';
            else if (hexColor === 'purple') hexColor = '#a855f7';
            else if (hexColor === 'blue') hexColor = '#314293';
            else if (hexColor && hexColor.startsWith('#')) {
                const r = parseInt(hexColor.slice(1, 3), 16) || 0;
                const g = parseInt(hexColor.slice(3, 5), 16) || 0;
                const b = parseInt(hexColor.slice(5, 7), 16) || 0;
                const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                if (luminance > 0.5) textColor = '#14161d';
            }
            
            return { label: matched.name, color: hexColor || '#314293', textColor, description: matched.description };
        }
        if (!scale.maxScore) return { label: 'Brak danych', color: '#313647', textColor: '#fbfaf7', description: null };
        const ratio = val / scale.maxScore;
        if (ratio > 0.73) return { label: 'Wysoki', color: '#e89183', textColor: '#14161d', description: null };
        if (ratio >= 0.45) return { label: 'Przeciętny', color: '#314293', textColor: '#ffffff', description: null };
        return { label: 'Niski', color: '#4e9054', textColor: '#ffffff', description: null };
    };

    const chartItems = Object.entries(result.scores)
        .map(([scaleId, value]) => {
            const scale = test.scales.find(s => s.id === scaleId);
            const maxScore = scale?.maxScore || 0;
            const percentage = maxScore ? Math.min(100, Math.max(0, (value / maxScore) * 100)) : 0;
            return {
                scaleId,
                name: scale?.name || scaleId,
                value,
                maxScore,
                percentage,
            };
        })
        .filter(item => item.maxScore > 0);

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

                        <div className="mb-8">
                            <h3 className="text-2xl font-semibold text-text mb-4">Szczegółowe wyniki skal</h3>
                            <div className="space-y-4">
                                {Object.entries(result.scores).map(([scaleId, value]) => {
                                    const { name, description } = getScaleDetails(scaleId);
                                    const scale = test.scales.find(s => s.id === scaleId);
                                    const maxScore = scale?.maxScore;
                                    const percentage = maxScore ? Math.min(100, Math.max(0, (value / maxScore) * 100)) : 0;
                                    const levelInfo = getScoreLevel(value, scale);
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
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-semibold text-text mb-4">Interpretacja i notatki terapeuty</h3>
                            <div className="bg-background/60 p-5 rounded-xl border border-border">
                                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                                    <h4 className="font-semibold text-text">Treść interpretacji do raportu</h4>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleGetAiInterpretation}
                                            disabled={isInterpretationLoading}
                                            className="flex items-center gap-2 px-3.5 py-2 bg-accent/15 text-accent border border-accent/30 font-semibold rounded-lg hover:bg-accent/25 transition-colors text-xs disabled:opacity-50"
                                        >
                                            <SparklesIcon className="w-4 h-4" />
                                            {isInterpretationLoading ? 'Generowanie...' : 'Generuj z AI'}
                                        </button>
                                        <button
                                            onClick={() => handleSaveNotes()}
                                            disabled={isSavingNotes}
                                            className="px-4 py-2 bg-primary text-primary-contrast font-semibold rounded-lg hover:opacity-90 transition-opacity text-xs shadow-sm disabled:opacity-50"
                                        >
                                            {isSavingNotes ? 'Zapisywanie...' : 'Zapisz notatki w bazie'}
                                        </button>
                                    </div>
                                </div>
                                {isInterpretationLoading && <div className="text-center p-4 text-text-muted">Analizowanie wyników przez model AI...</div>}
                                {aiInterpretation && (
                                    <div className="prose prose-sm prose-invert max-w-none p-4 mb-4 bg-surface rounded-xl border border-accent/40">
                                        <h5 className="font-semibold text-accent">Sugestia wygenerowana przez AI:</h5>
                                        <p className="text-text whitespace-pre-wrap">{aiInterpretation}</p>
                                        <button
                                            onClick={() => {
                                                setCustomInterpretation(aiInterpretation);
                                                setAiInterpretation(null);
                                                handleSaveNotes(aiInterpretation);
                                            }}
                                            className="text-xs font-semibold text-primary hover:underline mt-2"
                                        >
                                            Zastosuj i zapisz tę sugestię
                                        </button>
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
