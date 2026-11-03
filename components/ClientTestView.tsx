'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchPublicTestForClient } from '@/app/actions/testActions';
import { submitTest } from '@/app/actions/resultActions';
import { validateAccessCode } from '@/app/actions/accessCodeActions';
import type { Test, ClientAnswer, Question, TestResult } from './types';
import DOMPurify from 'isomorphic-dompurify';
import { ClientThankYou } from './ClientThankYou';

interface ClientTestViewProps {
    testId?: string;
    clientCode?: string;
}

export default function ClientTestView(props: ClientTestViewProps) {
    const params = useParams();
    const testId = props.testId || (typeof params?.testId === 'string' ? params.testId : '');
    const clientCode = (props.clientCode || (typeof params?.clientCode === 'string' ? params.clientCode : '')).trim().toUpperCase();

    const router = useRouter();

    const [test, setTest] = useState<Test | null>(null);
    const [answers, setAnswers] = useState<Record<string, ClientAnswer>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submissionResult, setSubmissionResult] = useState<TestResult | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [validationError, setValidationError] = useState<string | null>(null);

    const draftStorageKey = clientCode ? `rm_test_draft_${clientCode}` : '';

    // Restore draft answers from sessionStorage if present
    useEffect(() => {
        if (!draftStorageKey || typeof window === 'undefined') return;
        try {
            const raw = sessionStorage.getItem(draftStorageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.answers && typeof parsed.answers === 'object') {
                    setAnswers(parsed.answers);
                }
                if (typeof parsed.currentPage === 'number') {
                    setCurrentPage(parsed.currentPage);
                }
            }
        } catch {
            // Ignore storage errors
        }
    }, [draftStorageKey]);

    // Save draft answers to sessionStorage on change
    useEffect(() => {
        if (!draftStorageKey || typeof window === 'undefined' || isSubmitted) return;
        try {
            if (Object.keys(answers).length > 0) {
                sessionStorage.setItem(draftStorageKey, JSON.stringify({ answers, currentPage }));
            }
        } catch {
            // Ignore storage errors
        }
    }, [answers, currentPage, draftStorageKey, isSubmitted]);

    useEffect(() => {
        if (!testId || !clientCode) {
            setError("Brakujące informacje. Nie można załadować badania.");
            setIsLoading(false);
            return;
        }

        const loadTest = async () => {
            try {
                setIsLoading(true);
                const publicTest = await fetchPublicTestForClient(testId, clientCode);
                if (publicTest) {
                    setTest(publicTest);
                    return;
                }

                // If publicTest returned null, check reason via validateAccessCode for a friendly Polish error message
                const validation = await validateAccessCode(clientCode);
                if (!validation.isValid) {
                    setError(validation.error || "Ten kod dostępu został już wykorzystany lub wygasł. Proszę skontaktować się ze swoim specjalistą.");
                } else if (validation.testId && validation.testId !== testId) {
                    setError("Kod dostępu nie pasuje do wybranego badania.");
                } else {
                    setError("Nie znaleziono badania o podanym identyfikatorze.");
                }
            } catch (err: any) {
                setError("Nie udało się załadować badania. Proszę sprawdzić połączenie i spróbować ponownie.");
            } finally {
                setIsLoading(false);
            }
        };

        loadTest();
    }, [testId, clientCode]);

    const allQuestions = useMemo(() => test?.sections.flatMap(s => s.questions) || [], [test]);

    const paginatedQuestions = useMemo(() => {
        if (!test) return [];
        return test.sections.map(section => section.questions);
    }, [test]);

    const currentQuestions = paginatedQuestions[currentPage] || [];

    const questionStartIndex = useMemo(() => {
        if (currentPage === 0) return 0;
        return paginatedQuestions.slice(0, currentPage).reduce((acc, page) => acc + page.length, 0);
    }, [paginatedQuestions, currentPage]);

    const handleAnswerChange = (questionId: string, questionType: Question['type'], optionId: string) => {
        setValidationError(null);
        setAnswers(prev => {
            const newAnswers = { ...prev };
            if (questionType === 'multiple-select') {
                const currentAnswer = newAnswers[questionId];
                const currentSelection = currentAnswer?.selectedOptionIds || [];

                const newSelection = currentSelection.includes(optionId)
                    ? currentSelection.filter(id => id !== optionId)
                    : [...currentSelection, optionId];
                newAnswers[questionId] = { questionId, selectedOptionIds: newSelection };
            } else {
                newAnswers[questionId] = { questionId, selectedOptionId: optionId };
            }
            return newAnswers;
        });
    };

    const isCurrentPageAnswered = () => {
        return currentQuestions.every(q => {
            const ans = answers[q.id];
            if (!ans) return false;
            if (q.type === 'multiple-select') return (ans.selectedOptionIds?.length || 0) > 0;
            return !!ans.selectedOptionId;
        });
    };

    const handleNextPage = () => {
        if (!isCurrentPageAnswered()) {
            setValidationError("Proszę odpowiedzieć na wszystkie pytania na tej stronie, aby przejść dalej.");
            return;
        }
        setValidationError(null);
        if (currentPage < paginatedQuestions.length - 1) {
            setCurrentPage(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevPage = () => {
        setValidationError(null);
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const areAllQuestionsAnswered = () => {
        for (const q of allQuestions) {
            const ans = answers[q.id];
            const isAnswered = ans && (
                (q.type === 'multiple-select' && (ans.selectedOptionIds?.length || 0) > 0) ||
                (q.type !== 'multiple-select' && !!ans.selectedOptionId)
            );

            if (!isAnswered) {
                const pageIndex = paginatedQuestions.findIndex(page => page.some(pq => pq.id === q.id));
                return { allAnswered: false, firstUnansweredPage: pageIndex };
            }
        }
        return { allAnswered: true, firstUnansweredPage: -1 };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!test || isSubmitting || !clientCode) return;

        const validationResult = areAllQuestionsAnswered();
        if (!validationResult.allAnswered) {
            setValidationError(`Nie odpowiedziano na wszystkie pytania. Proszę uzupełnić brakujące odpowiedzi na stronie ${validationResult.firstUnansweredPage + 1}.`);
            setCurrentPage(validationResult.firstUnansweredPage);
            return;
        }

        setIsSubmitting(true);
        const clientAnswersRecord: Record<string, string[]> = {};
        Object.entries(answers).forEach(([questionId, answer]) => {
            if (answer.selectedOptionIds) {
                clientAnswersRecord[questionId] = answer.selectedOptionIds;
            } else if (answer.selectedOptionId) {
                clientAnswersRecord[questionId] = [answer.selectedOptionId];
            }
        });

        try {
            const result = await submitTest(testId!, clientAnswersRecord, clientCode);
            if (draftStorageKey && typeof window !== 'undefined') {
                sessionStorage.removeItem(draftStorageKey);
            }
            setIsSubmitted(true);
            setSubmissionResult(result);
        } catch (err: any) {
            setError(err?.message || "Nie udało się przesłać odpowiedzi. Możliwe, że ten kod został już wykorzystany.");
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-background" role="status" aria-label="Ładowanie badania">
                <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isSubmitted && submissionResult && test) {
        return <ClientThankYou result={submissionResult} test={test} />;
    }

    if (error) return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-surface/95 backdrop-blur-xl border border-border rounded-3xl shadow-2xl p-10 text-center max-w-lg animate-fade-in-up">
                <h2 className="text-3xl font-bold text-error mb-4">Informacja</h2>
                <p className="text-text text-lg leading-relaxed">{error}</p>
                <div className="mt-8">
                    <a href="/" className="no-underline px-8 py-3 bg-primary text-primary-contrast font-bold rounded-xl shadow hover:opacity-90 transition-all duration-300 inline-block">
                        Powrót do strony głównej
                    </a>
                </div>
            </div>
        </div>
    );

    if (!test) {
        router.push('/');
        return null;
    }

    const totalPages = paginatedQuestions.length;
    const progress = totalPages > 1 ? ((currentPage + 1) / totalPages) * 100 : 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background flex items-center justify-center p-4 text-text transition-all duration-500">
            <div className="w-full max-w-3xl animate-fade-in-up my-6">
                <div className="bg-surface/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-border">
                    <header className="px-8 py-6 bg-background/60 backdrop-blur-sm border-b border-border">
                        <h1 className="text-2xl font-bold text-text">{test.title}</h1>
                        <p className="text-text-muted mt-1 text-sm">
                            Część {currentPage + 1} z {totalPages}
                        </p>

                        {totalPages > 1 && (
                            <div
                                className="mt-4 w-full bg-border/40 rounded-full h-3 overflow-hidden shadow-inner"
                                role="progressbar"
                                aria-valuenow={Math.round(progress)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`Postęp badania: część ${currentPage + 1} z ${totalPages}`}
                            >
                                <div
                                    className="bg-gradient-to-r from-primary to-accent h-3 rounded-full"
                                    style={{ width: `${progress}%`, transition: 'width 0.4s ease-in-out' }}
                                />
                            </div>
                        )}
                    </header>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                        <div className="space-y-8">
                            {currentQuestions.map((q, index) => (
                                <fieldset key={q.id} className="border-b border-border/60 pb-8">
                                    <legend
                                        className="text-lg font-medium mb-5 text-text leading-relaxed w-full"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(`${questionStartIndex + index + 1}. ${q.text}`) }}
                                    />
                                    <div className="space-y-3">
                                        {['likert-5', 'likert-7', 'scale-1-10'].includes(q.type) ? (
                                            <div className="grid grid-cols-5 gap-2 sm:gap-4 mt-2">
                                                {q.options.map((option, idx) => {
                                                    const isSelected = answers[q.id]?.selectedOptionId === option.id;
                                                    const isNumber = /^\d+$/.test(option.text);
                                                    return (
                                                        <label key={option.id} className="flex flex-col items-center cursor-pointer group">
                                                            <input
                                                                type="radio"
                                                                name={q.id}
                                                                value={option.id}
                                                                checked={isSelected}
                                                                onChange={() => handleAnswerChange(q.id, q.type, option.id)}
                                                                className="sr-only peer"
                                                            />
                                                            <div
                                                                className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border-2 transition-all font-bold text-lg peer-focus-visible:ring-4 peer-focus-visible:ring-primary/50 ${
                                                                    isSelected
                                                                        ? 'bg-primary border-primary text-primary-contrast shadow-lg scale-110'
                                                                        : 'bg-background border-border text-text group-hover:border-primary/70 group-hover:bg-primary/10'
                                                                }`}
                                                            >
                                                                {isNumber ? option.text : idx + 1}
                                                            </div>
                                                            {!isNumber && (
                                                                <span className={`text-xs text-center mt-2.5 max-w-[96px] leading-snug transition-colors ${
                                                                    isSelected ? 'text-text font-semibold' : 'text-text-muted group-hover:text-text'
                                                                }`}>
                                                                    {option.text}
                                                                </span>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            q.options.map(option => (
                                                <label
                                                    key={option.id}
                                                    className="flex items-center p-4 rounded-xl border border-border bg-background/60 hover:bg-background has-[:checked]:bg-primary/15 has-[:checked]:border-primary transition-all cursor-pointer shadow-sm"
                                                >
                                                    <input
                                                        type={q.type === 'multiple-select' ? 'checkbox' : 'radio'}
                                                        name={q.id}
                                                        value={option.id}
                                                        checked={
                                                            q.type === 'multiple-select'
                                                                ? (answers[q.id]?.selectedOptionIds || []).includes(option.id)
                                                                : answers[q.id]?.selectedOptionId === option.id
                                                        }
                                                        onChange={() => handleAnswerChange(q.id, q.type, option.id)}
                                                        className="h-5 w-5 accent-[var(--primary-color)] focus:ring-2 focus:ring-primary"
                                                    />
                                                    <div
                                                        className="ml-4 text-text leading-relaxed"
                                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(option.text) }}
                                                    />
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </fieldset>
                            ))}
                        </div>

                        {validationError && (
                            <p role="alert" className="text-center text-error bg-error/10 border border-error/30 rounded-xl p-3 font-medium mt-6">
                                {validationError}
                            </p>
                        )}

                        <div className="pt-8 flex justify-between items-center gap-4">
                            <div>
                                {currentPage > 0 && (
                                    <button
                                        type="button"
                                        onClick={handlePrevPage}
                                        className="px-6 py-3 bg-background border border-border text-text font-semibold rounded-xl shadow-sm hover:bg-border/30 transition-all duration-200"
                                    >
                                        Wstecz
                                    </button>
                                )}
                            </div>
                            <div>
                                {currentPage < totalPages - 1 ? (
                                    <button
                                        type="button"
                                        onClick={handleNextPage}
                                        className="px-8 py-3 bg-primary text-primary-contrast font-bold rounded-xl shadow-lg hover:opacity-90 transition-all duration-200"
                                    >
                                        Dalej
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-8 py-3 bg-primary text-primary-contrast font-bold rounded-xl shadow-lg hover:opacity-90 disabled:opacity-50 transition-all duration-200"
                                    >
                                        {isSubmitting ? 'Przesyłanie...' : 'Zakończ i prześlij odpowiedzi'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
