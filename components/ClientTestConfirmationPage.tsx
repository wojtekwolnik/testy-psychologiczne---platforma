import React, { useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchPublicTestForClient } from '@/app/actions/testActions';
import { type Test } from './types';
import { BrandingContext } from '../contexts/BrandingContext';
import DOMPurify from 'isomorphic-dompurify';

const ClientTestConfirmationPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { branding } = useContext(BrandingContext);

  const testId = searchParams.get('testId');
  const clientCode = searchParams.get('clientCode');

  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId || !clientCode) {
      setError("Brak danych testu lub kodu dostępu. Proszę wrócić do strony głównej i spróbować ponownie.");
      setIsLoading(false);
      return;
    }

    const loadTest = async () => {
      try {
        setIsLoading(true);
        const fetchedTest = await fetchPublicTestForClient(testId, clientCode);
        if (fetchedTest) {
          setTest(fetchedTest);
        } else {
          setError("Nie znaleziono testu lub kod dostępu wygasł.");
        }
      } catch (err) {
        setError("Wystąpił błąd podczas ładowania testu.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [testId, clientCode]);

  const handleStart = () => {
    router.push(`/test/${testId}?clientCode=${clientCode}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !test) {
    return <div className="p-8 text-center text-error">{error || "Nie udało się wczytać testu."}</div>;
  }

  const questionCount = test.sections.reduce((acc, section) => acc + section.questions.length, 0);

  const parsedMessage = branding.clientConfirmationMessage
    .replace(/{testTitle}/g, test.title)
    .replace(/{questionCount}/g, String(questionCount))
    .replace(/{testDescription}/g, test.description);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background flex items-center justify-center p-4 transition-all duration-500 text-text">
      <div className="bg-surface/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-12 text-center max-w-2xl w-full border border-border animate-fade-in-up">
        <h1 className="text-3xl font-extrabold mb-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(branding.clientConfirmationTitle) }}></h1>
        <div className="text-text-muted text-lg leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parsedMessage) }}></div>

        <div className="bg-background/60 border border-border rounded-xl p-6 my-8 backdrop-blur-sm shadow-inner">
          <p className="text-lg font-medium">Test: <span className="text-primary font-bold">{test.title}</span></p>
          <p className="text-text-muted mt-2">Ilość pytań: <span className="font-semibold text-text">{questionCount}</span></p>
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={handleStart}
            className="w-full max-w-sm mx-auto px-8 py-4 bg-primary text-primary-contrast font-bold text-lg rounded-xl shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
          >
            {branding.clientConfirmationButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientTestConfirmationPage;
