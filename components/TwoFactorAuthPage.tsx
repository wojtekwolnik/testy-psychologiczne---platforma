import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheckIcon } from './common/Icons';

const TwoFactorAuthPage = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const { verify2FA, cancel2FA, userFor2FA, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if no user pending 2FA
  useEffect(() => {
    if (!userFor2FA && !isLoading) {
      router.push('/login');
    }
  }, [userFor2FA, isLoading, router]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newCode = [...code];
    newCode[index] = element.value;
    setCode(newCode);

    // Auto-focus next input
    if (element.nextSibling && element.value !== '') {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleBackspace = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const inputs = document.querySelectorAll('input[name="auth-code"]');
      if (inputs[index - 1]) (inputs[index - 1] as HTMLInputElement).focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError("Wprowadź pełny 6-cyfrowy kod.");
      return;
    }

    try {
      await verify2FA(fullCode);
      // Success is handled by context (redirect)
    } catch (err: any) {
      setError(err?.message || "Błąd weryfikacji dwuetapowej.");
    }
  };

  if (!userFor2FA) return null; // Or loader

  return (
    <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-indigo-600">
            <ShieldCheckIcon />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-color)]">Weryfikacja dwuetapowa</h1>
          <p className="text-sm text-slate-500 mt-2">
            Wprowadź 6-cyfrowy kod z aplikacji uwierzytelniającej, aby zalogować się jako <strong>{userFor2FA.email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                name="auth-code"
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(e.target, index)}
                onKeyDown={e => handleBackspace(e, index)}
                className="w-12 h-14 text-center text-2xl font-bold border rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Weryfikacja...' : 'Zaloguj się'}
            </button>
            <button
              type="button"
              onClick={cancel2FA}
              className="w-full py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorAuthPage;
