
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import { fetchResultById, fetchTestById, fetchPdfTemplates, getAiInterpretation } from '../services/apiClient';
import type { TestResult, Test, ClientAnswer, PdfTemplate } from './types';
import { DownloadIcon, SparklesIcon, ChevronLeftIcon } from './common/Icons';
import { BrandingContext } from '../contexts/BrandingContext';
import RichTextInput from './common/RichTextInput';

const ReportView: React.FC = () => {
    const { resultId } = useParams<{ resultId: string }>();
    const navigate = useNavigate();
    const { branding, isBrandingLoaded } = useContext(BrandingContext);
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
            setError("Nie znaleziono ID wyniku w adresie URL.");
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const fetchedResult = await fetchResultById(resultId);
                if (!fetchedResult) {
                    setError("Nie znaleziono wyniku testu.");
                    return;
                }
                setResult(fetchedResult);
                setCustomInterpretation(fetchedResult.therapistInterpretation || '');

                const fetchedTest = await fetchTestById(fetchedResult.testId);
                setTest(fetchedTest);

                const templates = await fetchPdfTemplates(fetchedResult.testId);
                setPdfTemplates(templates);

            } catch (err) {
                setError("Wystąpił błąd podczas ładowania danych.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [resultId]);

    const handleGeneratePdf = async () => {
        if (!result || !test) return;

        setIsGenerating(true);
        try {
            const templateToUse = pdfTemplates.find(t => t.id === selectedTemplate);
            const pdfBytes = await generatePdf(result, test, branding, templateToUse, customInterpretation);
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Raport-${result.clientName.replace(/ /g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Błąd generowania PDF:", err);
            setError("Nie udało się wygenerować raportu PDF.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGetAiInterpretation = async () => {
        if (!test || !result) return;
        setIsInterpretationLoading(true);
        setAiInterpretation(null);
        try {
            const interpretation = await getAiInterpretation(test, result);
            setAiInterpretation(interpretation.interpretation); // Assuming the API returns { interpretation: "..." }
        } catch (error) {
            console.error('Błąd pobierania interpretacji AI:', error);
            setError("Nie udało się uzyskać interpretacji od AI.");
        } finally {
            setIsInterpretationLoading(false);
        }
    };


    if (isLoading || !isBrandingLoaded) return <div className="flex justify-center items-center h-screen"><div>Ładowanie danych raportu...</div></div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!result || !test) return <div className="p-8 text-center">Nie znaleziono danych wyniku lub testu.</div>;

    const getScaleDescription = (scaleKey: string) => {
        const scale = test.scales.find(s => s.key === scaleKey);
        return scale?.description || 'Brak opisu skali.';
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                            <ChevronLeftIcon />
                            <span>Powrót</span>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Raport Wyników</h1>
                         <div className="flex items-center gap-4">
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="default">Domyślny Szablon</option>
                                {pdfTemplates.map(template => (
                                    <option key={template.id} value={template.id}>{template.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleGeneratePdf}
                                disabled={isGenerating}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                            >
                                {isGenerating ? 'Generowanie...' : <><DownloadIcon /> Pobierz PDF</>}
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main content */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-lg">
                        <div className="border-b pb-6 mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">{test.title}</h2>
                                    <p className="text-lg text-gray-600 mt-1">Pacjent: {result.clientName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Data Ukończenia</p>
                                    <p className="font-semibold text-gray-800">{new Date(result.completedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Scores Section */}
                        <div className="mb-8">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Wyniki Główne</h3>
                            <div className="space-y-4">
                                {Object.entries(result.scores).map(([key, value]) => (
                                    <div key={key} className="bg-gray-50 p-4 rounded-lg">
                                        <p className="font-bold text-lg text-blue-700">{key}</p>
                                        <p className="text-gray-600 mt-1">{getScaleDescription(key)}</p>
                                        <p className="text-2xl font-extrabold text-gray-800 mt-2">Wynik: {value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Interpretation Section */}
                        <div>
                             <h3 className="text-2xl font-semibold text-gray-800 mb-4">Interpretacja i Notatki Terapeuty</h3>
                            
                            {/* AI Interpretation */}
                            <div className="mb-6">
                                <button onClick={handleGetAiInterpretation} disabled={isInterpretationLoading} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-purple-400 transition-colors">
                                    {isInterpretationLoading ? 'Analizowanie...' : <><SparklesIcon /> Poproś AI o interpretację</>}
                                </button>
                                {isInterpretationLoading && <p className="text-sm text-gray-600 mt-2">Generowanie interpretacji, to może potrwać chwilę...</p>}
                                {aiInterpretation && (
                                    <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                        <h4 className="font-bold text-purple-800">Sugestia od AI</h4>
                                        <p className="text-gray-700 mt-2 whitespace-pre-wrap">{aiInterpretation}</p>
                                    </div>
                                )}
                            </div>

                             {/* Therapist's custom interpretation */}
                            <RichTextInput
                                initialValue={customInterpretation}
                                onSave={(newInterpretation) => setCustomInterpretation(newInterpretation)}
                            />
                        </div>
                    </div>

                    {/* Sidebar with Answers */}
                    <div className="bg-white p-6 rounded-xl shadow-lg self-start">
                        <h3 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-4">Udzielone Odpowiedzi</h3>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {result.answers.map((answer: ClientAnswer, index: number) => (
                                <div key={index} className="text-sm">
                                    <p className="font-semibold text-gray-700">Pytanie {index + 1}: {test.questions[index]?.text}</p>
                                    <p className="text-gray-600 pl-4">Odpowiedź: {String(answer.value)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Mock PDF Generation Logic
async function generatePdf(result: TestResult, test: Test, branding: any, template: PdfTemplate | undefined, customInterpretation: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  let y = height - 50;

  // Simple title
  page.drawText(`${branding.appName || 'Test'} - Raport Wyników`, { x: 50, y, size: 24 });
  y -= 40;

  if (template && template.body) {
    // This is a simplified placeholder. A real implementation would need a complex parser
    // to replace placeholders like {{clientName}} with actual data.
    let body = template.body;
    body = body.replace(/{{clientName}}/g, result.clientName);
    body = body.replace(/{{testDate}}/g, new Date(result.completedAt).toLocaleDateString());
    body = body.replace(/{{testTitle}}/g, test.title);
    
    // Naive replacement for scores
    Object.entries(result.scores).forEach(([key, value]) => {
        const scoreRegex = new RegExp(`{{scores.${key}}}`, 'g');
        body = body.replace(scoreRegex, String(value));
    });

    body = body.replace(/{{therapistInterpretation}}/g, customInterpretation);


    // This simplified version just draws the text. A real version would handle HTML -> PDF.
    const lines = body.split('\n');
    for (const line of lines) {
        page.drawText(line, { x: 50, y, size: 12 });
        y -= 15;
        if (y < 50) {
            page = pdfDoc.addPage();
            y = height - 50;
        }
    }
  } else {
    // Default fallback PDF content
    page.drawText(`Pacjent: ${result.clientName}`, { x: 50, y, size: 12 });
    y -= 20;
    page.drawText(`Data: ${new Date(result.completedAt).toLocaleDateString()}`, { x: 50, y, size: 12 });
    y -= 40;

    page.drawText('Wyniki:', { x: 50, y, size: 16 });
    y -= 25;

    for (const [key, value] of Object.entries(result.scores)) {
        page.drawText(`${key}: ${value}`, { x: 70, y, size: 12 });
        y -= 20;
    }
  }

  return pdfDoc.save();
}

export default ReportView;
