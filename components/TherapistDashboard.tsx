'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchResults, deleteResult } from '@/app/actions/resultActions';
import { generateAccessCode, fetchActiveCodes, deleteAccessCode } from '@/app/actions/accessCodeActions';
import { fetchTests } from '@/app/actions/testActions';
import { getUsers, UserData } from '@/app/actions/userActions';
import { TestResult, Test, AccessCode } from './types';
import { ChartBarIcon, TrashIcon, PlusIcon, ClipboardCopyIcon } from './common/Icons';
import ActionConfirmModal from './common/ActionConfirmModal';
import { useAuth } from '@/contexts/AuthContext';

const InfoTooltip: React.FC<{ id: string, label: string, text: string, activeId: string | null, setActiveId: (id: string | null) => void }> = ({ id, label, text, activeId, setActiveId }) => {
  const isOpen = activeId === id;
  return (
    <div className="relative inline-flex items-center ml-1.5 align-middle">
      <button 
        type="button" 
        onClick={(e) => { e.stopPropagation(); setActiveId(isOpen ? null : id); }}
        className="w-4 h-4 rounded-full bg-[var(--primary-color)]/20 text-[var(--primary-color)] hover:bg-[var(--primary-color)]/30 text-[11px] font-bold flex items-center justify-center transition-colors shadow-sm"
        title="Więcej informacji"
      >
        ?
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-2xl border border-slate-700 z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto text-left font-normal">
          <div className="font-semibold mb-1 text-[var(--primary-contrast-text-color)] flex justify-between items-center border-b border-slate-700 pb-1">
            <span>{label}</span>
            <button onClick={() => setActiveId(null)} className="hover:text-white text-slate-400 font-bold ml-2">✕</button>
          </div>
          <p className="text-slate-200 leading-relaxed mt-1.5">{text}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
};

const TherapistDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<TestResult[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [activeCodes, setActiveCodes] = useState<AccessCode[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [resultToDelete, setResultToDelete] = useState<string | null>(null);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTest, setFilterTest] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [therapists, setTherapists] = useState<UserData[]>([]);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('');

  useEffect(() => {
    loadData();
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 7);
    setExpiryDate(defaultExpiry.toISOString().split('T')[0]);

    if (user?.role === 'admin') {
      getUsers()
        .then((users: UserData[]) => {
          setTherapists(users);
          if (user) setSelectedTherapistId(user.id);
        })
        .catch(err => console.error("Failed to fetch users:", err));
    } else if (user) {
      setSelectedTherapistId(user.id);
    }
  }, [user]);

  useEffect(() => {
    const handleDocClick = () => setActiveTooltip(null);
    if (activeTooltip) {
      document.addEventListener('click', handleDocClick);
    }
    return () => document.removeEventListener('click', handleDocClick);
  }, [activeTooltip]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const fetchedResults = await fetchResults();
      const fetchedTests = await fetchTests();
      const fetchedCodes = await fetchActiveCodes();

      fetchedResults.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      setResults(fetchedResults);
      setTests(fetchedTests);
      setActiveCodes(fetchedCodes);

      if (fetchedTests.length > 0 && !selectedTest) {
        setSelectedTest(fetchedTests[0].id);
      }
    } catch (err) {
      setError("Nie udało się załadować danych. Odśwież stronę, aby spróbować ponownie.");
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
    deletionDate.setHours(0, 0, 0, 0);
    const diffTime = deletionDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const getDeletionDate = (date: Date | string) => {
    const completionDate = new Date(date);
    const deletionDate = new Date(completionDate);
    deletionDate.setDate(deletionDate.getDate() + 60);
    return deletionDate.toLocaleDateString();
  };

  const handleGenerateCode = async () => {
    if (!selectedTest || !expiryDate) return;
    const expiry = new Date(expiryDate);
    expiry.setHours(23, 59, 59, 999);

    if (!user) return;
    const targetTherapistId = user.role === 'admin' && selectedTherapistId ? selectedTherapistId : user.id;

    try {
      const newCode = await generateAccessCode(selectedTest, expiry, targetTherapistId);
      if (newCode) {
        setActiveCodes(prev => [newCode, ...prev]);
      }
    } catch (err) {
      console.error("Error generating code:", err);
    }
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

  const confirmDeleteCode = async (code: string) => {
    try {
      await deleteAccessCode(code);
      await loadData();
    } catch {
      setError("Nie udało się unieważnić kodu.");
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
        <h1 className="text-4xl font-bold mb-2">{user?.role === 'admin' ? 'Zarządzanie Wynikami' : 'Panel terapeuty'}</h1>
        <p className="opacity-80 mb-8">Przeglądaj wyniki, generuj kody dostępu i zarządzaj danymi klientów.</p>

        {/* Code Generator */}
        <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-end gap-4 mb-4">
            <div className="flex-grow w-full sm:w-auto">
              <label htmlFor="test-select" className="block text-xs font-medium text-slate-500 mb-1">
                Wybierz test
                <InfoTooltip id="genTest" label="Wybierz test" text="Wybierz test psychologiczny z listy dostępnych narzędzi, do którego chcesz wygenerować jednorazowy kod dostępu dla klienta." activeId={activeTooltip} setActiveId={setActiveTooltip} />
              </label>
              <select id="test-select" value={selectedTest} onChange={e => setSelectedTest(e.target.value)} className="w-full h-[48px] px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)]">
                {tests.map(t => <option key={t.id} value={t.id}>{t.title} (v{t.version})</option>)}
              </select>
            </div>

            {user?.role === 'admin' && (
              <div className="flex-grow w-full sm:w-auto">
                <label htmlFor="therapist-select" className="block text-xs font-medium text-slate-500 mb-1">
                  Przypisz do
                  <InfoTooltip id="genTherapist" label="Przypisz do" text="Wybierz terapeutę, do którego konta zostanie przypisany ten kod dostępu oraz późniejszy wynik testu." activeId={activeTooltip} setActiveId={setActiveTooltip} />
                </label>
                <select
                  id="therapist-select"
                  value={selectedTherapistId}
                  onChange={e => setSelectedTherapistId(e.target.value)}
                  className="w-full h-[48px] px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)]"
                >
                  {therapists.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.username || t.email} ({t.role === 'admin' ? 'Admin' : 'Terapeuta'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex-grow w-full sm:w-auto">
              <label htmlFor="expiry-date" className="block text-xs font-medium text-slate-500 mb-1">
                Data ważności
                <InfoTooltip id="genExpiry" label="Data ważności" text="Określa datę, do której wygenerowany kod dostępu pozostaje aktywny. Po tej dacie klient nie będzie mógł uruchomić testu." activeId={activeTooltip} setActiveId={setActiveTooltip} />
              </label>
              <input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full h-[48px] px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)]"
              />
            </div>
            <button onClick={handleGenerateCode} className="flex items-center justify-center gap-2 px-6 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90 h-[48px] w-full sm:w-auto flex-shrink-0">
              <PlusIcon /> Generuj kod
            </button>
          </div>
          {activeCodes.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
              <h3 className="text-md font-semibold opacity-80 mb-4">Aktywne kody (ważne i nieużyte)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--background-color)] font-semibold opacity-70 border-b border-[var(--border-color)]">
                    <tr>
                      <th className="p-3">Kod dostępu</th>
                      <th className="p-3">Przypisany Test</th>
                      <th className="p-3">Ważny do</th>
                      <th className="p-3 text-right">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCodes.filter(c => c && c.code).map(code => {
                      const associatedTest = tests.find(t => t.id === code.testId);
                      return (
                        <tr key={code.code} className="border-b border-[var(--border-color)]/50 hover:bg-[var(--background-color)]">
                          <td className="p-3 font-mono font-semibold text-[var(--primary-color)]">{code.code}</td>
                          <td className="p-3">{associatedTest?.title} <span className="text-xs opacity-50">(v{associatedTest?.version})</span></td>
                          <td className="p-3">{new Date(code.expiresAt).toLocaleDateString()}</td>
                          <td className="p-3 flex items-center justify-end gap-2">
                            <button onClick={() => handleCopyCode(code.code)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-md transition-colors text-xs" title="Kopiuj do schowka">
                              {copySuccess === code.code ? <span className="text-green-600">Skopiowano!</span> : <><ClipboardCopyIcon /> Kopiuj</>}
                            </button>
                            <button
                              onClick={() => setCodeToDelete(code.code)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 font-semibold rounded-md transition-colors text-xs"
                              title="Unieważnij ten kod"
                            >
                              <TrashIcon /> Unieważnij
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg">
          <div className="p-4 bg-[var(--background-color)] border-b border-[var(--border-color)] flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold self-center">Ukończone testy</h2>
              <button onClick={clearFilters} className="text-sm text-[var(--primary-color)] font-semibold hover:underline">Wyczyść filtry</button>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl -mt-2">Skorzystaj z poniższych filtrów, aby szybko wyszukać określone wyniki testów według identyfikatora klienta, rodzaju testu lub przedziału czasowego ukończenia.</p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end w-full">
              <div className="sm:col-span-2">
                <label htmlFor="search-client-id" className="block text-xs font-medium text-slate-500 mb-1">
                  Szukaj po ID klienta
                  <InfoTooltip id="filtClient" label="ID klienta" text="Filtruje listę ukończonych testów według unikalnego, jednorazowego kodu dostępu (ID klienta), który został wygenerowany w sekcji powyżej i przekazany klientowi przed rozpoczęciem testu." activeId={activeTooltip} setActiveId={setActiveTooltip} />
                </label>
                <input
                  id="search-client-id"
                  type="text"
                  placeholder="Wpisz ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full h-[42px] px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)] text-sm"
                />
              </div>
              <div className="sm:col-span-4">
                <label htmlFor="filter-test-select" className="block text-xs font-medium text-slate-500 mb-1">
                  Filtruj po teście
                  <InfoTooltip id="filtTest" label="Filtruj po teście" text="Zawęża wyświetlane wyniki na liście wyłącznie do wybranego rodzaju testu psychologicznego." activeId={activeTooltip} setActiveId={setActiveTooltip} />
                </label>
                <select
                  id="filter-test-select"
                  value={filterTest}
                  onChange={e => setFilterTest(e.target.value)}
                  className="w-full h-[42px] px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)] text-sm"
                >
                  <option value="all">Wszystkie testy</option>
                  {Array.from(new Map(results.map(item => [item.testId, item])).values()).map((result: TestResult) => {
                    const test = tests.find(t => t.id === result.testId);
                    return <option key={result.testId} value={result.testId}>{test?.title} (v{test?.version})</option>
                  })}
                </select>
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="filter-start-date" className="block text-xs font-medium text-slate-500 mb-1">
                  Data początkowa
                  <InfoTooltip id="filtStart" label="Data początkowa" text="Filtruje wyniki testów, wyświetlając wyłącznie te ukończone od wskazanej daty włącznie." activeId={activeTooltip} setActiveId={setActiveTooltip} />
                </label>
                <input
                  id="filter-start-date"
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className="w-full h-[42px] px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)] text-sm"
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="filter-end-date" className="block text-xs font-medium text-slate-500 mb-1">
                  Data końcowa
                  <InfoTooltip id="filtEnd" label="Data końcowa" text="Filtruje wyniki testów, wyświetlając wyłącznie te ukończone do wskazanej daty włącznie." activeId={activeTooltip} setActiveId={setActiveTooltip} />
                </label>
                <input
                  id="filter-end-date"
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="w-full h-[42px] px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)] text-sm"
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
                    <th className="p-4">Data usunięcia</th>
                    <th className="p-4">Usunięcie za</th>
                    <th className="p-4">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center opacity-60">
                        Brak wyników pasujących do kryteriów.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map(result => {
                      const daysLeft = getDaysUntilDeletion(result.completedAt);
                      const deletionDateStr = getDeletionDate(result.completedAt);
                      const urgencyClass = daysLeft <= 0 ? 'text-[var(--error-color)] font-bold' : daysLeft <= 7 ? 'text-[var(--warning-color)]' : '';

                      return (
                        <tr key={result.id} className="border-b border-[var(--border-color)] hover:bg-[var(--background-color)]">
                          <td className="p-4 font-mono">{result.clientIdentifier}</td>
                          <td className="p-4">{result.testTitle} <span className="text-xs opacity-50">(v{result.testVersion})</span></td>
                          <td className="p-4">{new Date(result.completedAt).toLocaleDateString()}</td>
                          <td className="p-4 font-medium">{deletionDateStr}</td>
                          <td className={`p-4 ${urgencyClass}`}>{daysLeft > 0 ? `${daysLeft} dni` : 'Dziś'}</td>
                          <td className="p-4 flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/report/${result.id}`)} // Updated navigation
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
      </div >
      <ActionConfirmModal
        isOpen={!!resultToDelete}
        onCancel={() => setResultToDelete(null)}
        onConfirm={() => {
          if (resultToDelete) confirmDeleteResult(resultToDelete);
          setResultToDelete(null);
        }}
        title="Potwierdź usunięcie wyniku"
        message="Czy na pewno chcesz trwale usunąć ten wynik? Tej operacji nie można cofnąć."
        confirmText="Usuń"
      />
      <ActionConfirmModal
        isOpen={!!codeToDelete}
        onCancel={() => setCodeToDelete(null)}
        onConfirm={() => {
          if (codeToDelete) confirmDeleteCode(codeToDelete);
          setCodeToDelete(null);
        }}
        title="Unieważnienie kodu"
        message="Czy na pewno chcesz unieważnić ten kod dostępu? Po usunięciu klient nie będzie mógł rozwiązać testu."
        confirmText="Unieważnij"
      />
    </>
  );
};

export default TherapistDashboard;
