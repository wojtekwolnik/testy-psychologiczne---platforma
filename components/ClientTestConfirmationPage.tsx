
import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { fetchTestById } from '../services/apiService';
import { type Test } from './types';
import { BrandingContext } from '../contexts/BrandingContext';

const ClientTestConfirmationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { branding } = useContext(BrandingContext);

  // Data passed from ClientCodeEntry page
  const { testId, clientCode } = location.state || {};

  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId || !clientCode) {
      // If data is missing, we can't proceed.
      setError("Brak danych testu. Proszę wrócić do strony głównej i spróbować ponownie.");
      setIsLoading(false);
      return;
    }

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
  }, [testId, clientCode]);
  
  const handleStart = () => {
      // Navigate to the test-taking view, passing the identifiers in the URL
      navigate(`/test/${testId}/${clientCode}`);
  };

  // If the page is accessed directly without state, redirect to home
  if (!testId || !clientCode) {
    return <Navigate to="/" replace />;
  }

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
  
  // Dynamically replace placeholders in branding messages
  const formattedMessage = branding.clientConfirmationMessage
    .replace(/{testTitle}/g, test.title)
    .replace(/{questionCount}/g, String(questionCount))
    .replace(/{testDescription}/g, test.description);
    
  const formattedTitle = branding.clientConfirmationTitle.replace(/{testTitle}/g, test.title);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 flex items-center justify-center p-4 transition-all duration-500 text-[var(--text-color)]">
      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-8 sm:p-12 text-center max-w-2xl w-full border border-slate-200">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4" dangerouslySetInnerHTML={{ __html: formattedTitle }}></h1>
        <div className="text-base md:text-lg mb-6 prose max-w-none mx-auto opacity-80" dangerouslySetInnerHTML={{ __html: formattedMessage }}></div>
        
        <div className="bg-slate-100 border border-slate-300 rounded-lg p-4 my-6">
            <p className="text-sm text-slate-600">Twój identyfikator testu to:</p>
            <p className="text-2xl font-mono font-bold tracking-widest text-slate-800 mt-1">{clientCode}</p>
            <p className="text-xs text-slate-500 mt-2">Ten identyfikator zostanie użyty do zapisania wyników. Terapeuta użyje go do odnalezienia Twojego testu.</p>
        </div>

        <button
          onClick={handleStart}
          className="w-full max-w-xs mx-auto px-8 py-4 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold text-lg rounded-lg shadow-lg hover:opacity-90 transition-all duration-300 hover:shadow-xl"
        >
          {branding.clientConfirmationButtonText}
        </button>
      </div>
    </div>
  );
};

export default ClientTestConfirmationPage;
