
import React, { useState, useEffect, useContext } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchTestsForAggregation, fetchDetailedAggregatedDataForTest, fetchTestById, fetchPsychometricData } from '../services/apiClient';
import type { AggregatedTestInfo, DetailedAggregatedData, View, Test, PsychometricData } from './types';
import { ChevronLeftIcon, BeakerIcon } from './common/Icons';
import { BrandingContext } from '../contexts/BrandingContext';

const AggregatedDataView: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => {
  const [testList, setTestList] = useState<AggregatedTestInfo[]>([]);
  const [selectedTest, setSelectedTest] = useState<AggregatedTestInfo | null>(null);
  const [detailedData, setDetailedData] = useState<DetailedAggregatedData | null>(null);
  const [detailedTestStructure, setDetailedTestStructure] = useState<Test | null>(null);
  const [psychometricData, setPsychometricData] = useState<PsychometricData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'general' | 'psychometric'>('general');

  const { branding } = useContext(BrandingContext);
  const COLORS = branding.chartColors;

  useEffect(() => {
    if (!selectedTest) {
      loadTestList();
    } else {
        if (currentTab === 'general') {
            loadDetailedData(selectedTest.testId);
        } else if (currentTab === 'psychometric') {
            loadPsychometricData(selectedTest.testId);
        }
    }
  }, [selectedTest, currentTab]);

  const loadTestList = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const tests = await fetchTestsForAggregation();
      setTestList(tests);
    } catch (err) {
      setError("Nie udało się załadować listy testów.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadDetailedData = async (testId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        setPsychometricData(null); // Clear other tab's data
        const [data, testStructure] = await Promise.all([
            fetchDetailedAggregatedDataForTest(testId),
            fetchTestById(testId)
        ]);
        setDetailedData(data);
        setDetailedTestStructure(testStructure || null);
      } catch (err) {
        setError("Nie udało się załadować szczegółowych danych.");
      } finally {
        setIsLoading(false);
      }
  };

  const loadPsychometricData = async (testId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setDetailedData(null); // Clear other tab's data
      const data = await fetchPsychometricData(testId);
      setPsychometricData(data);
    } catch (err) {
      setError("Nie udało się załadować danych psychometrycznych.");
    } finally {
      setIsLoading(false);
    }
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }


  const renderTestList = () => (
    <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 bg-[var(--background-color)] border-b border-[var(--border-color)]">
            <h2 className="text-xl font-semibold">Wybierz test do analizy</h2>
        </div>
        <div className="divide-y divide-[var(--border-color)]">
            {testList.map(test => (
                <div key={test.testId} onClick={() => setSelectedTest(test)} className="p-4 flex justify-between items-center hover:bg-[var(--background-color)] cursor-pointer">
                    <div>
                        <h3 className="font-bold text-lg">{test.testTitle} <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">v{test.version}</span></h3>
                        <p className="opacity-70 text-sm">Liczba ukończeń: {test.completionCount}</p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--primary-color)]">Zobacz szczegóły &rarr;</span>
                </div>
            ))}
        </div>
    </div>
  );
  
  const renderDetailedView = () => {
    if (!detailedData || !detailedTestStructure) return null;
    const allQuestions = detailedTestStructure.sections.flatMap(s => s.questions);
    return (
        <div className="space-y-10">
            {/* Score Distribution */}
            <div className="bg-[var(--secondary-color)] p-6 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Dystrybucja wyników w skalach</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {detailedData.scales.map(scale => (
                        <div key={scale.id}>
                            <h4 className="text-lg font-semibold text-center mb-2">{scale.name}</h4>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={detailedData.scoreDistribution[scale.id]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)"/>
                                        <XAxis dataKey="bin" tick={{ fill: 'var(--text-color)' }} />
                                        <YAxis allowDecimals={false} tick={{ fill: 'var(--text-color)' }}/>
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--secondary-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}/>
                                        <Bar dataKey="count" name="Liczba osób" fill="var(--accent-color)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Answer Frequency */}
            <div className="bg-[var(--secondary-color)] p-6 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Częstotliwość odpowiedzi na pytania</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {allQuestions.map(q => (
                       <div key={q.id}>
                           <h4 className="text-md font-semibold mb-2" dangerouslySetInnerHTML={{ __html: q.text }}></h4>
                           <div className="h-64 w-full">
                               <ResponsiveContainer width="100%" height="100%">
                                   <PieChart>
                                       <Pie data={detailedData.answerFrequency[q.id] || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                           {(detailedData.answerFrequency[q.id] || []).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                       </Pie>
                                       <Tooltip formatter={(value, name) => [value, stripHtml(name)]} contentStyle={{ backgroundColor: 'var(--secondary-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}/>
                                   </PieChart>
                               </ResponsiveContainer>
                           </div>
                       </div>
                   ))}
                </div>
            </div>
        </div>
    );
  };

  const renderPsychometricView = () => {
    if (!psychometricData) return (
        <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg p-8 text-center">
            <p className="font-semibold text-lg">Brak wystarczających danych do analizy.</p>
            <p className="opacity-70">Wymagane jest co najmniej 10 ukończonych testów do wygenerowania wiarygodnych statystyk psychometrycznych.</p>
        </div>
    );

    const getAlphaColor = (alpha: number | null) => {
        if (alpha === null) return 'text-slate-500';
        if (alpha >= 0.9) return 'text-green-700';
        if (alpha >= 0.8) return 'text-green-600';
        if (alpha >= 0.7) return 'text-yellow-600';
        if (alpha >= 0.6) return 'text-orange-600';
        return 'text-red-600';
    };

    const getDiscriminationColor = (index: number | null) => {
        if (index === null) return 'text-slate-500';
        if (index >= 0.4) return 'text-green-700';
        if (index >= 0.3) return 'text-green-600';
        if (index >= 0.2) return 'text-yellow-600';
        if (index >= 0.1) return 'text-orange-600';
        return 'text-red-600';
    };

    const getDifficultyColor = (index: number | null) => {
        if (index === null) return 'text-slate-500';
        if (index >= 0.4 && index <= 0.6) return 'text-green-600'; // Good
        if (index >= 0.2 && index <= 0.8) return 'text-yellow-600'; // Acceptable
        return 'text-red-600'; // Problematic (too easy or too hard)
    };

    return (
        <div className="space-y-10">
            <div className="bg-[var(--secondary-color)] p-6 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Rzetelność Skal (Alfa Cronbacha)</h3>
                 <p className="text-sm opacity-70 mb-4">Mierzy wewnętrzną spójność skali. Wartości powyżej 0.70 są zazwyczaj uważane za akceptowalne.</p>
                 <table className="w-full text-left">
                    <thead className="bg-[var(--background-color)] text-sm font-semibold opacity-70">
                        <tr className="text-[var(--text-color)]"><th className="p-3">Skala</th><th className="p-3">Współczynnik Alfa Cronbacha</th></tr>
                    </thead>
                    <tbody>
                        {psychometricData.scaleReliability.map(item => (
                            <tr key={item.scaleId} className="border-t border-[var(--border-color)]">
                                <td className="p-3 font-medium">{item.scaleName}</td>
                                <td className={`p-3 font-bold text-lg ${getAlphaColor(item.cronbachsAlpha)}`}>{item.cronbachsAlpha?.toFixed(3) ?? 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>

            <div className="bg-[var(--secondary-color)] p-6 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Wskaźniki Jakości Pytań</h3>
                <p className="text-sm opacity-70 mb-4">
                    <b>Moc dyskryminacyjna:</b> Wskazuje, jak dobrze pytanie różnicuje osoby o wysokich i niskich wynikach w danej skali. Wysokie wartości są pożądane.
                    <br />
                    <b>Trudność pytania:</b> Wskazuje, jak łatwe (blisko 1.0) lub trudne (blisko 0.0) było pytanie. Optymalne wartości znajdują się w środku skali.
                </p>
                <table className="w-full text-left">
                    <thead className="bg-[var(--background-color)] text-sm font-semibold opacity-70">
                        <tr className="text-[var(--text-color)]">
                            <th className="p-3">Pytanie</th>
                            <th className="p-3">Analizowana Skala</th>
                            <th className="p-3">Moc Dyskryminacyjna</th>
                            <th className="p-3">Trudność Pytania</th>
                        </tr>
                    </thead>
                     <tbody>
                        {psychometricData.questionDiscrimination.map(item => (
                             <tr key={`${item.questionId}-${item.scaleId}`} className="border-t border-[var(--border-color)]">
                                <td className="p-3 max-w-sm truncate">{item.questionText}</td>
                                <td className="p-3">{detailedTestStructure?.scales.find(s => s.id === item.scaleId)?.name ?? 'N/A'}</td>
                                <td className={`p-3 font-bold text-lg ${getDiscriminationColor(item.discriminationIndex)}`}>{item.discriminationIndex?.toFixed(3) ?? 'N/A'}</td>
                                <td className={`p-3 font-bold text-lg ${getDifficultyColor(item.difficultyIndex)}`}>{item.difficultyIndex?.toFixed(3) ?? 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };
  
  const renderTabs = () => (
    <div className="mb-6 border-b border-[var(--border-color)]">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setCurrentTab('general')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${currentTab === 'general' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                Dane Ogólne
            </button>
            <button onClick={() => setCurrentTab('psychometric')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${currentTab === 'psychometric' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                <BeakerIcon /> Analiza Psychometryczna
            </button>
        </nav>
    </div>
  );


  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
         {selectedTest && (
            <button onClick={() => { setSelectedTest(null); setDetailedData(null); setDetailedTestStructure(null); setCurrentTab('general'); }} className="p-2 mr-4 bg-[var(--secondary-color)] rounded-full shadow hover:bg-slate-200">
                <ChevronLeftIcon />
            </button>
         )}
         <div>
            <h1 className="text-4xl font-bold">Dane Zbiorcze</h1>
            <p className="opacity-80 mt-1">
                {selectedTest ? `Szczegóły dla: ${selectedTest.testTitle} (v${selectedTest.version})` : "Anonimowe dane do analizy trendów."}
            </p>
         </div>
      </div>

      {isLoading ? (
        <div className="text-center p-8">Ładowanie danych...</div>
      ) : error ? (
        <div className="text-center p-8 text-[var(--error-color)]">{error}</div>
      ) : selectedTest ? (
        <div>
            {renderTabs()}
            {currentTab === 'general' ? renderDetailedView() : renderPsychometricView()}
        </div>
      ) : testList.length === 0 ? (
        <div className="text-center p-8 bg-[var(--secondary-color)] rounded-lg shadow">Brak danych do wyświetlenia.</div>
      ) : (
        renderTestList()
      )}
    </div>
  );
};

export default AggregatedDataView;
