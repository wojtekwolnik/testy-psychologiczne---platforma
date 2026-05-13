
import React, { useContext, useState, useEffect, useRef } from 'react';
import { BrandingContext, lightTheme, darkTheme } from '../contexts/BrandingContext';
import { type BrandingSettings } from '../components/types';
import { getContrastRatio, getWcagRating, getContrastingTextColor } from '../utils/colorUtils';
import { useToast } from '../contexts/ToastContext';
import RichTextInput from './common/RichTextInput';

// --- Helper & Sub-components --- //
const ColorInput: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium mb-1 text-slate-700">{label}</label>
        <div className="flex items-center gap-2">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-10 h-10 p-0 border-0 rounded-full cursor-pointer overflow-hidden"
                style={{ backgroundColor: value }} 
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md font-mono text-sm bg-white"
            />
        </div>
    </div>
);

const ContrastChecker: React.FC<{ color1: string; color2: string; label: string }> = ({ color1, color2, label }) => {
    const ratio = getContrastRatio(color1, color2);
    const { rating, color } = getWcagRating(ratio);
    return (
        <div className="p-2 bg-slate-100 rounded-lg text-center flex-1 min-w-[80px]">
            <div className="text-xs opacity-70">{label}</div>
            <div className="font-bold text-slate-800">{ratio.toFixed(2)}</div>
            <div className={`font-semibold text-xs ${color}`}>{rating}</div>
        </div>
    );
};

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className='bg-white p-4 rounded-lg shadow-sm border'>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left flex justify-between items-center">
                <h2 className="text-xl font-semibold">{title}</h2>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
                <div className="mt-4 space-y-4 pt-4 border-t">
                    {children}
                </div>
            )}
        </div>
    );
}

// --- Live Preview Pane --- //
const LivePreview: React.FC<{ settings: BrandingSettings }> = ({ settings }) => {
    const contrastPrimaryText = getContrastingTextColor(settings.primaryColor);
    const contrastErrorText = getContrastingTextColor(settings.errorColor);
    const contrastSuccessText = getContrastingTextColor(settings.successColor);
    const contrastWarningText = getContrastingTextColor(settings.warningColor);

    const alertBaseStyle: React.CSSProperties = {
        padding: '0.75rem 1rem',
        borderRadius: `${settings.borderRadius}rem`,
        border: `1px solid transparent`,
        fontSize: '0.875rem',
    };

    const badgeBaseStyle: React.CSSProperties = {
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
    };

    return (
        <div 
            className="p-6 rounded-xl shadow-inner-lg w-full h-full transition-colors duration-200"
            style={{ backgroundColor: settings.backgroundColor, fontFamily: settings.fontFamily }}
        >
            <h3 className="text-xl font-bold mb-4 border-b pb-2" style={{ color: settings.textColor, borderColor: settings.borderColor }}>Podgląd na żywo</h3>
            
            <div className="space-y-4 mt-4">
                <button
                    className="w-full font-bold py-2 px-4 transition-all duration-200"
                    style={{
                        backgroundColor: settings.primaryColor,
                        color: contrastPrimaryText,
                        borderRadius: `${settings.borderRadius}rem`,
                        boxShadow: settings.boxShadow,
                    }}
                >Przycisk główny</button>

                <div
                    className="p-4 transition-all duration-200"
                    style={{
                        backgroundColor: settings.secondaryColor,
                        border: `1px solid ${settings.borderColor}`,
                        borderRadius: `${settings.borderRadius}rem`,
                        boxShadow: settings.boxShadow,
                    }}
                >
                    <h4 className="font-bold flex justify-between items-center" style={{ color: settings.textColor }}>
                        <span>Przykładowa karta</span>
                        <span style={{...badgeBaseStyle, backgroundColor: settings.therapistBackgroundColor, color: settings.therapistColor }}>Terapeuta</span>
                    </h4>
                    <p className="text-sm mt-2" style={{ color: settings.textColor, opacity: 0.8 }}>Zawartość wewnątrz karty.</p>
                </div>

                <input
                    type="text"
                    placeholder="Pole tekstowe..."
                    className="w-full p-3 border transition-all duration-200"
                    style={{
                        backgroundColor: settings.inputBackgroundColor,
                        color: settings.inputTextColor,
                        borderColor: settings.borderColor,
                        borderRadius: `${settings.borderRadius}rem`,
                    }}
                />
                
                <div className="flex justify-between items-center p-3 rounded-lg" style={{backgroundColor: settings.secondaryColor}}>
                  <span style={{color: settings.textColor, opacity: 0.9}}>Etykieta Admina:</span>
                  <span style={{...badgeBaseStyle, backgroundColor: settings.adminBackgroundColor, color: settings.adminColor }}>Admin</span>
                </div>

                <div style={{...alertBaseStyle, backgroundColor: settings.successColor, color: contrastSuccessText }}>
                    To jest komunikat o sukcesie.
                </div>
                <div style={{...alertBaseStyle, backgroundColor: settings.warningColor, color: contrastWarningText }}>
                   To jest komunikat ostrzegawczy.
                </div>
                <div style={{...alertBaseStyle, backgroundColor: settings.errorColor, color: contrastErrorText }}>
                    To jest komunikat o błędzie.
                </div>
            </div>
        </div>
    );
};


// --- Main Branding Component --- //
const BrandingSettings: React.FC = () => {
  const { branding, setBranding } = useContext(BrandingContext);
  const [localBranding, setLocalBranding] = useState<BrandingSettings>(branding);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalBranding(branding);
  }, [branding]);

  const handleSave = async () => {
      setIsSaving(true);
      setBranding(localBranding);
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsSaving(false);
      showToast("Ustawienia brandingu zostały zapisane.", 'success');
  };

  const handleReset = () => {
    setLocalBranding(branding);
    showToast("Przywrócono ostatnio zapisane ustawienia.", 'info');
  }

  const handleThemeApply = (themeName: 'light' | 'dark') => {
      const theme = themeName === 'light' ? lightTheme : darkTheme;
      setLocalBranding(prev => ({ ...prev, ...theme }));
      showToast(`Zastosowano motyw ${themeName === 'light' ? 'jasny' : 'ciemny'}.`, 'info');
  };

  const handleExport = () => {
      const jsonString = JSON.stringify(localBranding, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'branding-settings.json';
      a.click();
      URL.revokeObjectURL(a.href);
      a.remove();
      showToast("Konfiguracja została wyeksportowana.", 'success');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result as string;
              const importedSettings = JSON.parse(text);
              if (importedSettings.primaryColor && importedSettings.appName) {
                  setLocalBranding(prev => ({...branding, ...importedSettings}));
                  showToast("Konfiguracja została zaimportowana.", 'success');
              } else {
                  throw new Error("Plik nie zawiera prawidłowych ustawień brandingu.");
              }
          } catch (error: any) {
              showToast(`Błąd importu: ${error.message}`, 'error');
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };

  const handleRichTextChange = (field: keyof BrandingSettings, content: string) => {
    setLocalBranding(prev => ({...prev, [field]: content}));
  };

  return (
    <div className="p-4 sm:p-8 max-w-full mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Wygląd i Branding</h1>
          <p className="opacity-80 mt-1">Dostosuj wygląd aplikacji do swojej marki w czasie rzeczywistym.</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={handleReset} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Anuluj</button>
            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg disabled:bg-slate-400 hover:bg-indigo-700 transition-colors">
                {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        <div className="space-y-6">
            <CollapsibleSection title="Motywy i Zarządzanie" defaultOpen={true}>
                 <div className='flex flex-wrap gap-3'>
                    <button onClick={() => handleThemeApply('light')} className='flex-1 px-4 py-2 border rounded-md hover:bg-slate-50 transition-colors'>Motyw jasny</button>
                    <button onClick={() => handleThemeApply('dark')} className='flex-1 px-4 py-2 border rounded-md hover:bg-slate-50 transition-colors'>Motyw ciemny</button>
                </div>
                 <div className='flex flex-wrap gap-3 mt-3'>
                    <button onClick={handleImportClick} className='flex-1 px-4 py-2 border rounded-md hover:bg-slate-50 transition-colors'>Importuj...</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
                    <button onClick={handleExport} className='flex-1 px-4 py-2 border rounded-md hover:bg-slate-50 transition-colors'>Eksportuj...</button>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Ogólne i Typografia" defaultOpen={true}>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nazwa aplikacji</label>
                        <input type="text" value={localBranding.appName} onChange={(e) => setLocalBranding(prev => ({ ...prev, appName: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Logo URL</label>
                        <input type="text" value={localBranding.logoUrl || ''} onChange={(e) => setLocalBranding(prev => ({ ...prev, logoUrl: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-md" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Krój czcionki</label>
                     <select value={localBranding.fontFamily} onChange={e => setLocalBranding(prev => ({ ...prev, fontFamily: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-md bg-white">
                        <option value="'Inter', sans-serif">Inter</option>
                        <option value="'Roboto', sans-serif">Roboto</option>
                        <option value="'Open Sans', sans-serif">Open Sans</option>
                        <option value="'Lato', sans-serif">Lato</option>
                        <option value="'Montserrat', sans-serif">Montserrat</option>
                    </select>
                </div>
                 <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                       <label className="block text-sm font-medium mb-1">Zaokrąglenie ({localBranding.borderRadius.toFixed(2)}rem)</label>
                       <input type="range" min="0" max="2" step="0.05" value={localBranding.borderRadius} onChange={e => setLocalBranding(prev => ({...prev, borderRadius: parseFloat(e.target.value)}))} className="w-full" />
                    </div>
                     <div>
                       <label className="block text-sm font-medium mb-1">Cień elementów</label>
                        <select value={localBranding.boxShadow} onChange={e => setLocalBranding(prev => ({ ...prev, boxShadow: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-md bg-white text-sm">
                            <option value="none">Brak</option>
                            <option value="0 1px 2px 0 rgb(0 0 0 / 0.05)">Bardzo mały (xs)</option>
                            <option value="0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)">Mały (sm)</option>
                            <option value="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)">Średni (md)</option>
                            <option value="0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)">Duży (lg)</option>
                        </select>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Główna Paleta Kolorów" defaultOpen={true}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorInput label="Tło Główne" value={localBranding.backgroundColor} onChange={v => setLocalBranding(prev => ({...prev, backgroundColor: v}))} />
                    <ColorInput label="Tekst Główny" value={localBranding.textColor} onChange={v => setLocalBranding(prev => ({...prev, textColor: v}))} />
                    <ColorInput label="Kolor Główny (Przyciski)" value={localBranding.primaryColor} onChange={v => setLocalBranding(prev => ({...prev, primaryColor: v}))} />
                    <ColorInput label="Kolor Akcentujący" value={localBranding.accentColor} onChange={v => setLocalBranding(prev => ({...prev, accentColor: v}))} />
                </div>
                 <div className="mt-4 p-3 bg-slate-50 rounded-lg border">
                    <h3 className="font-semibold mb-2 text-sm">Kontrola kontrastu (WCAG)</h3>
                    <div className="flex flex-wrap gap-2">
                        <ContrastChecker color1={localBranding.textColor} color2={localBranding.backgroundColor} label="Tekst / Tło" />
                        <ContrastChecker color1={getContrastingTextColor(localBranding.primaryColor)} color2={localBranding.primaryColor} label="Przycisk" />
                        <ContrastChecker color1={localBranding.adminColor} color2={localBranding.adminBackgroundColor} label="Admin" />
                        <ContrastChecker color1={localBranding.therapistColor} color2={localBranding.therapistBackgroundColor} label="Terapeuta" />
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Teksty na Stronie Klienta">
                <div className="space-y-4">
                    <div>
                        <h4 class="font-semibold text-md mb-2 border-b pb-1">Strona Wpisywania Kodu</h4>
                        <div className="space-y-3 p-2">
                            <label className="block text-sm font-medium">Tytuł</label>
                            <input type="text" value={localBranding.clientPageTitle} onChange={(e) => setLocalBranding(prev => ({ ...prev, clientPageTitle: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-md" />
                            <label className="block text-sm font-medium">Opis</label>
                            <textarea value={localBranding.clientPageDescription} onChange={(e) => setLocalBranding(prev => ({ ...prev, clientPageDescription: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-md" rows={3}></textarea>
                            <label className="block text-sm font-medium">Tekst na przycisku</label>
                            <input type="text" value={localBranding.clientPageButtonText} onChange={(e) => setLocalBranding(prev => ({ ...prev, clientPageButtonText: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold text-md mb-2 border-b pb-1">Strona Potwierdzenia</h4>
                        <div className="space-y-3 p-2">
                             <label className="block text-sm font-medium">Tytuł</label>
                            <input type="text" value={localBranding.clientConfirmationTitle} onChange={(e) => setLocalBranding(prev => ({ ...prev, clientConfirmationTitle: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-md" />
                            <label className="block text-sm font-medium">Wiadomość (można użyć HTML)</label>
                            <RichTextInput content={localBranding.clientConfirmationMessage} onChange={(c) => handleRichTextChange('clientConfirmationMessage', c)} />
                            <label className="block text-sm font-medium">Tekst na przycisku</label>
                            <input type="text" value={localBranding.clientConfirmationButtonText} onChange={(e) => setLocalBranding(prev => ({ ...prev, clientConfirmationButtonText: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                    </div>
                     <div>
                        <h4 class="font-semibold text-md mb-2 border-b pb-1">Strona z Podziękowaniem</h4>
                        <div className="space-y-3 p-2">
                             <label className="block text-sm font-medium">Tytuł</label>
                            <input type="text" value={localBranding.clientThankYouTitle} onChange={(e) => setLocalBranding(prev => ({ ...prev, clientThankYouTitle: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-md" />
                            <label className="block text-sm font-medium">Wiadomość (można użyć HTML)</label>
                             <RichTextInput content={localBranding.clientThankYouMessage} onChange={(c) => handleRichTextChange('clientThankYouMessage', c)} />
                            <label className="block text-sm font-medium">Tekst na przycisku</label>
                            <input type="text" value={localBranding.clientThankYouButtonText} onChange={(e) => setLocalBranding(prev => ({ ...prev, clientThankYouButtonText: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

             <CollapsibleSection title="Szczegółowa Paleta">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorInput label="Tło Kart / Paneli" value={localBranding.secondaryColor} onChange={v => setLocalBranding(prev => ({...prev, secondaryColor: v}))} />
                    <ColorInput label="Kolor Obramowań" value={localBranding.borderColor} onChange={v => setLocalBranding(prev => ({...prev, borderColor: v}))} />
                    <ColorInput label="Tło Pól Wprowadzania" value={localBranding.inputBackgroundColor} onChange={v => setLocalBranding(prev => ({...prev, inputBackgroundColor: v}))} />
                    <ColorInput label="Tekst Pól Wprowadzania" value={localBranding.inputTextColor} onChange={v => setLocalBranding(prev => ({...prev, inputTextColor: v}))} />
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Alerty i Statusy">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorInput label="Kolor Sukcesu" value={localBranding.successColor} onChange={v => setLocalBranding(prev => ({...prev, successColor: v}))} />
                    <ColorInput label="Kolor Ostrzeżeń" value={localBranding.warningColor} onChange={v => setLocalBranding(prev => ({...prev, warningColor: v}))} />
                    <ColorInput label="Kolor Błędów" value={localBranding.errorColor} onChange={v => setLocalBranding(prev => ({...prev, errorColor: v}))} />
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Etykiety Ról Użytkowników">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorInput label="Tło Etykiety Admina" value={localBranding.adminBackgroundColor} onChange={v => setLocalBranding(prev => ({...prev, adminBackgroundColor: v}))} />
                    <ColorInput label="Tekst Etykiety Admina" value={localBranding.adminColor} onChange={v => setLocalBranding(prev => ({...prev, adminColor: v}))} />
                    <ColorInput label="Tło Etykiety Terapeuty" value={localBranding.therapistBackgroundColor} onChange={v => setLocalBranding(prev => ({...prev, therapistBackgroundColor: v}))} />
                    <ColorInput label="Tekst Etykiety Terapeuty" value={localBranding.therapistColor} onChange={v => setLocalBranding(prev => ({...prev, therapistColor: v}))} />
                </div>
            </CollapsibleSection>

        </div>

        <div className="sticky top-8 lg:block hidden">
            <LivePreview settings={localBranding} />
        </div>

      </div>
    </div>
  );
};

export default BrandingSettings;
