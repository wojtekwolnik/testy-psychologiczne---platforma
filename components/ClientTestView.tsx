import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchTestById } from '@/app/actions/testActions';
import { submitTest } from '@/app/actions/resultActions';
import { validateAccessCode } from '@/app/actions/accessCodeActions';
import type { Test, ClientAnswer, Question, TestResult } from './types';
import { BrandingContext } from '../contexts/BrandingContext';
import DOMPurify from 'isomorphic-dompurify';

interface ClientTestViewProps {
    testId?: string;
    clientCode?: string;
}

import { ClientThankYou } from './ClientThankYou';

export default function ClientTestView(props: ClientTestViewProps) {
    const params = useParams();
    // Use props if provided (from server component wrapper), fallback to params (if client routed)
    const testId = props.testId || (typeof params?.testId === 'string' ? params.testId : '');
    const clientCode = props.clientCode || (typeof params?.clientCode === 'string' ? params.clientCode : '');

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

    useEffect(() => {
        if (!testId || !clientCode) {
            setError("Brakujące informacje. Nie można załadować testu.");
            setIsLoading(false);
            return;
        }

        const loadTest = async () => {
            try {
                setIsLoading(true);
                // First, check if this test has already been completed
                if (clientCode) {
                    const validation = await validateAccessCode(clientCode);
                    if (!validation.isValid) {
                        // Check specifically if used
                        if (validation.error?.includes('wykorzystany') || validation.error?.includes('expired')) {
                            setError("Ten test został już ukończony lub kod wygasł. Proszę skontaktować się z terapeutą.");
                        } else {
                            setError(validation.error || "Nieprawidłowy kod dostępu.");
                        }
                        setIsLoading(false);
                        return;
                    }

                    if (validation.testId && testId && validation.testId !== testId) {
                        setError('Kod dostępu nie pasuje do tego testu.');
                        setIsLoading(false);
                        return;
                    }
                }

                const fetchedTest = await fetchTestById(testId);
                if (fetchedTest) {
                    setTest(fetchedTest);
                } else {
                    setError("Nie znaleziono testu o podanym identyfikatorze.");
                }
            } catch (err: any) {
                if (err.message && err.message.includes('already completed')) {
                    setError("Ten test został już ukończony i nie można go wypełnić ponownie. Proszę skontaktować się z terapeutą w celu uzyskania nowego kodu.");
                } else {
                    setError("Nie udało się załadować testu. Proszę sprawdzić połączenie i spróbować ponownie.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadTest();
    }, [testId, clientCode]);

    const allQuestions = useMemo(() => test?.sections.flatMap(s => s.questions) || [], [test]);

    // Pagination now follows Sections: 1 Section = 1 Page
    const paginatedQuestions = useMemo(() => {
        if (!test) return [];
        return test.sections.map(section => section.questions);
    }, [test]);

    const currentQuestions = paginatedQuestions[currentPage] || [];

    // Calculate global question index offset for the current page
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

                let newSelection;
                if (currentSelection.includes(optionId)) {
                    newSelection = currentSelection.filter(id => id !== optionId);
                } else {
                    newSelection = [...currentSelection, optionId];
                }
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
    }

    const handleNextPage = () => {
        if (!isCurrentPageAnswered()) {
            setValidationError("Proszę odpowiedzieć na wszystkie pytania na tej stronie, aby kontynuować.");
            return;
        }
        setValidationError(null);
        if (currentPage < paginatedQuestions.length - 1) {
            setCurrentPage(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handlePrevPage = () => {
        setValidationError(null);
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
            window.scrollTo(0, 0);
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
            setValidationError(`Nie odpowiedziano na wszystkie pytania. Proszę wrócić na stronę ${validationResult.firstUnansweredPage + 1}, aby uzupełnić brakujące odpowiedzi.`);
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
            setIsSubmitted(true);
            setSubmissionResult(result);
        } catch (err) {
            setError("Nie udało się przesłać odpowiedzi. Możliwe, że ten kod został już wykorzystany. Proszę spróbować ponownie lub skontaktować się z terapeutą.");
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen bg-background"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>;

    if (isSubmitted && submissionResult && test) {
        return <ClientThankYou result={submissionResult} test={test} />;
    }

    if (error) return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl p-12 text-center max-w-lg prose animate-fade-in-up">
                <h2 className="text-3xl font-bold text-error mb-4">Wystąpił błąd</h2>
                <p className="text-text-muted text-lg">{error}</p>
                <div className="mt-8">
                    <a href="/" className="no-underline px-8 py-3 bg-surface/80 text-text font-bold rounded-xl shadow hover:bg-surface transition-all duration-300 inline-block hover:-translate-y-1">
                        Powrót do strony głównej
                    </a>
                </div>
            </div>
        </div>
    );

    if (!test) {
        // Redirect if no test loaded (and no error shown yet)
        router.push('/');
        return null;
    }

    const totalPages = paginatedQuestions.length;
    const progress = totalPages > 1 ? ((currentPage + 1) / totalPages) * 100 : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background flex items-center justify-center p-4 text-text transition-all duration-500">
            <div className="w-full max-w-3xl animate-fade-in-up">
                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10">
                    <div className="px-8 py-6 bg-surface/50 backdrop-blur-sm border-b border-border/50">
                        <h2 className="text-2xl font-bold text-primary">{test.title}</h2>
                        <p className="text-text-muted mt-2">Część {currentPage + 1} z {totalPages}</p>
                        
                        {/* Progress Bar */}
                        {totalPages > 1 && (
                        <div className="mt-4 w-full bg-border/30 rounded-full h-3 overflow-hidden shadow-inner">
                            <div className="bg-gradient-to-r from-primary to-accent h-3 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                        </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="space-y-8">
                            {currentQuestions.map((q, index) => (
                                <div key={q.id} className="border-b border-slate-200 pb-8">
                                    <div className="text-lg font-semibold mb-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(`${questionStartIndex + index + 1}. ${q.text}`) }}></div>
                                    <div className="space-y-3">
                                        {['likert-5', 'likert-7', 'scale-1-10'].includes(q.type) ? (
                                            <div className="flex flex-wrap items-start justify-center gap-2 sm:gap-4 mt-2">
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
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border-2 transition-all font-bold text-lg
                                                                ${isSelected ? 'bg-primary border-primary text-primary-contrast shadow-lg scale-110' : 'bg-surface border-border text-text group-hover:border-primary/50 group-hover:bg-primary/5'}
                                                            `}>
                                                                {/* If text is just a number, show it. Otherwise show index + 1 */}
                                                                {isNumber ? option.text : (idx + 1)}
                                                            </div>
                                                            {/* Show text label if it's NOT just a number (e.g. "Strongly Agree") */}
                                                            {!isNumber && (
                                                                <span className="text-xs text-center mt-2 max-w-[80px] text-slate-600 font-medium leading-tight">{option.text}</span>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            q.options.map(option => (
                                                <label key={option.id} className="flex items-center p-4 rounded-xl border border-border/50 bg-surface/50 hover:bg-surface has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all cursor-pointer shadow-sm hover:shadow-md">
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
                                                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                    />
                                                    <div className="ml-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(option.text) }}></div>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {validationError && <p className="text-center text-red-600 font-semibold pt-6">{validationError}</p>}
                        <div className="pt-8 flex justify-between items-center">
                            <div>
                                {currentPage > 0 && (
                                    <button type="button" onClick={handlePrevPage} className="px-6 py-3 bg-surface border border-border/50 text-text font-semibold rounded-xl shadow-sm hover:bg-border/30 hover:-translate-y-1 transition-all duration-300">
                                        Wstecz
                                    </button>
                                )}
                            </div>
                            <div>
                                {currentPage < totalPages - 1 ? (
                                    <button type="button" onClick={handleNextPage} className="px-8 py-3 bg-primary text-primary-contrast font-bold rounded-xl shadow-lg hover:shadow-primary/30 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-300">
                                        Dalej
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-8 py-3 bg-success text-white font-bold rounded-xl shadow-lg hover:shadow-success/30 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-300"
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
};


