
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const SetupWizard: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Hasła nie są takie same.");
      return;
    }
    if (password.length < 8) {
      toast.error("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, setupKey }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Nie można odczytać odpowiedzi serwera.' }));
        throw new Error(errorData.error || `Błąd serwera: ${response.status}`);
      }

      toast.success("Konto administratora zostało utworzone! Możesz się teraz zalogować.");
      navigate('/login');
    } catch (error: any) {
      const errorMessage = error.message || "Wystąpił nieznany błąd.";
      if (errorMessage.includes('Invalid setup key')) {
        toast.error("Nieprawidłowy klucz konfiguracyjny. Sprawdź zmienną środowiskową SETUP_KEY.");
      } else if (errorMessage.includes('already exists')) {
        toast.error("Konfiguracja została już zakończona. Aplikacja jest gotowa do użytku.");
        navigate('/login');
      } else {
        toast.error(`Błąd: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl flex overflow-hidden">

        {/* Left Side - Instructions */}
        <div className="hidden md:block w-1/2 bg-slate-800 text-white p-8">
          <h2 className="text-2xl font-bold text-indigo-400 mb-4">Witaj w Kreatorze Konfiguracji</h2>
          <p className="text-slate-300 mb-6">
            Wygląda na to, że jest to pierwsze uruchomienie aplikacji. Aby rozpocząć, musimy utworzyć konto głównego administratora.
          </p>
          <div className="space-y-4 text-slate-300">
            <div>
                <h3 className="font-semibold text-lg text-indigo-300 mb-2">Krok 1: Znajdź swój Klucz Konfiguracyjny</h3>
                <p className='text-sm'>
                    Ze względów bezpieczeństwa, proces ten wymaga podania jednorazowego <strong>Klucza Konfiguracyjnego (Setup Key)</strong>. Klucz ten jest mechanizmem obronnym, który gwarantuje, że tylko osoba z dostępem do serwera może utworzyć pierwsze konto.
                </p>
                 <p className='text-sm mt-2'>
                    Klucz ten musi być ustawiony w <strong>zmiennych środowiskowych</strong> na serwerze, na którym uruchomiona jest aplikacja. Znajdź plik `.env` (lub analogiczny dla Twojej platformy hostingowej) i odszukaj zmienną o nazwie:
                </p>
                <div className="my-3 p-3 bg-slate-900 rounded-lg font-mono text-sm text-yellow-300">
                    SETUP_KEY="twoj-super-tajny-klucz-123"
                </div>
                 <p className='text-sm'>Skopiuj wartość tej zmiennej.</p>
            </div>
             <div>
                <h3 className="font-semibold text-lg text-indigo-300 mb-2">Krok 2: Wypełnij formularz</h3>
                <p className='text-sm'>
                    Użyj skopiowanego klucza oraz podaj adres e-mail i hasło dla nowego konta administratora. To konto będzie miało pełne uprawnienia do zarządzania aplikacją.
                </p>
            </div>
              <div>
                <h3 className="font-semibold text-lg text-indigo-300 mb-2">Krok 3: Zaloguj się</h3>
                <p className='text-sm'>
                   Po pomyślnym utworzeniu konta, zostaniesz przekierowany na stronę logowania. Twoja aplikacja będzie gotowa do pracy!
                </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-6">Utwórz Konto Administratora</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">Adres e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="admin@twojafirma.pl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Hasło</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Minimum 8 znaków"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Potwierdź hasło</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
             <div>
              <label className="block text-sm font-bold text-indigo-700">Klucz Konfiguracyjny (Setup Key)</label>
              <input
                type="text"
                value={setupKey}
                onChange={(e) => setSetupKey(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2 border-2 border-indigo-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-indigo-50"
                placeholder="Wklej klucz ze zmiennych środowiskowych"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 transition-colors"
            >
              {isSubmitting ? 'Tworzenie konta...' : 'Zakończ Konfigurację'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
