import React, { useState, useEffect, useMemo, useContext } from 'react';
import { fetchTestById, submitTest } from '../services/apiService';
import type { Test, ClientAnswer, Question } from './types';
import { View } from './types';
import { BrandingContext } from '../contexts/BrandingContext';

interface ClientTestViewProps {
  testId: string;
  clientCode: string;
  onNavigate: (view: View) => void;
}

const ClientTestView: React.FC<ClientTestViewProps> = ({ testId, clientCode, onNavigate }) => {
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<string, {type: Question['type'], value: string | string[] }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const loadTest = async () => {
      try {
        setIsLoading(true);
        const fetchedTest = await fetchTestById(testId);
        if (fetchedTest) {
          setTest(fetchedTest);
        } else {
          setError("Nie znaleziono testu.");
        }
      } catch (err) {
        setError("Nie udało się załadować testu.");
      } finally {
        setIsLoading(false);
      }
    };
    loadTest();
  }, [testId]);
  
  const allQuestions = useMemo(() => test?.sections.flatMap(s => s.questions) || [], [test]);

  const paginatedQuestions = useMemo(() => {
    if (!test || !test.questionsPerPage || test.questionsPerPage <= 0 || allQuestions.length <= test.questionsPerPage) {
        return [allQuestions];
    }
    const pages = [];
    for (let i = 0; i < allQuestions.length; i += test.questionsPerPage) {
        pages.push(allQuestions.slice(i, i + test.questionsPerPage));
    }
    return pages.length > 0 ? pages : [[]];
  }, [test, allQuestions]);
  
  const currentQuestions = paginatedQuestions[currentPage] || [];
  
  const handleAnswerChange = (questionId: string, questionType: Question['type'], optionId: string) => {
    setValidationError(null); // Clear validation error on new answer
    setAnswers(prev => {
        const newAnswers = {...prev};
        if (questionType === 'multiple-select') {
            const currentSelection = (newAnswers[questionId]?.value as string[] || []);
            if (currentSelection.includes(optionId)) {
                newAnswers[questionId] = {type: questionType, value: currentSelection.filter(id => id !== optionId)};
            } else {
                newAnswers[questionId] = {type: questionType, value: [...currentSelection, optionId]};
            }
        } else {
            newAnswers[questionId] = {type: questionType, value: optionId};
        }
        return newAnswers;
    });
  };

  const isCurrentPageAnswered = () => {
      return currentQuestions.every(q => answers[q.id] && (answers[q.id].value as any).length > 0);
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
      for (let i = 0; i < allQuestions.length; i++) {
          const q = allQuestions[i];
          if (!answers[q.id] || (answers[q.id].value as any).length === 0) {
              const pageIndex = paginatedQuestions.findIndex(page => page.some(pq => pq.id === q.id));
              return { allAnswered: false, firstUnansweredPage: pageIndex };
          }
      }
      return { allAnswered: true, firstUnansweredPage: -1 };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!test || isSubmitting) return;

    setValidationError(null);

    // First, validate the current page specifically.
    if (!isCurrentPageAnswered()) {
        setValidationError("Proszę odpowiedzieć na wszystkie pytania na tej stronie, aby przesłać odpowiedzi.");
        return;
    }

    // Then, validate the entire test.
    const validationResult = areAllQuestionsAnswered();
    if (!validationResult.allAnswered) {
        setValidationError(`Nie odpowiedziano na wszystkie pytania. Proszę wrócić na stronę ${validationResult.firstUnansweredPage + 1}, aby uzupełnić brakujące odpowiedzi.`);
        return;
    }
    
    setIsSubmitting(true);
    const clientAnswers: ClientAnswer[] = Object.keys(answers).map((questionId) => {
        const answer = answers[questionId];
        return {
            questionId,
            ...(answer.type === 'multiple-select'
                ? { selectedOptionIds: answer.value as string[] }
                : { selectedOptionId: answer.value as string })
        };
    });
    
    try {
        await submitTest(testId, clientAnswers, clientCode);
        onNavigate(View.ClientThankYou);
    } catch (err) {
        setError("Nie udało się przesłać odpowiedzi. Proszę spróbować ponownie.");
        setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen bg-[var(--background-color)]"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-color)]"></div></div>;
  if (error) return <div className="text-[var(--error-color)] text-center mt-10">{error}</div>;
  if (!test) return null;

  const totalPages = paginatedQuestions.length;
  const progress = totalPages > 1 ? ((currentPage + 1) / totalPages) * 100 : 0;

  return (
    <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center p-4 text-[var(--text-color)]">
      <div className="w-full max-w-3xl">
        <div className="bg-[var(--secondary-color)] rounded-xl shadow-2xl overflow-hidden">
          <div className="p-8 prose max-w-none">
            <h1 className="text-3xl font-bold" dangerouslySetInnerHTML={{ __html: test.title }}></h1>
            <div className="mt-2 opacity-80" dangerouslySetInnerHTML={{ __html: test.description }}></div>
            <div className="mt-2 text-sm opacity-60" dangerouslySetInnerHTML={{ __html: test.instructions }}></div>
          </div>
          
          {totalPages > 1 && (
            <div className="w-full bg-gray-200 h-2">
                <div className="bg-[var(--primary-color)] h-2" style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}></div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
                {currentQuestions.map((q, index) => (
                <div key={q.id} className="border-b border-[var(--border-color)] pb-8">
                    <div className="text-lg font-semibold mb-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: `${currentPage * (test.questionsPerPage || 0) + index + 1}. ${q.text}` }}></div>
                    <div className="space-y-3">
                    {q.options.map(option => (
                        <label key={option.id} className="flex items-center p-4 rounded-lg border border-[var(--border-color)] has-[:checked]:bg-indigo-50 has-[:checked]:border-[var(--primary-color)] transition-all cursor-pointer">
                        <input
                            type={q.type === 'multiple-select' ? 'checkbox' : 'radio'}
                            name={q.id}
                            value={option.id}
                            checked={
                                q.type === 'multiple-select' 
                                ? (answers[q.id]?.value as string[] || []).includes(option.id)
                                : answers[q.id]?.value === option.id
                            }
                            onChange={() => handleAnswerChange(q.id, q.type, option.id)}
                            className="h-5 w-5 text-[var(--primary-color)] focus:ring-[var(--primary-color)] border-[var(--border-color)]"
                        />
                        <div className="ml-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: option.text }}></div>
                        </label>
                    ))}
                    </div>
                </div>
                ))}
            </div>
             {validationError && <p className="text-center text-[var(--error-color)] font-semibold pt-6">{validationError}</p>}
             <div className="pt-8 flex justify-between items-center">
                <div>
                    {currentPage > 0 && (
                        <button type="button" onClick={handlePrevPage} className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                            Wstecz
                        </button>
                    )}
                </div>
                <div>
                    {currentPage < totalPages - 1 ? (
                         <button type="button" onClick={handleNextPage} className="px-8 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300">
                            Dalej
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300"
                        >
                            {isSubmitting ? 'Przesyłanie...' : 'Prześlij odpowiedzi'}
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


export const ClientThankYou: React.FC<{onNavigate: (view: View) => void}> = ({onNavigate}) => {
    const { branding } = useContext(BrandingContext);
    
    const formattedTitle = branding.clientThankYouTitle.replace(/{appName}/g, branding.appName);
    const formattedMessage = branding.clientThankYouMessage.replace(/{appName}/g, branding.appName);

    return (
    <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center p-4">
        <div className="bg-[var(--secondary-color)] text-[var(--text-color)] rounded-xl shadow-2xl p-12 text-center max-w-lg prose">
            <h1 className="text-4xl font-bold text-[var(--primary-color)] mb-4" dangerouslySetInnerHTML={{ __html: formattedTitle }}></h1>
            <div className="text-lg mb-6" dangerouslySetInnerHTML={{ __html: formattedMessage }}></div>
            <button
                onClick={() => onNavigate(View.Login)}
                className="no-underline px-6 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-semibold rounded-lg shadow-md hover:opacity-90 transition-colors"
            >
                {branding.clientThankYouButtonText}
            </button>
        </div>
    </div>
    );
};

export default ClientTestView;