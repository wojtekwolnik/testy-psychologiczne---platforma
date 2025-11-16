
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { fetchTestById, saveTest, fetchPdfTemplates } from '../services/apiClient';
import type { Test, Scale, Question, AnswerOption, ScoringRule, Section, PdfTemplate } from './types';
import { PlusIcon, TrashIcon } from './common/Icons';
import RichTextInput from './common/RichTextInput';
import { generateUniqueId } from '../utils/idUtils';

// This function remains the same, it's good as it is.
const sanitizeImportedTest = (imported: Test): Test => {
    const scaleIdMap = new Map<string, string>();
    const sanitizedScales = imported.scales.map(s => {
        const newId = generateUniqueId('s');
        scaleIdMap.set(s.id, newId);
        return { ...s, id: newId };
    });

    const sanitizedSections = imported.sections.map(sec => {
        const optionIdMap = new Map<string, string>();
        const sanitizedQuestions = sec.questions.map(q => {
            const sanitizedOptions = q.options.map(o => {
                const newId = generateUniqueId('o');
                optionIdMap.set(o.id, newId);
                return { ...o, id: newId };
            });

            const sanitizedScoring: Test['sections'][0]['questions'][0]['scoring'] = {};
            for (const oldOptionId in q.scoring) {
                const newOptionId = optionIdMap.get(oldOptionId);
                if (newOptionId) {
                    sanitizedScoring[newOptionId] = q.scoring[oldOptionId]
                        .map(rule => ({
                            ...rule,
                            scaleId: scaleIdMap.get(rule.scaleId) || '',
                        }))
                        .filter(rule => rule.scaleId); // Remove rules for scales that don't exist
                }
            }
            return {
                ...q,
                id: generateUniqueId('q'),
                options: sanitizedOptions,
                scoring: sanitizedScoring,
            };
        });

        return {
            ...sec,
            id: generateUniqueId('sec'),
            questions: sanitizedQuestions,
        };
    });

    // Treat as a brand new test
    return {
        ...imported,
        id: generateUniqueId('new'),
        canonicalId: generateUniqueId('tid'),
        version: 1,
        scales: sanitizedScales,
        sections: sanitizedSections,
        createdAt: new Date(),
    };
};

const TestEditor: React.FC = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const location = useLocation();
  const importedTest = location.state?.importedTest as Test | undefined;

  const [test, setTest] = useState<Test>({
    id: generateUniqueId('new'), canonicalId: generateUniqueId('tid'), version: 1, title: '', description: '',
    instructions: '', questionsPerPage: null, scales: [], sections: [], defaultTemplateId: null, createdAt: new Date(),
  });
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
        setIsLoading(true);
        const fetchedTemplates = await fetchPdfTemplates();
        setTemplates(fetchedTemplates);

        let initialTest: Test | undefined;

        if (importedTest) {
            initialTest = sanitizeImportedTest(importedTest);
        } else if (testId) {
            initialTest = await fetchTestById(testId);
        }
        
        if (initialTest) {
          setTest(initialTest);
        } else {
            const newTest: Test = {
              id: generateUniqueId('new'), canonicalId: generateUniqueId('tid'), version: 1, title: 'Nowy Test',
              description: '',
              instructions: 'Proszę odpowiedzieć na wszystkie pytania szczerze.',
              questionsPerPage: 5, scales: [],
              sections: [{ id: generateUniqueId('sec'), title: 'Sekcja 1', questions: [] }],
              defaultTemplateId: fetchedTemplates.length > 0 ? fetchedTemplates[0].id : null,
              createdAt: new Date(),
            };
            setTest(newTest);
        }
        setIsLoading(false);
    };
    loadInitialData();
  }, [testId, importedTest]);
  
  const validateTest = () => {
      for (const [sIndex, section] of test.sections.entries()) {
          for (const [qIndex, question] of section.questions.entries()) {
              for (const [optionId, rules] of Object.entries(question.scoring)) {
                  for (const [rIndex, rule] of (rules as ScoringRule[]).entries()) {
                      if (!rule.scaleId || rule.points === undefined || rule.points === null) {
                         const option = question.options.find(o => o.id === optionId);
                         const optionText = option ? `"${option.text.replace(/<[^>]*>?/gm, '')}"` : `ID: ${optionId}`;
                         setValidationError(`Błąd walidacji: W Sekcji ${sIndex + 1}, Pytaniu ${qIndex + 1}, przy odpowiedzi ${optionText}, reguła punktacji #${rIndex + 1} jest niekompletna. Upewnij się, że wybrano skalę i wpisano punkty.`);
                         return false;
                      }
                  }
              }
          }
      }
      setValidationError(null);
      return true;
  }

  const handleSave = useCallback(async (asNewVersion: boolean) => {
    if (!validateTest()) {
        return false;
    }
    setIsSaving(true);
    // Use a function to get the most recent state value
    setTest(currentTest => {
        saveTest(currentTest, asNewVersion).then(savedTest => {
            setTest(savedTest);
            setIsSaving(false);
        });
        return currentTest; // No immediate state change
    });
    return true;
  }, []);

  const handleSaveAndExit = useCallback(async (asNewVersion: boolean) => {
      const success = await handleSave(asNewVersion);
      if (success) {
        navigate('/admin/dashboard'); // Updated navigation
      }
  }, [handleSave, navigate]);

  const handleTestChange = (field: keyof Test, value: any) => {
    setTest(prev => ({ ...prev, [field]: value }));
  };

  const addScale = () => {
    const newScale: Scale = { id: generateUniqueId('s'), name: '', description: '' };
    setTest(prev => ({ ...prev, scales: [...prev.scales, newScale] }));
  };
  
  const updateScale = (index: number, field: keyof Scale, value: string) => {
      setTest(prev => ({
        ...prev,
        scales: prev.scales.map((s, i) => i === index ? { ...s, [field]: value } : s),
      }));
  };

  const removeScale = (idToRemove: string) => {
    setTest(prev => ({
        ...prev,
        scales: prev.scales.filter(s => s.id !== idToRemove),
        sections: prev.sections.map(sec => ({
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
        }))
    }));
  };
  
  const addSection = () => {
      const newSection: Section = { id: generateUniqueId('sec'), title: '', questions: [] };
      setTest(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
  };

  const updateSectionTitle = (sIndex: number, title: string) => {
      setTest(prev => ({
        ...prev,
        sections: prev.sections.map((sec, i) => i === sIndex ? { ...sec, title } : sec)
      }));
  };
  
  const removeSection = (sIndex: number) => {
      setTest(prev => ({
        ...prev,
        sections: prev.sections.filter((_, i) => i !== sIndex)
      }));
  };

  const addQuestion = (sIndex: number) => {
    const newQuestion: Question = {
      id: generateUniqueId('q'),
      text: '',
      type: 'multiple-choice',
      options: [],
      scoring: {},
    };
    setTest(prev => ({
        ...prev,
        sections: prev.sections.map((sec, i) => {
            if (i === sIndex) {
                return { ...sec, questions: [...sec.questions, newQuestion] };
            }
            return sec;
        }),
    }));
  };
  
  const updateQuestion = (sIndex: number, qIndex: number, field: keyof Question, value: any) => {
    setTest(prev => {
        const newSections = JSON.parse(JSON.stringify(prev.sections));
        const question = newSections[sIndex].questions[qIndex];
        question[field] = value;

        if (field === 'type' && value === 'likert-5') {
            question.options = [
                { id: generateUniqueId('o'), text: 'Zdecydowanie się nie zgadzam' },
                { id: generateUniqueId('o'), text: 'Nie zgadzam się' },
                { id: generateUniqueId('o'), text: 'Ani tak, ani nie' },
                { id: generateUniqueId('o'), text: 'Zgadzam się' },
                { id: generateUniqueId('o'), text: 'Zdecydowanie się zgadzam' },
            ];
        }
        return { ...prev, sections: newSections };
    });
  };
  
  const removeQuestion = (sIndex: number, qIndex: number) => {
    setTest(prev => ({
        ...prev,
        sections: prev.sections.map((sec, i) => {
            if (i === sIndex) {
                return { ...sec, questions: sec.questions.filter((_, qi) => qi !== qIndex) };
            }
            return sec;
        }),
    }));
  };

  const addOption = (sIndex: number, qIndex: number) => {
    const newOption: AnswerOption = { id: generateUniqueId('o'), text: '' };
    setTest(prev => ({
        ...prev,
        sections: prev.sections.map((sec, i) => {
            if (i === sIndex) {
                return {
                    ...sec,
                    questions: sec.questions.map((q, qi) => {
                        if (qi === qIndex) {
                            return { ...q, options: [...q.options, newOption] };
                        }
                        return q;
                    })
                };
            }
            return sec;
        }),
    }));
  };

  const updateOption = (sIndex: number, qIndex: number, oIndex: number, text: string) => {
    setTest(prev => ({
        ...prev,
        sections: prev.sections.map((sec, i) => {
            if (i === sIndex) {
                return {
                    ...sec,
                    questions: sec.questions.map((q, qi) => {
                        if (qi === qIndex) {
                            return {
                                ...q,
                                options: q.options.map((opt, oi) => oi === oIndex ? { ...opt, text } : opt)
                            };
                        }
                        return q;
                    })
                };
            }
            return sec;
        }),
    }));
  };

  const removeOption = (sIndex: number, qIndex: number, optionId: string) => {
    setTest(prev => {
        const newSections = JSON.parse(JSON.stringify(prev.sections));
        const question = newSections[sIndex].questions[qIndex];
        question.options = question.options.filter((o: AnswerOption) => o.id !== optionId);
        delete question.scoring[optionId];
        return { ...prev, sections: newSections };
    });
  };
  
  const addScoringRule = (sIndex: number, qIndex: number, optionId: string) => {
    const newRule: ScoringRule = { scaleId: test.scales[0]?.id || '', points: 0 };
    setTest(prev => {
        const newSections = JSON.parse(JSON.stringify(prev.sections));
        const question = newSections[sIndex].questions[qIndex];
        question.scoring[optionId] = [...(question.scoring[optionId] || []), newRule];
        return { ...prev, sections: newSections };
    });
  };
  
  const updateScoringRule = (sIndex: number, qIndex: number, optionId: string, ruleIndex: number, field: keyof ScoringRule, value: any) => {
    setTest(prev => {
        const newSections = JSON.parse(JSON.stringify(prev.sections));
        const rules = newSections[sIndex].questions[qIndex].scoring[optionId];
        rules[ruleIndex] = { ...rules[ruleIndex], [field]: value };
        return { ...prev, sections: newSections };
    });
  };

  const removeScoringRule = (sIndex: number, qIndex: number, optionId: string, ruleIndex: number) => {
    setTest(prev => {
        const newSections = JSON.parse(JSON.stringify(prev.sections));
        const rules = newSections[sIndex].questions[qIndex].scoring[optionId];
        rules.splice(ruleIndex, 1);
        return { ...prev, sections: newSections };
    });
  };

  if (isLoading) return <div className="p-8 text-center">Ładowanie edytora testów...</div>;
  
  const isEditingExistingTest = !!testId && !importedTest;
  const pageTitle = importedTest ? `Importuj Test (v1)` : isEditingExistingTest ? `Edytuj Test (v${test.version})` : 'Utwórz Nowy Test (v1)';

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">{pageTitle}</h1>

      {/* Test Details */}
      <div className="bg-[var(--secondary-color)] p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Szczegóły Testu</h2>
        <div className="space-y-4">
          <RichTextInput placeholder="Tytuł testu" value={test.title} onChange={value => handleTestChange('title', value)} />
          <RichTextInput placeholder="Opis testu" value={test.description} onChange={value => handleTestChange('description', value)} />
          <RichTextInput placeholder="Instrukcje dla klienta" value={test.instructions} onChange={value => handleTestChange('instructions', value)} />
           <div>
            <label className="block text-sm font-medium mb-1">Domyślny szablon raportu PDF</label>
            <select
                value={test.defaultTemplateId || ''}
                onChange={e => handleTestChange('defaultTemplateId', e.target.value)}
                className="w-full p-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)]"
            >
                <option value="">Brak (użyj systemowego domyślnego)</option>
                {templates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
            </select>
          </div>
           <div>
                <label className="block text-sm font-medium mb-1">Pytania na stronę (paginacja)</label>
                <input 
                    type="number" 
                    placeholder="Zostaw puste, by wyłączyć" 
                    value={test.questionsPerPage || ''} 
                    onChange={e => handleTestChange('questionsPerPage', e.target.value ? parseInt(e.target.value, 10) : null)} 
                    className="w-full p-2 border border-[var(--border-color)] rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)]" 
                />
                <p className="text-xs opacity-60 mt-1">Określ, ile pytań ma być wyświetlanych na jednej stronie. Pozostawienie pustego pola wyłączy podział na strony.</p>
           </div>
        </div>
      </div>
      
      {/* Scales */}
      <div className="bg-[var(--secondary-color)] p-6 rounded-xl shadow-lg mb-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Skale Oceny</h2>
            <button onClick={addScale} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)]/20 text-[var(--accent-color)] font-semibold rounded-lg hover:bg-[var(--accent-color)]/30 transition-colors">
                <PlusIcon/> Dodaj Skalę
            </button>
        </div>
        <div className="space-y-4">
            {test.scales.map((scale, i) => (
                <div key={scale.id} className="flex items-start gap-4 p-4 bg-[var(--background-color)] rounded-lg">
                    <input type="text" placeholder="Nazwa skali (np. Lęk)" value={scale.name} onChange={e => updateScale(i, 'name', e.target.value)} className="w-1/3 p-2 border border-[var(--border-color)] rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
                    <input type="text" placeholder="Opis skali" value={scale.description} onChange={e => updateScale(i, 'description', e.target.value)} className="flex-grow p-2 border border-[var(--border-color)] rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
                    <button onClick={() => removeScale(scale.id)} className="p-2 text-[var(--error-color)] hover:bg-red-100 rounded-full"><TrashIcon/></button>
                </div>
            ))}
        </div>
      </div>

      {/* Sections and Questions */}
       <div className="space-y-6">
        {test.sections.map((section, sIndex) => (
            <div key={section.id} className="bg-[var(--secondary-color)] p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex-grow">
                        <RichTextInput placeholder={`Tytuł sekcji ${sIndex + 1}`} value={section.title} onChange={value => updateSectionTitle(sIndex, value)} />
                    </div>
                    {test.sections.length > 1 && <button onClick={() => removeSection(sIndex)} className="p-2 ml-4 text-[var(--error-color)] hover:bg-red-100 rounded-full"><TrashIcon/></button>}
                </div>

                <div className="space-y-6">
                    {section.questions.map((q, qIndex) => (
                        <div key={q.id} className="p-4 border border-[var(--background-color)] rounded-lg">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="flex-grow">
                                  <RichTextInput placeholder={`Pytanie ${qIndex + 1}`} value={q.text} onChange={value => updateQuestion(sIndex, qIndex, 'text', value)} />
                                </div>
                                <select value={q.type} onChange={e => updateQuestion(sIndex, qIndex, 'type', e.target.value)} className="p-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)]">
                                    <option value="multiple-choice">Jednokrotny wybór</option>
                                    <option value="multiple-select">Wielokrotny wybór</option>
                                    <option value="likert-5">Skala Likerta (5 st.)</option>
                                </select>
                                <button onClick={() => removeQuestion(sIndex, qIndex)} className="p-2 text-[var(--error-color)] hover:bg-red-100 rounded-full"><TrashIcon/></button>
                            </div>
                            <div className="pl-4 space-y-3">
                                {q.options.map((opt, oIndex) => (
                                    <div key={opt.id} className="bg-[var(--background-color)] p-3 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-grow">
                                                <RichTextInput placeholder={`Odpowiedź ${oIndex + 1}`} value={opt.text} onChange={value => updateOption(sIndex, qIndex, oIndex, value)} />
                                            </div>
                                            {q.type !== 'likert-5' && <button onClick={() => removeOption(sIndex, qIndex, opt.id)} className="p-2 text-[var(--error-color)] hover:bg-red-100 rounded-full self-center"><TrashIcon/></button>}
                                        </div>
                                        <div className="pl-4 mt-2 space-y-2">
                                            {(q.scoring[opt.id] || []).map((rule, ruleIndex) => (
                                                <div key={ruleIndex} className="flex items-center gap-2">
                                                    <span className="text-sm">Reguła #{ruleIndex + 1}:</span>
                                                    <select value={rule.scaleId} onChange={e => updateScoringRule(sIndex, qIndex, opt.id, ruleIndex, 'scaleId', e.target.value)} className="p-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)]" disabled={test.scales.length === 0}>
                                                        <option value="">{test.scales.length === 0 ? 'Brak skal' : 'Wybierz skalę'}</option>
                                                        {test.scales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                    <input type="number" placeholder="Pkt" value={rule.points} onChange={e => updateScoringRule(sIndex, qIndex, opt.id, ruleIndex, 'points', parseInt(e.target.value, 10) || 0)} className="w-24 p-2 border border-[var(--border-color)] rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)]"/>
                                                    <button onClick={() => removeScoringRule(sIndex, qIndex, opt.id, ruleIndex)} className="p-1 text-[var(--error-color)] hover:bg-red-100 rounded-full"><TrashIcon/></button>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => addScoringRule(sIndex, qIndex, opt.id)} 
                                                disabled={test.scales.length === 0}
                                                title={test.scales.length === 0 ? "Najpierw dodaj skalę, aby móc przypisać punkty." : "Dodaj regułę punktacji"}
                                                className="text-xs text-[var(--accent-color)] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                            >
                                                + Dodaj regułę punktacji
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {q.type !== 'likert-5' && <button onClick={() => addOption(sIndex, qIndex)} className="text-sm text-[var(--primary-color)] font-semibold mt-2">+ Dodaj opcję</button>}
                            </div>
                        </div>
                    ))}
                     <button onClick={() => addQuestion(sIndex)} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)]/20 text-[var(--accent-color)] font-semibold rounded-lg hover:bg-[var(--accent-color)]/30 transition-colors mt-4">
                        <PlusIcon/> Dodaj Pytanie do tej sekcji
                    </button>
                </div>
            </div>
        ))}
         <button onClick={addSection} className="w-full text-center py-4 border-2 border-dashed border-[var(--border-color)] opacity-60 rounded-lg hover:bg-[var(--secondary-color)] hover:border-slate-400 transition-colors">
            + Dodaj nową sekcję
        </button>
      </div>
      
      {validationError && (
        <div className="mt-4 p-4 bg-red-100 text-[var(--error-color)] rounded-lg font-semibold">
            {validationError}
        </div>
      )}

      <div className="flex justify-end gap-4 mt-8">
        <button onClick={() => navigate('/admin/dashboard')} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg">Anuluj</button>
        {isEditingExistingTest ? (
          <>
            <button onClick={() => handleSaveAndExit(false)} disabled={isSaving} className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg disabled:bg-slate-400">
              {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
            <button onClick={() => handleSaveAndExit(true)} disabled={isSaving} className="px-6 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg disabled:bg-slate-400">
              {isSaving ? 'Zapisywanie...' : 'Zapisz jako nową wersję'}
            </button>
          </>
        ) : (
          <button onClick={() => handleSaveAndExit(false)} disabled={isSaving} className="px-6 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg disabled:bg-slate-400">
            {isSaving ? 'Zapisywanie...' : 'Zapisz Test'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TestEditor;
