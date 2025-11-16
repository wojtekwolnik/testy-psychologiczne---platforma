
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrandingContext } from '../contexts/BrandingContext';

const TwoFactorAuthPage: React.FC = () => {
  const { verify2FA, userFor2FA, isLoading, cancel2FA } = useAuth();
  const { branding } = React.useContext(BrandingContext);
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // If there is no user pending 2FA, redirect to login
    if (!userFor2FA) {
      navigate('/login');
    }
  }, [userFor2FA, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Kod musi składać się z 6 cyfr.');
      return;
    }

    try {
      await verify2FA(code);
      // On success, AuthProvider will handle navigation
    } catch (apiError: any) {
      setError(apiError.message || 'Wystąpił błąd serwera podczas weryfikacji kodu.');
      setCode(''); // Clear input on error
    }
  };

  if (!userFor2FA) {
    return null; // or a loading indicator, since the effect will redirect
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background-color)] p-4 text-[var(--text-color)]">
      <div className="w-full max-w-md">
        <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg p-8 text-center">
          {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" className="h-16 w-auto mx-auto mb-4 object-contain" />}
          <h1 className="text-2xl font-bold mb-2">Weryfikacja dwuetapowa</h1>
          <p className="opacity-80 mb-6">Wprowadź 6-cyfrowy kod z aplikacji uwierzytelniającej dla konta <strong className='font-bold'>{userFor2FA.email}</strong>.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="tel"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="w-full p-4 text-center text-2xl tracking-[.5em] font-mono border-2 border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition bg-[var(--input-background-color)] text-[var(--input-text-color)]"
              placeholder="------"
              autoFocus
              inputMode="numeric"
            />
            {error && <p className="text-[var(--error-color)]">{error}</p>}
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full px-8 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90 disabled:bg-slate-400 transition-colors duration-300"
            >
              {isLoading ? 'Weryfikowanie...' : 'Zweryfikuj'}
            </button>
            <button
              type="button"
              onClick={cancel2FA}
              disabled={isLoading}
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
