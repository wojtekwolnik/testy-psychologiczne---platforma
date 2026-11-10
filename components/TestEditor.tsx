
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
import { generateEqualThresholds, calculateScaleScoreBounds } from '@/lib/interpretationBuilder';

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
    const [thresholdCounts, setThresholdCounts] = useState<Record<string, number>>({});

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
                    let newTest: Test | null = null;
                    const searchParams = new URLSearchParams(window.location.search);
                    const importDraftStr = localStorage.getItem('import_draft');
                    
                    if (importDraftStr && searchParams.get('import') === 'local') {
                        try {
                            const parsed = JSON.parse(importDraftStr);
                            newTest = {
                                ...parsed,
                                id: generateUniqueId('new'),
                                canonicalId: generateUniqueId('tid'),
                                version: 1,
                                status: 'DRAFT',
                                createdAt: new Date().toISOString()
                            };
                            localStorage.removeItem('import_draft');
                        } catch (e) {
                            console.error('Failed to parse import_draft', e);
                        }
                    }

                    if (!newTest) {
                        newTest = {
                            id: generateUniqueId('new'),
                            canonicalId: generateUniqueId('tid'), version: 1, title: 'Nowy Test',
                            description: '', instructions: '', status: 'DRAFT', questionsPerPage: 10, scales: [],
                            sections: [{ id: generateUniqueId('sec'), title: 'Sekcja 1', questions: [] }],
                            defaultTemplateId: null, createdAt: new Date().toISOString(),
                        };
                    }
                    setTest(newTest);
                }
            } catch (e) { console.error("Failed to load initial data", e); }
            finally { setIsLoading(false); }
        };
        loadInitialData();
    }, [testId]);

    const handleSave = useCallback(async (isPublishing: boolean, asNewVersion: boolean = false) => {
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
                saved = await saveTest(testToSave, asNewVersion);
            }

            setTest(saved);
            toast.success(asNewVersion ? `Utworzono nową wersję testu (v${saved.version})!` : (isPublishing ? "Test opublikowany pomyślnie!" : "Szkic zapisany pomyślnie!"));
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

    const computeAutoPointsForOption = (qType: Question['type'], index: number, totalOptions: number, isReversed: boolean): number => {
        if (qType === 'yes-no') {
            return index === 0 ? (isReversed ? 0 : 1) : (isReversed ? 1 : 0);
        }
        if (qType === 'likert-5') {
            return isReversed ? (5 - index) : (index + 1);
        }
        if (qType === 'scale-1-10') {
            return isReversed ? (10 - index) : (index + 1);
        }
        return isReversed ? (totalOptions - index) : (index + 1);
    };

    // --- Question Management ---
    const addQuestion = (sectionId: string) => {
        let newQuestionId = generateUniqueId('q');
        setTest(prev => {
            if (!prev) return null;
            const targetSection = prev.sections.find(s => s.id === sectionId);
            const templateQuestion =
                targetSection?.questions[targetSection.questions.length - 1] ||
                prev.sections.flatMap(s => s.questions)[0];

            let defaultType: Question['type'] = 'multiple-choice';
            let defaultOptions: AnswerOption[] = [];

            if (templateQuestion && ['likert-5', 'likert-7', 'scale-1-10', 'yes-no'].includes(templateQuestion.type)) {
                defaultType = templateQuestion.type;
                defaultOptions = templateQuestion.options.map((opt, idx) => ({
                    id: String(idx + 1),
                    text: opt.text,
                }));
            }

            const newQuestion: Question = {
                id: newQuestionId,
                text: 'Nowe Pytanie',
                type: defaultType,
                isReversed: false,
                options: defaultOptions,
                scoring: {},
            };

            return {
                ...prev,
                sections: prev.sections.map(s =>
                    s.id === sectionId ? { ...s, questions: [...s.questions, newQuestion] } : s
                ),
            };
        });
        // Ensure new question is expanded
        setExpandedQuestionId(newQuestionId);
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
                                    newOptions = LIKERT_5_LABELS.map((text, i) => ({ id: String(i + 1), text }));
                                    newScoring = {};
                                } else if (updates.type === 'likert-7') {
                                    newOptions = Array.from({ length: 7 }, (_, i) => ({ id: String(i + 1), text: (i + 1).toString() }));
                                    newScoring = {};
                                } else if (updates.type === 'scale-1-10') {
                                    newOptions = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1), text: (i + 1).toString() }));
                                    newScoring = {};
                                } else if (updates.type === 'yes-no') {
                                    newOptions = YES_NO_LABELS.map((text, i) => ({ id: String(i + 1), text }));
                                    newScoring = {};
                                }
                            } else if (
                                updates.isReversed !== undefined &&
                                updates.isReversed !== Boolean(q.isReversed) &&
                                ['likert-5', 'likert-7', 'scale-1-10', 'yes-no'].includes(q.type)
                            ) {
                                // Recalculate points across all assigned scales when toggling isReversed
                                const updatedScoring: Record<string, ScoringRule[]> = {};
                                q.options.forEach((opt, idx) => {
                                    const currentRules = q.scoring?.[opt.id] || [];
                                    const pts = computeAutoPointsForOption(q.type, idx, q.options.length, updates.isReversed!);
                                    updatedScoring[opt.id] = currentRules.map(r => ({
                                        ...r,
                                        points: pts,
                                    }));
                                });
                                newScoring = updatedScoring;
                            }

                            return {
                                ...q,
                                ...updates,
                                options: updates.type ? newOptions : (updates.options || q.options),
                                scoring: updates.type ? newScoring : (updates.scoring || newScoring)
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

                            // Upsert scoring for `scaleId` across all options while preserving any other scales already assigned to this question
                            const newScoring: Record<string, ScoringRule[]> = { ...(q.scoring || {}) };

                            q.options.forEach((opt, index) => {
                                const points = computeAutoPointsForOption(q.type, index, q.options.length, isReversed);
                                const existingRules = (q.scoring?.[opt.id] || []).filter(r => r.scaleId !== scaleId);
                                newScoring[opt.id] = [...existingRules, { scaleId, points }];
                            });

                            return {
                                ...q,
                                isReversed,
                                scoring: newScoring
                            };
                        })
                    };
                })
            };
        });
    };

    const removeScaleFromQuestion = (sectionId: string, questionId: string, scaleId: string) => {
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
                            const newScoring: Record<string, ScoringRule[]> = {};
                            for (const [optId, rules] of Object.entries(q.scoring || {})) {
                                newScoring[optId] = (rules || []).filter(r => r.scaleId !== scaleId);
                            }
                            return {
                                ...q,
                                scoring: newScoring,
                            };
                        }),
                    };
                }),
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
                            const currentRules = (q.scoring[optionId] || []).filter(r => r.scaleId !== scaleId);
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
            <div className="bg-surface border border-border p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-2xl font-semibold text-text mb-4">Informacje Podstawowe</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-text-muted mb-1">Tytuł Testu</label>
                        <input
                            type="text"
                            value={test.title}
                            onChange={e => handleTestChange('title', e.target.value)}
                            className="w-full p-2 border border-border bg-input-bg text-input-text rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none text-lg font-semibold"
                            placeholder="Wprowadź tytuł testu..."
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-text-muted mb-1">Opis (widoczny dla klienta)</label>
                        <textarea
                            value={test.description}
                            onChange={e => handleTestChange('description', e.target.value)}
                            className="w-full p-2 border border-border bg-input-bg text-input-text rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none min-h-[80px]"
                            placeholder="Wprowadź opis testu..."
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-text-muted mb-1">Instrukcje (widoczne przed rozpoczęciem)</label>
                        <textarea
                            value={test.instructions}
                            onChange={e => handleTestChange('instructions', e.target.value)}
                            className="w-full p-2 border border-border bg-input-bg text-input-text rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none min-h-[80px]"
                            placeholder="Wprowadź instrukcje..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Wersja</label>
                        <input
                            type="number"
                            value={test.version}
                            readOnly
                            className="w-full p-2 border border-border rounded-lg bg-background/50 text-text-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-text-muted mt-1">Wersja jest aktualizowana automatycznie przy zapisie.</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <label className="block text-sm font-medium text-text-muted">Maksymalna liczba pytań w sekcji</label>
                            <button onClick={() => setHelpTopic('sections')} className="text-text-muted hover:text-[var(--primary-color)]">
                                <QuestionMarkCircleIcon className="h-4 w-4" />
                            </button>
                        </div>
                        <input
                            type="number"
                            min={1}
                            value={test.questionsPerPage || 10}
                            onChange={e => handleTestChange('questionsPerPage', parseInt(e.target.value) || 10)}
                            className="w-full p-2 border border-border bg-input-bg text-input-text rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none"
                        />
                        <p className="text-xs text-text-muted mt-1">
                            To ustawienie pomaga kontrolować długość sekcji. W widoku klienta, każda sekcja to osobna strona.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-surface border border-border p-6 rounded-xl shadow-lg mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-text">Skale Oceny</h2>
                    <div className="flex gap-2">
                        <button onClick={() => addScale('standard')} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)]/20 text-[var(--accent-color)] font-semibold rounded-lg hover:bg-[var(--accent-color)]/30 transition-colors">
                            <PlusIcon /> Dodaj Skalę Standardową
                        </button>
                        <button onClick={() => addScale('calculated')} className="flex items-center gap-2 px-4 py-2 bg-orange-400/20 text-orange-400 font-semibold rounded-lg hover:bg-orange-400/30 transition-colors">
                            <CalculatorIcon /> Dodaj Skalę Obliczeniową
                        </button>
                    </div>
                </div>
                <div className="space-y-4">
                    {test.scales.map((scale, i) => (
                        <div key={scale.id} className={`p-4 rounded-lg bg-background/60 border border-border border-l-4 ${scale.type === 'calculated' ? 'border-l-orange-500' : 'border-l-blue-500'}`}>
                            <div className="flex items-start gap-4">
                                <div className="flex-grow space-y-2">
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Nazwa skali" value={scale.name} onChange={e => updateScale(i, { name: e.target.value })} className="w-full p-2 border border-[var(--border-color)] rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
                                        <input type="text" placeholder="Skrót (max 3 znaki)" value={scale.abbreviation || ''} maxLength={3} onChange={e => updateScale(i, { abbreviation: e.target.value })} className="w-32 p-2 border border-[var(--border-color)] rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)] text-center font-bold" title="Krótka nazwa wyświetlana na wykresach" />
                                    </div>
                                    <input type="text" placeholder="Opis skali" value={scale.description} onChange={e => updateScale(i, { description: e.target.value })} className="w-full p-2 border border-[var(--border-color)] rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
                                </div>
                                <button onClick={() => removeScale(scale.id)} className="p-2 text-[var(--error-color)] hover:bg-red-500/20 rounded-full"><TrashIcon /></button>
                            </div>
                            {scale.type === 'standard' ? (
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <div>
                                        <label className="text-sm font-medium text-text">Maksymalna liczba punktów:</label>
                                        <input type="number" min="1" value={scale.maxScore || 0} onChange={e => updateScale(i, { maxScore: Math.max(1, parseInt(e.target.value) || 0) })} className="w-32 p-2 ml-2 border border-[var(--border-color)] rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
                                    </div>
                                    {(() => {
                                        const bounds = calculateScaleScoreBounds(test.sections, scale.id);
                                        if (bounds.questionCount === 0) return null;
                                        return (
                                            <div className="flex items-center gap-2 text-xs text-text-muted bg-surface border border-border px-3 py-1.5 rounded-md">
                                                <span>
                                                    Wyliczono z {bounds.questionCount} pytań: zakres <strong className="text-text">{bounds.minPossible}–{bounds.maxPossible} pkt</strong>
                                                </span>
                                                {bounds.maxPossible > 0 && scale.maxScore !== bounds.maxPossible && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateScale(i, { maxScore: bounds.maxPossible })}
                                                        className="px-2 py-0.5 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        Ustaw max = {bounds.maxPossible}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div className="mt-3 p-3 bg-orange-400/10 rounded-md">
                                    <div className="flex items-center gap-2 mb-1">
                                        <label className="text-sm font-medium text-orange-400">Formuła obliczeniowa:</label>
                                        <button
                                            onClick={() => setHelpTopic('formula')}
                                            className="text-orange-400 hover:text-orange-300 transition-colors"
                                            title="Jak tworzyć formuły?"
                                        >
                                            <QuestionMarkCircleIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <input type="text" placeholder="np. ({scale-id1} + {scale-id2}) / 2" value={scale.formula || ''} onChange={e => updateScale(i, { formula: e.target.value })} className="w-full p-2 mt-1 border border-orange-500/40 rounded-md text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
                                    <div className="mt-2 text-xs">
                                        <span className="font-semibold text-text">Wstaw ID skali:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {test.scales.filter(s => s.id !== scale.id).map(s => (
                                                <button key={s.id} onClick={() => insertScaleIdIntoFormula(i, s.id)} className="text-xs bg-surface border border-border text-text hover:bg-white/10 px-2 py-1 rounded-md">{s.name} {s.abbreviation ? `(${s.abbreviation})` : ''} [{s.id}]</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Custom Levels Configuration */}
                            <div className="mt-4 pt-4 border-t border-border">
                                <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                                    <div>
                                        <label className="text-sm font-semibold text-text">Poziomy wyników / progi interpretacyjne (dowolna liczba progów):</label>
                                        <p className="text-xs text-text-muted">Każdy próg może mieć własną nazwę, zakres punktowy i opis, który automatycznie zbuduje interpretację z klucza.</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-surface border border-border rounded-md px-2 py-1 text-xs">
                                            <span className="text-text font-medium">Liczba progów:</span>
                                            <input
                                                type="number"
                                                min={2}
                                                max={20}
                                                value={thresholdCounts[scale.id] ?? (scale.levels && scale.levels.length >= 2 ? scale.levels.length : 3)}
                                                onChange={e => {
                                                    const val = Math.max(2, Math.min(20, parseInt(e.target.value) || 2));
                                                    setThresholdCounts(prev => ({ ...prev, [scale.id]: val }));
                                                }}
                                                className="w-14 p-1 border border-border rounded text-center font-bold bg-input-bg text-input-text"
                                                title="Wybierz na ile progów podzielić skalę (np. 2, 3, 4, 5, 10)"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const n = thresholdCounts[scale.id] ?? (scale.levels && scale.levels.length >= 2 ? scale.levels.length : 3);
                                                    const bounds = calculateScaleScoreBounds(test.sections, scale.id);
                                                    const maxVal = scale.maxScore || bounds.maxPossible || 100;
                                                    const generated = generateEqualThresholds(n, maxVal, 0);
                                                    updateScale(i, { levels: generated });
                                                    toast.info(`Wygenerowano ${n} równych progów (0–${maxVal} pkt) dla skali "${scale.name || 'Skala'}".`);
                                                }}
                                                className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-semibold transition-colors"
                                                title="Automatycznie podziel zakres 0..Max na wybraną liczbę równych przedziałów"
                                            >
                                                Wygeneruj równe progi
                                            </button>
                                            {(() => {
                                                const bounds = calculateScaleScoreBounds(test.sections, scale.id);
                                                if (bounds.minPossible <= 0 || bounds.maxPossible <= bounds.minPossible) return null;
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const n = thresholdCounts[scale.id] ?? (scale.levels && scale.levels.length >= 2 ? scale.levels.length : 3);
                                                            const maxVal = scale.maxScore || bounds.maxPossible;
                                                            const generated = generateEqualThresholds(n, maxVal, bounds.minPossible);
                                                            updateScale(i, { levels: generated });
                                                            toast.info(`Wygenerowano ${n} równych progów (${bounds.minPossible}–${maxVal} pkt) dla skali "${scale.name || 'Skala'}".`);
                                                        }}
                                                        className="px-2 py-1 bg-teal-600 text-white hover:bg-teal-700 rounded font-semibold transition-colors"
                                                        title={`Podziel realny zakres punktów z pytań (${bounds.minPossible}..${scale.maxScore || bounds.maxPossible}) na N progów`}
                                                    >
                                                        Od {bounds.minPossible} do {scale.maxScore || bounds.maxPossible}
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const currentLevels = scale.levels || [];
                                                const lastMax = currentLevels.length > 0 ? currentLevels[currentLevels.length - 1].maxScore + 1 : 0;
                                                const maxVal = Math.max(lastMax, scale.maxScore || 100);
                                                const newLevel = { id: generateUniqueId('lvl'), name: `Poziom ${currentLevels.length + 1}`, minScore: lastMax, maxScore: maxVal, color: '#3b82f6', description: '' };
                                                updateScale(i, { levels: [...currentLevels, newLevel] });
                                            }}
                                            className="text-xs px-3 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 rounded-md font-semibold flex items-center gap-1 transition-colors"
                                        >
                                            + Dodaj próg ręcznie
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {(scale.levels || []).map((level, lIndex) => (
                                        <div key={level.id} className="bg-surface p-2.5 rounded-lg border border-border shadow-sm text-xs mb-2">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={level.name}
                                                    onChange={e => {
                                                        const updatedLevels = (scale.levels || []).map((l, idx) => idx === lIndex ? { ...l, name: e.target.value } : l);
                                                        updateScale(i, { levels: updatedLevels });
                                                    }}
                                                    placeholder="Nazwa (np. Bardzo wysoki)"
                                                    className="flex-grow p-1.5 border border-border bg-input-bg text-input-text rounded font-semibold min-w-[120px]"
                                                />
                                                <span className="text-text-muted">od</span>
                                                <input
                                                    type="number"
                                                    value={level.minScore}
                                                    onChange={e => {
                                                        const updatedLevels = (scale.levels || []).map((l, idx) => idx === lIndex ? { ...l, minScore: parseInt(e.target.value) || 0 } : l);
                                                        updateScale(i, { levels: updatedLevels });
                                                    }}
                                                    className="w-16 p-1.5 border border-border bg-input-bg text-input-text rounded text-center"
                                                    placeholder="Min"
                                                />
                                                <span className="text-text-muted">do</span>
                                                <input
                                                    type="number"
                                                    value={level.maxScore}
                                                    onChange={e => {
                                                        const updatedLevels = (scale.levels || []).map((l, idx) => idx === lIndex ? { ...l, maxScore: parseInt(e.target.value) || 0 } : l);
                                                        updateScale(i, { levels: updatedLevels });
                                                    }}
                                                    className="w-16 p-1.5 border border-border bg-input-bg text-input-text rounded text-center"
                                                    placeholder="Max"
                                                />
                                                <div className="flex items-center gap-1 border border-border rounded p-1 bg-input-bg">
                                                    <input
                                                        type="color"
                                                        value={level.color && level.color.startsWith('#') ? level.color : '#3b82f6'}
                                                        onChange={e => {
                                                            const updatedLevels = (scale.levels || []).map((l, idx) => idx === lIndex ? { ...l, color: e.target.value } : l);
                                                            updateScale(i, { levels: updatedLevels });
                                                        }}
                                                        className="w-6 h-6 border-0 cursor-pointer p-0 bg-transparent"
                                                        title="Wybierz kolor poziomu"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedLevels = (scale.levels || []).filter((_, idx) => idx !== lIndex);
                                                        updateScale(i, { levels: updatedLevels });
                                                    }}
                                                    className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/20 rounded ml-auto"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <textarea
                                                value={level.description || ''}
                                                onChange={e => {
                                                    const updatedLevels = (scale.levels || []).map((l, idx) => idx === lIndex ? { ...l, description: e.target.value } : l);
                                                    updateScale(i, { levels: updatedLevels });
                                                }}
                                                placeholder="Specyficzny opis dla tego poziomu wyników (opcjonalny, pojawi się w raporcie)..."
                                                className="w-full p-1.5 border border-border bg-input-bg text-input-text rounded font-normal min-h-[50px] resize-y"
                                            />
                                        </div>
                                    ))}
                                    {(scale.levels || []).length === 0 && (
                                        <p className="text-xs text-text-muted italic">Brak zdefiniowanych poziomów. Zostaną użyte domyślne 3 progi wyliczane z maksymalnej liczby punktów.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                {test.sections.map((section, sIndex) => (
                    <div key={section.id} className="bg-surface border border-border p-6 rounded-xl shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <input
                                type="text"
                                value={section.title}
                                onChange={e => updateSection(section.id, { title: e.target.value })}
                                className="text-2xl font-bold text-text bg-transparent border-b-2 border-transparent hover:border-border focus:border-[var(--primary-color)] outline-none px-2 py-1 flex-grow mr-4"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => removeSection(section.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Usuń sekcję">
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {section.questions.map((question, qIndex) => {
                                const isExpanded = expandedQuestionId === question.id;
                                const assignedScaleIds = Array.from(
                                    new Set(
                                        Object.values(question.scoring || {})
                                            .flat()
                                            .map(r => r?.scaleId)
                                            .filter((id): id is string => Boolean(id))
                                    )
                                );
                                return (
                                    <div key={question.id} className="bg-background/50 border border-border shadow-sm rounded-lg overflow-hidden transition-all">
                                        {/* Question Header / Toggle Bar */}
                                        <div
                                            className="bg-background/80 p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                            onClick={() => toggleQuestionCollapse(question.id)}
                                        >
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : '-rotate-0'}`}>
                                                    <ChevronLeftIcon className="h-5 w-5 text-text-muted" />
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold text-text-muted uppercase">Pytanie {qIndex + 1}</span>
                                                        {question.isReversed && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                                                                Odwrócone
                                                            </span>
                                                        )}
                                                        {assignedScaleIds.map(sid => {
                                                            const scName = test.scales.find(s => s.id === sid)?.name || sid;
                                                            return (
                                                                <span
                                                                    key={sid}
                                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono truncate max-w-[180px]"
                                                                    title={`Punktowana skala: ${scName}`}
                                                                >
                                                                    {scName}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                    <span className="text-sm font-medium text-text truncate max-w-[500px] mt-0.5">
                                                        {question.text || <span className="italic text-text-muted">Bez treści...</span>}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs px-2 py-1 bg-surface border border-border rounded text-text-muted hidden sm:inline-block">
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
                                                    className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Usuń pytanie"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Collapsible Body */}
                                        <div className={`transition-all duration-300 ease-in-out ${!isExpanded ? 'max-h-0 opacity-0 overflow-hidden' : 'opacity-100 p-6'}`}>
                                            <div className="mb-4 pr-10">
                                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Treść Pytania</label>
                                                <input
                                                    type="text"
                                                    value={question.text}
                                                    onChange={e => updateQuestion(section.id, question.id, { text: e.target.value })}
                                                    className="w-full text-lg p-3 border border-border bg-input-bg text-input-text rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                                                    placeholder="Treść pytania..."
                                                />
                                            </div>

                                            <div className="mb-6">
                                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Typ Pytania i Przypisanie do Skal</label>
                                                <div className="flex flex-wrap gap-4 items-center">
                                                    <select
                                                        value={question.type}
                                                        onChange={e => updateQuestion(section.id, question.id, { type: e.target.value as any })}
                                                        className="w-full md:w-auto p-2 border border-border rounded-lg bg-input-bg text-input-text"
                                                    >
                                                        <option value="multiple-choice">Jednokrotny wybór</option>
                                                        <option value="multiple-select">Wielokrotny wybór</option>
                                                        <option value="yes-no">Tak/Nie</option>
                                                        <option value="likert-5">Skala Likerta (1-5)</option>
                                                        <option value="scale-1-10">Skala Numeryczna (1-10)</option>
                                                    </select>

                                                    <div className="flex items-center gap-2 border-l pl-4 border-border">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`reversed-${question.id}`}
                                                                checked={question.isReversed || false}
                                                                onChange={(e) => updateQuestion(section.id, question.id, { isReversed: e.target.checked })}
                                                                className="h-4 w-4 text-[var(--primary-color)] rounded border-border focus:ring-[var(--primary-color)]"
                                                            />
                                                            <label htmlFor={`reversed-${question.id}`} className="text-sm text-text cursor-pointer select-none">Odwrócona punktacja</label>
                                                            <button onClick={() => setHelpTopic('reversed')} className="text-text-muted hover:text-[var(--primary-color)] ml-1">
                                                                <QuestionMarkCircleIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {['likert-5', 'likert-7', 'scale-1-10', 'yes-no'].includes(question.type) && (
                                                        <div className="flex items-center gap-2 ml-auto">
                                                            <select
                                                                className="text-sm p-2 border border-border rounded-lg bg-input-bg text-input-text w-auto min-w-[240px]"
                                                                onChange={(e) => {
                                                                    if (e.target.value) {
                                                                        applyAutoScoring(section.id, question.id, e.target.value, question.isReversed || false);
                                                                        e.target.value = ''; // Reset select
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">+ Dodaj skalę do pytania (możesz wybrać wiele)...</option>
                                                                {test.scales.filter(s => s.type === 'standard').map(s => (
                                                                    <option key={s.id} value={s.id}>
                                                                        {assignedScaleIds.includes(s.id) ? `✓ ${s.name} (zaktualizuj)` : s.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button onClick={() => setHelpTopic('auto-score')} className="text-text-muted hover:text-[var(--primary-color)] ml-1">
                                                                <QuestionMarkCircleIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Multi-Scale Assigned Pills Bar */}
                                                <div className="mt-3 p-3 bg-surface/70 border border-border rounded-lg flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-semibold text-text-muted mr-1">
                                                        Przypisane skale ({assignedScaleIds.length}):
                                                    </span>
                                                    {assignedScaleIds.length === 0 ? (
                                                        <span className="text-xs text-text-muted italic">
                                                            Brak przypisanych skal — wybierz jedną lub więcej skal z listy powyżej (lub przypisz punkty ręcznie przy odpowiedziach).
                                                        </span>
                                                    ) : (
                                                        assignedScaleIds.map(sid => {
                                                            const scName = test.scales.find(s => s.id === sid)?.name || sid;
                                                            return (
                                                                <span
                                                                    key={sid}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                                                >
                                                                    <span>{scName}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeScaleFromQuestion(section.id, question.id, sid)}
                                                                        className="text-blue-200 hover:text-red-400 font-bold ml-0.5"
                                                                        title={`Usuń skalę "${scName}" z tego pytania`}
                                                                    >
                                                                        &times;
                                                                    </button>
                                                                </span>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-3 pl-4 border-l-2 border-border">
                                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Odpowiedzi</label>
                                                {question.options.map((option) => (
                                                    <div key={option.id} className="bg-surface border border-border p-4 rounded-lg">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="h-4 w-4 rounded-full border-2 border-border"></div>
                                                            <input
                                                                type="text"
                                                                value={option.text}
                                                                onChange={e => updateOption(section.id, question.id, option.id, e.target.value)}
                                                                className="flex-grow p-2 border border-border rounded focus:border-[var(--primary-color)] outline-none bg-input-bg text-input-text transition-colors"
                                                                placeholder="Treść odpowiedzi..."
                                                            />
                                                            {!['likert-5', 'likert-7', 'scale-1-10'].includes(question.type) && (
                                                                <button onClick={() => removeOption(section.id, question.id, option.id)} className="text-text-muted hover:text-red-400">
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Scoring Rules Interface */}
                                                        <div className="bg-background/60 p-3 rounded text-sm border border-border/50">
                                                            <div className="text-xs font-semibold text-text-muted mb-2">PUNKTACJA (opcjonalne):</div>
                                                            {question.scoring[option.id]?.map((rule, rIndex) => (
                                                                <div key={rIndex} className="flex gap-2 mb-2 items-center">
                                                                    <div className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-xs font-mono">
                                                                        {test.scales.find(s => s.id === rule.scaleId)?.name || rule.scaleId}
                                                                    </div>
                                                                    <div className="font-bold text-text">+{rule.points} pkt</div>
                                                                    <button onClick={() => removeScoringRule(section.id, question.id, option.id, rIndex)} className="text-red-400 hover:text-red-300 ml-auto">
                                                                        &times;
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            <div className="flex gap-2 mt-2 items-center">
                                                                <select
                                                                    className="text-xs p-1 border border-border bg-input-bg text-input-text rounded max-w-[200px]"
                                                                    id={`scale-select-${question.id}-${option.id}`}
                                                                >
                                                                    <option value="">Wybierz skalę...</option>
                                                                    {test.scales.filter(s => s.type === 'standard').map(s => (
                                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                                    ))}
                                                                </select>
                                                                <input
                                                                    type="number"
                                                                    className="text-xs p-1 border border-border bg-input-bg text-input-text rounded w-16"
                                                                    placeholder="Pkt"
                                                                    id={`points-input-${question.id}-${option.id}`}
                                                                    defaultValue={1}
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const scaleSelect = document.getElementById(`scale-select-${question.id}-${option.id}`) as HTMLSelectElement;
                                                                        const pointsInput = document.getElementById(`points-input-${question.id}-${option.id}`) as HTMLInputElement;
                                                                        if (scaleSelect?.value && pointsInput?.value) {
                                                                            addScoringRule(section.id, question.id, option.id, scaleSelect.value, parseInt(pointsInput.value));
                                                                            scaleSelect.value = '';
                                                                            pointsInput.value = '1';
                                                                        }
                                                                    }}
                                                                    className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs rounded hover:bg-emerald-500/30 transition-colors"
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
                                                    className={`text-sm font-semibold text-[var(--primary-color)] hover:underline flex items-center gap-1 mt-2 disabled:text-text-muted disabled:no-underline disabled:cursor-not-allowed`}
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
                                className="w-full py-4 border-2 border-dashed border-border rounded-lg text-text-muted font-bold hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 transition-all flex justify-center items-center gap-2"
                            >
                                <PlusIcon /> Dodaj Pytanie
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addSection}
                    className="w-full py-6 bg-surface shadow-lg border border-border rounded-xl text-xl font-bold text-text hover:text-[var(--primary-color)] hover:border-[var(--primary-color)]/50 hover:shadow-xl transition-all flex justify-center items-center gap-3"
                >
                    <PlusIcon className="h-8 w-8" /> Dodaj Nową Sekcję
                </button>
            </div>

            {/* Formula Help Modal */}
            {
    /* Generic Help Modal */}
            {helpTopic && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-text">
                                {helpTopic === 'formula' && "Jak tworzyć formuły obliczeniowe?"}
                                {helpTopic === 'sections' && "Sekcje i Paginacja"}
                                {helpTopic === 'reversed' && "Odwrócona Punktacja"}
                                {helpTopic === 'auto-score' && "Automatyczne Przypisywanie Punktów"}
                            </h3>
                            <button onClick={() => setHelpTopic(null)} className="text-text-muted hover:text-text">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4 text-sm text-text-muted">
                            {helpTopic === 'formula' && (
                                <>
                                    <p>
                                        Formuły pozwalają na automatyczne obliczanie wyników na podstawie innych skal.
                                        Możesz używać standardowych operatorów matematycznych oraz funkcji.
                                    </p>
                                    <div className="bg-background/60 p-4 rounded-lg border border-border">
                                        <h4 className="font-semibold text-text mb-2">Dostępne Operatory:</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li><code>+</code> (Dodawanie)</li>
                                            <li><code>-</code> (Odejmowanie)</li>
                                            <li><code>*</code> (Mnożenie)</li>
                                            <li><code>/</code> (Dzielenie)</li>
                                            <li><code>( )</code> (Nawiasy do grupowania)</li>
                                        </ul>
                                    </div>
                                    <div className="bg-background/60 p-4 rounded-lg border border-border">
                                        <h4 className="font-semibold text-text mb-2">Zmienne (Skale):</h4>
                                        <p className="mb-2">Aby użyć wyniku z innej skali, wstaw jej ID w nawiasach klamrowych, np. <code>{`{scale-123}`}</code>.</p>
                                        <p className="text-xs text-text-muted">
                                            Użyj przycisków "Wstaw ID skali" pod polem formuły, aby szybko dodać odpowiedni identyfikator.
                                        </p>
                                    </div>
                                    <div className="bg-background/60 p-4 rounded-lg border border-border">
                                        <h4 className="font-semibold text-text mb-2">Przykłady:</h4>
                                        <ul className="space-y-2 font-mono text-xs">
                                            <li className="bg-surface p-2 border border-border rounded text-text">
                                                <div className="text-text-muted">// Suma dwóch skal</div>
                                                {`{s-1234} + {s-5678}`}
                                            </li>
                                        </ul>
                                    </div>
                                </>
                            )}

                            {helpTopic === 'sections' && (
                                <>
                                    <p>
                                        W edytorze testu <strong className="text-text">każda sekcja odpowiada jednej stronie</strong> w widoku dla klienta.
                                    </p>
                                    <p>
                                        Ustawienie "Maksymalna liczba pytań w sekcji" służy jako wskazówka i pomaga kontrolować długość testu, ale ostateczny podział na strony zależy od liczby utworzonych sekcji.
                                    </p>
                                    <p className="mt-2 text-primary font-semibold">
                                        Dobra praktyka: Twórz nowe sekcje tematycznie lub co 5-10 pytań, aby nie przytłoczyć użytkownika zbyt długą stroną.
                                    </p>
                                </>
                            )}

                            {helpTopic === 'reversed' && (
                                <>
                                    <p>
                                        <strong className="text-text">Odwrócona punktacja</strong> jest używana w pytaniach, gdzie treść jest sformułowana negatywnie względem mierzonej cechy.
                                    </p>
                                    <p>
                                        Gdy opcja jest zaznaczona:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2 mt-2">
                                        <li>Dla pytań <strong className="text-text">Tak/Nie</strong>: "Tak" = 0 pkt, "Nie" = 1 pkt.</li>
                                        <li>Dla <strong className="text-text">Skali Likerta (1-5)</strong>: Najniższa ocena dostaje 5 pkt, a najwyższa 1 pkt.</li>
                                        <li>Dla <strong className="text-text">Skali Numerycznej</strong>: Punkty są przydzielane odwrotnie do wartości liczbowej.</li>
                                    </ul>
                                    <p className="mt-4 text-xs text-text-muted">
                                        Przełączenie tej opcji automatycznie przelicza punkty (np. 1→5 na 5→1) dla wszystkich skal przypisanych do danego pytania.
                                    </p>
                                </>
                            )}

                            {helpTopic === 'auto-score' && (
                                <>
                                    <p>
                                        To narzędzie pozwala na <strong className="text-text">szybkie przypisanie pytania do jednej lub wielu skal</strong> jednocześnie.
                                    </p>
                                    <p>
                                        Każde wybranie skali z listy <em>„+ Dodaj skalę do pytania...”</em> dopisuje ją do wszystkich opcji odpowiedzi w pytaniu (z uwzględnieniem przełącznika „Odwrócona punktacja”), nie kasując wcześniej przypisanych skal.
                                    </p>
                                    <div className="bg-blue-500/15 p-3 rounded border border-blue-500/30 text-blue-200 mt-2">
                                        <strong>Wskazówka:</strong> Przypisane skale widoczne są jako niebieskie znaczniki pod wyborem typu pytania (oraz na pasku zwiniętego pytania) — kliknięcie <strong>&times;</strong> na znaczniku usuwa daną skalę ze wszystkich odpowiedzi pytania naraz.
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setHelpTopic(null)}
                                className="px-4 py-2 bg-primary text-background font-semibold rounded hover:bg-primary/90"
                            >
                                Rozumiem
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <div className="flex justify-end gap-4 mt-8">
                <button onClick={() => router.push('/admin/dashboard')} className="px-6 py-2 bg-surface border border-border text-text hover:bg-white/5 font-semibold rounded-lg transition-colors">Anuluj</button>{testId !== 'new' && (<button onClick={() => handleSave(test?.status === 'PUBLISHED', true)} disabled={isSaving} className="px-6 py-2 border border-primary/50 bg-primary/15 text-primary font-bold rounded-lg hover:bg-primary/25 transition-colors disabled:opacity-50" title="Tworzy nową wersję (v+1) z tym samym identyfikatorem kanonicznym">{isSaving ? 'Zapisywanie...' : `Zapisz jako nową wersję (v${(test?.version || 1) + 1})`}</button>)}
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
