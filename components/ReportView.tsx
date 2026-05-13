'use client';

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchResultById } from '@/app/actions/resultActions';
import { fetchPdfTemplates, fetchTestById } from '@/app/actions/testActions';
import type { TestResult, Test, PdfTemplate, Question } from './types';
import { DownloadIcon, SparklesIcon, ChevronLeftIcon } from './common/Icons';
import { BrandingContext } from '@/contexts/BrandingContext';
import RichTextInput from './common/RichTextInput';
import { toast } from 'react-toastify';
import DOMPurify from 'isomorphic-dompurify';

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

    useEffect(() => {
        if (!resultId) {
            setError("Nie znaleziono ID wyniku.");
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const fetchedResult = await fetchResultById(resultId);
                if (!fetchedResult) throw new Error("Result not found");
                setResult(fetchedResult);

                // Set initial analysis if exists
                if (fetchedResult.analysis) {
                    setCustomInterpretation(fetchedResult.analysis);
                }

                const fetchedTest = await fetchTestById(fetchedResult.testId);
                if (!fetchedTest) throw new Error("Test not found");
                setTest(fetchedTest);

                const templates = await fetchPdfTemplates();
                const testTemplates = templates.filter(t => t.testCanonicalId === fetchedTest.canonicalId);
                setPdfTemplates(testTemplates);

                if (fetchedTest.defaultTemplateId) {
                    setSelectedTemplate(fetchedTest.defaultTemplateId);
                } else if (testTemplates.length > 0) {
                    // Fallback to first if no default set but template exists (optional, maybe keep 'default' hardcoded)
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

    const handleGeneratePdf = async () => {
        if (!result || !test || !branding) return;
        setIsGenerating(true);
        try {
            const { generatePdf } = await import('./pdfGenerator'); // Dynamic import
            const templateToUse = pdfTemplates.find(t => t.id === selectedTemplate);
            const pdfBytes = await generatePdf(result, test, branding, templateToUse, customInterpretation);

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Raport-${result.clientIdentifier.replace(/ /g, '_')}.pdf`;
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

    if (isLoading) return <div className="flex justify-center items-center h-screen"><div>Ładowanie danych raportu...</div></div>;
    if (error) return <div className="p-8 text-center text-red-600 font-semibold">{error}</div>;
    if (!result || !test) return <div className="p-8 text-center">Nie znaleziono danych wyniku lub testu.</div>;

    const getScaleDetails = (scaleId: string) => {
        const scale = test.scales.find(s => s.id === scaleId);
        return scale ? { name: scale.name, description: scale.description } : { name: scaleId, description: 'Brak opisu.' };
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
                    <ChevronLeftIcon />
                    Powrót
                </button>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-lg">
                        <div className="border-b pb-6 mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">{test.title}</h2>
                                    <p className="text-lg text-gray-600 mt-1">Identyfikator klienta: {result.clientIdentifier}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Data Ukończenia</p>
                                    <p className="font-semibold text-gray-800">{new Date(result.completedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Wyniki</h3>
                            <div className="space-y-4">
                                {Object.entries(result.scores).map(([scaleId, value]) => {
                                    const { name, description } = getScaleDetails(scaleId);
                                    const maxScore = test.scales.find(s => s.id === scaleId)?.maxScore;
                                    const percentage = maxScore ? (value / maxScore) * 100 : 0;
                                    return (
                                        <div key={scaleId} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="font-bold text-lg text-indigo-700">{name}</p>
                                                <p className="text-2xl font-extrabold text-gray-800">{value}{maxScore ? ` / ${maxScore}` : ''}</p>
                                            </div>
                                            {maxScore && (
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                            )}
                                            <p className="text-gray-600 text-sm mt-2">{description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Interpretacja</h3>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold">Notatki i interpretacja terapeuty</h4>
                                    <button
                                        onClick={handleGetAiInterpretation}
                                        disabled={isInterpretationLoading}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 font-semibold rounded-md hover:bg-purple-200 transition-colors text-sm disabled:opacity-50"
                                    >
                                        <SparklesIcon />
                                        {isInterpretationLoading ? 'Generowanie...' : 'Generuj z AI'}
                                    </button>
                                </div>
                                {isInterpretationLoading && <div className="text-center p-4">Analizowanie wyników...</div>}
                                {aiInterpretation && (
                                    <div className="prose prose-sm max-w-none p-4 mb-4 bg-purple-50 rounded-md border border-purple-200">
                                        <h5 className="font-semibold">Sugestia od AI:</h5>
                                        <p>{aiInterpretation}</p>
                                        <button onClick={() => { setCustomInterpretation(aiInterpretation); setAiInterpretation(null); }} className="text-sm font-semibold text-purple-600 hover:underline mt-2">Użyj tej sugestii</button>
                                    </div>
                                )}
                                <RichTextInput value={customInterpretation} onChange={setCustomInterpretation} />
                                <p className="text-xs text-gray-500 mt-2">Ta interpretacja zostanie dołączona do raportu PDF.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg self-start sticky top-24">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Opcje Raportu</h3>
                            <button
                                onClick={handleGeneratePdf}
                                disabled={isGenerating}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                            >
                                <DownloadIcon /> {isGenerating ? 'Generowanie...' : 'Pobierz PDF'}
                            </button>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-2">Szablon PDF</label>
                            <select id="template-select" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                <option value="default">Domyślny wygląd raportu</option>
                                {pdfTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 border-b pb-3 my-4">Udzielone Odpowiedzi</h3>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {Object.entries(result.answers).map(([questionId, answerValue]) => {
                                const question = questionsMap.get(questionId);
                                if (!question) return null;

                                let answerText = '';
                                if (Array.isArray(answerValue)) { // Multiple select
                                    answerText = answerValue.map(val => question.options.find(opt => opt.id === val)?.text || val).join(', ');
                                } else { // Single select / Likert
                                    answerText = question.options.find(opt => opt.id === answerValue)?.text || String(answerValue);
                                }

                                return (
                                    <div key={questionId} className="text-sm">
                                        <p className="font-semibold text-gray-700" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.text) }} />
                                        <p className="text-gray-600 pl-4">Odpowiedź: {answerText}</p>
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
