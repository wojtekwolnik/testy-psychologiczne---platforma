import React, { useContext, useState, useEffect, useCallback } from 'react';
import { BrandingContext } from '../contexts/BrandingContext';
import { type AiSettings, View } from './types';
import { useToast } from '../../contexts/ToastContext';

interface AiSettingsPageProps {
  onNavigate: (view: View) => void;
  setIsDirty: (isDirty: boolean) => void;
  setSaveAction: (action: { handler: () => Promise<boolean> } | null) => void;
}

const AiSettingsPage: React.FC<AiSettingsPageProps> = ({ onNavigate, setIsDirty, setSaveAction }) => {
  const { branding, setBranding } = useContext(BrandingContext);
  const [localSettings, setLocalSettings] = useState<AiSettings>(branding.aiSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [initialState, setInitialState] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    // Deep copy for initial state comparison
    const stringState = JSON.stringify(branding.aiSettings);
    setInitialState(stringState);
    setLocalSettings(JSON.parse(stringState));
  }, [branding.aiSettings]);

  useEffect(() => {
    setIsDirty(initialState !== JSON.stringify(localSettings));
  }, [localSettings, initialState, setIsDirty]);

  const handleSave = useCallback(async () => {
      setIsSaving(true);
      setBranding({ ...branding, aiSettings: localSettings });
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

  const handleChange = (field: keyof AiSettings, value: any) => {
    setLocalSettings(prev => ({...prev, [field]: value}));
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Ustawienia Asystenta AI</h1>
      <p className="opacity-80 mb-8">Skonfiguruj integrację z zewnętrznymi modelami językowymi, aby włączyć funkcję sugestii interpretacji dla terapeutów.</p>

      <div className="bg-[var(--secondary-color)] p-8 rounded-xl shadow-lg space-y-8">
        {/* Enable/Disable Toggle */}
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

        {/* Configuration Form (shown only if enabled) */}
        {localSettings.enabled && (
            <div className="space-y-6 pt-6 border-t border-[var(--border-color)]">
                 <div>
                    <label className="block text-lg font-semibold mb-2">Dostawca AI</label>
                    <select value={localSettings.provider} onChange={(e) => handleChange('provider', e.target.value)} className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]">
                        <option value="gemini">Google Gemini</option>
                        <option value="chatgpt">OpenAI ChatGPT (Symulacja)</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-lg font-semibold mb-2">Klucz API</label>
                    <input
                        type="password"
                        placeholder="Wprowadź swój klucz API"
                        value={localSettings.apiKey}
                        onChange={(e) => handleChange('apiKey', e.target.value)}
                        className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)] font-mono"
                    />
                </div>
                 <div>
                    <label className="block text-lg font-semibold mb-2">Model</label>
                    <input
                        type="text"
                        placeholder="np. gemini-2.5-flash"
                        value={localSettings.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                        className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]"
                    />
                    <p className="text-xs opacity-60 mt-1">Podaj dokładną nazwę modelu, którego chcesz użyć (np. `gemini-2.5-flash` lub `gpt-4o`).</p>
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