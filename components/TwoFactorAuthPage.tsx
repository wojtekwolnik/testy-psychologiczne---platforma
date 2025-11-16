import React, { useState, useContext } from 'react';
import { BrandingContext } from '../contexts/BrandingContext';
import { type User } from './types'; // NOWY IMPORT

interface TwoFactorAuthPageProps {
  userToAuth: User; // ZMIANA: Przekazujemy całego użytkownika, aby mieć jego ID
  onVerify: () => void;
  onBack: () => void;
}

const TwoFactorAuthPage: React.FC<TwoFactorAuthPageProps> = ({ userToAuth, onVerify, onBack }) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false); // NOWY STAN
  const [error, setError] = useState('');
  const { branding } = useContext(BrandingContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!/^\d{6}$/.test(code)) {
      setError('Kod musi składać się z 6 cyfr.');
      return;
    }

    setIsVerifying(true);
    try {
        // TODO: Zaimplementować endpoint w apiClient.ts `verifyLogin2FA({ userId: userToAuth.id, code })`
        // Serwer używa zapisanego sekretu użytkownika do weryfikacji kodu.
        // Symulacja wywołania API
        await new Promise(resolve => setTimeout(resolve, 1000));
        const isCodeValid = true; // To będzie wynik wywołania API

        if (isCodeValid) {
            onVerify();
        } else {
            setError('Nieprawidłowy kod weryfikacyjny. Spróbuj ponownie.');
        }
    } catch (apiError) {
        setError('Wystąpił błąd serwera podczas weryfikacji kodu.');
    } finally {
        setIsVerifying(false);
        setCode(''); // Wyczyść pole po próbie
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background-color)] p-4 text-[var(--text-color)]">
      <div className="w-full max-w-md">
        <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg p-8 text-center">
          {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" className="h-16 w-auto mx-auto mb-4 object-contain" />}
          <h1 className="text-2xl font-bold mb-2">Weryfikacja dwuetapowa</h1>
          <p className="opacity-80 mb-6">Wprowadź 6-cyfrowy kod z aplikacji uwierzytelniającej dla konta <strong className='font-bold'>{userToAuth.email}</strong>.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="tel" // Użyj `tel` dla lepszej obsługi na urządzeniach mobilnych
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="w-full p-4 text-center text-2xl tracking-[.5em] font-mono border-2 border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition bg-[var(--input-background-color)] text-[var(--input-text-color)]"
              placeholder="------"
              autoFocus
              inputMode="numeric" // Klawiatura numeryczna na mobilnych
            />
            {error && <p className="text-[var(--error-color)]">{error}</p>}
            <button
              type="submit"
              disabled={isVerifying || code.length !== 6}
              className="w-full px-8 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90 disabled:bg-slate-400 transition-colors duration-300"
            >
              {isVerifying ? 'Weryfikowanie...' : 'Zweryfikuj'}
            </button>
            <button
              type="button"
              onClick={onBack}
              disabled={isVerifying}
              className="w-full text-sm opacity-80 hover:opacity-100 mt-2 disabled:opacity-50"
            >
              Powrót do logowania
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuthPage;
