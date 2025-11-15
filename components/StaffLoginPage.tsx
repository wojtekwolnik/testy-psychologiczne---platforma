
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrandingContext } from '../contexts/BrandingContext';

export const StaffLoginPage: React.FC = () => {
  const { branding } = useContext(BrandingContext);
  const auth = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Usunięto lokalny stan `isLoading`, będziemy używać `auth.isLoading` z kontekstu.
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        setError('Proszę wypełnić wszystkie pola.');
        return;
    }
    setError(null);
    try {
      // Nie potrzebujemy już setIsLoading(true), ponieważ kontekst będzie tym zarządzał
      await auth.login(email, password);
      // Nawigacja w przypadku sukcesu jest obsługiwana przez AuthProvider, więc tu nic więcej nie robimy.
    } catch (err: any) {
      // Łapiemy błąd rzucony przez funkcję login
      setError(err.message || 'Wystąpił nieznany błąd.');
      // Nie potrzebujemy setIsLoading(false), kontekst powinien to obsłużyć
    }
  };

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

                {error && <p role="alert" className="text-[var(--error-color)] text-sm text-center">{error}</p>}

                <button
                    type="submit"
                    disabled={auth.isLoading} // Używamy stanu `isLoading` z kontekstu
                    className="w-full px-8 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300"
                >
                    {auth.isLoading ? "Logowanie..." : "Zaloguj się"}
                </button>
            </form>
        </main>
        
        <button onClick={() => navigate('/')} className="mt-8 opacity-80 hover:text-[var(--primary-color)] font-semibold transition-colors">
            &larr; Powrót do strony klienta
        </button>
    </div>
    </div>
  );
};
