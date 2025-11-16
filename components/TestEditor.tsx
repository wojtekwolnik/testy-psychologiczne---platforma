
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { fetchTestById, saveTest, fetchPdfTemplates } from '../services/apiClient';
import type { Test, Scale, Question, AnswerOption, ScoringRule, Section, PdfTemplate } from './types';
import { PlusIcon, TrashIcon, CalculatorIcon } from './common/Icons';
import RichTextInput from './common/RichTextInput';
import { generateUniqueId } from '../utils/idUtils';

const TestEditor: React.FC = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const [test, setTest] = useState<Test | null>(null);
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const fetchedTemplates = await fetchPdfTemplates();
            setTemplates(fetchedTemplates);
            let initialTest: Test | null = null;
            if (testId) {
                initialTest = await fetchTestById(testId);
            }
            if (initialTest) {
                setTest(initialTest);
            } else {
                const newTest: Test = {
                    id: generateUniqueId('new'), 
                    canonicalId: generateUniqueId('tid'), version: 1, title: 'Nowy Test',
                    description: '', instructions: '', questionsPerPage: 10, scales: [],
                    sections: [{ id: generateUniqueId('sec'), title: 'Sekcja 1', questions: [] }],
                    defaultTemplateId: null, createdAt: new Date().toISOString(),
                };
                setTest(newTest);
            }
        } catch(e) { console.error("Failed to load initial data", e); } 
        finally { setIsLoading(false); }
    };
    loadInitialData();
  }, [testId]);

  const handleSaveAndExit = useCallback(async (asNewVersion: boolean) => { 
        if (!test) return;
        setIsSaving(true);
        try {
            const savedTest = await saveTest(test, asNewVersion);
            setTest(savedTest);
            navigate('/admin/dashboard');
        } catch(e) { console.error(e) } finally { setIsSaving(false); }
    }, [test, navigate]);

  const handleTestChange = (field: keyof Test, value: any) => {
    setTest(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const addScale = (type: 'standard' | 'calculated') => {
    let newScale: Scale;
    if (type === 'standard') {
        newScale = { id: generateUniqueId('s'), type: 'standard', name: 'Nowa Skala Standardowa', description: '', maxScore: 50 };
    } else {
        newScale = { id: generateUniqueId('s'), type: 'calculated', name: 'Nowa Skala Obliczeniowa', description: '', formula: '' };
    }
    setTest(prev => prev ? ({ ...prev, scales: [...prev.scales, newScale] }) : null);
  };
  
  const updateScale = (index: number, updatedValues: Partial<Scale>) => {
      setTest(prev => prev ? ({
        ...prev,
        scales: prev.scales.map((s, i) => i === index ? { ...s, ...updatedValues } : s),
      }) : null);
  };

  const removeScale = (idToRemove: string) => {
    setTest(prev => {
        if (!prev) return null;

        const cleanedScales = prev.scales
            .filter(s => s.id !== idToRemove)
            .map(s => {
                if (s.type === 'calculated' && s.formula && s.formula.includes(`{${idToRemove}}`)) {
                    return {
                        ...s,
                        formula: s.formula.replace(new RegExp(`\\{${idToRemove}\\}`, 'g'), '0'),
                    };
                }
                return s;
            });

        const cleanedSections = prev.sections.map(sec => ({
            ...sec,
            questions: sec.questions.map(q => ({
                ...q,
                scoring: Object.keys(q.scoring).reduce((acc, optionId) => {
                    const rules = q.scoring[optionId];
                    const filteredRules = rules.filter(rule => rule.scaleId !== idToRemove);
                    if (filteredRules.length > 0) {
                        acc[optionId] = filteredRules;
                    }
                    return acc;
                }, {} as Record<string, ScoringRule[]>)
            }))
        }));

        return {
            ...prev,
            scales: cleanedScales,
            sections: cleanedSections,
        };
    });
  };
  
  const insertScaleIdIntoFormula = (index: number, scaleId: string) => {
      const currentScale = test?.scales[index];
      if(currentScale?.type === 'calculated') {
          const currentFormula = currentScale.formula || '';
          const newFormula = `${currentFormula}{${scaleId}}`;
          updateScale(index, { formula: newFormula });
      }
  }

  if (isLoading || !test) return <div className="p-8 text-center">Ładowanie edytora testów...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Edytor Testu</h1>
      <div className="bg-[var(--secondary-color)] p-6 rounded-xl shadow-lg mb-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Skale Oceny</h2>
            <div className="flex gap-2">
                 <button onClick={() => addScale('standard')} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)]/20 text-[var(--accent-color)] font-semibold rounded-lg hover:bg-[var(--accent-color)]/30 transition-colors">
                    <PlusIcon/> Dodaj Skalę Standardową
                </button>
                <button onClick={() => addScale('calculated')} className="flex items-center gap-2 px-4 py-2 bg-orange-400/20 text-orange-500 font-semibold rounded-lg hover:bg-orange-400/30 transition-colors">
                    <CalculatorIcon/> Dodaj Skalę Obliczeniową
                </button>
            </div>
        </div>
        <div className="space-y-4">
            {test.scales.map((scale, i) => (
                <div key={scale.id} className={`p-4 rounded-lg bg-[var(--background-color)] border-l-4 ${scale.type === 'calculated' ? 'border-orange-500' : 'border-blue-500'}`}>
                    <div className="flex items-start gap-4">
                        <div className="flex-grow space-y-2">
                            <input type="text" placeholder="Nazwa skali" value={scale.name} onChange={e => updateScale(i, { name: e.target.value })} className="w-full p-2 border border-[var(--border-color)] rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
                            <input type="text" placeholder="Opis skali" value={scale.description} onChange={e => updateScale(i, { description: e.target.value })} className="w-full p-2 border border-[var(--border-color)] rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
                        </div>
                         <button onClick={() => removeScale(scale.id)} className="p-2 text-[var(--error-color)] hover:bg-red-100 rounded-full"><TrashIcon/></button>
                    </div>
                    {scale.type === 'standard' ? (
                        <div className="mt-2">
                            <label className="text-sm font-medium">Maksymalna liczba punktów:</label>
                             <input type="number" value={scale.maxScore || 0} onChange={e => updateScale(i, { maxScore: parseInt(e.target.value) || 0 })} className="w-32 p-2 ml-2 border border-[var(--border-color)] rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
                        </div>
                    ) : (
                        <div className="mt-3 p-3 bg-orange-400/10 rounded-md">
                            <label className="text-sm font-medium text-orange-700">Formuła obliczeniowa:</label>
                            <input type="text" placeholder="np. ({scale-id1} + {scale-id2}) / 2" value={scale.formula || ''} onChange={e => updateScale(i, { formula: e.target.value })} className="w-full p-2 mt-1 border border-orange-300 rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
                            <div className="mt-2 text-xs">
                                <span className="font-semibold">Wstaw ID skali:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                {test.scales.filter(s => s.id !== scale.id).map(s => (
                                    <button key={s.id} onClick={() => insertScaleIdIntoFormula(i, s.id)} className="text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded-md">{s.name} ({s.id})</button>
                                ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
      <div className="flex justify-end gap-4 mt-8">
        <button onClick={() => navigate('/admin/dashboard')} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg">Anuluj</button>
        <button onClick={() => handleSaveAndExit(false)} disabled={isSaving} className="px-6 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg disabled:bg-slate-400">
            {isSaving ? 'Zapisywanie...' : 'Zapisz Test'}
        </button>
      </div>
    </div>
  );
};

export default TestEditor;
