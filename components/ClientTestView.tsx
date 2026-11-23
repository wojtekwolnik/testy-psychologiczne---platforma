'use client';

import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchPublicTestForClient } from '@/app/actions/testActions';
import { submitTest } from '@/app/actions/resultActions';
import { validateAccessCode } from '@/app/actions/accessCodeActions';
import type { Test, ClientAnswer, Question, TestResult } from './types';
import DOMPurify from 'isomorphic-dompurify';
import { ClientThankYou } from './ClientThankYou';
import { BrandingContext, DEFAULT_PRIVACY_POLICY_TITLE, DEFAULT_TERMS_OF_TESTING_TITLE } from '@/contexts/BrandingContext';
import TermsOfTestingModal from './TermsOfTestingModal';

interface ClientTestViewProps {
    testId?: string;
    clientCode?: string;
}

const isQuestionAnswered = (q: Question, ans?: ClientAnswer): boolean => {
    if (!ans) return false;
    if (q.type === 'multiple-select') {
        return (ans.selectedOptionIds?.length || 0) > 0;
    }
    return !!ans.selectedOptionId;
};

export default function ClientTestView(props: ClientTestViewProps) {
    const params = useParams();
    const testId = props.testId || (typeof params?.testId === 'string' ? params.testId : '');
    const clientCode = (props.clientCode || (typeof params?.clientCode === 'string' ? params.clientCode : '')).trim().toUpperCase();

    const router = useRouter();
    const { branding } = useContext(BrandingContext);

    const [test, setTest] = useState<Test | null>(null);
    const [answers, setAnswers] = useState<Record<string, ClientAnswer>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submissionResult, setSubmissionResult] = useState<TestResult | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [highlightedUnansweredIds, setHighlightedUnansweredIds] = useState<string[]>([]);
    const [restoredBannerVisible, setRestoredBannerVisible] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [termsModalTab, setTermsModalTab] = useState<'terms' | 'privacy'>('terms');

    const draftStorageKey = clientCode ? `rm_test_draft_${testId ? `${testId}_` : ''}${clientCode}` : '';
    const legacyDraftStorageKey = clientCode ? `rm_test_draft_${clientCode}` : '';

    // Restore draft answers from localStorage / sessionStorage if present
    useEffect(() => {
        if (!draftStorageKey || typeof window === 'undefined') return;
        try {
            const raw =
                localStorage.getItem(draftStorageKey) ||
                sessionStorage.getItem(draftStorageKey) ||
                (legacyDraftStorageKey ? sessionStorage.getItem(legacyDraftStorageKey) : null);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.answers && typeof parsed.answers === 'object' && Object.keys(parsed.answers).length > 0) {
                    setAnswers(parsed.answers);
                    setRestoredBannerVisible(true);
                }
                if (typeof parsed.currentPage === 'number' && parsed.currentPage >= 0) {
                    setCurrentPage(parsed.currentPage);
                }
            }
        } catch {
            // Ignore storage errors
        }
    }, [draftStorageKey, legacyDraftStorageKey]);

    // Save draft answers to localStorage + sessionStorage on change
    useEffect(() => {
        if (!draftStorageKey || typeof window === 'undefined' || isSubmitted) return;
        try {
            if (Object.keys(answers).length > 0) {
                const serialized = JSON.stringify({
                    answers,
                    currentPage,
                    updatedAt: Date.now(),
                });
                localStorage.setItem(draftStorageKey, serialized);
                sessionStorage.setItem(draftStorageKey, serialized);
            }
        } catch {
            // Ignore storage errors
        }
    }, [answers, currentPage, draftStorageKey, isSubmitted]);

    const clearSavedDraft = () => {
        if (typeof window === 'undefined') return;
        try {
            if (draftStorageKey) {
                localStorage.removeItem(draftStorageKey);
                sessionStorage.removeItem(draftStorageKey);
            }
            if (legacyDraftStorageKey) {
                localStorage.removeItem(legacyDraftStorageKey);
                sessionStorage.removeItem(legacyDraftStorageKey);
            }
        } catch {
            // Ignore storage errors
        }
    };

    const handleResetProgress = () => {
        clearSavedDraft();
        setAnswers({});
        setCurrentPage(0);
        setHighlightedUnansweredIds([]);
        setValidationError(null);
        setRestoredBannerVisible(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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

    // Ensure restored currentPage stays within bounds once test loads
    useEffect(() => {
        if (paginatedQuestions.length > 0 && currentPage >= paginatedQuestions.length) {
            setCurrentPage(0);
        }
    }, [paginatedQuestions.length, currentPage]);

    const currentQuestions = paginatedQuestions[currentPage] || [];
    const currentSectionTitle = test?.sections[currentPage]?.title || '';

    const questionStartIndex = useMemo(() => {
        if (currentPage === 0) return 0;
        return paginatedQuestions.slice(0, currentPage).reduce((acc, page) => acc + page.length, 0);
    }, [paginatedQuestions, currentPage]);

    const unansweredOnCurrentPage = useMemo(() => {
        return currentQuestions.filter(q => !isQuestionAnswered(q, answers[q.id]));
    }, [currentQuestions, answers]);

    const totalAnsweredCount = useMemo(() => {
        return allQuestions.filter(q => isQuestionAnswered(q, answers[q.id])).length;
    }, [allQuestions, answers]);

    const scrollToQuestion = (questionId: string) => {
        if (typeof document === 'undefined') return;
        const el = document.getElementById(`question-field-${questionId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleAnswerChange = (questionId: string, questionType: Question['type'], optionId: string) => {
        setValidationError(null);
        setHighlightedUnansweredIds(prev => prev.filter(id => id !== questionId));
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

    const highlightAndScrollToMissingOnCurrentPage = () => {
        const missingIds = unansweredOnCurrentPage.map(q => q.id);
        setHighlightedUnansweredIds(missingIds);
        if (unansweredOnCurrentPage.length > 0) {
            const firstMissing = unansweredOnCurrentPage[0];
            const firstMissingNumber = questionStartIndex + currentQuestions.findIndex(q => q.id === firstMissing.id) + 1;
            setValidationError(
                unansweredOnCurrentPage.length === 1
                    ? `Pominięto 1 pytanie na tej stronie (pytanie nr ${firstMissingNumber}). Zaznacz odpowiedź, aby przejść dalej.`
                    : `Pozostało do zaznaczenia na tej stronie: ${unansweredOnCurrentPage.length} pytań (pierwsze pominięte: pytanie nr ${firstMissingNumber}).`
            );
            scrollToQuestion(firstMissing.id);
        }
    };

    const handleNextPage = () => {
        if (unansweredOnCurrentPage.length > 0) {
            highlightAndScrollToMissingOnCurrentPage();
            return;
        }
        setValidationError(null);
        setHighlightedUnansweredIds([]);
        if (currentPage < paginatedQuestions.length - 1) {
            setCurrentPage(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevPage = () => {
        setValidationError(null);
        setHighlightedUnansweredIds([]);
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const findFirstUnansweredAcrossTest = () => {
        for (let pageIdx = 0; pageIdx < paginatedQuestions.length; pageIdx++) {
            const pageQuestions = paginatedQuestions[pageIdx];
            const missingOnPage = pageQuestions.filter(q => !isQuestionAnswered(q, answers[q.id]));
            if (missingOnPage.length > 0) {
                return {
                    allAnswered: false,
                    firstUnansweredPage: pageIdx,
                    missingIds: missingOnPage.map(q => q.id),
                    firstQuestionId: missingOnPage[0].id,
                };
            }
        }
        return { allAnswered: true, firstUnansweredPage: -1, missingIds: [] as string[], firstQuestionId: '' };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!test || isSubmitting || !clientCode) return;

        if (unansweredOnCurrentPage.length > 0) {
            highlightAndScrollToMissingOnCurrentPage();
            return;
        }

        const validationResult = findFirstUnansweredAcrossTest();
        if (!validationResult.allAnswered) {
            setValidationError(`Nie odpowiedziano na wszystkie pytania. Przeniesiono do części ${validationResult.firstUnansweredPage + 1}, aby uzupełnić brakujące odpowiedzi.`);
            setHighlightedUnansweredIds(validationResult.missingIds);
            setCurrentPage(validationResult.firstUnansweredPage);
            setTimeout(() => {
                if (validationResult.firstQuestionId) {
                    scrollToQuestion(validationResult.firstQuestionId);
                }
            }, 150);
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
            clearSavedDraft();
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
    const progress = allQuestions.length > 0 ? Math.round((totalAnsweredCount / allQuestions.length) * 100) : 100;
    const answeredOnCurrentPageCount = currentQuestions.length - unansweredOnCurrentPage.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background flex items-center justify-center p-4 text-text transition-all duration-500">
            <div className="w-full max-w-3xl animate-fade-in-up my-6">
                <div className="bg-surface/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-border">
                    <header className="px-6 sm:px-8 py-6 bg-background/60 backdrop-blur-sm border-b border-border">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                                <h1 className="text-2xl font-bold text-text">{test.title}</h1>
                                <p className="text-text-muted mt-1 text-sm">
                                    Część {currentPage + 1} z {totalPages}
                                    {currentSectionTitle ? ` — ${currentSectionTitle}` : ''}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="inline-block px-3 py-1 rounded-full bg-surface border border-border text-xs font-semibold text-text">
                                    Odpowiedzi: <span className="text-primary font-bold">{totalAnsweredCount}</span> / {allQuestions.length} ({progress}%)
                                </span>
                                <p className="text-[11px] text-text-muted mt-1">
                                    Postęp zapisuje się automatycznie
                                </p>
                            </div>
                        </div>

                        <div
                            className="mt-4 w-full bg-border/40 rounded-full h-3 overflow-hidden shadow-inner"
                            role="progressbar"
                            aria-valuenow={progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Postęp badania: ${totalAnsweredCount} z ${allQuestions.length} pytań`}
                        >
                            <div
                                className="bg-gradient-to-r from-primary to-accent h-3 rounded-full"
                                style={{ width: `${Math.max(4, progress)}%`, transition: 'width 0.4s ease-in-out' }}
                            />
                        </div>

                        {restoredBannerVisible && totalAnsweredCount > 0 && (
                            <div className="mt-4 p-3 rounded-xl bg-primary/15 border border-primary/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="text-text">
                                    ✓ Przywrócono Twój zapisany postęp badania (<strong>{totalAnsweredCount}</strong> z {allQuestions.length} odpowiedzi). Możesz spokojnie kontynuować.
                                </span>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleResetProgress}
                                        className="text-text-muted hover:text-error underline font-medium"
                                    >
                                        Wyczyść i zacznij od nowa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRestoredBannerVisible(false)}
                                        className="text-text-muted hover:text-text font-bold px-1"
                                        title="Ukryj komunikat"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}
                    </header>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                        <div className="space-y-8">
                            {currentQuestions.map((q, index) => {
                                const isHighlightedMissing = highlightedUnansweredIds.includes(q.id) && !isQuestionAnswered(q, answers[q.id]);
                                return (
                                    <fieldset
                                        key={q.id}
                                        id={`question-field-${q.id}`}
                                        className={`border-b border-border/60 pb-8 transition-all duration-300 ${
                                            isHighlightedMissing
                                                ? 'border-2 border-warning bg-warning/10 rounded-2xl p-5 -mx-2 shadow-lg'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-5">
                                            <legend
                                                className="text-lg font-medium text-text leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(`${questionStartIndex + index + 1}. ${q.text.replace(/^\s*\d+[\.\)]\s*/, '')}`) }}
                                            />
                                            {isHighlightedMissing && (
                                                <span
                                                    className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                                                    style={{
                                                        backgroundColor: 'var(--warning-color)',
                                                        color: 'var(--warning-contrast)',
                                                    }}
                                                >
                                                    Brak odpowiedzi
                                                </span>
                                            )}
                                        </div>
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
                                );
                            })}
                        </div>

                        {validationError && (
                            <div
                                role="alert"
                                className="mt-6 p-4 rounded-xl bg-error/15 border border-error/30 text-error font-medium flex flex-wrap items-center justify-between gap-3 text-sm"
                            >
                                <span>{validationError}</span>
                                {unansweredOnCurrentPage.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => scrollToQuestion(unansweredOnCurrentPage[0].id)}
                                        className="px-3.5 py-1.5 rounded-lg bg-error text-error-contrast font-bold text-xs hover:opacity-90 transition-opacity"
                                    >
                                        Przewiń do pominiętego pytania &uarr;
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                                {currentPage > 0 && (
                                    <button
                                        type="button"
                                        onClick={handlePrevPage}
                                        className="px-6 py-3 bg-background border border-border text-text font-semibold rounded-xl shadow-sm hover:bg-border/30 transition-all duration-200"
                                    >
                                        &larr; Wstecz
                                    </button>
                                )}
                                <span className="text-xs text-text-muted">
                                    Na tej stronie: <strong className="text-text">{answeredOnCurrentPageCount} / {currentQuestions.length}</strong>
                                    {unansweredOnCurrentPage.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={highlightAndScrollToMissingOnCurrentPage}
                                            className="ml-2 text-warning hover:underline font-semibold"
                                        >
                                            (pozostało: {unansweredOnCurrentPage.length})
                                        </button>
                                    )}
                                </span>
                            </div>
                            <div className="w-full sm:w-auto flex justify-end">
                                {currentPage < totalPages - 1 ? (
                                    <button
                                        type="button"
                                        onClick={handleNextPage}
                                        className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-contrast font-bold rounded-xl shadow-lg hover:opacity-90 transition-all duration-200"
                                    >
                                        Dalej &rarr;
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-contrast font-bold rounded-xl shadow-lg hover:opacity-90 disabled:opacity-50 transition-all duration-200"
                                    >
                                        {isSubmitting ? 'Przesyłanie...' : 'Zakończ i prześlij odpowiedzi'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                <footer className="mt-5 text-center text-xs text-text-muted flex flex-wrap items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setTermsModalTab('terms');
                            setIsTermsModalOpen(true);
                        }}
                        className="text-primary hover:underline font-semibold opacity-80 hover:opacity-100 transition-opacity"
                    >
                        {branding.termsOfTestingTitle || DEFAULT_TERMS_OF_TESTING_TITLE}
                    </button>
                    <span className="opacity-40">&bull;</span>
                    <button
                        type="button"
                        onClick={() => {
                            setTermsModalTab('privacy');
                            setIsTermsModalOpen(true);
                        }}
                        className="text-primary hover:underline font-semibold opacity-80 hover:opacity-100 transition-opacity"
                    >
                        {branding.privacyPolicyTitle || DEFAULT_PRIVACY_POLICY_TITLE}
                    </button>
                </footer>
            </div>

            <TermsOfTestingModal
                isOpen={isTermsModalOpen}
                onClose={() => setIsTermsModalOpen(false)}
                initialTab={termsModalTab}
            />
        </div>
    );
}
