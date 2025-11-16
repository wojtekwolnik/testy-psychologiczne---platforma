
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTests, fetchTestVersions, fetchTestById } from '../services/apiClient';
import { type Test } from './types';
import { EditIcon, PlusIcon, DownloadIcon, UploadIcon, ClockIcon } from './common/Icons';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
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
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
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
    navigate('/admin/tests'); // Updated navigation
    setIsCreateMenuOpen(false);
  };
  
  const handleCreateNewClick = () => {
    navigate('/admin/test/new'); // Updated navigation
    setIsCreateMenuOpen(false);
  };

  const handleJsonFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedTest = JSON.parse(event.target?.result as string);
            // Navigate and pass data via state
            navigate('/admin/test/new', { state: { importedTest } });
        } catch (err) {
            alert("Błąd podczas przetwarzania pliku JSON. Upewnij się, że ma poprawny format.");
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  
  const handleShowHistory = async (canonicalId: string) => {
    setIsHistoryLoading(true);
    setIsHistoryModalOpen(true);
    const allVersions = await fetchTestVersions();
    const versions = allVersions.filter(v => v.canonicalId === canonicalId);
    setHistoryVersions(versions);
    setIsHistoryLoading(false);
  };

  const filteredTests = useMemo(() => {
    return tests.filter(test => 
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
                <div className="absolute right-0 mt-2 w-64 bg-[var(--secondary-color)] rounded-lg shadow-xl z-10 border border-[var(--border-color)]">
                    <button onClick={handleCreateNewClick} className="w-full text-left px-4 py-3 hover:bg-[var(--background-color)]">
                        <p className="font-semibold">Utwórz nowy</p>
                        <p className="text-xs opacity-70">Zaprojektuj test od zera w edytorze.</p>
                    </button>
                    <button onClick={handleCsvImportClick} className="w-full text-left px-4 py-3 hover:bg-[var(--background-color)] border-t border-[var(--border-color)]">
                        <p className="font-semibold">Importuj (CSV)</p>
                        <p className="text-xs opacity-70">Rekomendowane do tworzenia nowych testów z pliku.</p>
                    </button>
                     <button onClick={handleJsonImportClick} className="w-full text-left px-4 py-3 hover:bg-[var(--background-color)] border-t border-[var(--border-color)]">
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
                      onClick={() => navigate(`/admin/test/edit/${test.id}`)} // Updated navigation
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
                        <p>Ładowanie historii...</p>                    ) : (
                        <div className="space-y-3">
                        {historyVersions.map(v => (
                            <div key={v.id} className="bg-[var(--background-color)] p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{v.title}</p>
                                    <p className="text-sm opacity-70">
                                        Wersja {v.version} &bull; Utworzono: {new Date(v.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleExport(v.id)} className="p-2 hover:bg-slate-200 rounded-full" title="Eksportuj tę wersję"><DownloadIcon /></button>
                                    <button onClick={() => navigate(`/admin/test/edit/${v.id}`)} className="p-2 hover:bg-slate-200 rounded-full" title="Edytuj tę wersję"><EditIcon /></button>
                                </div>
                            </div>
                        ))}
                        </div>
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
