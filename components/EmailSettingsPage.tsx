import React, { useContext, useState, useEffect, useCallback } from 'react';
import { BrandingContext } from '../contexts/BrandingContext';
import { type EmailSettings, View } from './types';
import RichTextInput from './common/RichTextInput';
import { useToast } from '../contexts/ToastContext';

interface EmailSettingsPageProps {
  onNavigate: (view: View) => void;
  setIsDirty: (isDirty: boolean) => void;
  setSaveAction: (action: { handler: () => Promise<boolean> } | null) => void;
}

const EmailSettingsPage: React.FC<EmailSettingsPageProps> = ({ onNavigate, setIsDirty, setSaveAction }) => {
  const { branding, setBranding } = useContext(BrandingContext);
  const [localSettings, setLocalSettings] = useState<EmailSettings>(branding.emailSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [initialState, setInitialState] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const stringState = JSON.stringify(branding.emailSettings);
    setInitialState(stringState);
    setLocalSettings(JSON.parse(stringState));
  }, [branding.emailSettings]);

  useEffect(() => {
    setIsDirty(initialState !== JSON.stringify(localSettings));
  }, [localSettings, initialState, setIsDirty]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setBranding({ ...branding, emailSettings: localSettings });
    await new Promise(resolve => setTimeout(resolve, 300));
    setInitialState(JSON.stringify(localSettings));
    setIsSaving(false);
    setIsDirty(false);
    showToast("Ustawienia e-mail zostały zapisane.", 'success');
    return true;
  }, [localSettings, branding, setBranding, setIsDirty, showToast]);

  useEffect(() => {
    setSaveAction({ handler: handleSave });
    return () => setSaveAction(null);
  }, [handleSave, setSaveAction]);

  const handleChange = (field: keyof EmailSettings | keyof EmailSettings['smtp'], value: any, isSmtp: boolean = false) => {
    setLocalSettings(prev => {
      if (isSmtp) {
        return { ...prev, smtp: { ...prev.smtp, [field as keyof EmailSettings['smtp']]: value } };
      }
      return { ...prev, [field as keyof EmailSettings]: value };
    });
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
        <div className="border-b border-[var(--border-color)] pb-6">
          <h2 className="text-2xl font-semibold mb-4">Konfiguracja serwera SMTP</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Host SMTP" value={localSettings.smtp.host} onChange={e => handleChange('host', e.target.value, true)} className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
            <input type="number" placeholder="Port" value={localSettings.smtp.port} onChange={e => handleChange('port', parseInt(e.target.value) || 0, true)} className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
            <input type="text" placeholder="Użytkownik" value={localSettings.smtp.username} onChange={e => handleChange('username', e.target.value, true)} className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
            <input type="password" placeholder="Hasło" value={localSettings.smtp.password} onChange={e => handleChange('password', e.target.value, true)} className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={localSettings.smtp.secure} onChange={e => handleChange('secure', e.target.checked, true)} className="h-4 w-4 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                <span>Użyj bezpiecznego połączenia (SSL/TLS)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="border-b border-[var(--border-color)] pb-6">
          <h2 className="text-2xl font-semibold mb-4">Ustawienia Nadawcy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Nazwa nadawcy" value={localSettings.fromName} onChange={e => handleChange('fromName', e.target.value)} className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]" />
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
                value={localSettings.therapistNotificationBody}
                onChange={value => handleChange('therapistNotificationBody', value)}
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
