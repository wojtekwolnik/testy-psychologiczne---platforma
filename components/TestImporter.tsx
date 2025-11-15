import React, { useState } from 'react';
import { View, type Test, type Section, type Question, type Scale } from './types';
import { UploadIcon, ChevronLeftIcon } from './common/Icons';

const parseCsv = (csvText: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let lineNumber = 1;

  // Normalize newlines to \n for easier parsing and reliable line counting
  const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for an escaped quote ("")
        if (i + 1 < normalizedText.length && normalizedText[i + 1] === '"') {
          currentField += '"';
          i++; // Skip the next quote as it's part of the current one
        } else {
          inQuotes = false; // End of quoted field
        }
      } else {
        currentField += char;
      }
    } else {
      switch (char) {
        case '"':
          // A quote should only start a quoted field if it's at the beginning of a field.
          // We are lenient here and allow it if the field is just whitespace.
          if (currentField.trim() === '') {
            currentField = ''; // Clear any whitespace before the quote
            inQuotes = true;
          } else {
             // Treat quote as a literal character if field is not empty (technically a format error)
             currentField += char;
          }
          break;
        case ',':
          currentRow.push(currentField.trim());
          currentField = '';
          break;
        case '\n':
          currentRow.push(currentField.trim());
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
          lineNumber++;
          break;
        default:
          currentField += char;
          break;
      }
    }
  }

  // After the loop, check for unterminated quotes
  if (inQuotes) {
    throw new Error(`Błąd formatu CSV w linii ${lineNumber}: Niezamknięty cudzysłów. Upewnij się, że każdy cudzysłów otwierający (") ma swoje zamknięcie.`);
  }
  
  // Push the last field and row if the file doesn't end with a newline
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  // Remove completely empty rows that might have been parsed from multiple newlines
  return rows.filter(row => row.length > 1 || (row.length === 1 && row[0] !== ''));
};


const buildTestFromData = (data: string[][], title: string, description: string): Test => {
    const newTest: Test = {
        id: '', canonicalId: '', version: 1, title, description, instructions: '',
        questionsPerPage: 5, scales: [], sections: [], defaultTemplateId: null,
        createdAt: new Date(),
    };

    const scalesMap = new Map<string, Scale>();
    let currentSection: Section | null = null;
    let currentQuestion: Question | null = null;
    
    const headers = data[0] || [];
    const scaleColumns: { nameIndex: number, pointsIndex: number }[] = [];
    
    // Gracefully handle CSVs without scale information
    const hasScaleData = headers.some(h => h.startsWith('scale_name_'));

    if (hasScaleData) {
        headers.forEach((h, i) => {
            if (h.startsWith('scale_name_')) {
                const pointsIndex = headers.findIndex(ph => ph === `points_${h.split('_')[2]}`);
                if(pointsIndex > -1) {
                    scaleColumns.push({ nameIndex: i, pointsIndex });
                }
            }
        });
    }

    for(let i = 1; i < data.length; i++) {
        const row = data[i];
        const sectionTitle = row[0] || '';
        const questionText = row[1] || '';
        const questionType = (row[2] as Question['type']) || 'multiple-choice';
        const optionText = row[3] || '';

        if (sectionTitle && (!currentSection || currentSection.title !== sectionTitle)) {
            currentSection = { id: `temp-sec-${newTest.sections.length}`, title: sectionTitle, questions: [] };
            newTest.sections.push(currentSection);
            currentQuestion = null;
        }

        if (questionText && (!currentQuestion || currentQuestion.text !== questionText)) {
            currentQuestion = {
                id: `temp-q-${currentSection?.questions.length}`, text: questionText, type: questionType,
                options: [], scoring: {},
            };
            currentSection?.questions.push(currentQuestion);
        }
        
        if (currentQuestion && optionText) {
            const newOption = { id: `temp-o-${i}`, text: optionText };
            currentQuestion.options.push(newOption);
            
            if (scaleColumns.length > 0) {
                scaleColumns.forEach(sc => {
                    const scaleName = row[sc.nameIndex];
                    const pointsText = row[sc.pointsIndex];
                    const points = pointsText ? parseInt(pointsText, 10) : NaN;

                    if (scaleName && !isNaN(points)) {
                        let scale = scalesMap.get(scaleName);
                        if (!scale) {
                            scale = { id: `temp-scale-${scalesMap.size}`, name: scaleName, description: `Skala dla "${scaleName}"` };
                            scalesMap.set(scaleName, scale);
                            newTest.scales.push(scale);
                        }
                        
                        if (!currentQuestion!.scoring[newOption.id]) {
                            currentQuestion!.scoring[newOption.id] = [];
                        }
                        // Temporarily store the scale's NAME. The editor's sanitize function will map it to a new final ID.
                        currentQuestion!.scoring[newOption.id].push({ scaleId: scale.name, points: points });
                    }
                });
            }
        }
    }
    
    // The imported test object is now structurally correct, but IDs are temporary and references
    // in scoring rules use scale names. The `sanitizeImportedTest` function in the editor component
    // is responsible for creating final, unique IDs and resolving these name-based references.
    return newTest;
}

interface TestImporterProps {
  onNavigate: (view: View, context?: any) => void;
}

const TestImporter: React.FC<TestImporterProps> = ({ onNavigate }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [csvData, setCsvData] = useState<string[][] | null>(null);
    const [testTitle, setTestTitle] = useState('');
    const [testDescription, setTestDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setFileName(file.name);
        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const parsedData = parseCsv(text);
                if (parsedData.length < 2) {
                    throw new Error("Plik CSV jest pusty lub zawiera tylko nagłówki.");
                }
                setCsvData(parsedData);
            } catch (err: any) {
                setError(`Błąd przetwarzania pliku: ${err.message}`);
                setFileName(null);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsText(file);
    };

    const handleImport = () => {
        if (!csvData || !testTitle) {
            setError("Tytuł testu oraz plik CSV są wymagane.");
            return;
        }
        try {
            const newTest = buildTestFromData(csvData, testTitle, testDescription);
            onNavigate(View.TestEditor, { importedTest: newTest });
        } catch (err: any) {
            setError(`Błąd tworzenia testu: ${err.message}`);
        }
    };

  return (
    <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
            <button onClick={() => onNavigate(View.AdminDashboard)} className="p-2 mr-4 bg-[var(--secondary-color)] rounded-full shadow hover:bg-slate-200">
                <ChevronLeftIcon />
            </button>
            <div>
                <h1 className="text-4xl font-bold">Importuj test z pliku CSV</h1>
                <p className="opacity-80 mt-1">Stwórz nowy test, przesyłając plik z jego strukturą.</p>
            </div>
        </div>

      <div className="bg-[var(--secondary-color)] p-8 rounded-xl shadow-lg space-y-6">
        <div>
            <h2 className="text-xl font-semibold mb-2">Krok 1: Przygotuj plik CSV</h2>
            <div className="text-sm p-4 bg-[var(--background-color)] rounded-lg opacity-80">
                <p>Plik musi zawierać nagłówki. Wymagane kolumny to: <strong>section_title, question_text, question_type, option_text</strong>.</p>
                <p>Aby dodać punktację, dodaj pary kolumn: <strong>scale_name_1, points_1, scale_name_2, points_2</strong> itd.</p>
                <p>Każdy wiersz reprezentuje jedną opcję odpowiedzi. Dla pytań z wieloma opcjami, powtórz ten sam tytuł sekcji i treść pytania w kolejnych wierszach.</p>
                <p>Dozwolone typy pytań: <code>multiple-choice</code>, <code>multiple-select</code>, <code>likert-5</code>.</p>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold mb-2">Krok 2: Podaj szczegóły testu</h2>
            <div className="space-y-4">
                <input type="text" placeholder="* Tytuł testu (wymagane)" value={testTitle} onChange={e => setTestTitle(e.target.value)} className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
                <textarea placeholder="Opis testu (opcjonalnie)" value={testDescription} onChange={e => setTestDescription(e.target.value)} className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold mb-2">Krok 3: Prześlij plik</h2>
            <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-[var(--background-color)] border-2 border-[var(--border-color)] border-dashed rounded-lg cursor-pointer hover:border-gray-400">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadIcon/>
                    <p className="mb-2 text-sm">
                        {fileName ? <span className="font-semibold">{fileName}</span> : <><span className="font-semibold">Kliknij, aby przesłać</span> lub przeciągnij i upuść</>}
                    </p>
                    <p className="text-xs opacity-70">CSV (rozdzielany przecinkami)</p>
                </div>
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

        <div className="flex justify-end">
            <button
                onClick={handleImport}
                disabled={!csvData || !testTitle || isProcessing}
                className="flex items-center gap-2 px-6 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
                {isProcessing ? 'Przetwarzanie...' : 'Przejdź do edytora'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TestImporter;