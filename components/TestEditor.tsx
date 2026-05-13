
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchTestById, saveTest, createNewTest, fetchPdfTemplates } from '@/app/actions/testActions';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { Test, Scale, Question, AnswerOption, ScoringRule, Section, PdfTemplate } from './types';
import { PlusIcon, TrashIcon, CalculatorIcon, QuestionMarkCircleIcon, ChevronLeftIcon } from './common/Icons';
// import RichTextInput from './common/RichTextInput';
import { generateUniqueId } from '../utils/idUtils';

const LIKERT_5_LABELS = [
    'Zdecydowanie nie zgadzam się',
    'Raczej się nie zgadzam',
    'Nie mam zdania/Średnio',
    'Raczej się zgadzam',
    'Zdecydowanie zgadzam się'
];
// Points for Likert 5: 1, 2, 3, 4, 5 (Normal) / 5, 4, 3, 2, 1 (Reversed)

const YES_NO_LABELS = ['Tak', 'Nie'];
// Points for Yes/No: Yes=1, No=0 (Normal) / Yes=0, No=1 (Reversed)


const validateTest = (test: Test): string[] => {
    const errors: string[] = [];
    if (!test.title || test.title.trim() === '') errors.push('Tytuł testu jest wymagany');
    if (test.sections.length === 0) errors.push('Test musi zawierać przynajmniej jedną sekcję');

    test.sections.forEach((section, index) => {
        if (section.questions.length === 0) errors.push(`Sekcja "${section.title}" nie zawiera pytań`);
        section.questions.forEach((q, qIndex) => {
            if (!q.text || q.text.trim() === '') errors.push(`Pytanie ${qIndex + 1} w sekcji "${section.title}" nie ma treści`);
        });
    });

    test.scales.forEach((scale, index) => {
        if (!scale.name || scale.name.trim() === '') errors.push(`Skala #${index + 1} nie ma nazwy`);
    });

    return errors;
};


const TestEditor: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const testId = params.testId as string; // Next.js params can be string or array

    const [test, setTest] = useState<Test | null>(null);
    const [templates, setTemplates] = useState<PdfTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [helpTopic, setHelpTopic] = useState<'formula' | 'sections' | 'reversed' | 'auto-score' | null>(null);
    // Stores the ID of the currently expanded question. If null, all are collapsed.
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const fetchedTemplates = await fetchPdfTemplates();
                setTemplates(fetchedTemplates);
                let initialTest: Test | null = null;
                if (testId && testId !== 'new') {
                    initialTest = await fetchTestById(testId);
                }

                if (initialTest) {
                    setTest(initialTest);
                } else {
                    const newTest: Test = {
                        id: generateUniqueId('new'),
                        canonicalId: generateUniqueId('tid'), version: 1, title: 'Nowy Test',
                        description: '', instructions: '', status: 'DRAFT', questionsPerPage: 10, scales: [],
                        sections: [{ id: generateUniqueId('sec'), title: 'Sekcja 1', questions: [] }],
                        defaultTemplateId: null, createdAt: new Date().toISOString(),
                    };
                    setTest(newTest);
                }
            } catch (e) { console.error("Failed to load initial data", e); }
            finally { setIsLoading(false); }
        };
        loadInitialData();
    }, [testId]);

    const handleSave = useCallback(async (isPublishing: boolean) => {
        if (!test) return;

        // If publishing, validate. If draft, skip validation.
        if (isPublishing) {
            const errors = validateTest(test);
            if (errors.length > 0) {
                toast.error(
                    <div>
                        <strong>Nie można opublikować testu:</strong>
                        <ul className="list-disc pl-4 mt-2">
                            {errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>,
                    { autoClose: 5000 }
                );
                return;
            }
        }

        setIsSaving(true);
        try {
            // Update status based on action
            const testToSave = { ...test, status: isPublishing ? 'PUBLISHED' : 'DRAFT' } as Test;

            let saved: Test;
            if (testId === 'new') {
                saved = await createNewTest(testToSave);
            } else {
                saved = await saveTest(testToSave, false);
            }

            setTest(saved);
            toast.success(isPublishing ? "Test opublikowany pomyślnie!" : "Szkic zapisany pomyślnie!");
            setTimeout(() => {
                router.push('/admin/dashboard');
            }, 1000);
        } catch (e) {
            console.error(e);
            toast.error("Wystąpił błąd podczas zapisywania testu.");
        } finally { setIsSaving(false); }
    }, [test, router, testId]);

    const handleTestChange = (field: keyof Test, value: any) => {
        setTest(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    // Warn on page reload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (test) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [test]);

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
        if (currentScale?.type === 'calculated') {
            const currentFormula = currentScale.formula || '';
            const newFormula = `${currentFormula}{${scaleId}}`;
            updateScale(index, { formula: newFormula });
        }
    }

    // --- Section Management ---
    const addSection = () => {
        setTest(prev => prev ? ({
            ...prev,
            sections: [...prev.sections, { id: generateUniqueId('sec'), title: `Sekcja ${prev.sections.length + 1}`, questions: [] }]
        }) : null);
    };

    const updateSection = (sectionId: string, updates: Partial<Section>) => {
        setTest(prev => prev ? ({
            ...prev,
            sections: prev.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s)
        }) : null);
    };

    const removeSection = (sectionId: string) => {
        setTest(prev => prev ? ({
            ...prev,
            sections: prev.sections.filter(s => s.id !== sectionId)
        }) : null);
    };

    // --- Question Management ---
    const addQuestion = (sectionId: string) => {
        const newQuestion: Question = {
            id: generateUniqueId('q'),
            text: 'Nowe Pytanie',
            type: 'multiple-choice', // default
            options: [],
            scoring: {}
        };

        setTest(prev => prev ? ({
            ...prev,
            sections: prev.sections.map(s => s.id === sectionId ? { ...s, questions: [...s.questions, newQuestion] } : s)
        }) : null);
        // Ensure new question is expanded
        setExpandedQuestionId(newQuestion.id);
    };

    const updateQuestion = (sectionId: string, questionId: string, updates: Partial<Question>) => {
        setTest(prev => {
            if (!prev) return null;
            return {
                ...prev,
                sections: prev.sections.map(s => {
                    if (s.id !== sectionId) return s;
                    return {
                        ...s,
                        questions: s.questions.map(q => {
                            if (q.id !== questionId) return q;

                            let newOptions = q.options;
                            let newScoring = q.scoring;

                            // Auto-generate options if type changes to a fixed scale
                            if (updates.type) {
                                if (updates.type === 'likert-5') {
                                    newOptions = LIKERT_5_LABELS.map(text => ({ id: generateUniqueId('opt'), text }));
                                    newScoring = {};
                                } else if (updates.type === 'likert-7') {
                                    newOptions = Array.from({ length: 7 }, (_, i) => ({ id: generateUniqueId('opt'), text: (i + 1).toString() }));
                                    newScoring = {};
                                } else if (updates.type === 'scale-1-10') {
                                    newOptions = Array.from({ length: 10 }, (_, i) => ({ id: generateUniqueId('opt'), text: (i + 1).toString() }));
                                    newScoring = {};
                                } else if (updates.type === 'yes-no') {
                                    newOptions = YES_NO_LABELS.map(text => ({ id: generateUniqueId('opt'), text }));
                                    newScoring = {};
                                }
                            }

                            return {
                                ...q,
                                ...updates,
                                options: updates.type ? newOptions : (updates.options || q.options),
                                scoring: updates.type ? newScoring : (updates.scoring || q.scoring)
                            };
                        })
                    };
                })
            };
        });
    };

    const applyAutoScoring = (sectionId: string, questionId: string, scaleId: string, isReversed: boolean) => {
        setTest(prev => {
            if (!prev) return null;
            return {
                ...prev,
                sections: prev.sections.map(s => {
                    if (s.id !== sectionId) return s;
                    return {
                        ...s,
                        questions: s.questions.map(q => {
                            if (q.id !== questionId) return q;

                            // Generate scoring based on type
                            const newScoring: Record<string, ScoringRule[]> = {};

                            q.options.forEach((opt, index) => {
                                let points = 0;

                                if (q.type === 'yes-no') {
                                    // Index 0 = Tak, Index 1 = Nie
                                    if (index === 0) points = isReversed ? 0 : 1;
                                    else points = isReversed ? 1 : 0;
                                } else if (q.type === 'likert-5') {
                                    // 1..5
                                    points = isReversed ? (5 - index) : (index + 1);
                                } else if (q.type === 'scale-1-10') {
                                    // 1..10
                                    points = isReversed ? (10 - index) : (index + 1);
                                } else {
                                    // Default fallback logic for others (e.g. likert-7)
                                    points = isReversed ? (q.options.length - index) : (index + 1);
                                }

                                newScoring[opt.id] = [{ scaleId, points }];
                            });

                            return {
                                ...q,
                                isReversed, // Ensure the reversed flag is set
                                scoring: newScoring
                            };
                        })
                    };
                })
            };
        });
    };

    const removeQuestion = (sectionId: string, questionId: string) => {
        setTest(prev => prev ? ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id !== sectionId) return s;
                return { ...s, questions: s.questions.filter(q => q.id !== questionId) };
            })
        }) : null);
    };

    // --- Option Management ---
    const addOption = (sectionId: string, questionId: string) => {
        const newOption: AnswerOption = { id: generateUniqueId('opt'), text: 'Nowa Opcja' };
        setTest(prev => {
            if (!prev) return null;
            return {
                ...prev,
                sections: prev.sections.map(s => {
                    if (s.id !== sectionId) return s;
                    return {
                        ...s,
                        questions: s.questions.map(q => {
                            if (q.id !== questionId) return q;
                            return { ...q, options: [...q.options, newOption] };
                        })
                    };
                })
            };
        });
    };

    const updateOption = (sectionId: string, questionId: string, optionId: string, text: string) => {
        setTest(prev => {
            if (!prev) return null;
            return {
                ...prev,
                sections: prev.sections.map(s => {
                    if (s.id !== sectionId) return s;
                    return {
                        ...s,
                        questions: s.questions.map(q => {
                            if (q.id !== questionId) return q;
                            return {
                                ...q,
                                options: q.options.map(o => o.id === optionId ? { ...o, text } : o)
                            };
                        })
                    };
                })
            };
        });
    };

    const removeOption = (sectionId: string, questionId: string, optionId: string) => {
        setTest(prev => {
            if (!prev) return null;
            return {
                ...prev,
                sections: prev.sections.map(s => {
                    if (s.id !== sectionId) return s;
                    return {
                        ...s,
                        questions: s.questions.map(q => {
                            if (q.id !== questionId) return q;
                            const newScoring = { ...q.scoring };
                            delete newScoring[optionId]; // Remove scoring for this option
                            return {
                                ...q,
                                options: q.options.filter(o => o.id !== optionId),
                                scoring: newScoring
                            };
                        })
                    };
                })
            };
        });
    };

    // --- Scoring Management ---
    const addScoringRule = (sectionId: string, questionId: string, optionId: string, scaleId: string, points: number) => {
        setTest(prev => {
            if (!prev) return null;
            return {
                ...prev,
                sections: prev.sections.map(s => {
                    if (s.id !== sectionId) return s;
                    return {
                        ...s,
                        questions: s.questions.map(q => {
                            if (q.id !== questionId) return q;
                            const currentRules = q.scoring[optionId] || [];
                            const newRules = [...currentRules, { scaleId, points }];
                            return {
                                ...q,
                                scoring: { ...q.scoring, [optionId]: newRules }
                            };
                        })
                    };
                })
            };
        });
    };

    const removeScoringRule = (sectionId: string, questionId: string, optionId: string, ruleIndex: number) => {
        setTest(prev => {
            if (!prev) return null;
            return {
                ...prev,
                sections: prev.sections.map(s => {
                    if (s.id !== sectionId) return s;
                    return {
                        ...s,
                        questions: s.questions.map(q => {
                            if (q.id !== questionId) return q;
                            const currentRules = q.scoring[optionId] || [];
                            const newRules = currentRules.filter((_, idx) => idx !== ruleIndex);
                            return {
                                ...q,
                                scoring: { ...q.scoring, [optionId]: newRules }
                            };
                        })
                    };
                })
            };
        });
    };

    const toggleQuestionCollapse = (questionId: string) => {
        setExpandedQuestionId(prevId => prevId === questionId ? null : questionId);
    };

    if (isLoading || !test) return <div className="p-8 text-center">Ładowanie edytora testów...</div>;

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Edytor Testu</h1>

            {/* Metadata Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-slate-200">
                <h2 className="text-2xl font-semibold mb-4">Informacje Podstawowe</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tytuł Testu</label>
                        <input
                            type="text"
                            value={test.title}
                            onChange={e => handleTestChange('title', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none text-lg font-semibold"
                            placeholder="Wprowadź tytuł testu..."
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Opis (widoczny dla klienta)</label>
                        <textarea
                            value={test.description}
                            onChange={e => handleTestChange('description', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none min-h-[80px]"
                            placeholder="Wprowadź opis testu..."
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Instrukcje (widoczne przed rozpoczęciem)</label>
                        <textarea
                            value={test.instructions}
                            onChange={e => handleTestChange('instructions', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none min-h-[80px]"
                            placeholder="Wprowadź instrukcje..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Wersja</label>
                        <input
                            type="number"
                            value={test.version}
                            readOnly
                            className="w-full p-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-400 mt-1">Wersja jest aktualizowana automatycznie przy zapisie.</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <label className="block text-sm font-medium text-slate-700">Maksymalna liczba pytań w sekcji</label>
                            <button onClick={() => setHelpTopic('sections')} className="text-slate-400 hover:text-[var(--primary-color)]">
                                <QuestionMarkCircleIcon className="h-4 w-4" />
                            </button>
                        </div>
                        <input
                            type="number"
                            min={1}
                            value={test.questionsPerPage || 10}
                            onChange={e => handleTestChange('questionsPerPage', parseInt(e.target.value) || 10)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            To ustawienie pomaga kontrolować długość sekcji. W widoku klienta, każda sekcja to osobna strona.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-[var(--secondary-color)] p-6 rounded-xl shadow-lg mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">Skale Oceny</h2>
                    <div className="flex gap-2">
                        <button onClick={() => addScale('standard')} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)]/20 text-[var(--accent-color)] font-semibold rounded-lg hover:bg-[var(--accent-color)]/30 transition-colors">
                            <PlusIcon /> Dodaj Skalę Standardową
                        </button>
                        <button onClick={() => addScale('calculated')} className="flex items-center gap-2 px-4 py-2 bg-orange-400/20 text-orange-500 font-semibold rounded-lg hover:bg-orange-400/30 transition-colors">
                            <CalculatorIcon /> Dodaj Skalę Obliczeniową
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
                                <button onClick={() => removeScale(scale.id)} className="p-2 text-[var(--error-color)] hover:bg-red-100 rounded-full"><TrashIcon /></button>
                            </div>
                            {scale.type === 'standard' ? (
                                <div className="mt-2">
                                    <label className="text-sm font-medium">Maksymalna liczba punktów:</label>
                                    <input type="number" min="1" value={scale.maxScore || 0} onChange={e => updateScale(i, { maxScore: Math.max(1, parseInt(e.target.value) || 0) })} className="w-32 p-2 ml-2 border border-[var(--border-color)] rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
                                </div>
                            ) : (
                                <div className="mt-3 p-3 bg-orange-400/10 rounded-md">
                                    <div className="flex items-center gap-2 mb-1">
                                        <label className="text-sm font-medium text-orange-700">Formuła obliczeniowa:</label>
                                        <button
                                            onClick={() => setHelpTopic('formula')}
                                            className="text-orange-600 hover:text-orange-800 transition-colors"
                                            title="Jak tworzyć formuły?"
                                        >
                                            <QuestionMarkCircleIcon className="h-5 w-5" />
                                        </button>
                                    </div>
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

            <div className="space-y-8">
                {test.sections.map((section, sIndex) => (
                    <div key={section.id} className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <input
                                type="text"
                                value={section.title}
                                onChange={e => updateSection(section.id, { title: e.target.value })}
                                className="text-2xl font-bold bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-[var(--primary-color)] outline-none px-2 py-1 flex-grow mr-4"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => removeSection(section.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Usuń sekcję">
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {section.questions.map((question, qIndex) => {
                                const isExpanded = expandedQuestionId === question.id;
                                return (
                                    <div key={question.id} className="bg-slate-50 border border-slate-200 shadow-sm rounded-lg overflow-hidden transition-all">
                                        {/* Question Header / Toggle Bar */}
                                        <div
                                            className="bg-slate-100 p-4 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition-colors"
                                            onClick={() => toggleQuestionCollapse(question.id)}
                                        >
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : '-rotate-0'}`}>
                                                    <ChevronLeftIcon className="h-5 w-5 text-slate-500" />
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Pytanie {qIndex + 1}</span>
                                                    <span className="text-sm font-medium text-slate-800 truncate max-w-[500px]">
                                                        {question.text || <span className="italic text-slate-400">Bez treści...</span>}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs px-2 py-1 bg-white border rounded text-slate-500 hidden sm:inline-block">
                                                    {question.type === 'yes-no' ? 'Tak/Nie' :
                                                        question.type === 'likert-5' ? 'Likert (1-5)' :
                                                            question.type === 'scale-1-10' ? 'Skala (1-10)' :
                                                                question.type === 'multiple-select' ? 'Wielokrotny' : 'Jednokrotny'}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeQuestion(section.id, question.id);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Usuń pytanie"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Collapsible Body */}
                                        <div className={`transition-all duration-300 ease-in-out ${!isExpanded ? 'max-h-0 opacity-0 overflow-hidden' : 'opacity-100 p-6'}`}>
                                            <div className="mb-4 pr-10">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Treść Pytania</label>
                                                <input
                                                    type="text"
                                                    value={question.text}
                                                    onChange={e => updateQuestion(section.id, question.id, { text: e.target.value })}
                                                    className="w-full text-lg p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                                                    placeholder="Treść pytania..."
                                                />
                                            </div>

                                            <div className="mb-6">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Typ Pytania</label>
                                                <div className="flex flex-wrap gap-4 items-end">
                                                    <select
                                                        value={question.type}
                                                        onChange={e => updateQuestion(section.id, question.id, { type: e.target.value as any })}
                                                        className="w-full md:w-auto p-2 border border-slate-300 rounded-lg bg-white"
                                                    >
                                                        <option value="multiple-choice">Jednokrotny wybór</option>
                                                        <option value="multiple-select">Wielokrotny wybór</option>
                                                        <option value="yes-no">Tak/Nie</option>
                                                        <option value="likert-5">Skala Likerta (1-5)</option>
                                                        <option value="scale-1-10">Skala Numeryczna (1-10)</option>
                                                    </select>

                                                    <div className="flex items-center gap-2 border-l pl-4 border-slate-300">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`reversed-${question.id}`}
                                                                checked={question.isReversed || false}
                                                                onChange={(e) => updateQuestion(section.id, question.id, { isReversed: e.target.checked })}
                                                                className="h-4 w-4 text-[var(--primary-color)] rounded border-gray-300 focus:ring-[var(--primary-color)]"
                                                            />
                                                            <label htmlFor={`reversed-${question.id}`} className="text-sm text-slate-700 cursor-pointer select-none">Odwrócona punktacja</label>
                                                            <button onClick={() => setHelpTopic('reversed')} className="text-slate-400 hover:text-[var(--primary-color)] ml-1">
                                                                <QuestionMarkCircleIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {['likert-5', 'scale-1-10', 'yes-no'].includes(question.type) && (
                                                        <div className="flex items-center gap-2 ml-auto">
                                                            <select
                                                                className="text-sm p-2 border border-slate-300 rounded-lg bg-white w-auto min-w-[220px]"
                                                                onChange={(e) => {
                                                                    if (e.target.value) {
                                                                        applyAutoScoring(section.id, question.id, e.target.value, question.isReversed || false);
                                                                        e.target.value = ''; // Reset select
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">+ Przypisz punkty do skali...</option>
                                                                {test.scales.filter(s => s.type === 'standard').map(s => (
                                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                                ))}
                                                            </select>
                                                            <button onClick={() => setHelpTopic('auto-score')} className="text-slate-400 hover:text-[var(--primary-color)] ml-1">
                                                                <QuestionMarkCircleIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-3 pl-4 border-l-2 border-slate-200">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Odpowiedzi</label>
                                                {question.options.map((option) => (
                                                    <div key={option.id} className="bg-white p-4 rounded-lg border border-slate-200">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="h-4 w-4 rounded-full border-2 border-slate-300"></div>
                                                            <input
                                                                type="text"
                                                                value={option.text}
                                                                onChange={e => updateOption(section.id, question.id, option.id, e.target.value)}
                                                                className="flex-grow p-2 border border-slate-200 rounded focus:border-[var(--primary-color)] outline-none bg-slate-50 focus:bg-white transition-colors"
                                                                placeholder="Treść odpowiedzi..."
                                                            />
                                                            {!['likert-5', 'likert-7', 'scale-1-10'].includes(question.type) && (
                                                                <button onClick={() => removeOption(section.id, question.id, option.id)} className="text-slate-400 hover:text-red-500">
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Scoring Rules Interface */}
                                                        <div className="bg-slate-50 p-3 rounded text-sm">
                                                            <div className="text-xs font-semibold text-slate-500 mb-2">PUNKTACJA (opcjonalne):</div>
                                                            {question.scoring[option.id]?.map((rule, rIndex) => (
                                                                <div key={rIndex} className="flex gap-2 mb-2 items-center">
                                                                    <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                                                                        {test.scales.find(s => s.id === rule.scaleId)?.name || rule.scaleId}
                                                                    </div>
                                                                    <div className="font-bold text-slate-700">+{rule.points} pkt</div>
                                                                    <button onClick={() => removeScoringRule(section.id, question.id, option.id, rIndex)} className="text-red-400 hover:text-red-600 ml-auto">
                                                                        &times;
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            <div className="flex gap-2 mt-2 items-center">
                                                                <select
                                                                    className="text-xs p-1 border rounded max-w-[150px]"
                                                                    id={`scale-select-${option.id}`}
                                                                >
                                                                    <option value="">Wybierz skalę...</option>
                                                                    {test.scales.filter(s => s.type === 'standard').map(s => (
                                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                                    ))}
                                                                </select>
                                                                <input
                                                                    type="number"
                                                                    className="text-xs p-1 border rounded w-16"
                                                                    placeholder="Pkt"
                                                                    id={`points-input-${option.id}`}
                                                                    defaultValue={1}
                                                                />
                                                                <button
                                                                    onClick={(e) => {
                                                                        const scaleSelect = document.getElementById(`scale-select-${option.id}`) as HTMLSelectElement;
                                                                        const pointsInput = document.getElementById(`points-input-${option.id}`) as HTMLInputElement;
                                                                        if (scaleSelect.value && pointsInput.value) {
                                                                            addScoringRule(section.id, question.id, option.id, scaleSelect.value, parseInt(pointsInput.value));
                                                                            scaleSelect.value = '';
                                                                            pointsInput.value = '1';
                                                                        }
                                                                    }}
                                                                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors"
                                                                >
                                                                    + Dodaj
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => addOption(section.id, question.id)}
                                                    disabled={['likert-5', 'likert-7', 'scale-1-10'].includes(question.type)}
                                                    className={`text-sm font-semibold text-[var(--primary-color)] hover:underline flex items-center gap-1 mt-2 disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed`}
                                                >
                                                    <PlusIcon className="h-4 w-4" /> Dodaj opcję odpowiedzi
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <button
                                onClick={() => addQuestion(section.id)}
                                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 font-bold hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] hover:bg-blue-50 transition-all flex justify-center items-center gap-2"
                            >
                                <PlusIcon /> Dodaj Pytanie
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addSection}
                    className="w-full py-6 bg-white shadow-lg border border-slate-200 rounded-xl text-xl font-bold text-slate-600 hover:text-[var(--primary-color)] hover:shadow-xl transition-all flex justify-center items-center gap-3"
                >
                    <PlusIcon className="h-8 w-8" /> Dodaj Nową Sekcję
                </button>
            </div>

            {/* Formula Help Modal */}
            {
    /* Generic Help Modal */}
            {helpTopic && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                {helpTopic === 'formula' && "Jak tworzyć formuły obliczeniowe?"}
                                {helpTopic === 'sections' && "Sekcje i Paginacja"}
                                {helpTopic === 'reversed' && "Odwrócona Punktacja"}
                                {helpTopic === 'auto-score' && "Automatyczne Przypisywanie Punktów"}
                            </h3>
                            <button onClick={() => setHelpTopic(null)} className="text-gray-500 hover:text-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4 text-sm text-gray-600">
                            {helpTopic === 'formula' && (
                                <>
                                    <p>
                                        Formuły pozwalają na automatyczne obliczanie wyników na podstawie innych skal.
                                        Możesz używać standardowych operatorów matematycznych oraz funkcji.
                                    </p>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-semibold text-gray-800 mb-2">Dostępne Operatory:</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li><code>+</code> (Dodawanie)</li>
                                            <li><code>-</code> (Odejmowanie)</li>
                                            <li><code>*</code> (Mnożenie)</li>
                                            <li><code>/</code> (Dzielenie)</li>
                                            <li><code>( )</code> (Nawiasy do grupowania)</li>
                                        </ul>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-semibold text-gray-800 mb-2">Zmienne (Skale):</h4>
                                        <p className="mb-2">Aby użyć wyniku z innej skali, wstaw jej ID w nawiasach klamrowych, np. <code>{`{scale-123}`}</code>.</p>
                                        <p className="text-xs text-gray-500">
                                            Użyj przycisków "Wstaw ID skali" pod polem formuły, aby szybko dodać odpowiedni identyfikator.
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-semibold text-gray-800 mb-2">Przykłady:</h4>
                                        <ul className="space-y-2 font-mono text-xs">
                                            <li className="bg-white p-2 border rounded">
                                                <div className="text-gray-500">// Suma dwóch skal</div>
                                                {`{s-1234} + {s-5678}`}
                                            </li>
                                        </ul>
                                    </div>
                                </>
                            )}

                            {helpTopic === 'sections' && (
                                <>
                                    <p>
                                        W edytorze testu <strong>każda sekcja odpowiada jednej stronie</strong> w widoku dla klienta.
                                    </p>
                                    <p>
                                        Ustawienie "Maksymalna liczba pytań w sekcji" służy jako wskazówka i pomaga kontrolować długość testu, ale ostateczny podział na strony zależy od liczby utworzonych sekcji.
                                    </p>
                                    <p className="mt-2 text-indigo-600 font-semibold">
                                        Dobra praktyka: Twórz nowe sekcje tematycznie lub co 5-10 pytań, aby nie przytłoczyć użytkownika zbyt długą stroną.
                                    </p>
                                </>
                            )}

                            {helpTopic === 'reversed' && (
                                <>
                                    <p>
                                        <strong>Odwrócona punktacja</strong> jest używana w pytaniach, gdzie treść jest sformułowana negatywnie względem mierzonej cechy.
                                    </p>
                                    <p>
                                        Gdy opcja jest zaznaczona:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2 mt-2">
                                        <li>Dla pytań <strong>Tak/Nie</strong>: "Tak" = 0 pkt, "Nie" = 1 pkt.</li>
                                        <li>Dla <strong>Skali Likerta (1-5)</strong>: Najniższa ocena dostaje 5 pkt, a najwyższa 1 pkt.</li>
                                        <li>Dla <strong>Skali Numerycznej</strong>: Punkty są przydzielane odwrotnie do wartości liczbowej.</li>
                                    </ul>
                                    <p className="mt-4 text-xs text-gray-500">
                                        Pamiętaj, aby po zmianie tego ustawienia ponownie kliknąć przycisk przypisywania punktów do skali, aby zaktualizować wartości.
                                    </p>
                                </>
                            )}

                            {helpTopic === 'auto-score' && (
                                <>
                                    <p>
                                        To narzędzie pozwala na <strong>szybkie przypisanie punktów</strong> do wszystkich opcji w pytaniu jednocześnie.
                                    </p>
                                    <p>
                                        Wybierz skalę z listy, a system automatycznie przydzieli punkty w zależności od typu pytania i ustawienia "Odwrócona punktacja".
                                    </p>
                                    <div className="bg-blue-50 p-3 rounded border border-blue-100 text-blue-800 mt-2">
                                        <strong>Wskazówka:</strong> Jest to opcja opcjonalna. Jeśli potrzebujesz niestandardowej punktacji, możesz ręcznie edytować punkty przy każdej odpowiedzi poniżej.
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setHelpTopic(null)}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
                            >
                                Rozumiem
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <div className="flex justify-end gap-4 mt-8">
                <button onClick={() => router.push('/admin/dashboard')} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg">Anuluj</button>
                <button
                    onClick={() => handleSave(false)}
                    disabled={isSaving}
                    className="px-6 py-2 border font-bold rounded-lg transition-colors disabled:opacity-50"
                    style={{
                        backgroundColor: 'var(--warning-color)',
                        color: 'white',
                        borderColor: 'var(--warning-color)'
                    }}
                >
                    {isSaving ? 'Zapisywanie...' : 'Zapisz Szkic'}
                </button>
                <button
                    onClick={() => handleSave(true)}
                    disabled={isSaving}
                    className="px-6 py-2 font-bold rounded-lg transition-colors disabled:opacity-50"
                    style={{
                        backgroundColor: 'var(--success-color)',
                        color: 'white'
                    }}
                >
                    {isSaving ? 'Zapisywanie...' : 'Opublikuj'}
                </button>
            </div>
        </div >
    );
};


export default TestEditor;
