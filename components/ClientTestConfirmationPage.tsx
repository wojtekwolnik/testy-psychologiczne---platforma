import React, { useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchPublicTestForClient } from '@/app/actions/testActions';
import { type Test } from './types';
import {
  BrandingContext,
  DEFAULT_TERMS_CONSENT_CHECKBOX_TEXT,
  DEFAULT_TERMS_OF_TESTING_SUMMARY,
  DEFAULT_TERMS_OF_TESTING_TITLE,
} from '../contexts/BrandingContext';
import DOMPurify from 'isomorphic-dompurify';
import TermsOfTestingModal from './TermsOfTestingModal';

const ClientTestConfirmationPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { branding } = useContext(BrandingContext);

  const testId = searchParams.get('testId');
  const clientCode = searchParams.get('clientCode');

  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const requireConsent = branding.requireTermsConsent !== false;
  const termsTitle = branding.termsOfTestingTitle || DEFAULT_TERMS_OF_TESTING_TITLE;
  const termsSummary = branding.termsOfTestingSummary || DEFAULT_TERMS_OF_TESTING_SUMMARY;
  const rawCheckboxText = branding.termsConsentCheckboxText || DEFAULT_TERMS_CONSENT_CHECKBOX_TEXT;

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
    if (requireConsent && !hasAcceptedTerms) {
      setConsentError(true);
      return;
    }
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

  const renderCheckboxLabel = () => {
    if (rawCheckboxText.includes('{termsLink}')) {
      const [before, after] = rawCheckboxText.split('{termsLink}');
      return (
        <>
          <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(before) }} />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsTermsModalOpen(true);
            }}
            className="text-primary font-semibold underline hover:opacity-80 transition-opacity mx-0.5"
          >
            {termsTitle}
          </button>
          <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(after || '') }} />
        </>
      );
    }
    return (
      <>
        <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawCheckboxText) }} />{' '}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsTermsModalOpen(true);
          }}
          className="text-primary font-semibold underline hover:opacity-80 transition-opacity"
        >
          ({termsTitle})
        </button>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background flex flex-col items-center justify-center p-4 transition-all duration-500 text-text">
      <div className="bg-surface/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 text-center max-w-2xl w-full border border-border animate-fade-in-up my-6">
        <h1 className="text-3xl font-extrabold mb-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(branding.clientConfirmationTitle) }}></h1>
        <div className="text-text-muted text-lg leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parsedMessage) }}></div>

        <div className="bg-background/60 border border-border rounded-xl p-5 my-6 backdrop-blur-sm shadow-inner">
          <p className="text-lg font-medium">Test: <span className="text-primary font-bold">{test.title}</span></p>
          <p className="text-text-muted mt-1.5">Liczba pytań: <span className="font-semibold text-text">{questionCount}</span></p>
        </div>

        {/* Terms of Testing Summary Box */}
        {termsSummary && (
          <div className="bg-background/40 border border-border/80 rounded-2xl p-5 my-6 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-border/60">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                Zasady i charakter badania
              </h2>
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Pełne {termsTitle} →
              </button>
            </div>
            <div
              className="text-xs sm:text-sm text-text-muted leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-text"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(termsSummary) }}
            />
          </div>
        )}

        {/* Consent Checkbox */}
        {requireConsent && (
          <div className="my-6 text-left">
            <label
              className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                hasAcceptedTerms
                  ? 'bg-primary/10 border-primary'
                  : consentError
                  ? 'bg-error/10 border-error'
                  : 'bg-background/60 border-border hover:border-primary/60'
              }`}
            >
              <input
                type="checkbox"
                checked={hasAcceptedTerms}
                onChange={(e) => {
                  setHasAcceptedTerms(e.target.checked);
                  if (e.target.checked) setConsentError(false);
                }}
                className="mt-1 h-5 w-5 rounded accent-[var(--primary-color)] shrink-0 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-text leading-relaxed">
                {renderCheckboxLabel()}
              </span>
            </label>
            {consentError && (
              <p className="text-xs text-error font-semibold mt-2 text-center" role="alert">
                Aby rozpocząć badanie, potwierdź zapoznanie się z warunkami wykonywania badań.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button
            onClick={handleStart}
            disabled={requireConsent && !hasAcceptedTerms}
            className="w-full max-w-sm mx-auto px-8 py-4 bg-primary text-primary-contrast font-bold text-lg rounded-xl shadow-lg hover:shadow-primary/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
          >
            {branding.clientConfirmationButtonText}
          </button>
        </div>
      </div>

      <footer className="text-center text-xs text-text-muted space-y-1 pb-4">
        <button
          type="button"
          onClick={() => setIsTermsModalOpen(true)}
          className="text-primary hover:underline font-semibold"
        >
          {termsTitle}
        </button>
      </footer>

      <TermsOfTestingModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
    </div>
  );
};

export default ClientTestConfirmationPage;
