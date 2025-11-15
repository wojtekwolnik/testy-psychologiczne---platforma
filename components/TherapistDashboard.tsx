
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchResults, fetchTests, generateAccessCode, fetchActiveCodes, deleteResult } from '../services/apiClient';
import { type TestResult, type Test, type AccessCode } from './types';
import { ChartBarIcon, TrashIcon, PlusIcon, ClipboardCopyIcon } from './common/Icons';
import ActionConfirmModal from './common/ActionConfirmModal';

const TherapistDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [activeCodes, setActiveCodes] = useState<AccessCode[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [resultToDelete, setResultToDelete] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTest, setFilterTest] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const THERAPIST_ID = 'user-2'; // Hardcoded therapist ID for demo

  useEffect(() => {
    loadData();
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 7);
    setExpiryDate(defaultExpiry.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedResults, fetchedTests, fetchedCodes] = await Promise.all([
        fetchResults(THERAPIST_ID),
        fetchTests(true), 
        fetchActiveCodes(THERAPIST_ID)
      ]);
      
      fetchedResults.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      setResults(fetchedResults);
      setTests(fetchedTests);
      setActiveCodes(fetchedCodes);
      
      if(fetchedTests.length > 0 && !selectedTest) {
        setSelectedTest(fetchedTests[0].id);
      }
    } catch (err) {
      setError("Nie udało się załadować danych.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const getDaysUntilDeletion = (date: Date | string) => {
      const completionDate = new Date(date);
      const deletionDate = new Date(completionDate);
      deletionDate.setDate(deletionDate.getDate() + 60);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deletionDate.setHours(0,0,0,0);
      const diffTime = deletionDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const handleGenerateCode = async () => {
    if (!selectedTest || !expiryDate) return;
    const expiry = new Date(expiryDate);
    expiry.setHours(23, 59, 59, 999);
    
    const newCode = await generateAccessCode(selectedTest, THERAPIST_ID, expiry);
    setActiveCodes(prev => [...prev, newCode]);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
        setCopySuccess(code);
        setTimeout(() => setCopySuccess(''), 2000);
    });
  };
  
  const confirmDeleteResult = async (resultId: string) => {
    try {
        await deleteResult(resultId);
        await loadData();
    } catch {
        setError("Nie udało się usunąć wyniku.");
    }
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setFilterTest('all');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const filteredResults = useMemo(() => {
    return results.filter(result => {
        const matchesSearch = result.clientIdentifier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTest = filterTest === 'all' || result.testId === filterTest;

        const completedDate = new Date(result.completedAt);
        completedDate.setHours(0, 0, 0, 0);

        let matchesStartDate = true;
        if (filterStartDate) {
            const startDate = new Date(filterStartDate);
            startDate.setHours(0, 0, 0, 0);
            matchesStartDate = completedDate >= startDate;
        }

        let matchesEndDate = true;
        if (filterEndDate) {
            const endDate = new Date(filterEndDate);
            endDate.setHours(0, 0, 0, 0);
            matchesEndDate = completedDate <= endDate;
        }

        return matchesSearch && matchesTest && matchesStartDate && matchesEndDate;
    });
  }, [results, searchTerm, filterTest, filterStartDate, filterEndDate]);

  return (
    <>
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Panel terapeuty</h1>
      <p className="opacity-80 mb-8">Przeglądaj wyniki, generuj kody dostępu i zarządzaj danymi klientów.</p>

      {/* Code Generator */}
      <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Generator kodów dostępu</h2>
        <div className="flex flex-col sm:flex-row items-stretch gap-4 mb-4">
          <select value={selectedTest} onChange={e => setSelectedTest(e.target.value)} className="flex-grow p-3 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)]">
            {tests.map(t => <option key={t.id} value={t.id}>{t.title} (v{t.version})</option>)}
          </select>
          <div className="flex-grow">
              <label htmlFor="expiry-date" className="block text-xs font-medium text-slate-500 mb-1">Data ważności</label>
              <input 
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)]"
              />
          </div>
          <button onClick={handleGenerateCode} className="flex self-end items-center justify-center gap-2 px-4 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90">
             <PlusIcon /> Generuj kod
          </button>
        </div>
        {activeCodes.length > 0 && (
            <div>
                <h3 className="text-md font-semibold opacity-80">Aktywne kody (ważne i nieużyte):</h3>
                <ul className="mt-2 space-y-1 text-sm opacity-70">
                    {activeCodes.map(code => {
                        const associatedTest = tests.find(t => t.id === code.testId);
                        return (
                            <li key={code.code} className="font-mono bg-[var(--background-color)] px-2 py-1 rounded flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span>{code.code} <span className="opacity-50">- ({associatedTest?.title} v{associatedTest?.version})</span></span>
                                   <button onClick={() => handleCopyCode(code.code)} className="p-1 hover:bg-slate-200 rounded">
                                        {copySuccess === code.code ? <span className="text-xs text-green-600">Skopiowano!</span> : <ClipboardCopyIcon />}
                                   </button>
                                </div>
                                <span className="text-xs font-semibold">Ważny do: {new Date(code.expiresAt).toLocaleDateString()}</span>
                            </li>
                        )
                    })}
                </ul>
            </div>
        )}
      </div>

      <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 bg-[var(--background-color)] border-b border-[var(--border-color)] flex flex-col gap-4">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-semibold self-center">Ukończone testy</h2>
             <button onClick={clearFilters} className="text-sm text-[var(--primary-color)] font-semibold hover:underline">Wyczyść filtry</button>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-grow">
                <label className="text-xs font-medium text-slate-500">Szukaj po ID klienta</label>
                <input 
                    type="text"
                    placeholder="Wpisz ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)]"
                />
            </div>
            <div className="flex-grow">
                <label className="text-xs font-medium text-slate-500">Filtruj po teście</label>
                <select
                    value={filterTest}
                    onChange={e => setFilterTest(e.target.value)}
                    className="w-full p-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)]"
                >
                    <option value="all">Wszystkie testy</option>
                    {[...new Map(results.map(item => [item.testId, item])).values()].map((result: TestResult) => {
                        const test = tests.find(t => t.id === result.testId);
                        return <option key={result.testId} value={result.testId}>{test?.title} (v{test?.version})</option>
                    })}
                </select>
            </div>
             <div className="flex-grow">
                <label className="text-xs font-medium text-slate-500">Data ukończenia (od)</label>
                <input
                    type="date"
                    value={filterStartDate}
                    onChange={e => setFilterStartDate(e.target.value)}
                    className="w-full p-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)]"
                />
            </div>
             <div className="flex-grow">
                <label className="text-xs font-medium text-slate-500">Data ukończenia (do)</label>
                <input
                    type="date"
                    value={filterEndDate}
                    onChange={e => setFilterEndDate(e.target.value)}
                    className="w-full p-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)]"
                />
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center">Ładowanie wyników...</div>
        ) : error ? (
          <div className="p-8 text-center text-[var(--error-color)]">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[var(--background-color)] text-sm font-semibold opacity-70">
                <tr className="text-[var(--text-color)]">
                  <th className="p-4">Identyfikator Klienta</th>
                  <th className="p-4">Tytuł Testu</th>
                  <th className="p-4">Data ukończenia</th>
                  <th className="p-4">Usuwanie za</th>
                  <th className="p-4">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="p-8 text-center opacity-60">
                            Brak wyników pasujących do kryteriów.
                        </td>
                    </tr>
                ) : (
                  filteredResults.map(result => {
                    const daysLeft = getDaysUntilDeletion(result.completedAt);
                    const urgencyClass = daysLeft <= 0 ? 'text-[var(--error-color)] font-bold' : daysLeft <= 7 ? 'text-[var(--warning-color)]' : '';

                    return (
                        <tr key={result.id} className="border-b border-[var(--border-color)] hover:bg-[var(--background-color)]">
                        <td className="p-4 font-mono">{result.clientIdentifier}</td>
                        <td className="p-4">{result.testTitle} <span className="text-xs opacity-50">(v{result.testVersion})</span></td>
                        <td className="p-4">{new Date(result.completedAt).toLocaleDateString()}</td>
                        <td className={`p-4 ${urgencyClass}`}>{daysLeft > 0 ? `${daysLeft} dni` : 'Dziś'}</td>
                        <td className="p-4 flex items-center gap-2">
                            <button
                                onClick={() => navigate(`/report/${result.id}`)} // Updated navigation
                                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-color)]/20 text-[var(--accent-color)] font-semibold rounded-md hover:bg-[var(--accent-color)]/30 transition-colors text-sm"
                            >
                                <ChartBarIcon />
                                Zobacz raport
                            </button>
                             <button
                                onClick={() => setResultToDelete(result.id)}
                                className="p-2 opacity-60 hover:bg-red-100 hover:text-[var(--error-color)] rounded-full transition-colors"
                                title="Usuń wynik"
                            >
                                <TrashIcon />
                            </button>
                        </td>
                        </tr>
                    );
                })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    <ActionConfirmModal 
      isOpen={!!resultToDelete}
      onCancel={() => setResultToDelete(null)}
      onConfirm={() => {
        if(resultToDelete) confirmDeleteResult(resultToDelete);
        setResultToDelete(null);
      }}
      title="Potwierdź usunięcie wyniku"
      message="Czy na pewno chcesz trwale usunąć ten wynik? Tej operacji nie można cofnąć."
      confirmText="Usuń"
    />
    </>
  );
};

export default TherapistDashboard;
