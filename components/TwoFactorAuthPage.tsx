import React, { useState, useContext } from 'react';
import { BrandingContext } from '../contexts/BrandingContext';

interface TwoFactorAuthPageProps {
  onVerify: () => void;
  onBack: () => void;
}

const TwoFactorAuthPage: React.FC<TwoFactorAuthPageProps> = ({ onVerify, onBack }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { branding } = useContext(BrandingContext);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Demo logic: accept any 6-digit code.
    if (/^\d{6}$/.test(code)) {
      onVerify();
    } else {
      setError('Kod musi składać się z 6 cyfr.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background-color)] p-4 text-[var(--text-color)]">
      <div className="w-full max-w-md">
        <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg p-8 text-center">
          {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" className="h-16 w-auto mx-auto mb-4 object-contain" />}
          <h1 className="text-2xl font-bold mb-2">Weryfikacja dwuetapowa</h1>
          <p className="opacity-80 mb-6">Wprowadź 6-cyfrowy kod z aplikacji uwierzytelniającej.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="w-full p-4 text-center text-2xl tracking-[.5em] font-mono border-2 border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition bg-[var(--input-background-color)] text-[var(--input-text-color)]"
              placeholder="------"
              autoFocus
            />
            {error && <p className="text-[var(--error-color)]">{error}</p>}
            <button
              type="submit"
              className="w-full px-8 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90 disabled:bg-slate-400 transition-colors duration-300"
            >
              Zweryfikuj
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full text-sm opacity-80 hover:opacity-100 mt-2"
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
