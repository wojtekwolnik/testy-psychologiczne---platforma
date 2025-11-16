
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BrandingContext } from '../contexts/BrandingContext';
import { type AiSettings } from './types';
import { type StaffLayoutContext, View } from '../App'; // ZMIANA: Import View
import { useToast } from '../contexts/ToastContext';
import { SparklesIcon, CogIcon } from './common/Icons'; // ZMIANA: Import CogIcon

const AiSettingsPage = () => {
  const { onNavigate, setIsDirty, setSaveAction } = useOutletContext<StaffLayoutContext>();
  const { branding, setBranding } = useContext(BrandingContext);

  const [localSettings, setLocalSettings] = useState<Omit<AiSettings, 'apiKey'>>(branding.aiSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [initialState, setInitialState] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const { apiKey, ...rest } = branding.aiSettings;
    const stringState = JSON.stringify(rest);
    setInitialState(stringState);
    setLocalSettings(JSON.parse(stringState));
  }, [branding.aiSettings]);

  useEffect(() => {
    setIsDirty(initialState !== JSON.stringify(localSettings));
  }, [localSettings, initialState, setIsDirty]);

  const handleSave = useCallback(async () => {
      setIsSaving(true);
      setBranding({ ...branding, aiSettings: { ...branding.aiSettings, ...localSettings } });
      await new Promise(resolve => setTimeout(resolve, 300)); 
      setInitialState(JSON.stringify(localSettings));
      setIsSaving(false);
      setIsDirty(false);
      showToast("Ustawienia AI zostały zapisane.", 'success');
      return true;
  }, [localSettings, branding, setBranding, setIsDirty, showToast]);

  useEffect(() => {
    setSaveAction({ handler: handleSave });
    return () => setSaveAction(null);
  }, [handleSave, setSaveAction]);

  const handleChange = (field: keyof Omit<AiSettings, 'apiKey'>, value: any) => {
    setLocalSettings(prev => ({...prev, [field]: value}));
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Ustawienia Asystenta AI</h1>
      <p className="opacity-80 mb-8">Skonfiguruj integrację z zewnętrznymi modelami językowymi, aby włączyć funkcję sugestii interpretacji dla terapeutów.</p>

      <div className="bg-[var(--secondary-color)] p-8 rounded-xl shadow-lg space-y-8">
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
                <h2 className="text-xl font-semibold">Asystent Interpretacji AI</h2>
                <p className="text-sm opacity-70">Włącz, aby umożliwić terapeutom korzystanie z sugestii AI w raportach.</p>
            </div>
            <label htmlFor="toggle-ai" className="inline-flex relative items-center cursor-pointer">
                <input type="checkbox" id="toggle-ai" className="sr-only peer" checked={localSettings.enabled} onChange={(e) => handleChange('enabled', e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
            </label>
        </div>

        {localSettings.enabled && (
            <div className="space-y-6 pt-6 border-t border-[var(--border-color)]">
                 <div>
                    <label className="block text-lg font-semibold mb-2">Dostawca AI</label>
                    <select value={localSettings.provider} onChange={(e) => handleChange('provider', e.target.value)} className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]">
                        <option value="gemini">Google Gemini</option>
                        <option value="chatgpt">OpenAI ChatGPT (Symulacja)</option>
                    </select>
                </div>
                
                {/* === ZMIANA: ZASTĄPIONO BLOKIEM PROWADZĄCYM DO NOWEJ STRONY === */}
                <div>
                    <label className="block text-lg font-semibold mb-2">Konfiguracja Klucza API</label>
                    <div className="p-4 bg-slate-100 rounded-lg border-2 border-slate-200 space-y-3">
                        <p className="text-sm text-slate-800">Klucz API jest konfigurowany na serwerze. Aby go zmienić, przejdź do dedykowanej strony zarządzania konfiguracją serwera.</p>
                        <button
                            type="button"
                            onClick={() => onNavigate(View.ServerConfig)}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
                        >
                            <CogIcon />
                            Zarządzaj Konfiguracją Serwera
                        </button>
                    </div>
                </div>
                {/* === KONIEC ZMIANY === */}

                 <div>
                    <label className="block text-lg font-semibold mb-2">Model</label>
                    <input
                        type="text"
                        placeholder="np. gemini-1.5-flash"
                        value={localSettings.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                        className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]"
                    />
                    <p className="text-xs opacity-60 mt-1">Podaj dokładną nazwę modelu, którego chcesz użyć (np. `gemini-1.5-flash` lub `gpt-4o`).</p>
                </div>
                 <div>
                    <label className="block text-lg font-semibold mb-2">Prompt Systemowy</label>
                    <textarea
                        rows={5}
                        value={localSettings.systemPrompt}
                        onChange={(e) => handleChange('systemPrompt', e.target.value)}
                        className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]"
                    />
                    <p className="text-xs opacity-60 mt-1">To jest globalna instrukcja dla AI, która określa jej rolę i zachowanie podczas generowania interpretacji.</p>
                </div>
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
                    <p className="font-bold">Gwarancja Prywatności</p>
                    <p className="text-sm">Do API wysyłane są <strong>wyłącznie zanonimizowane, zagregowane wyniki liczbowe</strong> oraz definicje skal. Żadne odpowiedzi na poszczególne pytania ani dane klienta nie opuszczają systemu.</p>
                </div>
            </div>
        )}
      </div>

       <div className="flex justify-end gap-4 mt-8">
        <button onClick={() => onNavigate(View.AdminDashboard)} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg">Anuluj</button>
        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg disabled:bg-slate-400">
            {isSaving ? 'Zapisywanie...' : 'Zapisz ustawienia AI'}
        </button>
      </div>
    </div>
  );
};

export default AiSettingsPage;
