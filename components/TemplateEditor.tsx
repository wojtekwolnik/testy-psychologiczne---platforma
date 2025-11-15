import React, { useState, useEffect, useCallback } from 'react';
import { fetchPdfTemplateById, savePdfTemplate } from '../services/apiService';
import { View, type PdfTemplate } from './types';
import RichTextInput from './common/RichTextInput';

interface TemplateEditorProps {
  templateId: string | null;
  onNavigate: (view: View) => void;
  setIsDirty: (isDirty: boolean) => void;
  setSaveAction: (action: { handler: () => Promise<boolean> } | null) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ templateId, onNavigate, setIsDirty, setSaveAction }) => {
  const [template, setTemplate] = useState<PdfTemplate>({
    id: `tpl-${Date.now()}`,
    name: '',
    includeBarChart: true,
    includePieChart: true,
    includeDetailedAnswers: true,
    includeHeader: true,
    includeClientInfo: true,
    includeScoresTable: true,
    customHeaderText: '',
  });
  const [initialState, setInitialState] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadTemplate = async () => {
      setIsLoading(true);
      if (templateId) {
        const fetchedTemplate = await fetchPdfTemplateById(templateId);
        if (fetchedTemplate) {
          setTemplate(fetchedTemplate);
          setInitialState(JSON.stringify(fetchedTemplate));
        }
      } else {
         const newTemplate = {
            id: `tpl-${Date.now()}`,
            name: '',
            includeBarChart: true,
            includePieChart: true,
            includeDetailedAnswers: true,
            includeHeader: true,
            includeClientInfo: true,
            includeScoresTable: true,
            customHeaderText: '',
        };
        setTemplate(newTemplate);
        setInitialState(JSON.stringify(newTemplate));
      }
      setIsLoading(false);
    };
    loadTemplate();
  }, [templateId]);
  
  useEffect(() => {
    setIsDirty(JSON.stringify(template) !== initialState);
  }, [template, initialState, setIsDirty]);

  const handleSave = useCallback(async () => {
      if (!template.name) {
          alert("Nazwa szablonu jest wymagana.");
          return false;
      }
      setIsSaving(true);
      await savePdfTemplate(template);
      setIsSaving(false);
      setIsDirty(false);
      // After saving, update the initial state to prevent the dirty flag from being true
      setInitialState(JSON.stringify(template));
      return true;
  }, [template, setIsDirty]);
  
  const handleSaveAndExit = useCallback(async () => {
      // Check for name before trying to save and exit.
      if (!template.name) {
          alert("Nazwa szablonu jest wymagana.");
          return;
      }
      const success = await handleSave();
      if (success) {
        onNavigate(View.TemplateManager);
      }
  }, [handleSave, onNavigate, template.name]);

  useEffect(() => {
    setSaveAction({ handler: handleSave });
    return () => setSaveAction(null);
  }, [handleSave, setSaveAction]);


  const handleToggle = (field: keyof Omit<PdfTemplate, 'id' | 'name' | 'customHeaderText'>) => {
    setTemplate(prev => ({ ...prev, [field]: !prev[field] }));
  };
  
  const handleChange = (field: keyof PdfTemplate, value: string) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) return <div className="p-8 text-center">Ładowanie edytora szablonów...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">{templateId ? 'Edytuj szablon raportu' : 'Utwórz nowy szablon'}</h1>
      
      <div className="bg-[var(--secondary-color)] p-8 rounded-xl shadow-lg space-y-6">
        <div>
            <label className="block text-lg font-semibold mb-2">Nazwa szablonu</label>
            <input
                type="text"
                placeholder="np. Raport standardowy"
                value={template.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]"
            />
        </div>
         <div>
            <label className="block text-lg font-semibold mb-2">Niestandardowy tekst nagłówka</label>
            <RichTextInput
                value={template.customHeaderText}
                onChange={(value) => handleChange('customHeaderText', value)}
            />
        </div>

        <div>
            <h2 className="text-lg font-semibold mb-2">Elementy dołączone do raportu PDF</h2>
            <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer has-[:checked]:bg-indigo-50 has-[:checked]:border-[var(--primary-color)]">
                    <span>
                        <span className="font-semibold">Nagłówek raportu</span>
                        <span className="block text-sm opacity-70">Zawiera logo, tytuł testu i niestandardowy tekst.</span>
                    </span>
                    <input type="checkbox" checked={template.includeHeader} onChange={() => handleToggle('includeHeader')} className="h-6 w-6 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                </label>
                 <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer has-[:checked]:bg-indigo-50 has-[:checked]:border-[var(--primary-color)]">
                    <span>
                        <span className="font-semibold">Informacje o kliencie</span>
                        <span className="block text-sm opacity-70">Identyfikator klienta i data ukończenia.</span>
                    </span>
                    <input type="checkbox" checked={template.includeClientInfo} onChange={() => handleToggle('includeClientInfo')} className="h-6 w-6 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer has-[:checked]:bg-indigo-50 has-[:checked]:border-[var(--primary-color)]">
                    <span>
                        <span className="font-semibold">Tabela wyników</span>
                        <span className="block text-sm opacity-70">Prosta tabela z punktacją dla każdej skali.</span>
                    </span>
                    <input type="checkbox" checked={template.includeScoresTable} onChange={() => handleToggle('includeScoresTable')} className="h-6 w-6 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer has-[:checked]:bg-indigo-50 has-[:checked]:border-[var(--primary-color)]">
                    <span>
                        <span className="font-semibold">Wykres słupkowy</span>
                        <span className="block text-sm opacity-70">Porównanie wyników z maksymalną wartością.</span>
                    </span>
                    <input type="checkbox" checked={template.includeBarChart} onChange={() => handleToggle('includeBarChart')} className="h-6 w-6 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                </label>
                 <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer has-[:checked]:bg-indigo-50 has-[:checked]:border-[var(--primary-color)]">
                    <span>
                        <span className="font-semibold">Wykres kołowy</span>
                        <span className="block text-sm opacity-70">Proporcjonalny udział wyników w całości.</span>
                    </span>
                    <input type="checkbox" checked={template.includePieChart} onChange={() => handleToggle('includePieChart')} className="h-6 w-6 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                </label>
                 <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer has-[:checked]:bg-indigo-50 has-[:checked]:border-[var(--primary-color)]">
                    <span>
                        <span className="font-semibold">Szczegółowe odpowiedzi</span>
                        <span className="block text-sm opacity-70">Lista wszystkich pytań i odpowiedzi klienta.</span>
                    </span>
                    <input type="checkbox" checked={template.includeDetailedAnswers} onChange={() => handleToggle('includeDetailedAnswers')} className="h-6 w-6 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                </label>
            </div>
        </div>
      </div>

       <div className="flex justify-end gap-4 mt-8">
        <button onClick={() => onNavigate(View.TemplateManager)} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg">Anuluj</button>
        <button onClick={handleSaveAndExit} disabled={isSaving} className="px-6 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg disabled:bg-slate-400">
            {isSaving ? 'Zapisywanie...' : 'Zapisz szablon'}
        </button>
      </div>

    </div>
  );
};

export default TemplateEditor;
