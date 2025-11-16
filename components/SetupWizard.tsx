
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className='border-t pt-4'>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full text-left flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && <div className="mt-4 space-y-4">{children}</div>}
        </div>
    );
}

const SetupWizard: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // NOWE STANY DLA KONFIGURACJI ZAAWANSOWANEJ
  const [smtpConfig, setSmtpConfig] = useState({ host: '', port: '', user: '', pass: '', secure: false });
  const [aiConfig, setAiConfig] = useState({ apiKey: '', provider: 'gemini', model: 'gemini-1.5-flash' });

  const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setSmtpConfig(prev => ({...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleAiChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setAiConfig(prev => ({...prev, [name]: value }))
  }

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
        headers: { 'Content-Type': 'application/json' },
        // ZMIANA: Wysyłamy teraz dodatkowe dane konfiguracyjne
        body: JSON.stringify({ 
            email, 
            password, 
            setupKey, 
            smtp: smtpConfig.host ? smtpConfig : undefined, 
            ai: aiConfig.apiKey ? aiConfig : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Nie można odczytać odpowiedzi serwera.' }));
        throw new Error(errorData.error || `Błąd serwera: ${response.status}`);
      }

      toast.success("Konfiguracja zakończona pomyślnie! Możesz się teraz zalogować.");
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
        <div className="hidden md:block w-1/2 bg-slate-800 text-white p-8 overflow-y-auto" style={{maxHeight: '95vh'}}>
           <h2 className="text-2xl font-bold text-indigo-400 mb-4">Witaj w Kreatorze Konfiguracji</h2>
            <p className="text-slate-300 mb-6">
                To jednorazowy proces, który pozwoli Ci uruchomić aplikację. Utworzymy konto administratora i opcjonalnie skonfigurujemy usługi zewnętrzne.
            </p>
            <div className="space-y-4 text-slate-300">
                 <div>
                    <h3 className="font-semibold text-lg text-indigo-300 mb-2">Dane Podstawowe</h3>
                    <p className='text-sm'>Podaj klucz konfiguracyjny `SETUP_KEY` ze zmiennych środowiskowych serwera oraz utwórz pierwsze konto administratora.</p>
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-indigo-300 mb-2">Konfiguracja Opcjonalna</h3>
                    <p className='text-sm'>Możesz od razu skonfigurować wysyłkę e-maili (SMTP) oraz integrację z AI. Jeśli pominiesz ten krok, te usługi nie będą dostępne i będzie trzeba je skonfigurować później manualnie na serwerze.</p>
                    <p className="text-xs mt-2 p-2 bg-yellow-900/50 text-yellow-300 rounded-md">Wprowadzone tu dane (hasło SMTP, klucz API) zostaną zapisane w pliku `.env` na serwerze i nie będą później widoczne w panelu administracyjnym.</p>
                </div>
                 <div>
                    <h3 className="font-semibold text-lg text-indigo-300 mb-2">Zakończenie</h3>
                    <p className='text-sm'>Po pomyślnym utworzeniu konta, zostaniesz przekierowany na stronę logowania. Twoja aplikacja będzie gotowa do pracy!</p>
                </div>
            </div>
        </div>

        <div className="w-full md:w-1/2 p-8 overflow-y-auto" style={{maxHeight: '95vh'}}>
          <h1 className="text-3xl font-bold text-slate-800 mb-6">Zakończ Konfigurację</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700">Adres e-mail Administratora</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" placeholder="admin@twojafirma.pl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Hasło (min. 8 znaków)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Potwierdź hasło</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-bold text-indigo-700">Klucz Konfiguracyjny (Setup Key)</label>
              <input type="text" value={setupKey} onChange={(e) => setSetupKey(e.target.value)} required className="mt-1 block w-full px-4 py-2 border-2 border-indigo-300 rounded-md bg-indigo-50" placeholder="Wklej klucz ze zmiennych środowiskowych" />
            </div>
            
            {/* SEKCJA SMTP */}
            <CollapsibleSection title="Konfiguracja Wysyłki E-mail (Opcjonalne)">
                 <input type="text" name="host" placeholder="Host SMTP" value={smtpConfig.host} onChange={handleSmtpChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                 <input type="text" name="port" placeholder="Port SMTP" value={smtpConfig.port} onChange={handleSmtpChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                 <input type="text" name="user" placeholder="Użytkownik SMTP" value={smtpConfig.user} onChange={handleSmtpChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                 <input type="password" name="pass" placeholder="Hasło SMTP" value={smtpConfig.pass} onChange={handleSmtpChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                 <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="secure" checked={smtpConfig.secure} onChange={handleSmtpChange} /> Użyj połączenia SSL/TLS</label>
            </CollapsibleSection>

            {/* SEKCJA AI */}
            <CollapsibleSection title="Konfiguracja Asystenta AI (Opcjonalne)">
                <select name="provider" value={aiConfig.provider} onChange={handleAiChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md bg-white">
                    <option value="gemini">Google Gemini</option>
                    <option value="chatgpt">OpenAI ChatGPT (Symulacja)</option>
                </select>
                 <input type="password" name="apiKey" placeholder="Klucz API dostawcy AI" value={aiConfig.apiKey} onChange={handleAiChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                 <input type="text" name="model" placeholder="Nazwa modelu (np. gemini-1.5-flash)" value={aiConfig.model} onChange={handleAiChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
            </CollapsibleSection>

            <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 transition-colors">
              {isSubmitting ? 'Zapisywanie konfiguracji...' : 'Zakończ Konfigurację'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
