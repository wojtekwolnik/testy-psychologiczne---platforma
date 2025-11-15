import React, { useState, useContext } from 'react';
import { View } from './types';
import { BrandingContext } from '../contexts/BrandingContext';

interface StaffLoginPageProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onNavigate: (view: View) => void;
}

export const StaffLoginPage: React.FC<StaffLoginPageProps> = ({ onLogin, onNavigate }) => {
  const { branding } = useContext(BrandingContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        setError('Proszę wypełnić wszystkie pola.');
        return;
    }
    setIsLoading(true);
    setError(null);
    const loginError = await onLogin(email, password);
    if (loginError) {
        setError(loginError);
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background-color)] p-4 text-[var(--text-color)]">
      <div className="w-full max-w-sm">
        <header className="text-center mb-8">
            {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" className="h-16 w-auto mx-auto mb-4 object-contain" />}
            <h1 className="text-4xl font-extrabold tracking-tight">
                Logowanie personelu
            </h1>
            <p className="mt-2 text-lg opacity-80">
                Zaloguj się do <span className="font-bold text-[var(--primary-color)]">{branding.appName}</span>
            </p>
        </header>

        <main className="bg-[var(--secondary-color)] rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">Adres email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition bg-[var(--input-background-color)] text-[var(--input-text-color)]"
                    />
                </div>
                <div>
                    <label htmlFor="password"  className="block text-sm font-medium mb-1">Hasło</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition bg-[var(--input-background-color)] text-[var(--input-text-color)]"
                    />
                </div>

                {error && <p className="text-[var(--error-color)] text-sm text-center">{error}</p>}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-8 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300"
                >
                    {isLoading ? "Logowanie..." : "Zaloguj się"}
                </button>
            </form>
        </main>
        
        <button onClick={() => onNavigate(View.ClientCodeEntry)} className="mt-8 opacity-80 hover:text-[var(--primary-color)] font-semibold transition-colors">
            &larr; Powrót do strony klienta
        </button>
    </div>
  );
};
