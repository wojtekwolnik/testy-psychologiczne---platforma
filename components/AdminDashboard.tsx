
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchTests, fetchTestById, fetchTestVersions, updateTestStatus } from '@/app/actions/testActions';
import { type Test } from './types';
import { EditIcon, PlusIcon, DownloadIcon, UploadIcon, ClockIcon } from './common/Icons';
import { toast } from 'react-toastify';

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const importJsonInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyVersions, setHistoryVersions] = useState<Test[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTests();

    const handleClickOutside = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadTests = async () => {
    try {
      setIsLoading(true);
      const fetchedTests = await fetchTests();
      setTests(fetchedTests);
    } catch (err) {
      setError("Nie udało się załadować testów.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (testId: string) => {
    try {
      const testToExport = await fetchTestById(testId);
      if (!testToExport) {
        alert("Nie znaleziono testu do wyeksportowania.");
        return;
      }
      const dataStr = JSON.stringify(testToExport, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `${testToExport.title.replace(/\s+/g, '_')}_v${testToExport.version}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch {
      alert("Wystąpił błąd podczas eksportowania testu.");
    }
  };

  const handleJsonImportClick = () => {
    importJsonInputRef.current?.click();
    setIsCreateMenuOpen(false);
  };

  const handleCsvImportClick = () => {
    router.push('/admin/tests');
    setIsCreateMenuOpen(false);
  };

  const handleCreateNewClick = () => {
    router.push('/admin/test/new');
    setIsCreateMenuOpen(false);
  };

  const validateImportSchema = (data: any): string | null => {
    if (!data || typeof data !== 'object') return "Plik nie zawiera poprawnego obiektu JSON.";
    if (typeof data.title !== 'string') return "Brak tytułu testu (pole 'title').";
    if (!Array.isArray(data.sections)) return "Brak sekcji pytań (pole 'sections' musi być listą).";
    if (!Array.isArray(data.scales)) return "Brak definicji skal (pole 'scales' musi być listą).";

    for (let i = 0; i < data.sections.length; i++) {
      const sec = data.sections[i];
      if (!sec || typeof sec !== 'object') return `Sekcja ${i + 1} jest nieprawidłowa.`;
      if (!Array.isArray(sec.questions)) return `Sekcja ${i + 1} nie zawiera prawidłowej listy pytań ('questions').`;
      
      for (let j = 0; j < sec.questions.length; j++) {
        const q = sec.questions[j];
        if (!q || typeof q !== 'object') return `Pytanie ${j + 1} w sekcji ${i + 1} jest nieprawidłowe.`;
        if (!Array.isArray(q.options)) return `Pytanie ${j + 1} w sekcji ${i + 1} nie zawiera listy opcji ('options').`;
        if (!q.scoring || typeof q.scoring !== 'object') return `Pytanie ${j + 1} w sekcji ${i + 1} nie zawiera obiektu punktacji ('scoring').`;
      }
    }

    return null; // Brak błędów
  };

  const handleJsonFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedTest = JSON.parse(event.target?.result as string);
        
        const schemaError = validateImportSchema(importedTest);
        if (schemaError) {
          toast.error(`Błąd walidacji pliku: ${schemaError}`);
          return;
        }

        localStorage.setItem('import_draft', JSON.stringify(importedTest));
        router.push('/admin/test/new?import=local');
      } catch (err) {
        toast.error("Błąd podczas przetwarzania pliku JSON. Upewnij się, że ma poprawny format składniowy.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleShowHistory = async (canonicalId: string) => {
    setIsHistoryLoading(true);
    setIsHistoryModalOpen(true);
    try {
      const versions = await fetchTestVersions(canonicalId); // <-- CORRECTED THIS LINE
      setHistoryVersions(versions);
    } catch (err) {
      // Handle error if necessary, e.g., show a toast notification
      console.error("Failed to fetch test versions:", err);
      setHistoryVersions([]); // Clear previous results
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleStatusChange = async (testId: string, newStatus: 'DRAFT' | 'PUBLISHED') => {
    // Confirmation
    const action = newStatus === 'PUBLISHED' ? 'opublikować' : 'przywrócić do szkicu';
    if (!window.confirm(`Czy na pewno chcesz ${action} ten test?`)) {
      return;
    }

    try {
      await updateTestStatus(testId, newStatus);
      // Optimistic update
      setTests(prev => prev.map(t => t.id === testId ? { ...t, status: newStatus } : t));
      toast.success(`Status zmieniony na: ${newStatus === 'PUBLISHED' ? 'Opublikowany' : 'Szkic'}`);
    } catch (err) {
      toast.error("Nie udało się zmienić statusu.");
    }
  };

  const filteredTests = useMemo(() => {
    // Display only the latest version of each test (by canonicalId)
    const latestVersions = new Map<string, Test>();
    tests.forEach(test => {
      const existing = latestVersions.get(test.canonicalId);
      if (!existing || test.version > existing.version) {
        latestVersions.set(test.canonicalId, test);
      }
    });

    const testsToDisplay = Array.from(latestVersions.values());

    return testsToDisplay.filter(test =>
      test.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tests, searchTerm]);

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold">Panel Administratora</h1>
            <p className="opacity-80 mt-1">Zarządzaj testami, użytkownikami i wyglądem platformy.</p>
          </div>
          <div className="relative" ref={createMenuRef}>
            <input type="file" accept=".json" ref={importJsonInputRef} onChange={handleJsonFileSelected} className="hidden" />
            <button
              onClick={() => setIsCreateMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-5 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90"
            >
              <PlusIcon /> Utwórz Test
            </button>
            {isCreateMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-50 border border-[var(--border-color)]"
                style={{ backgroundColor: 'var(--secondary-color, #ffffff)' }}
              >
                <button
                  onClick={handleCreateNewClick}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--background-color)] transition-colors text-[var(--text-color)]"
                >
                  <p className="font-semibold">Utwórz nowy</p>
                  <p className="text-xs opacity-70">Zaprojektuj test od zera w edytorze.</p>
                </button>
                <button
                  onClick={handleCsvImportClick}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--background-color)] border-t border-[var(--border-color)] transition-colors text-[var(--text-color)]"
                >
                  <p className="font-semibold">Importuj (CSV)</p>
                  <p className="text-xs opacity-70">Rekomendowane do tworzenia nowych testów z pliku.</p>
                </button>
                <button
                  onClick={handleJsonImportClick}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--background-color)] border-t border-[var(--border-color)] transition-colors text-[var(--text-color)]"
                >
                  <p className="font-semibold">Importuj (JSON)</p>
                  <p className="text-xs opacity-70">Do przywracania kopii zapasowych i archiwów.</p>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-[var(--background-color)] border-b border-[var(--border-color)] flex justify-between items-center">
            <h2 className="text-xl font-semibold">Istniejące Testy (Najnowsze Wersje)</h2>
            <input
              type="text"
              placeholder="Szukaj testu..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full max-w-xs p-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)]"
            />
          </div>
          {isLoading ? (
            <div className="p-8 text-center">Ładowanie testów...</div>
          ) : error ? (
            <div className="p-8 text-center text-[var(--error-color)]">{error}</div>
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
              {filteredTests.length === 0 ? (
                <div className="p-8 text-center opacity-60">
                  {searchTerm ? "Nie znaleziono testów pasujących do wyszukiwania." : "Nie utworzono jeszcze żadnych testów."}
                </div>
              ) : (
                filteredTests.map(test => (
                  <div key={test.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-[var(--background-color)] gap-3">
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        {test.title}
                        <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">v{test.version}</span>
                      </h3>
                      <p className="opacity-70 text-sm">
                        {test.sections.reduce((acc, s) => acc + s.questions.length, 0)} Pytań, {test.scales.length} Skal
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="relative inline-block">
                        <select
                          value={test.status}
                          onChange={(e) => handleStatusChange(test.id, e.target.value as 'DRAFT' | 'PUBLISHED')}
                          className="text-xs font-bold uppercase tracking-wider pl-3 pr-8 py-1.5 rounded border-none outline-none cursor-pointer shadow-sm hover:brightness-110 transition-all appearance-none text-left"
                          style={{
                            backgroundColor: test.status === 'PUBLISHED' ? 'var(--success-color)' : 'var(--warning-color)',
                            color: 'white',
                            minWidth: '130px'
                          }}
                          title="Zmień status testu"
                        >
                          <option value="DRAFT">Szkic</option>
                          <option value="PUBLISHED">Opublikowany</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                      </div>
                      <button
                        onClick={() => handleShowHistory(test.canonicalId)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200 text-sm" title="Historia wersji"
                      >
                        <ClockIcon />
                      </button>
                      <button
                        onClick={() => handleExport(test.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200 text-sm"
                      >
                        <DownloadIcon /> Eksportuj
                      </button>
                      <button
                        onClick={() => router.push(`/admin/test/edit/${test.id}`)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200 text-sm"
                      >
                        <EditIcon /> Edytuj
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--secondary-color)] rounded-lg shadow-xl p-6 w-full max-w-2xl text-[var(--text-color)] max-h-[90vh] flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Historia Wersji Testu</h2>
            <div className="flex-grow overflow-y-auto pr-2">
              {isHistoryLoading ? (
                <p>Ładowanie historii...</p>) : historyVersions.length > 0 ? (
                  <div className="space-y-3">
                    {historyVersions.sort((a, b) => b.version - a.version).map(v => (
                      <div key={v.id} className="bg-[var(--background-color)] p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{v.title}</p>
                          <p className="text-sm opacity-70">
                            Wersja {v.version} &bull; Utworzono: {new Date(v.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleExport(v.id)} className="p-2 hover:bg-slate-200 rounded-full" title="Eksportuj tę wersję"><DownloadIcon /></button>
                          <button onClick={() => { setIsHistoryModalOpen(false); router.push(`/admin/test/edit/${v.id}`); }} className="p-2 hover:bg-slate-200 rounded-full" title="Edytuj tę wersję"><EditIcon /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                <p>Brak historii wersji dla tego testu.</p>
              )}
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setIsHistoryModalOpen(false)} className="px-5 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold">Zamknij</button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default AdminDashboard;
