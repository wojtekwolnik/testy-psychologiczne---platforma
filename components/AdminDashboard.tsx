'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchTests, fetchTestById, fetchTestVersions, updateTestStatus, deleteTest } from '@/app/actions/testActions';
import { type Test, type Scale, type Section, type Question, type ScoringRule } from './types';
import { EditIcon, PlusIcon, DownloadIcon, UploadIcon, ClockIcon, TrashIcon } from './common/Icons';
import ActionConfirmModal from './common/ActionConfirmModal';
import { generateUniqueId } from '../utils/idUtils';
import { toast } from 'react-toastify';

const LIKERT_5_LABELS = [
  'Zdecydowanie nie zgadzam się',
  'Raczej się nie zgadzam',
  'Nie mam zdania/Średnio',
  'Raczej się zgadzam',
  'Zdecydowanie zgadzam się'
];

const YES_NO_LABELS = ['Tak', 'Nie'];

/**
 * Parses a single CSV line respecting double-quoted fields.
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const SAMPLE_CSV_CONTENT = [
  'sekcja;pytanie;typ;skala;odwrocone;opcje',
  'Część 1: Relacje społeczne;Lubię przebywać w dużym gronie ludzi.;likert-5;Ekstrawersja;NIE;',
  'Część 1: Relacje społeczne;Wolę spędzać wolny czas w samotności niż na przyjęciach.;likert-5;Ekstrawersja;TAK;',
  'Część 2: Odporność na stres;Często martwię się rzeczami, na które nie mam wpływu.;likert-5;Neurotyczność;NIE;',
  'Część 2: Odporność na stres;W sytuacjach kryzysowych zachowuję spokój.;likert-5;Neurotyczność;TAK;',
  'Część 3: Pytania dodatkowe;Czy w ciągu ostatniego miesiąca miałeś/aś trudności ze snem?;yes-no;Napięcie;NIE;',
  'Część 3: Pytania dodatkowe;Jak często odczuwasz zmęczenie w ciągu dnia?;multiple-choice;Napięcie;NIE;Nigdy:0|Rzadko:1|Często:2|Codziennie:3'
].join('\r\n');

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

  // Delete Test Modal State
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);

  // CSV Import Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvTestTitle, setCsvTestTitle] = useState('Nowy Test z CSV');
  const [csvTestDescription, setCsvTestDescription] = useState('');
  const [csvTestInstructions, setCsvTestInstructions] = useState('Oceń poniższe stwierdzenia zgodnie z tym, jak dobrze opisują Twoje odczucia i zachowania.');
  const [csvPreview, setCsvPreview] = useState<{
    test: Test | null;
    error: string | null;
    fileName: string;
    questionsCount: number;
    sectionsCount: number;
    scalesCount: number;
  }>({
    test: null,
    error: null,
    fileName: '',
    questionsCount: 0,
    sectionsCount: 0,
    scalesCount: 0,
  });

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
    setCsvTestTitle('Nowy Test Psychologiczny');
    setCsvTestDescription('');
    setCsvTestInstructions('Oceń poniższe stwierdzenia zgodnie z tym, jak dobrze opisują Twoje odczucia i zachowania.');
    setCsvPreview({ test: null, error: null, fileName: '', questionsCount: 0, sectionsCount: 0, scalesCount: 0 });
    setIsCsvModalOpen(true);
    setIsCreateMenuOpen(false);
  };

  const handleDownloadSampleCsv = () => {
    // Include UTF-8 BOM (\uFEFF) so Microsoft Excel opens Polish characters properly
    const blob = new Blob(['\uFEFF' + SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'szablon_testu_realmoment.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawText = String(event.target?.result || '').replace(/^\uFEFF/, '');
        const lines = rawText
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(l => l.length > 0);

        if (lines.length < 2) {
          setCsvPreview({
            test: null,
            error: 'Plik CSV musi zawierać wiersz nagłówkowy oraz przynajmniej jedno pytanie.',
            fileName: file.name,
            questionsCount: 0,
            sectionsCount: 0,
            scalesCount: 0,
          });
          return;
        }

        // Auto-detect delimiter (';' from Polish Excel or ',')
        const headerLine = lines[0];
        const semicolonCount = (headerLine.match(/;/g) || []).length;
        const commaCount = (headerLine.match(/,/g) || []).length;
        const delimiter = semicolonCount >= commaCount ? ';' : ',';

        const headers = parseCsvLine(headerLine, delimiter).map(h =>
          h.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/ł/g, 'l')
            .trim()
        );

        const idxSection = headers.findIndex(h => h.includes('sekcj') || h === 'section');
        const idxQuestion = headers.findIndex(h => h.includes('pytan') || h === 'question' || h === 'tresc' || h === 'text');
        const idxType = headers.findIndex(h => h.includes('typ') || h === 'type');
        const idxScale = headers.findIndex(h => h.includes('skal') || h === 'scale');
        const idxReversed = headers.findIndex(h => h.includes('odwroc') || h.includes('revers'));
        const idxOptions = headers.findIndex(h => h.includes('opcj') || h === 'options');

        if (idxQuestion === -1) {
          setCsvPreview({
            test: null,
            error: 'Nie znaleziono kolumny "pytanie" w nagłówku pliku CSV. Pobierz szablon CSV i zachowaj nazwy kolumn: sekcja;pytanie;typ;skala;odwrocone;opcje',
            fileName: file.name,
            questionsCount: 0,
            sectionsCount: 0,
            scalesCount: 0,
          });
          return;
        }

        const scalesByName = new Map<string, Scale>();
        const sectionsByName = new Map<string, Section>();
        let totalQuestions = 0;

        for (let r = 1; r < lines.length; r++) {
          const cols = parseCsvLine(lines[r], delimiter);
          const questionText = (cols[idxQuestion] || '').trim();
          if (!questionText) continue;

          const sectionTitle = (idxSection !== -1 ? cols[idxSection] : '')?.trim() || 'Sekcja 1';
          const rawType = ((idxType !== -1 ? cols[idxType] : '')?.trim().toLowerCase()) || 'likert-5';
          const scaleName = (idxScale !== -1 ? cols[idxScale] : '')?.trim() || 'Wynik Ogólny';
          const rawReversed = ((idxReversed !== -1 ? cols[idxReversed] : '')?.trim().toUpperCase()) || 'NIE';
          const isReversed = ['TAK', 'YES', 'TRUE', '1', 'T', 'Y'].includes(rawReversed);
          const rawCustomOptions = (idxOptions !== -1 ? cols[idxOptions] : '')?.trim() || '';

          let scale = scalesByName.get(scaleName);
          if (!scale) {
            scale = {
              id: generateUniqueId('s'),
              type: 'standard',
              name: scaleName,
              description: '',
              maxScore: 0,
            };
            scalesByName.set(scaleName, scale);
          }

          let section = sectionsByName.get(sectionTitle);
          if (!section) {
            section = {
              id: generateUniqueId('sec'),
              title: sectionTitle,
              questions: [],
            };
            sectionsByName.set(sectionTitle, section);
          }

          let qType: Question['type'] = 'likert-5';
          if (rawType === 'yes-no' || rawType === 'tak-nie') qType = 'yes-no';
          else if (rawType === 'scale-1-10' || rawType === '1-10') qType = 'scale-1-10';
          else if (rawType === 'multiple-choice' || rawType === 'single-select' || rawCustomOptions.length > 0) qType = 'multiple-choice';
          else qType = 'likert-5';

          const options: { id: string; text: string }[] = [];
          const scoring: Record<string, ScoringRule[]> = {};
          let maxPointsForQuestion = 0;

          if (qType === 'likert-5') {
            LIKERT_5_LABELS.forEach((label, idx) => {
              const optId = generateUniqueId('opt');
              const pts = isReversed ? (5 - idx) : (idx + 1);
              options.push({ id: optId, text: label });
              scoring[optId] = [{ scaleId: scale!.id, points: pts }];
              if (pts > maxPointsForQuestion) maxPointsForQuestion = pts;
            });
          } else if (qType === 'yes-no') {
            YES_NO_LABELS.forEach((label, idx) => {
              const optId = generateUniqueId('opt');
              const pts = idx === 0 ? (isReversed ? 0 : 1) : (isReversed ? 1 : 0);
              options.push({ id: optId, text: label });
              scoring[optId] = [{ scaleId: scale!.id, points: pts }];
              if (pts > maxPointsForQuestion) maxPointsForQuestion = pts;
            });
          } else if (qType === 'scale-1-10') {
            for (let idx = 0; idx < 10; idx++) {
              const optId = generateUniqueId('opt');
              const pts = isReversed ? (10 - idx) : (idx + 1);
              options.push({ id: optId, text: String(idx + 1) });
              scoring[optId] = [{ scaleId: scale!.id, points: pts }];
              if (pts > maxPointsForQuestion) maxPointsForQuestion = pts;
            }
          } else {
            // Custom options format: "Opcja A:0|Opcja B:1|Opcja C:2"
            const parts = rawCustomOptions
              ? rawCustomOptions.split('|').map(p => p.trim()).filter(Boolean)
              : ['Odpowiedź 1:1', 'Odpowiedź 2:2', 'Odpowiedź 3:3'];

            parts.forEach((part, idx) => {
              const optId = generateUniqueId('opt');
              const lastColon = part.lastIndexOf(':');
              let text = part;
              let pts = idx + 1;
              if (lastColon > 0) {
                text = part.slice(0, lastColon).trim();
                const parsedPts = Number(part.slice(lastColon + 1).trim());
                if (!isNaN(parsedPts)) pts = parsedPts;
              }
              options.push({ id: optId, text });
              scoring[optId] = [{ scaleId: scale!.id, points: pts }];
              if (pts > maxPointsForQuestion) maxPointsForQuestion = pts;
            });
          }

          scale.maxScore = (scale.maxScore || 0) + maxPointsForQuestion;

          section.questions.push({
            id: generateUniqueId('q'),
            text: questionText,
            type: qType,
            isReversed,
            options,
            scoring,
          });
          totalQuestions++;
        }

        if (totalQuestions === 0) {
          setCsvPreview({
            test: null,
            error: 'Nie znaleziono żadnych prawidłowych wierszy z pytaniami w pliku CSV.',
            fileName: file.name,
            questionsCount: 0,
            sectionsCount: 0,
            scalesCount: 0,
          });
          return;
        }

        const builtTest: Test = {
          id: generateUniqueId('new'),
          canonicalId: generateUniqueId('tid'),
          version: 1,
          title: csvTestTitle.trim() || file.name.replace(/\.csv$/i, ''),
          description: csvTestDescription.trim(),
          instructions: csvTestInstructions.trim(),
          status: 'DRAFT',
          questionsPerPage: 10,
          scales: Array.from(scalesByName.values()),
          sections: Array.from(sectionsByName.values()),
          defaultTemplateId: null,
          createdAt: new Date().toISOString(),
        };

        setCsvPreview({
          test: builtTest,
          error: null,
          fileName: file.name,
          questionsCount: totalQuestions,
          sectionsCount: builtTest.sections.length,
          scalesCount: builtTest.scales.length,
        });
      } catch (err) {
        setCsvPreview({
          test: null,
          error: 'Wystąpił błąd podczas odczytu pliku CSV. Upewnij się, że plik jest zapisany jako CSV (UTF-8).',
          fileName: file.name,
          questionsCount: 0,
          sectionsCount: 0,
          scalesCount: 0,
        });
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleConfirmCsvImport = () => {
    if (!csvPreview.test) return;
    const finalDraft: Test = {
      ...csvPreview.test,
      title: csvTestTitle.trim() || csvPreview.test.title,
      description: csvTestDescription.trim(),
      instructions: csvTestInstructions.trim(),
    };
    localStorage.setItem('import_draft', JSON.stringify(finalDraft));
    setIsCsvModalOpen(false);
    router.push('/admin/test/new?import=local');
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

    return null;
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
      const versions = await fetchTestVersions(canonicalId);
      setHistoryVersions(versions);
    } catch (err) {
      console.error("Failed to fetch test versions:", err);
      setHistoryVersions([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleStatusChange = async (testId: string, newStatus: 'DRAFT' | 'PUBLISHED') => {
    const action = newStatus === 'PUBLISHED' ? 'opublikować' : 'przywrócić do szkicu';
    if (!window.confirm(`Czy na pewno chcesz ${action} ten test?`)) {
      return;
    }

    try {
      await updateTestStatus(testId, newStatus);
      setTests(prev => prev.map(t => t.id === testId ? { ...t, status: newStatus } : t));
      toast.success(`Status zmieniony na: ${newStatus === 'PUBLISHED' ? 'Opublikowany' : 'Szkic'}`);
    } catch (err) {
      toast.error("Nie udało się zmienić statusu.");
    }
  };

  const confirmDeleteTest = async () => {
    if (!testToDelete) return;
    try {
      await deleteTest(testToDelete.id);
      setTests(prev => prev.filter(t => t.id !== testToDelete.id));
      toast.success(`Test "${testToDelete.title}" został usunięty.`);
    } catch (err) {
      toast.error("Nie udało się usunąć testu.");
    } finally {
      setTestToDelete(null);
    }
  };

  const filteredTests = useMemo(() => {
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
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-contrast font-bold rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <PlusIcon /> Utwórz Test
            </button>
            {isCreateMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-surface rounded-xl shadow-2xl z-50 border border-border backdrop-blur-md overflow-hidden"
              >
                <button
                  onClick={handleCreateNewClick}
                  className="w-full text-left px-4 py-3 hover:bg-background transition-colors text-text"
                >
                  <p className="font-semibold">Utwórz nowy w edytorze</p>
                  <p className="text-xs text-text-muted">Zaprojektuj test od zera w edytorze wizualnym.</p>
                </button>
                <button
                  onClick={handleCsvImportClick}
                  className="w-full text-left px-4 py-3 hover:bg-background border-t border-border/50 transition-colors text-text"
                >
                  <p className="font-semibold text-primary">Importuj z pliku CSV (Excel)</p>
                  <p className="text-xs text-text-muted">Szybkie tworzenie testu z arkusza pytań wraz z instrukcją i szablonem.</p>
                </button>
                <button
                  onClick={handleJsonImportClick}
                  className="w-full text-left px-4 py-3 hover:bg-background border-t border-border/50 transition-colors text-text"
                >
                  <p className="font-semibold">Importuj kopię JSON</p>
                  <p className="text-xs text-text-muted">Do przywracania pełnych kopii zapasowych testów.</p>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface/60 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-border/50">
          <div className="p-5 bg-background/50 border-b border-border flex justify-between items-center">
            <h2 className="text-xl font-semibold">Istniejące Testy (Najnowsze Wersje)</h2>
            <input
              type="text"
              placeholder="Szukaj testu..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full max-w-xs p-2.5 pl-4 border border-border rounded-lg bg-input-bg text-input-text focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
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
                        <span className="text-xs font-mono bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">v{test.version}</span>
                      </h3>
                      <p className="opacity-70 text-sm">
                        {test.sections.reduce((acc, s) => acc + s.questions.length, 0)} Pytań, {test.scales.length} Skal
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
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
                        className="flex items-center gap-2 px-3 py-2 bg-background border border-border/50 text-text font-semibold rounded-lg hover:bg-border/30 hover:shadow-sm text-sm transition-all" title="Historia wersji"
                      >
                        <ClockIcon />
                      </button>
                      <button
                        onClick={() => handleExport(test.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-background border border-border/50 text-text font-semibold rounded-lg hover:bg-border/30 hover:shadow-sm text-sm transition-all"
                      >
                        <DownloadIcon /> Eksportuj
                      </button>
                      <button
                        onClick={() => router.push(`/admin/test/edit/${test.id}`)}
                        className="flex items-center gap-2 px-3 py-2 bg-background border border-border/50 text-text font-semibold rounded-lg hover:bg-border/30 hover:shadow-sm text-sm transition-all"
                      >
                        <EditIcon /> Edytuj
                      </button>
                      <button
                        onClick={() => setTestToDelete(test)}
                        className="p-2 bg-error/10 border border-error/20 text-error rounded-lg hover:bg-error/20 transition-colors"
                        title="Usuń tę wersję testu"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* CSV Import Modal with full instructions & template download */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-3xl text-text max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4 border-b border-border pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-text">Importuj test z pliku CSV (Excel / Arkusze)</h2>
                <p className="text-sm text-text-muted mt-1">
                  Przygotuj listę pytań w programie Excel, LibreOffice Calc lub Arkuszach Google i zaimportuj ją jednym kliknięciem.
                </p>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="text-text-muted hover:text-text font-bold text-xl px-2"
              >
                ✕
              </button>
            </div>

            {/* Step-by-step instructions */}
            <div className="bg-background/70 border border-border rounded-xl p-5 mb-6 text-sm space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h3 className="font-bold text-primary text-base">Instrukcja przygotowania pliku CSV</h3>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 rounded-lg font-semibold text-xs transition-colors"
                >
                  <DownloadIcon /> Pobierz przykładowy szablon CSV
                </button>
              </div>

              <p className="text-text-muted leading-relaxed">
                Pierwszy wiersz pliku musi zawierać nazwy kolumn oddzielone <strong>średnikiem (<code>;</code>)</strong> (domyślny format polskiego Excela) lub <strong>przecinkiem (<code>,</code>)</strong>:
              </p>

              <div className="p-3 bg-surface rounded-lg border border-border font-mono text-xs text-primary overflow-x-auto">
                sekcja;pytanie;typ;skala;odwrocone;opcje
              </div>

              <ul className="list-disc pl-5 space-y-1.5 text-xs text-text-muted">
                <li><strong className="text-text"><code>sekcja</code></strong> — nazwa strony/części testu (np. <code>Część 1: Relacje</code>). Pytania o tej samej nazwie sekcji zostaną zgrupowane razem.</li>
                <li><strong className="text-text"><code>pytanie</code></strong> — pełna treść pytania wyświetlana badanemu (wymagane).</li>
                <li><strong className="text-text"><code>typ</code></strong> — wpisz jeden z obsługiwanych typów:
                  <ul className="list-disc pl-5 mt-1 space-y-0.5">
                    <li><code>likert-5</code> (domyślny) — 5-stopniowa skala Likerta (1–5 pkt).</li>
                    <li><code>yes-no</code> — pytanie Tak (1 pkt) / Nie (0 pkt).</li>
                    <li><code>scale-1-10</code> — skala numeryczna od 1 do 10.</li>
                    <li><code>multiple-choice</code> — własne opcje odpowiedzi zdefiniowane w ostatniej kolumnie <code>opcje</code>.</li>
                  </ul>
                </li>
                <li><strong className="text-text"><code>skala</code></strong> — nazwa skali psychometrycznej, do której pytanie dodaje punkty (np. <code>Ekstrawersja</code>). System sam utworzy wszystkie skale i wyliczy ich maksymalną liczbę punktów!</li>
                <li><strong className="text-text"><code>odwrocone</code></strong> — wpisz <code>TAK</code> (lub <code>1</code>), jeśli pytanie ma odwróconą punktację (np. dla <code>likert-5</code>: 5, 4, 3, 2, 1 pkt), albo <code>NIE</code> dla zwykłej punktacji.</li>
                <li><strong className="text-text"><code>opcje</code></strong> — (tylko dla <code>multiple-choice</code>) własne warianty oddzielone kreską pionową <code>|</code> w formacie <code>Tekst:Punkty</code>, np. <code>Nigdy:0|Czasami:1|Często:2|Zawsze:3</code>.</li>
              </ul>
            </div>

            {/* Metadata inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Tytuł importowanego testu</label>
                <input
                  type="text"
                  value={csvTestTitle}
                  onChange={e => setCsvTestTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-input-bg text-input-text text-sm"
                  placeholder="Np. Kwestionariusz Radzenia Sobie ze Stresem"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Krótki opis testu</label>
                <input
                  type="text"
                  value={csvTestDescription}
                  onChange={e => setCsvTestDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-input-bg text-input-text text-sm"
                  placeholder="Opcjonalny opis narzędzia..."
                />
              </div>
            </div>

            {/* File upload */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-text-muted mb-2">Wybierz plik CSV z dysku (.csv)</label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFileChange}
                className="block w-full text-sm text-text-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-contrast hover:file:opacity-90 cursor-pointer border border-border rounded-xl p-2 bg-background/50"
              />
            </div>

            {csvPreview.error && (
              <div className="p-4 mb-6 rounded-xl bg-error/15 border border-error/30 text-error text-sm font-medium">
                {csvPreview.error}
              </div>
            )}

            {csvPreview.test && (
              <div className="p-4 mb-6 rounded-xl bg-primary/15 border border-primary/30 text-sm">
                <p className="font-bold text-primary mb-1">Plik „{csvPreview.fileName}” został pomyślnie przetworzony!</p>
                <p className="text-text-muted text-xs">
                  Wykryto: <strong className="text-text">{csvPreview.questionsCount} pytań</strong> w <strong className="text-text">{csvPreview.sectionsCount} sekcjach</strong> oraz <strong className="text-text">{csvPreview.scalesCount} skal</strong> ({csvPreview.test.scales.map(s => `${s.name} [max ${s.maxScore} pkt]`).join(', ')}).
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-text-muted hover:text-text hover:bg-background text-sm font-semibold transition-colors"
              >
                Anuluj
              </button>
              <button
                type="button"
                disabled={!csvPreview.test}
                onClick={handleConfirmCsvImport}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-contrast font-bold text-sm shadow-md hover:opacity-90 disabled:opacity-40 transition-all"
              >
                Otwórz zaimportowany test w Edytorze
              </button>
            </div>
          </div>
        </div>
      )}

      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl shadow-2xl p-8 w-full max-w-2xl text-text max-h-[90vh] flex flex-col border border-border/50 animate-scale-in">
            <h2 className="text-2xl font-bold mb-4">Historia Wersji Testu</h2>
            <div className="flex-grow overflow-y-auto pr-2">
              {isHistoryLoading ? (
                <p>Ładowanie historii...</p>) : historyVersions.length > 0 ? (
                  <div className="space-y-3">
                    {historyVersions.sort((a, b) => b.version - a.version).map(v => (
                      <div key={v.id} className="bg-background/80 p-4 rounded-xl flex justify-between items-center border border-border/30 hover:shadow-sm transition-all">
                        <div>
                          <p className="font-semibold">{v.title} <span className="text-xs font-mono text-primary ml-1">(v{v.version})</span></p>
                          <p className="text-xs opacity-70 mt-0.5">
                            Status: {v.status === 'PUBLISHED' ? 'Opublikowany' : 'Szkic'} &bull; Utworzono: {new Date(v.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleExport(v.id)} className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" title="Eksportuj tę wersję"><DownloadIcon /></button>
                          <button onClick={() => { setIsHistoryModalOpen(false); router.push(`/admin/test/edit/${v.id}`); }} className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" title="Edytuj tę wersję"><EditIcon /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                <p>Brak historii wersji dla tego testu.</p>
              )}
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setIsHistoryModalOpen(false)} className="px-6 py-2.5 bg-background border border-border text-text rounded-xl font-semibold hover:bg-surface transition-colors shadow-sm">Zamknij</button>
            </div>
          </div>
        </div>
      )}

      <ActionConfirmModal
        isOpen={!!testToDelete}
        onCancel={() => setTestToDelete(null)}
        onConfirm={confirmDeleteTest}
        title="Potwierdź usunięcie testu"
        message={`Czy na pewno chcesz trwale usunąć test "${testToDelete?.title} (v${testToDelete?.version})" wraz z powiązanymi z tą wersją kodami i wynikami?`}
        confirmText="Usuń test"
      />
    </>
  );
};

export default AdminDashboard;
