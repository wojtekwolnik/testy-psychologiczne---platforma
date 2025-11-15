
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { fetchTestById, submitTest, checkTestStatus } from '../services/apiClient';
import type { Test, ClientAnswer, Question } from './types';
import { BrandingContext } from '../contexts/BrandingContext';

const ClientTestView: React.FC = () => {
  const { testId, clientCode } = useParams<{ testId: string; clientCode: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<string, {type: Question['type'], value: string | string[] }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        const isCompleted = await checkTestStatus(clientCode);
        if (isCompleted) {
            setError("Ten test został już ukończony i nie można go wypełnić ponownie. Proszę skontaktować się z terapeutą w celu uzyskania nowego kodu.");
            setIsLoading(false);
            return;
        }

        const fetchedTest = await fetchTestById(testId);
        if (fetchedTest) {
          setTest(fetchedTest);
        } else {
          setError("Nie znaleziono testu o podanym identyfikatorze.");
        }
      } catch (err: any) {
        if (err.message.includes('already completed')) {
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

  const paginatedQuestions = useMemo(() => {
    if (!test || !test.questionsPerPage || test.questionsPerPage <= 0) {
        return [allQuestions]; // No pagination
    }
    const pages = [];
    for (let i = 0; i < allQuestions.length; i += test.questionsPerPage) {
        pages.push(allQuestions.slice(i, i + test.questionsPerPage));
    }
    return pages.length > 0 ? pages : [[]];
  }, [test, allQuestions]);
  
  const currentQuestions = paginatedQuestions[currentPage] || [];
  
  const handleAnswerChange = (questionId: string, questionType: Question['type'], optionId: string) => {
    setValidationError(null);
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
      for (const q of allQuestions) {
          if (!answers[q.id] || (Array.isArray(answers[q.id].value) && (answers[q.id].value as string[]).length === 0) || (typeof answers[q.id].value === 'string' && !answers[q.id].value)) {
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
    const clientAnswers: ClientAnswer[] = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        ...(answer.type === 'multiple-select'
            ? { selectedOptionIds: answer.value as string[] }
            : { selectedOptionId: answer.value as string })
    }));
    
    try {
        await submitTest(testId!, clientAnswers, clientCode);
        navigate('/thank-you');
    } catch (err) {
        setError("Nie udało się przesłać odpowiedzi. Możliwe, że ten kod został już wykorzystany. Proszę spróbować ponownie lub skontaktować się z terapeutą.");
        setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen bg-[var(--background-color)]"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-color)]"></div></div>;
  
  if (error) return (
    <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-12 text-center max-w-lg prose">
            <h1 className="text-3xl font-bold text-red-600">Wystąpił błąd</h1>
            <p className="text-lg">{error}</p>
            <button
                onClick={() => navigate('/')}
                className="mt-4 no-underline px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-colors"
            >
                Powrót do strony głównej
            </button>
        </div>
    </div>
    );

  if (!test) return <Navigate to="/" replace />; // Should not happen if error handling is correct

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
                    <div className="text-lg font-semibold mb-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: `${currentPage * (test.questionsPerPage || 0) + index + 1}. ${q.text}` }}></div>
                    <div className="space-y-3">
                    {q.options.map(option => (
                        <label key={option.id} className="flex items-center p-4 rounded-lg border border-slate-300 has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 transition-all cursor-pointer shadow-sm">
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
                            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="ml-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: option.text }}></div>
                        </label>
                    ))}
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


export const ClientThankYou: React.FC = () => {
    const navigate = useNavigate();
    const { branding } = useContext(BrandingContext);
    
    const formattedTitle = branding.clientThankYouTitle.replace(/{appName}/g, branding.appName);
    const formattedMessage = branding.clientThankYouMessage.replace(/{appName}/g, branding.appName);

    return (
    <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center p-4">
        <div className="bg-[var(--secondary-color)] text-[var(--text-color)] rounded-xl shadow-2xl p-12 text-center max-w-lg prose">
            <h1 className="text-4xl font-bold text-[var(--primary-color)] mb-4" dangerouslySetInnerHTML={{ __html: formattedTitle }}></h1>
            <div className="text-lg mb-6" dangerouslySetInnerHTML={{ __html: formattedMessage }}></div>
            <button
                onClick={() => navigate('/')}
                className="no-underline px-6 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-semibold rounded-lg shadow-md hover:opacity-90 transition-colors"
            >
                {branding.clientThankYouButtonText}
            </button>
        </div>
    </div>
    );
};

export default ClientTestView;
