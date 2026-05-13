import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BrandingContext } from '../contexts/BrandingContext';
import { type EmailSettings } from './types';
import { type StaffLayoutContext, View } from '../App'; // ZMIANA: Import View
import RichTextInput from './common/RichTextInput';
import { useToast } from '../contexts/ToastContext';
import { CogIcon } from './common/Icons'; // ZMIANA: Import CogIcon

const EmailSettingsPage = () => {
  const { onNavigate, setIsDirty, setSaveAction } = useOutletContext<StaffLayoutContext>();
  const { branding, setBranding } = useContext(BrandingContext);

  const [localSettings, setLocalSettings] = useState<Omit<EmailSettings, 'smtp'>>(branding.emailSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [initialState, setInitialState] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const { smtp, ...rest } = branding.emailSettings;
    const stringState = JSON.stringify(rest);
    setInitialState(stringState);
    setLocalSettings(JSON.parse(stringState));
  }, [branding.emailSettings]);

  useEffect(() => {
    const { smtp, ...rest } = localSettings;
    setIsDirty(initialState !== JSON.stringify(rest));
  }, [localSettings, initialState, setIsDirty]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const { smtp, ...rest } = localSettings;
    setBranding({ ...branding, emailSettings: { ...branding.emailSettings, ...rest } });
    await new Promise(resolve => setTimeout(resolve, 300));
    setInitialState(JSON.stringify(rest));
    setIsSaving(false);
    setIsDirty(false);
    showToast("Ustawienia e-mail zostały zapisane.", 'success');
    return true;
  }, [localSettings, branding, setBranding, setIsDirty, showToast]);

  useEffect(() => {
    setSaveAction({ handler: handleSave });
    return () => setSaveAction(null);
  }, [handleSave, setSaveAction]);

  const handleChange = (field: keyof Omit<EmailSettings, 'smtp'>, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const therapistEmailTags = [
    { name: 'clientIdentifier', description: 'Identyfikator klienta (np. KOD-123).' },
    { name: 'testTitle', description: 'Tytuł ukończonego testu.' },
    { name: 'completionDate', description: 'Data ukończenia testu.' },
    { name: 'therapistName', description: 'Imię i nazwisko terapeuty.' },
    { name: 'reportLink', description: 'Bezpośredni link do raportu w aplikacji.' },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Ustawienia E-mail</h1>
      <p className="opacity-80 mb-8">Skonfiguruj wysyłkę powiadomień e-mail z systemu.</p>

      <div className="bg-[var(--secondary-color)] p-8 rounded-xl shadow-lg space-y-8">
        
        {/* === ZMIANA: ZASTĄPIONO BLOKIEM PROWADZĄCYM DO NOWEJ STRONY === */}
        <div className="border-b border-[var(--border-color)] pb-6">
            <h2 className="text-2xl font-semibold mb-4">Konfiguracja serwera SMTP</h2>
            <div className="p-4 bg-slate-100 rounded-lg border-2 border-slate-200 space-y-3">
                <p className="text-sm text-slate-800">Dane serwera SMTP są konfigurowane na serwerze. Aby je zmienić, przejdź do dedykowanej strony zarządzania konfiguracją serwera.</p>
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

        <div className="border-b border-[var(--border-color)] pb-6">
          <h2 className="text-2xl font-semibold mb-4">Ustawienia Nadawcy</h2>
          <p className="text-sm opacity-70 mb-2">Te dane będą widoczne dla odbiorców wiadomości.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Nazwa nadawcy (np. Twoja Poradnia)" value={localSettings.fromName} onChange={e => handleChange('fromName', e.target.value)} className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
            <input type="email" placeholder="Adres e-mail nadawcy" value={localSettings.fromEmail} onChange={e => handleChange('fromEmail', e.target.value)} className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Szablon powiadomienia dla terapeuty</h2>
          <p className="text-sm opacity-70 mb-4">Ta wiadomość jest wysyłana do terapeuty, gdy klient ukończy test. Możesz używać dynamicznych tagów.</p>
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold mb-2">Temat wiadomości</label>
              <input
                type="text"
                value={localSettings.therapistNotificationSubject}
                onChange={e => handleChange('therapistNotificationSubject', e.target.value)}
                className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-2">Treść wiadomości</label>
              <RichTextInput
                initialValue={localSettings.therapistNotificationBody}
                onSave={value => handleChange('therapistNotificationBody', value)}
                availableTags={therapistEmailTags}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button onClick={() => onNavigate(View.AdminDashboard)} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg">Anuluj</button>
        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg disabled:bg-slate-400">
          {isSaving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
        </button>
      </div>
    </div>
  );
};

export default EmailSettingsPage;
