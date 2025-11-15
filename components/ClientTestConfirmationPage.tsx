import React, { useState, useEffect, useContext } from 'react';
import { fetchTestById } from '../services/apiService';
import { type Test, View } from './types';
import { BrandingContext } from '../contexts/BrandingContext';

interface ClientTestConfirmationPageProps {
  testId: string;
  clientCode: string;
  onNavigate: (view: View, context?: any) => void;
}

const ClientTestConfirmationPage: React.FC<ClientTestConfirmationPageProps> = ({ testId, clientCode, onNavigate }) => {
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { branding } = useContext(BrandingContext);

  useEffect(() => {
    const loadTest = async () => {
      try {
        setIsLoading(true);
        const fetchedTest = await fetchTestById(testId);
        if (fetchedTest) {
          setTest(fetchedTest);
        } else {
          setError("Nie znaleziono testu. Kod może być nieprawidłowy.");
        }
      } catch (err) {
        setError("Wystąpił błąd podczas ładowania testu.");
      } finally {
        setIsLoading(false);
      }
    };
    loadTest();
  }, [testId]);
  
  const handleStart = () => {
      onNavigate(View.ClientTest, { testId, clientCode });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--background-color)]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-color)]"></div>
      </div>
    );
  }

  if (error || !test) {
    return <div className="p-8 text-center text-[var(--error-color)]">{error || "Nie udało się wczytać testu."}</div>;
  }
  
  const questionCount = test.sections.reduce((acc, section) => acc + section.questions.length, 0);
  
  const formattedMessage = branding.clientConfirmationMessage
    .replace(/{testTitle}/g, test.title)
    .replace(/{questionCount}/g, String(questionCount))
    .replace(/{testDescription}/g, test.description);
    
  const formattedTitle = branding.clientConfirmationTitle
    .replace(/{testTitle}/g, test.title)
    .replace(/{questionCount}/g, String(questionCount))
    .replace(/{testDescription}/g, test.description);

  return (
    <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center p-4">
      <div className="bg-[var(--secondary-color)] text-[var(--text-color)] rounded-xl shadow-2xl p-12 text-center max-w-2xl">
        <h1 className="text-4xl font-bold text-[var(--primary-color)] mb-4" dangerouslySetInnerHTML={{ __html: formattedTitle }}></h1>
        <div className="text-lg mb-8 prose max-w-none mx-auto" dangerouslySetInnerHTML={{ __html: formattedMessage }}></div>
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90 transition-colors"
        >
          {branding.clientConfirmationButtonText}
        </button>
      </div>
    </div>
  );
};

export default ClientTestConfirmationPage;