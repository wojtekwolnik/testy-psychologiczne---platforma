import React, { useState, useEffect, useMemo, useContext } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from 'recharts';
import { fetchResultById, fetchTestById, fetchPdfTemplates, getAiInterpretation } from '../services/apiService';
import type { TestResult, Test, ClientAnswer, PdfTemplate } from './types';
import { DownloadIcon, SparklesIcon } from './common/Icons';
import { BrandingContext } from '../contexts/BrandingContext';
import RichTextInput from './common/RichTextInput'; // Although not used for input, its tag logic could be useful

const ReportView: React.FC<{ resultId: string }> = ({ resultId }) => {
  const [result, setResult] = useState<TestResult | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [allTemplates, setAllTemplates] = useState<PdfTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { branding } = useContext(BrandingContext);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const template: PdfTemplate | null = useMemo(() => {
    return allTemplates.find(t => t.id === selectedTemplateId) || null;
  }, [allTemplates, selectedTemplateId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const fetchedResult = await fetchResultById(resultId);
        if (!fetchedResult) {
          setError('Nie znaleziono wyniku.');
          setIsLoading(false);
          return;
        }
        setResult(fetchedResult);
        
        const [fetchedTest, fetchedTemplates] = await Promise.all([
            fetchTestById(fetchedResult.testId),
            fetchPdfTemplates()
        ]);

        if (!fetchedTest) {
            setError('Nie udało się załadować struktury testu.');
            setIsLoading(false);
            return;
        }
        setTest(fetchedTest);
        
        const systemDefaultTemplate: PdfTemplate = {
            id: 'sys-default',
            name: 'Domyślny systemowy',
            includeBarChart: true, includePieChart: true, includeDetailedAnswers: true,
            includeHeader: true, includeClientInfo: true, includeScoresTable: true, customHeaderText: '',
        };

        setAllTemplates([systemDefaultTemplate, ...fetchedTemplates]);

        // Set the default template for the test, or the system default if none is assigned
        setSelectedTemplateId(fetchedTest.defaultTemplateId || 'sys-default');

      } catch (err) {
        setError('Nie udało się załadować danych raportu.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [resultId]);

  const handleDownloadPdf = async () => {
    const { generatePdf } = await import('../utils/pdfGenerator');
    generatePdf('report-content', `raport-${result?.clientIdentifier}-${result?.testTitle.replace(/\s+/g, '_')}`);
  };

  const handleGetAiInterpretation = async () => {
    if (!result || !test || !branding.aiSettings.enabled) return;
    setIsAiLoading(true);
    setIsAiModalOpen(true);
    setAiInterpretation('');
    try {
        const interpretation = await getAiInterpretation(result, test, branding.aiSettings);
        setAiInterpretation(interpretation);
    } catch (err: any) {
        setAiInterpretation(`Wystąpił błąd: ${err.message}`);
    } finally {
        setIsAiLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return result?.scores.map(s => ({
      name: s.scaleName,
      Wynik: s.score,
      'Maks. wynik': s.maxScore,
    })) || [];
  }, [result]);

  const pieChartData = useMemo(() => {
    const totalScore = result?.scores.reduce((acc, s) => acc + s.score, 0) || 0;
    if (totalScore === 0) return [];
    return result?.scores.map(s => ({
        name: s.scaleName,
        value: s.score,
    })).filter(s => s.value > 0) || [];
  }, [result]);
  
  const COLORS = branding.chartColors;

  if (isLoading) return <div className="p-8 text-center">Ładowanie raportu...</div>;
  if (error) return <div className="p-8 text-center text-[var(--error-color)]">{error}</div>;
  if (!result || !test || !template) return null;
  
  const allQuestions = test.sections.flatMap(s => s.questions);
  const getAnswerForQuestion = (qId: string): ClientAnswer | undefined => result.answers.find(a => a.questionId === qId);

  const daysLeft = Math.ceil((new Date(new Date(result.completedAt).getTime() + 60 * 24 * 60 * 60 * 1000).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  const formattedHeaderText = template.customHeaderText
    .replace(/{testTitle}/g, result.testTitle)
    .replace(/{testVersion}/g, String(result.testVersion))
    .replace(/{clientIdentifier}/g, result.clientIdentifier)
    .replace(/{completionDate}/g, new Date(result.completedAt).toLocaleDateString());


  return (
    <>
    <div className="p-4 sm:p-8 bg-[var(--background-color)] min-h-screen text-[var(--text-color)]">
       <div className="max-w-5xl mx-auto" id="report-content">
        <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg p-8 space-y-8">
            {/* Report Header */}
            <div className="flex justify-between items-start border-b border-[var(--border-color)] pb-6">
                <div>
                    {template.includeHeader && (
                        <>
                            {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" className="h-12 w-auto mb-4" />}
                            <h1 className="text-3xl font-bold" dangerouslySetInnerHTML={{ __html: result.testTitle }}></h1>
                            <span className="text-lg font-normal opacity-50">(v{result.testVersion})</span>
                            {template.customHeaderText && <div className="text-lg font-semibold text-[var(--primary-color)] mt-1 prose" dangerouslySetInnerHTML={{ __html: formattedHeaderText }}></div>}
                        </>
                    )}
                    {template.includeClientInfo && (
                        <div className="mt-2">
                             <p className="opacity-80 mt-1">
                                Identyfikator klienta: <span className="font-mono bg-[var(--background-color)] px-2 py-1 rounded">{result.clientIdentifier}</span>
                            </p>
                            <p className="opacity-60 text-sm mt-1">
                                Ukończono: {new Date(result.completedAt).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
                <div className="text-right flex flex-col items-end gap-2 hide-on-pdf">
                    <div className="flex flex-wrap justify-end items-center gap-2">
                         <select 
                            value={selectedTemplateId} 
                            onChange={e => setSelectedTemplateId(e.target.value)} 
                            className="p-2 border border-slate-300 rounded-md bg-white"
                         >
                            {allTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors">
                            <DownloadIcon />
                            Pobierz PDF
                        </button>
                        {branding.aiSettings.enabled && (
                            <button 
                                onClick={handleGetAiInterpretation} 
                                disabled={isAiLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
                            >
                                <SparklesIcon className="h-5 w-5" />
                                {isAiLoading ? 'Analizowanie...' : 'Asystent AI'}
                            </button>
                        )}
                    </div>
                    <p className="text-sm mt-2 text-[var(--error-color)] font-medium">Raport zostanie usunięty za {daysLeft} dni</p>
                </div>
            </div>
            
            {/* Scores Table */}
            {template.includeScoresTable && (
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Tabela wyników</h2>
                    <div className="bg-[var(--background-color)] rounded-lg overflow-hidden border border-[var(--border-color)]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 text-sm font-semibold opacity-70">
                            <tr className="text-[var(--text-color)]">
                                <th className="p-3">Skala</th>
                                <th className="p-3 text-right">Wynik</th>
                                <th className="p-3 text-right">Maksymalny wynik</th>
                                <th className="p-3 text-right">Procentowo</th>
                            </tr>
                            </thead>
                            <tbody>
                            {result.scores.map(score => (
                                <tr key={score.scaleId} className="border-t border-[var(--border-color)]">
                                <td className="p-3 font-medium">{score.scaleName}</td>
                                <td className="p-3 text-right font-mono">{score.score}</td>
                                <td className="p-3 text-right font-mono">{score.maxScore}</td>
                                <td className="p-3 text-right font-mono">{score.maxScore > 0 ? ((score.score / score.maxScore) * 100).toFixed(0) : 0}%</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {/* Visual Charts */}
            {(template.includeBarChart || template.includePieChart) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {template.includeBarChart && (
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Podsumowanie wyników</h2>
                    <div className="h-96 w-full p-4 bg-[var(--background-color)] rounded-lg">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                <XAxis dataKey="name" tick={{ fill: 'var(--text-color)' }} />
                                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-color)' }} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--secondary-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}/>
                                <Legend wrapperStyle={{ color: 'var(--text-color)' }} />
                                <Bar dataKey="Wynik" fill="var(--primary-color)" />
                                <Bar dataKey="Maks. wynik" fill="var(--accent-color)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                )}
                 {template.includePieChart && (
                 <div>
                    <h2 className="text-2xl font-semibold mb-4">Proporcje wyników</h2>
                    <div className="h-96 w-full p-4 bg-[var(--background-color)] rounded-lg">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fill="var(--text-color)">
                                     {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--secondary-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}/>
                                <Legend wrapperStyle={{ color: 'var(--text-color)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                )}
            </div>
            )}

             {/* Detailed Answers */}
             {template.includeDetailedAnswers && (
             <div>
                <h2 className="text-2xl font-semibold mb-4">Szczegółowe odpowiedzi</h2>
                <div className="space-y-4">
                    {allQuestions.map(q => {
                        const answer = getAnswerForQuestion(q.id);
                        const selectedOptionIds = answer?.selectedOptionId ? [answer.selectedOptionId] : answer?.selectedOptionIds || [];
                        const selectedOptionsText = q.options
                            .filter(opt => selectedOptionIds.includes(opt.id))
                            .map(opt => opt.text)
                            .join(', ');

                        return (
                            <div key={q.id} className="bg-[var(--background-color)] p-4 rounded-lg">
                                <div className="font-semibold prose max-w-none" dangerouslySetInnerHTML={{ __html: q.text }}></div>
                                <div className="opacity-80 mt-1 prose max-w-none">Odpowiedź klienta: <span className="font-medium text-[var(--text-color)]" dangerouslySetInnerHTML={{ __html: selectedOptionsText || 'Brak odpowiedzi' }}></span></div>
                            </div>
                        );
                    })}
                </div>
             </div>
            )}
        </div>
      </div>
    </div>

    {isAiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--secondary-color)] rounded-lg shadow-xl p-6 w-full max-w-2xl text-[var(--text-color)] max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <SparklesIcon className="h-6 w-6 text-[var(--primary-color)]" />
                    Sugestia interpretacji AI
                </h2>
                <div className="flex-grow overflow-y-auto pr-2">
                    {isAiLoading ? (
                        <div className="flex items-center justify-center h-48">
                           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--primary-color)]"></div>
                        </div>
                    ) : (
                         <div className="prose max-w-none text-[var(--text-color)]">
                             <p className="text-sm opacity-70 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                                <strong>Zastrzeżenie:</strong> Poniższa treść została wygenerowana przez sztuczną inteligencję i ma charakter wyłącznie pomocniczy. Nie stanowi diagnozy i nie zastępuje profesjonalnej oceny klinicznej.
                             </p>
                             <div dangerouslySetInnerHTML={{ __html: aiInterpretation.replace(/\n/g, '<br />') }} />
                         </div>
                    )}
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={() => setIsAiModalOpen(false)} className="px-5 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold">Zamknij</button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default ReportView;