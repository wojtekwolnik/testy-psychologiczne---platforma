import React, { useContext, useState, useEffect, useCallback } from 'react';
import { BrandingContext } from '../contexts/BrandingContext';
import { type BrandingSettings, View } from './types';
import RichTextInput from './common/RichTextInput';
import { getContrastRatio, getWcagRating, getContrastingTextColor } from '../utils/colorUtils';
import { useToast } from '../contexts/ToastContext';

const ContrastChecker: React.FC<{ color1: string; color2: string; label: string }> = ({ color1, color2, label }) => {
    const ratio = getContrastRatio(color1, color2);
    const { rating, color } = getWcagRating(ratio);
    return (
        <div className="p-2 bg-[var(--background-color)] rounded-lg text-center">
            <div className="text-sm opacity-70">{label}</div>
            <div className="font-bold">{ratio.toFixed(2)}</div>
            <div className={`font-semibold text-sm ${color}`}>{rating}</div>
        </div>
    );
};


interface BrandingSettingsProps {
  onNavigate: (view: View) => void;
  setIsDirty: (isDirty: boolean) => void;
  setSaveAction: (action: { handler: () => Promise<boolean> } | null) => void;
}

const ColorInput: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-lg font-semibold mb-2">{label}</label>
        <div className="flex items-center gap-4">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-16 h-16 p-1 border-2 border-[var(--border-color)] rounded-lg"
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg font-mono text-[var(--input-text-color)] bg-[var(--input-background-color)]"
                style={{ direction: 'ltr' }}
            />
        </div>
    </div>
);

const BrandingSettings: React.FC<BrandingSettingsProps> = ({ onNavigate, setIsDirty, setSaveAction }) => {
  const { branding, setBranding } = useContext(BrandingContext);
  const [localBranding, setLocalBranding] = useState(branding);
  const [isSaving, setIsSaving] = useState(false);
  const [initialState, setInitialState] = useState<BrandingSettings>(branding);
  const [activeTab, setActiveTab] = useState<'appearance' | 'communication'>('appearance');
  const { showToast } = useToast();

  const confirmationTags = [
      { name: 'testTitle', description: 'Tytuł testu, który rozpocznie klient.' },
      { name: 'questionCount', description: 'Całkowita liczba pytań w teście.' },
      { name: 'testDescription', description: 'Opis testu podany w edytorze.' },
  ];
  const thankYouTags = [
      { name: 'appName', description: 'Nazwa aplikacji z ustawień ogólnych.' },
  ];

  useEffect(() => {
    setInitialState(branding);
    setLocalBranding(branding);
  }, [branding]);

  useEffect(() => {
    setIsDirty(JSON.stringify(initialState) !== JSON.stringify(localBranding));
  }, [localBranding, initialState, setIsDirty]);

  const handleSave = useCallback(async () => {
      setIsSaving(true);
      setBranding(localBranding);
      await new Promise(resolve => setTimeout(resolve, 300)); 
      setInitialState(JSON.parse(JSON.stringify(localBranding)));
      setIsSaving(false);
      setIsDirty(false);
      showToast("Ustawienia brandingu zostały zapisane.", 'success');
      return true;
  }, [localBranding, setBranding, setIsDirty, showToast]);

  useEffect(() => {
    setSaveAction({ handler: handleSave });
    return () => setSaveAction(null);
  }, [handleSave, setSaveAction]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalBranding(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Wygląd i Branding</h1>
      <p className="opacity-80 mb-8">Dostosuj wygląd aplikacji i komunikację z klientem do swojej marki.</p>
      
      {/* Tabs */}
      <div className="mb-8 border-b border-[var(--border-color)]">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('appearance')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'appearance' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                Wygląd i Identyfikacja
            </button>
            <button onClick={() => setActiveTab('communication')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'communication' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                Komunikacja z Klientem
            </button>
        </nav>
      </div>


      <div className="bg-[var(--secondary-color)] p-8 rounded-xl shadow-lg space-y-8">
        {activeTab === 'appearance' && (
            <>
                {/* General Settings */}
                <div className="pb-6">
                    <h2 className="text-2xl font-semibold mb-4">Ustawienia ogólne</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold mb-2">Nazwa aplikacji</label>
                            <input
                                type="text"
                                value={localBranding.appName}
                                onChange={(e) => setLocalBranding(prev => ({ ...prev, appName: e.target.value }))}
                                className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]"
                            />
                        </div>
                        <div>
                        <label className="block text-lg font-semibold mb-2">Logo aplikacji</label>
                        <div className="flex items-center gap-4">
                            {localBranding.logoUrl && <img src={localBranding.logoUrl} alt="Podgląd logo" className="h-16 w-auto border p-1 rounded-lg bg-white" />}
                            <input
                            type="file"
                            accept="image/png, image/jpeg, image/svg+xml"
                            onChange={handleFileChange}
                            className="block w-full text-sm
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-[var(--accent-color)]/20 file:text-[var(--accent-color)]
                                hover:file:bg-[var(--accent-color)]/30"
                            />
                        </div>
                        </div>
                    </div>
                </div>

                {/* Main Color Settings */}
                <div className="border-t border-[var(--border-color)] pt-6">
                    <h2 className="text-2xl font-semibold mb-4">Główna Paleta Kolorów</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ColorInput label="Kolor Tła" value={localBranding.backgroundColor} onChange={v => setLocalBranding(prev => ({...prev, backgroundColor: v}))} />
                        <ColorInput label="Kolor Tekstu" value={localBranding.textColor} onChange={v => setLocalBranding(prev => ({...prev, textColor: v}))} />
                        <ColorInput label="Kolor Podstawowy (Główny)" value={localBranding.primaryColor} onChange={v => setLocalBranding(prev => ({...prev, primaryColor: v}))} />
                        <ColorInput label="Kolor Akcentujący" value={localBranding.accentColor} onChange={v => setLocalBranding(prev => ({...prev, accentColor: v}))} />
                    </div>
                    <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                        <h3 className="font-semibold mb-2">Kontrola kontrastu (dostępność WCAG)</h3>
                        <div className="flex flex-wrap gap-4">
                        <ContrastChecker color1={localBranding.textColor} color2={localBranding.backgroundColor} label="Tekst / Tło" />
                        <ContrastChecker color1={getContrastingTextColor(localBranding.primaryColor)} color2={localBranding.primaryColor} label="Przycisk / Tło" />
                        <ContrastChecker color1={localBranding.inputTextColor} color2={localBranding.inputBackgroundColor} label="Pole tekstowe / Tło" />
                        </div>
                    </div>
                </div>
                
                {/* Detailed Color Settings */}
                <div className="border-t border-[var(--border-color)] pt-6 mt-6">
                    <h2 className="text-2xl font-semibold mb-4">Szczegółowa Paleta Kolorów</h2>
                    <p className="text-sm opacity-70 mb-4">Dostosuj szczegółowe kolory dla zaawansowanych elementów interfejsu, takich jak pola wprowadzania, alerty i specyficzne role użytkowników.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ColorInput label="Kolor Drugorzędny (Karty)" value={localBranding.secondaryColor} onChange={v => setLocalBranding(prev => ({...prev, secondaryColor: v}))} />
                        <ColorInput label="Kolor Obramowań" value={localBranding.borderColor} onChange={v => setLocalBranding(prev => ({...prev, borderColor: v}))} />
                        
                        <ColorInput label="Tło Pól Wprowadzania" value={localBranding.inputBackgroundColor} onChange={v => setLocalBranding(prev => ({...prev, inputBackgroundColor: v}))} />
                        <ColorInput label="Tekst Pól Wprowadzania" value={localBranding.inputTextColor} onChange={v => setLocalBranding(prev => ({...prev, inputTextColor: v}))} />

                        <ColorInput label="Kolor Błędów" value={localBranding.errorColor} onChange={v => setLocalBranding(prev => ({...prev, errorColor: v}))} />
                        <ColorInput label="Kolor Ostrzeżeń" value={localBranding.warningColor} onChange={v => setLocalBranding(prev => ({...prev, warningColor: v}))} />
                        <ColorInput label="Kolor Sukcesu" value={localBranding.successColor} onChange={v => setLocalBranding(prev => ({...prev, successColor: v}))} />
                        
                        <ColorInput label="Tekst Etykiety Admina" value={localBranding.adminColor} onChange={v => setLocalBranding(prev => ({...prev, adminColor: v}))} />
                        <ColorInput label="Tło Etykiety Admina" value={localBranding.adminBackgroundColor} onChange={v => setLocalBranding(prev => ({...prev, adminBackgroundColor: v}))} />

                        <ColorInput label="Tekst Etykiety Terapeuty" value={localBranding.therapistColor} onChange={v => setLocalBranding(prev => ({...prev, therapistColor: v}))} />
                        <ColorInput label="Tło Etykiety Terapeuty" value={localBranding.therapistBackgroundColor} onChange={v => setLocalBranding(prev => ({...prev, therapistBackgroundColor: v}))} />
                    </div>
                </div>

                {/* Chart Colors */}
                <div className="border-t border-[var(--border-color)] pt-6 mt-6">
                    <h2 className="text-2xl font-semibold mb-4">Kolory Wykresów</h2>
                    <p className="text-sm opacity-70 mb-4">Zdefiniuj kolory używane w wykresach kołowych i słupkowych w raportach.</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {localBranding.chartColors.map((color, index) => (
                            <div key={index}>
                                <label className="block text-sm font-medium mb-1">Kolor {index + 1}</label>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => {
                                        const newChartColors = [...localBranding.chartColors];
                                        newChartColors[index] = e.target.value;
                                        setLocalBranding(prev => ({...prev, chartColors: newChartColors}));
                                    }}
                                    className="w-full h-12 p-1 border-2 border-[var(--border-color)] rounded-lg"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </>
        )}
        
        {activeTab === 'communication' && (
             <div className="space-y-8">
                {/* Client Page Settings */}
                <div className="border-b border-[var(--border-color)] pb-6">
                    <h2 className="text-2xl font-semibold mb-4">Strona startowa klienta</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold mb-2">Tytuł</label>
                            <RichTextInput value={localBranding.clientPageTitle} onChange={(value) => setLocalBranding(prev => ({ ...prev, clientPageTitle: value }))} />
                        </div>
                        <div>
                            <label className="block text-lg font-semibold mb-2">Opis / Instrukcje</label>
                            <RichTextInput value={localBranding.clientPageDescription} onChange={(value) => setLocalBranding(prev => ({ ...prev, clientPageDescription: value }))} />
                        </div>
                        <div>
                            <label className="block text-lg font-semibold mb-2">Tekst na przycisku</label>
                            <input
                                type="text"
                                value={localBranding.clientPageButtonText}
                                onChange={(e) => setLocalBranding(prev => ({...prev, clientPageButtonText: e.target.value}))}
                                className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]"
                            />
                        </div>
                    </div>
                </div>
                
                {/* Client Confirmation Page Settings */}
                <div className="border-b border-[var(--border-color)] pb-6">
                    <h2 className="text-2xl font-semibold mb-4">Ekran potwierdzający dla klienta</h2>
                    <p className="text-sm opacity-70 mb-4">Ten ekran wyświetla się po poprawnym wpisaniu kodu. Możesz używać dynamicznych tagów, które zostaną automatycznie podstawione.</p>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold mb-2">Tytuł</label>
                            <RichTextInput value={localBranding.clientConfirmationTitle} onChange={(value) => setLocalBranding(prev => ({ ...prev, clientConfirmationTitle: value }))} availableTags={confirmationTags} />
                        </div>
                        <div>
                            <label className="block text-lg font-semibold mb-2">Wiadomość</label>
                            <RichTextInput value={localBranding.clientConfirmationMessage} onChange={(value) => setLocalBranding(prev => ({ ...prev, clientConfirmationMessage: value }))} availableTags={confirmationTags} />
                        </div>
                        <div>
                            <label className="block text-lg font-semibold mb-2">Tekst na przycisku</label>
                            <input
                                type="text"
                                value={localBranding.clientConfirmationButtonText}
                                onChange={(e) => setLocalBranding(prev => ({...prev, clientConfirmationButtonText: e.target.value}))}
                                className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]"
                            />
                        </div>
                    </div>
                </div>

                {/* Client Thank You Page Settings */}
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Strona podziękowania</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold mb-2">Tytuł</label>
                            <RichTextInput value={localBranding.clientThankYouTitle} onChange={(value) => setLocalBranding(prev => ({ ...prev, clientThankYouTitle: value }))} availableTags={thankYouTags} />
                        </div>
                        <div>
                            <label className="block text-lg font-semibold mb-2">Wiadomość</label>
                            <RichTextInput value={localBranding.clientThankYouMessage} onChange={(value) => setLocalBranding(prev => ({ ...prev, clientThankYouMessage: value }))} availableTags={thankYouTags} />
                        </div>
                        <div>
                            <label className="block text-lg font-semibold mb-2">Tekst na przycisku</label>
                            <input
                                type="text"
                                value={localBranding.clientThankYouButtonText}
                                onChange={(e) => setLocalBranding(prev => ({...prev, clientThankYouButtonText: e.target.value}))}
                                className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg text-[var(--input-text-color)] bg-[var(--input-background-color)]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
      
       <div className="flex justify-end gap-4 mt-8">
        <button onClick={() => onNavigate(View.AdminDashboard)} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg">Anuluj</button>
        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg disabled:bg-slate-400">
            {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
        </button>
      </div>

    </div>
  );
};

export default BrandingSettings;
