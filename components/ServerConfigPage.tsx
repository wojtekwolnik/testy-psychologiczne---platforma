
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { type StaffLayoutContext } from '../App';
import { KeyIcon, LockClosedIcon, CheckCircleIcon } from './common/Icons';

// Kopia sekcji z kreatora, aby zachować spójność
const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
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

const ServerConfigPage: React.FC = () => {
  const { onNavigate } = useOutletContext<StaffLayoutContext>();
  const { showToast } = useToast();

  const [setupKey, setSetupKey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [smtpConfig, setSmtpConfig] = useState({ host: '', port: '', user: '', pass: '', secure: false });
  const [aiConfig, setAiConfig] = useState({ apiKey: '', provider: 'gemini', model: '' });

  const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setSmtpConfig(prev => ({...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleAiChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setAiConfig(prev => ({...prev, [name]: value }))
  }

  const handleUnlock = async () => {
      setIsVerifying(true);
      try {
          // TODO: Zaimplementować endpoint w apiClient.ts `verifySetupKey(setupKey)`
          // Serwer sprawdza, czy klucz się zgadza i zwraca 200 OK lub 401 Unauthorized
          await new Promise(r => setTimeout(r, 500)); // Symulacja
          if (setupKey === 'dummy-key-for-testing') { // Symulacja poprawnego klucza
              setIsUnlocked(true);
              showToast('Dostęp odblokowany.', 'success');
          } else {
              throw new Error('Nieprawidłowy klucz konfiguracyjny.');
          }
      } catch (error: any) {
          showToast(error.message, 'error');
      } finally {
          setIsVerifying(false);
      }
  }

  const handleSaveChanges = async () => {
      setIsSaving(true);
       try {
          // TODO: Zaimplementować endpoint w apiClient.ts `updateServerConfig({ setupKey, smtp: ..., ai: ...})`
          // Serwer weryfikuje klucz PONOWNIE, a następnie aktualizuje plik .env
          await new Promise(r => setTimeout(r, 1500)); 
          showToast('Konfiguracja serwera została zaktualizowana.', 'success');
          // Opcjonalnie: można wylogować admina lub odświeżyć aplikację
          onNavigate('/admin/dashboard');
      } catch (error: any) {
          showToast(`Błąd zapisu: ${error.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  }

  if (!isUnlocked) {
      return (
          <div className="p-8 max-w-lg mx-auto mt-10 bg-white rounded-xl shadow-lg border">
              <div className="flex flex-col items-center text-center">
                  <LockClosedIcon className="w-16 h-16 text-slate-400 mb-4" />
                  <h1 className="text-2xl font-bold mb-2">Strefa Chroniona</h1>
                  <p className="text-slate-600 mb-6">Aby zmodyfikować konfigurację serwera (SMTP, Klucze API), musisz potwierdzić dostęp, podając jednorazowy klucz konfiguracyjny.</p>
                  <div className="w-full space-y-2">
                      <label className="font-semibold text-slate-700">Klucz Konfiguracyjny (SETUP_KEY)</label>
                      <input 
                          type="password"
                          value={setupKey}
                          onChange={e => setSetupKey(e.target.value)}
                          placeholder="Wklej klucz ze zmiennych środowiskowych"
                          className="w-full p-3 border-2 border-slate-300 rounded-lg text-center font-mono"
                      />
                      <button
                          onClick={handleUnlock}
                          disabled={isVerifying || !setupKey}
                          className="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 flex items-center justify-center gap-2"
                      >
                          <KeyIcon />
                          {isVerifying ? 'Weryfikowanie...' : 'Odblokuj Dostęp'}
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  return (
       <div className="p-8 max-w-3xl mx-auto">
            <div className='text-center mb-8'>
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-4xl font-bold mb-2">Zarządzanie Konfiguracją Serwera</h1>
                <p className="opacity-80">Dostęp został autoryzowany. Możesz teraz zaktualizować ustawienia serwera.</p>
                 <p className="text-xs mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md max-w-lg mx-auto">Zmiany zostaną zapisane w pliku <code className='font-mono'>.env</code> na serwerze. Po zapisaniu zalecane jest ponowne uruchomienie aplikacji.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg space-y-5 border">
                 {/* SEKCJA SMTP */}
                <CollapsibleSection title="Konfiguracja Wysyłki E-mail (SMTP)" defaultOpen={true}>
                    <p className="text-sm text-slate-600 mb-2">Wprowadź nowe dane. Pozostawienie wszystkich pól pustych dezaktywuje usługę.</p>
                    <input type="text" name="host" placeholder="Host SMTP" value={smtpConfig.host} onChange={handleSmtpChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                    <input type="text" name="port" placeholder="Port SMTP" value={smtpConfig.port} onChange={handleSmtpChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                    <input type="text" name="user" placeholder="Użytkownik SMTP" value={smtpConfig.user} onChange={handleSmtpChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                    <input type="password" name="pass" placeholder="Hasło SMTP" value={smtpConfig.pass} onChange={handleSmtpChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="secure" checked={smtpConfig.secure} onChange={handleSmtpChange} /> Użyj połączenia SSL/TLS</label>
                </CollapsibleSection>

                {/* SEKCJA AI */}
                <CollapsibleSection title="Konfiguracja Asystenta AI" defaultOpen={true}>
                     <p className="text-sm text-slate-600 mb-2">Wprowadź nowe dane. Pozostawienie klucza API pustym dezaktywuje usługę.</p>
                    <select name="provider" value={aiConfig.provider} onChange={handleAiChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md bg-white">
                        <option value="gemini">Google Gemini</option>
                        <option value="chatgpt">OpenAI ChatGPT (Symulacja)</option>
                    </select>
                    <input type="password" name="apiKey" placeholder="Nowy Klucz API" value={aiConfig.apiKey} onChange={handleAiChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                    <input type="text" name="model" placeholder="Nazwa modelu (np. gemini-1.5-flash)" value={aiConfig.model} onChange={handleAiChange} className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md" />
                </CollapsibleSection>

                <div className="flex justify-end gap-4 pt-4 border-t">
                    <button type="button" onClick={() => onNavigate('/admin/dashboard')} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg">Anuluj</button>
                    <button
                        type="button"
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="w-full sm:w-auto flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-400"
                        >
                        {isSaving ? 'Zapisywanie na serwerze...' : 'Zapisz i Zastąp Konfigurację'}
                    </button>
                </div>
            </div>
       </div>
  )

}

export default ServerConfigPage;
