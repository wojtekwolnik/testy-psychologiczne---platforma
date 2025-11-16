
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
  const [jwtSecret, setJwtSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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

  const generateSecret = () => {
      const array = new Uint32Array(16);
      window.crypto.getRandomValues(array);
      const secret = Array.from(array, dec => ('0' + dec.toString(16)).substr(-8)).join('');
      setJwtSecret(secret);
      toast.success("Wygenerowano bezpieczny sekret!", { autoClose: 2000 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Hasła nie są takie same.");
    }
    if (password.length < 8) {
      return toast.error("Hasło musi mieć co najmniej 8 znaków.");
    }
    if (jwtSecret.length < 32) {
      return toast.error("JWT Secret jest wymagany i musi mieć co najmniej 32 znaki.");
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            admin: { email, password },
            jwtSecret,
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
       if (errorMessage.includes('Setup already completed')) {
        toast.warn("Konfiguracja została już wcześniej zakończona. Przekierowuję do logowania.");
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
                To jednorazowy proces, który pozwoli Ci uruchomić i zabezpieczyć Twoją aplikację.
            </p>
            <div className="space-y-4 text-slate-300">
                 <div>
                    <h3 className="font-semibold text-lg text-indigo-300 mb-2">1. Klucz Bezpieczeństwa</h3>
                    <p className='text-sm'>Wygeneruj i zapisz `JWT_SECRET` w pliku .env. Jest on niezbędny do zabezpieczenia sesji użytkowników i prawidłowego działania aplikacji.</p>
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-indigo-300 mb-2">2. Konto Administratora</h3>
                    <p className='text-sm'>Utwórz pierwsze konto administratora, które będzie służyło do zarządzania całym systemem.</p>
                </div>
                 <div>
                    <h3 className="font-semibold text-lg text-indigo-300 mb-2">3. Usługi Zewnętrzne (Opcjonalne)</h3>
                    <p className='text-sm'>Możesz od razu skonfigurować wysyłkę e-maili (SMTP) oraz integrację z AI. Wprowadzone tu dane zostaną zapisane w pliku `.env` na serwerze.</p>
                </div>
            </div>
        </div>

        <div className="w-full md:w-1/2 p-8 overflow-y-auto" style={{maxHeight: '95vh'}}>
          <h1 className="text-3xl font-bold text-slate-800 mb-6">Zakończ Konfigurację</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* --- SEKCJA KLUCZY --- */}
            <div className='p-4 bg-indigo-50 rounded-lg border border-indigo-200 space-y-4'>
                <p className='text-sm text-indigo-800 font-semibold'>Krok 1: Klucz Bezpieczeństwa Sesji</p>
                <div>
                  <label className="block text-sm font-bold text-slate-700">Sekret Sesji (JWT Secret)</label>
                  <div className="flex gap-2 mt-1">
                    <input type="text" value={jwtSecret} onChange={(e) => setJwtSecret(e.target.value)} required minLength={32} className="block w-full px-4 py-2 border border-slate-300 rounded-md" placeholder="Wklej lub wygeneruj sekret..." />
                    <button type="button" onClick={generateSecret} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 text-nowrap">Generuj</button>
                  </div>
                  <p className='text-xs text-slate-500 mt-1'>Kluczowy dla bezpieczeństwa, musi mieć min. 32 znaki. Zostanie zapisany w pliku .env.</p>
                </div>
            </div>

            {/* --- SEKCJA ADMINA --- */}
            <div className='p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4'>
                 <p className='text-sm text-slate-800 font-semibold'>Krok 2: Konto Administratora</p>
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
            </div>

            {/* --- SEKCJE OPCJONALNE --- */}
            <CollapsibleSection title="Krok 3: E-mail i AI (Opcjonalne)">
                 <input type="text" name="host" placeholder="Host SMTP" value={smtpConfig.host} onChange={handleSmtpChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                 <input type="text" name="port" placeholder="Port SMTP" value={smtpConfig.port} onChange={handleSmtpChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                 <input type="text" name="user" placeholder="Użytkownik SMTP" value={smtpConfig.user} onChange={handleSmtpChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                 <input type="password" name="pass" placeholder="Hasło SMTP" value={smtpConfig.pass} onChange={handleSmtpChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                 <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="secure" checked={smtpConfig.secure} onChange={handleSmtpChange} /> Użyj połączenia SSL/TLS</label>
                 <hr/>
                <select name="provider" value={aiConfig.provider} onChange={handleAiChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md bg-white">
                    <option value="gemini">Google Gemini</option>
                </select>
                 <input type="password" name="apiKey" placeholder="Klucz API dostawcy AI" value={aiConfig.apiKey} onChange={handleAiChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                 <input type="text" name="model" placeholder="Nazwa modelu (np. gemini-1.5-flash)" value={aiConfig.model} onChange={handleAiChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
            </CollapsibleSection>

            <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 transition-colors">
              {isSubmitting ? 'Zapisywanie konfiguracji...' : 'Zakończ i Zapisz'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
