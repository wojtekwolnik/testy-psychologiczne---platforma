import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchTestById } from '@/app/actions/testActions';
import { submitTest } from '@/app/actions/resultActions';
import { validateAccessCode } from '@/app/actions/accessCodeActions';
import type { Test, ClientAnswer, Question, TestResult } from './types';
import { BrandingContext } from '../contexts/BrandingContext';

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

    if (isLoading) return <div className="flex justify-center items-center h-screen bg-[var(--background-color)]"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-color)]"></div></div>;

    if (isSubmitted && submissionResult && test) {
        return <ClientThankYou result={submissionResult} test={test} />;
    }

    if (error) return (
        <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-12 text-center max-w-lg prose">
                <h1 className="text-3xl font-bold text-red-600">Wystąpił błąd</h1>
                <p className="text-lg">{error}</p>
                <button
                    onClick={() => router.push('/')}
                    className="mt-4 no-underline px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-colors"
                >
                    Powrót do strony głównej
                </button>
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-[var(--text-color)]">
            <div className="w-full max-w-3xl">
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
                    <div className="p-8 prose max-w-none">
                        <h1 className="text-3xl font-bold" dangerouslySetInnerHTML={{ __html: test.title }}></h1>
                        <div className="mt-2 opacity-80" dangerouslySetInnerHTML={{ __html: test.description }}></div>
                        <div className="mt-2 text-sm opacity-60" dangerouslySetInnerHTML={{ __html: test.instructions }}></div>
                    </div>

                    {totalPages > 1 && (
                        <div className="w-full bg-gray-200 h-2.5">
                            <div className="bg-green-500 h-2.5" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="space-y-8">
                            {currentQuestions.map((q, index) => (
                                <div key={q.id} className="border-b border-slate-200 pb-8">
                                    <div className="text-lg font-semibold mb-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: `${questionStartIndex + index + 1}. ${q.text}` }}></div>
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
                                                                ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-110' : 'bg-white border-slate-300 text-slate-600 group-hover:border-indigo-400 group-hover:bg-indigo-50'}
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
                                                <label key={option.id} className="flex items-center p-4 rounded-lg border border-slate-300 has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 transition-all cursor-pointer shadow-sm">
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
                                                    <div className="ml-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: option.text }}></div>
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
                                    <button type="button" onClick={handlePrevPage} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                                        Wstecz
                                    </button>
                                )}
                            </div>
                            <div>
                                {currentPage < totalPages - 1 ? (
                                    <button type="button" onClick={handleNextPage} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300">
                                        Dalej
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300"
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


