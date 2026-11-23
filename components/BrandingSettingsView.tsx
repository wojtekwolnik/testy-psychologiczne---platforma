'use client';

import React, { useContext, useState, useEffect } from 'react';
import {
    BrandingContext,
    DEFAULT_CLIENT_THANK_YOU_SAFETY_NOTE,
    DEFAULT_PRIVACY_POLICY_CONTENT,
    DEFAULT_PRIVACY_POLICY_TITLE,
    DEFAULT_REPORT_DISCLAIMER_TEXT,
    DEFAULT_TERMS_CONSENT_CHECKBOX_TEXT,
    DEFAULT_TERMS_OF_TESTING_CONTENT,
    DEFAULT_TERMS_OF_TESTING_SUMMARY,
    DEFAULT_TERMS_OF_TESTING_TITLE,
    unifiedPalette,
} from '@/contexts/BrandingContext';
import { saveBrandingSettings, sendTestEmailAction } from '@/app/actions/brandingActions';
import { Tab } from '@headlessui/react';
import { FaPalette, FaGlobe, FaEnvelope, FaRobot, FaCog, FaUpload, FaTrash, FaImage, FaAlignLeft } from 'react-icons/fa';
import { ThemePalette } from '@/components/types';
import RichTextInput from '@/components/common/RichTextInput';
import { getContrastingTextColor } from '@/utils/colorUtils';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

export default function BrandingPage() {
    const { branding, setBranding } = useContext(BrandingContext);
    const [localSettings, setLocalSettings] = useState(branding);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [logoError, setLogoError] = useState('');
    const [faviconError, setFaviconError] = useState('');
    const [testEmail, setTestEmail] = useState('wojciech.wolnik@gmail.com');
    const [testEmailStatus, setTestEmailStatus] = useState<{ loading: boolean, message: string, success: boolean }>({ loading: false, message: '', success: false });

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setLogoError('');

        if (!file) return;

        if (file.size > 500 * 1024) { // 500KB strict limit
            setLogoError('Plik jest za duży! Maksymalny rozmiar to 500KB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            updateSetting('logoUrl', result);
        };
        reader.onerror = () => {
            setLogoError('Błąd podczas odczytu pliku.');
        };
        reader.readAsDataURL(file);
    };

    const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFaviconError('');

        if (!file) return;

        if (file.size > 250 * 1024) {
            setFaviconError('Plik ikony jest za duży! Maksymalny rozmiar to 250KB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            updateSetting('faviconUrl', result);
        };
        reader.onerror = () => {
            setFaviconError('Błąd podczas odczytu pliku ikony.');
        };
        reader.readAsDataURL(file);
    };

    const handleReportLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setError('Plik logo dla raportów musi być mniejszy niż 2MB.');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            updateSetting('reportLogoUrl', reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Sync localSettings when branding context updates (async load from server)
    useEffect(() => {
        if (branding) {
            setLocalSettings(branding);
        }
    }, [branding]);

    const handleSave = async () => {
        try {
            await saveBrandingSettings(localSettings);
            setBranding(localSettings);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            setError('Błąd zapisu ustawień.');
        }
    };

    const handleTestEmail = async () => {
        setTestEmailStatus({ loading: true, message: '', success: false });
        // It's important to save the settings first or at least they should be saved to DB for the action to use them.
        // Actually the backend action uses the settings FROM THE DB. 
        // So we inform the user they must save before testing.
        const res = await sendTestEmailAction(testEmail);
        setTestEmailStatus({ loading: false, message: res.message, success: res.success });
        setTimeout(() => setTestEmailStatus(prev => ({ ...prev, message: '' })), 5000);
    };

    const updateSetting = (key: string, value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const updateNestedSetting = (parent: string, key: string, value: any) => {
        setLocalSettings(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent as keyof typeof prev] as object || {}),
                [key]: value
            }
        }));
    };

    const updateThemeSetting = (key: keyof ThemePalette, value: string) => {
        setLocalSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const currentPalette = localSettings;

    const updateSmtpSetting = (key: string, value: any) => {
        setLocalSettings(prev => ({
            ...prev,
            emailSettings: {
                ...prev.emailSettings,
                smtp: {
                    ...prev.emailSettings.smtp,
                    [key]: value
                }
            }
        }));
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-color)]">Ustawienia Platformy</h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => setLocalSettings(branding)} // Reset to last saved
                        className="px-6 py-2 bg-surface border border-border text-text rounded-lg hover:bg-background hover:border-primary/50 font-semibold shadow-sm transition-all"
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-primary text-primary-contrast rounded-lg hover:opacity-90 font-bold shadow-md transition-all"
                    >
                        {saved ? 'Zapisano!' : 'Zapisz Zmiany'}
                    </button>
                </div>
            </div>

            {error && <div className="bg-error/15 border border-error/30 text-error p-4 rounded-xl mb-4">{error}</div>}

            <Tab.Group>
                <Tab.List className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-1.5 rounded-xl bg-surface border border-border p-1.5 mb-6">
                    <Tab className={({ selected }) => classNames('w-full rounded-lg px-3 py-2.5 text-xs sm:text-sm leading-5 transition-colors outline-none whitespace-nowrap', selected ? 'bg-primary shadow-md text-primary-contrast font-bold' : 'text-text-muted hover:bg-background/60 hover:text-text font-medium')}>
                        <div className="flex items-center justify-center gap-2"><FaCog className="shrink-0" /> <span>Ogólne</span></div>
                    </Tab>
                    <Tab className={({ selected }) => classNames('w-full rounded-lg px-3 py-2.5 text-xs sm:text-sm leading-5 transition-colors outline-none whitespace-nowrap', selected ? 'bg-primary shadow-md text-primary-contrast font-bold' : 'text-text-muted hover:bg-background/60 hover:text-text font-medium')}>
                        <div className="flex items-center justify-center gap-2"><FaGlobe className="shrink-0" /> <span>Portal Klienta</span></div>
                    </Tab>
                    <Tab className={({ selected }) => classNames('w-full rounded-lg px-3 py-2.5 text-xs sm:text-sm leading-5 transition-colors outline-none whitespace-nowrap', selected ? 'bg-primary shadow-md text-primary-contrast font-bold' : 'text-text-muted hover:bg-background/60 hover:text-text font-medium')}>
                        <div className="flex items-center justify-center gap-2"><FaAlignLeft className="shrink-0" /> <span>Warunki i RODO</span></div>
                    </Tab>
                    <Tab className={({ selected }) => classNames('w-full rounded-lg px-3 py-2.5 text-xs sm:text-sm leading-5 transition-colors outline-none whitespace-nowrap', selected ? 'bg-primary shadow-md text-primary-contrast font-bold' : 'text-text-muted hover:bg-background/60 hover:text-text font-medium')}>
                        <div className="flex items-center justify-center gap-2"><FaPalette className="shrink-0" /> <span>Kolorystyka</span></div>
                    </Tab>
                    <Tab className={({ selected }) => classNames('w-full rounded-lg px-3 py-2.5 text-xs sm:text-sm leading-5 transition-colors outline-none whitespace-nowrap', selected ? 'bg-primary shadow-md text-primary-contrast font-bold' : 'text-text-muted hover:bg-background/60 hover:text-text font-medium')}>
                        <div className="flex items-center justify-center gap-2"><FaEnvelope className="shrink-0" /> <span>E-mail</span></div>
                    </Tab>
                    <Tab className={({ selected }) => classNames('w-full rounded-lg px-3 py-2.5 text-xs sm:text-sm leading-5 transition-colors outline-none whitespace-nowrap', selected ? 'bg-primary shadow-md text-primary-contrast font-bold' : 'text-text-muted hover:bg-background/60 hover:text-text font-medium')}>
                        <div className="flex items-center justify-center gap-2"><FaRobot className="shrink-0" /> <span>AI</span></div>
                    </Tab>
                    <Tab className={({ selected }) => classNames('w-full rounded-lg px-3 py-2.5 text-xs sm:text-sm leading-5 transition-colors outline-none whitespace-nowrap', selected ? 'bg-primary shadow-md text-primary-contrast font-bold' : 'text-text-muted hover:bg-background/60 hover:text-text font-medium')}>
                        <div className="flex items-center justify-center gap-2"><FaCog className="shrink-0" /> <span>Raporty PDF</span></div>
                    </Tab>
                </Tab.List>

                <Tab.Panels>
                    {/* General Settings */}
                    <Tab.Panel className="bg-surface border border-border p-6 rounded-2xl shadow-lg space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Nazwa Aplikacji</label>
                                <input type="text" className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" value={localSettings.appName} onChange={e => updateSetting('appName', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Logo Aplikacji</label>
                                <div className="flex items-center gap-4">
                                    {localSettings.logoUrl && (
                                        <div className="relative group">
                                            <img
                                                src={localSettings.logoUrl}
                                                alt="Logo Preview"
                                                className="h-12 w-auto object-contain border border-border bg-background/80 rounded-lg p-1.5"
                                            />
                                            <button
                                                onClick={() => updateSetting('logoUrl', '')}
                                                className="absolute -top-2 -right-2 bg-error text-error-contrast rounded-full p-1 shadow hover:opacity-90"
                                                title="Usuń logo"
                                            >
                                                <FaTrash size={10} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-background border border-border rounded-lg font-semibold text-text hover:border-primary hover:bg-primary/10 shadow-sm transition-all text-sm">
                                            <FaUpload className="mr-2 text-primary" />
                                            {localSettings.logoUrl ? 'Zmień Logo' : 'Wgraj Logo'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                                                onChange={handleLogoUpload}
                                            />
                                        </label>
                                        <p className="text-xs text-text-muted mt-1">
                                            Maks. 500KB. Zalecane: PNG, SVG, WebP. (Wymiary ok. 200x50px)
                                        </p>
                                        {logoError && <p className="text-xs text-error mt-1 font-bold">{logoError}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border">
                            <label className="block text-sm font-medium text-text mb-2">
                                Ikona Strony w Karcie Przeglądarki (Favicon)
                            </label>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="relative group flex items-center justify-center w-14 h-14 rounded-xl border border-border bg-background/80 p-2">
                                    <img
                                        src={localSettings.faviconUrl || '/favicon-realmoment.png'}
                                        alt="Favicon Preview"
                                        className="w-8 h-8 object-contain"
                                    />
                                    {localSettings.faviconUrl && localSettings.faviconUrl !== '/favicon-realmoment.png' && (
                                        <button
                                            type="button"
                                            onClick={() => updateSetting('faviconUrl', '/favicon-realmoment.png')}
                                            className="absolute -top-2 -right-2 bg-error text-error-contrast rounded-full p-1 shadow hover:opacity-90"
                                            title="Przywróć domyślną ikonę Real Moment"
                                        >
                                            <FaTrash size={10} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1 min-w-[240px]">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-background border border-border rounded-lg font-semibold text-text hover:border-primary hover:bg-primary/10 shadow-sm transition-all text-sm">
                                            <FaUpload className="mr-2 text-primary" />
                                            Wgraj nową ikonę (Favicon)
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/png, image/x-icon, image/vnd.microsoft.icon, image/svg+xml, image/webp, image/jpeg"
                                                onChange={handleFaviconUpload}
                                            />
                                        </label>
                                        {localSettings.faviconUrl && localSettings.faviconUrl !== '/favicon-realmoment.png' && (
                                            <button
                                                type="button"
                                                onClick={() => updateSetting('faviconUrl', '/favicon-realmoment.png')}
                                                className="px-3 py-2 text-xs font-semibold bg-background border border-border hover:border-primary text-text rounded-md transition-colors"
                                            >
                                                Przywróć sygnet Real Moment
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-text-muted mt-1.5">
                                        Maks. 250KB. Zalecany kwadratowy format PNG, ICO lub SVG (np. 64×64 px lub 128×128 px). Domyślnie ustawiony jest sygnet Real Moment.
                                    </p>
                                    {faviconError && <p className="text-xs text-error mt-1 font-bold">{faviconError}</p>}
                                </div>
                            </div>
                        </div>
                    </Tab.Panel>

                    {/* Client Portal Settings */}
                    <Tab.Panel className="bg-surface border border-border p-6 rounded-2xl shadow-lg space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Tytuł Strony Logowania</label>
                                <input type="text" className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" value={localSettings.clientPageTitle} onChange={e => updateSetting('clientPageTitle', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Opis Strony Logowania</label>
                                <textarea className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" rows={3} value={localSettings.clientPageDescription} onChange={e => updateSetting('clientPageDescription', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">Tytuł Ekranu Potwierdzenia (przed startem badania)</label>
                                    <input type="text" className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" value={localSettings.clientConfirmationTitle} onChange={e => updateSetting('clientConfirmationTitle', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">Przycisk Rozpoczęcia Badania</label>
                                    <input type="text" className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" value={localSettings.clientConfirmationButtonText} onChange={e => updateSetting('clientConfirmationButtonText', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Wiadomość Powitalna przed Badaniem</label>
                                <textarea className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" rows={2} value={localSettings.clientConfirmationMessage} onChange={e => updateSetting('clientConfirmationMessage', e.target.value)} />
                                <p className="text-xs text-text-muted mt-1">Dostępne znaczniki: <code>{`{testTitle}`}</code>, <code>{`{questionCount}`}</code></p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">Tytuł Podziękowania</label>
                                    <input type="text" className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" value={localSettings.clientThankYouTitle} onChange={e => updateSetting('clientThankYouTitle', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">Wiadomość Podziękowania</label>
                                    <textarea className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" rows={2} value={localSettings.clientThankYouMessage} onChange={e => updateSetting('clientThankYouMessage', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </Tab.Panel>

                    {/* Terms of Testing (Warunki Badań) */}
                    <Tab.Panel className="bg-surface border border-border p-6 rounded-2xl shadow-lg space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-text">Warunki wykonywania badań oraz Polityka Prywatności i RODO</h2>
                                <p className="text-xs text-text-muted mt-1">
                                    Zarządzaj treścią zasad badania i klauzul RODO wyświetlanych przed startem testu, w oknie modalnym, na podstronach{' '}
                                    <a href="/warunki-badania" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                        /warunki-badania
                                    </a>{' '}
                                    i{' '}
                                    <a href="/polityka-prywatnosci" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                        /polityka-prywatnosci
                                    </a>{' '}
                                    oraz w stopce raportów PDF.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setLocalSettings(prev => ({
                                        ...prev,
                                        termsOfTestingTitle: DEFAULT_TERMS_OF_TESTING_TITLE,
                                        termsOfTestingSummary: DEFAULT_TERMS_OF_TESTING_SUMMARY,
                                        termsOfTestingContent: DEFAULT_TERMS_OF_TESTING_CONTENT,
                                        requireTermsConsent: true,
                                        termsConsentCheckboxText: DEFAULT_TERMS_CONSENT_CHECKBOX_TEXT,
                                        clientThankYouSafetyNote: DEFAULT_CLIENT_THANK_YOU_SAFETY_NOTE,
                                        reportDisclaimerEnabled: true,
                                        reportDisclaimerText: DEFAULT_REPORT_DISCLAIMER_TEXT,
                                        privacyPolicyTitle: DEFAULT_PRIVACY_POLICY_TITLE,
                                        privacyPolicyContent: DEFAULT_PRIVACY_POLICY_CONTENT,
                                    }));
                                }}
                                className="px-3.5 py-2 text-xs font-semibold bg-background border border-border hover:border-primary text-text rounded-lg transition-colors"
                            >
                                Przywróć domyślną treść warunków i RODO
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                    Tytuł dokumentu i linku w stopce
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text"
                                    value={localSettings.termsOfTestingTitle ?? DEFAULT_TERMS_OF_TESTING_TITLE}
                                    onChange={e => updateSetting('termsOfTestingTitle', e.target.value)}
                                />
                            </div>

                            <div className="p-4 bg-background/60 border border-border rounded-xl space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="requireTermsConsent"
                                        checked={localSettings.requireTermsConsent !== false}
                                        onChange={e => updateSetting('requireTermsConsent', e.target.checked)}
                                        className="h-5 w-5 accent-[var(--primary-color)]"
                                    />
                                    <label htmlFor="requireTermsConsent" className="font-semibold text-text text-sm cursor-pointer">
                                        Wymagaj zaznaczenia zgody na ekranie potwierdzenia przed rozpoczęciem badania (/test-confirmation)
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Treść checkboxa akceptacji przed startem badania
                                    </label>
                                    <textarea
                                        rows={2}
                                        className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text text-sm"
                                        value={localSettings.termsConsentCheckboxText ?? DEFAULT_TERMS_CONSENT_CHECKBOX_TEXT}
                                        onChange={e => updateSetting('termsConsentCheckboxText', e.target.value)}
                                    />
                                    <p className="text-xs text-text-muted mt-1">
                                        Użyj znacznika <code>{`{termsLink}`}</code> w miejscu, gdzie ma pojawić się klikalny link otwierający pełne Warunki wykonywania badań.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <RichTextInput
                                    label="Skrócone podsumowanie zasad na ekranie przed rozpoczęciem badania (/test-confirmation)"
                                    value={localSettings.termsOfTestingSummary ?? DEFAULT_TERMS_OF_TESTING_SUMMARY}
                                    onChange={val => updateSetting('termsOfTestingSummary', val)}
                                />
                                <p className="text-xs text-text-muted mt-1">
                                    Zwięzłe punkty wyświetlane w ramce nad przyciskiem „Rozumiem, zaczynamy”.
                                </p>
                            </div>

                            <div>
                                <RichTextInput
                                    label="Pełna treść zakładki / okna „Warunki wykonywania badań” (/warunki-badania)"
                                    value={localSettings.termsOfTestingContent ?? DEFAULT_TERMS_OF_TESTING_CONTENT}
                                    onChange={val => updateSetting('termsOfTestingContent', val)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                    Wskazówka informacyjna / bezpieczeństwa na ekranie podziękowania (po zakończeniu badania)
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text text-sm"
                                    value={localSettings.clientThankYouSafetyNote ?? DEFAULT_CLIENT_THANK_YOU_SAFETY_NOTE}
                                    onChange={e => updateSetting('clientThankYouSafetyNote', e.target.value)}
                                />
                            </div>

                            <div className="p-4 bg-background/60 border border-border rounded-xl space-y-3">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="reportDisclaimerEnabledTab"
                                        checked={localSettings.reportDisclaimerEnabled !== false}
                                        onChange={e => updateSetting('reportDisclaimerEnabled', e.target.checked)}
                                        className="h-5 w-5 accent-[var(--primary-color)]"
                                    />
                                    <label htmlFor="reportDisclaimerEnabledTab" className="font-semibold text-text text-sm cursor-pointer">
                                        Dołączaj klauzulę metodologiczną na końcu raportu PDF oraz w widoku raportu terapeuty
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Treść klauzuli metodologicznej w raporcie PDF
                                    </label>
                                    <textarea
                                        rows={2}
                                        className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text text-sm"
                                        value={localSettings.reportDisclaimerText ?? DEFAULT_REPORT_DISCLAIMER_TEXT}
                                        onChange={e => updateSetting('reportDisclaimerText', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border space-y-5">
                                <div>
                                    <h3 className="text-lg font-bold text-text">Polityka Prywatności i RODO (/polityka-prywatnosci)</h3>
                                    <p className="text-xs text-text-muted mt-0.5">
                                        Treść wyświetlana w zakładce „Polityka prywatności i RODO” w stopce Portalu Klienta oraz pod adresem{' '}
                                        <a href="/polityka-prywatnosci" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                            /polityka-prywatnosci
                                        </a>
                                        .
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Tytuł dokumentu Polityki Prywatności i RODO
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text"
                                        value={localSettings.privacyPolicyTitle ?? DEFAULT_PRIVACY_POLICY_TITLE}
                                        onChange={e => updateSetting('privacyPolicyTitle', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <RichTextInput
                                        label="Pełna treść „Polityka prywatności i RODO” (/polityka-prywatnosci)"
                                        value={localSettings.privacyPolicyContent ?? DEFAULT_PRIVACY_POLICY_CONTENT}
                                        onChange={val => updateSetting('privacyPolicyContent', val)}
                                    />
                                </div>
                            </div>
                        </div>
                    </Tab.Panel>

                    {/* Colors Settings */}
                    <Tab.Panel className="bg-surface border border-border p-6 rounded-2xl shadow-lg space-y-8">
                        {currentPalette ? (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-background/70 border border-border">
                                    <div>
                                        <h3 className="font-bold text-base text-text">Podgląd kontrastu przycisków i pól formularzy</h3>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            System automatycznie dobiera kontrastowy kolor tekstu (jasny lub ciemny) na przyciskach i polach.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setLocalSettings(prev => ({ ...prev, ...unifiedPalette }))}
                                        className="px-4 py-2 text-xs font-bold bg-background border border-border hover:border-primary text-text rounded-lg transition-colors"
                                    >
                                        Przywróć domyślną paletę Real Moment
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border" style={{ backgroundColor: currentPalette.backgroundColor }}>
                                    <span
                                        className="px-4 py-2 rounded-lg text-xs font-bold shadow-sm"
                                        style={{
                                            backgroundColor: currentPalette.primaryColor,
                                            color: getContrastingTextColor(currentPalette.primaryColor),
                                        }}
                                    >
                                        Przycisk główny (Primary)
                                    </span>
                                    <span
                                        className="px-4 py-2 rounded-lg text-xs font-semibold border"
                                        style={{
                                            backgroundColor: currentPalette.secondaryColor,
                                            borderColor: currentPalette.borderColor,
                                            color: currentPalette.textColor,
                                        }}
                                    >
                                        Przycisk pomocniczy (Anuluj)
                                    </span>
                                    <span
                                        className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider"
                                        style={{
                                            backgroundColor: currentPalette.successColor,
                                            color: getContrastingTextColor(currentPalette.successColor),
                                        }}
                                    >
                                        Opublikowany
                                    </span>
                                    <span
                                        className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider"
                                        style={{
                                            backgroundColor: currentPalette.warningColor,
                                            color: getContrastingTextColor(currentPalette.warningColor),
                                        }}
                                    >
                                        Szkic
                                    </span>
                                    <input
                                        type="text"
                                        readOnly
                                        value="Przykładowe pole tekstowe (Input)"
                                        className="px-3 py-1.5 rounded-lg border text-xs font-medium w-60"
                                        style={{
                                            backgroundColor: currentPalette.inputBackgroundColor,
                                            color: currentPalette.inputTextColor,
                                            borderColor: currentPalette.borderColor,
                                        }}
                                    />
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg mb-4 text-text border-b border-border pb-2">Główne Elementy</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Kolor Podstawowy (Primary)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette?.primaryColor || '#2f7a3e'} onChange={e => updateThemeSetting('primaryColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette?.primaryColor || '#2f7a3e'} onChange={e => updateThemeSetting('primaryColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Kolor Akcentu (Accent)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.accentColor} onChange={e => updateThemeSetting('accentColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.accentColor} onChange={e => updateThemeSetting('accentColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Kolor Dodatkowy (Secondary)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.secondaryColor} onChange={e => updateThemeSetting('secondaryColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.secondaryColor} onChange={e => updateThemeSetting('secondaryColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {/* Sidebar Colors */}
                                <div>
                                    <h3 className="font-bold text-lg mb-4 text-text border-b border-border pb-2">Panel Boczny (Sidebar)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Tło Panelu</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.sidebarBackground} onChange={e => updateThemeSetting('sidebarBackground', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.sidebarBackground} onChange={e => updateThemeSetting('sidebarBackground', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Kolor Tekstu</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.sidebarTextColor} onChange={e => updateThemeSetting('sidebarTextColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.sidebarTextColor} onChange={e => updateThemeSetting('sidebarTextColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Tło Aktywnego Elementu</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.sidebarActiveBackground} onChange={e => updateThemeSetting('sidebarActiveBackground', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.sidebarActiveBackground} onChange={e => updateThemeSetting('sidebarActiveBackground', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Tekst Aktywnego Elementu</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.sidebarActiveText} onChange={e => updateThemeSetting('sidebarActiveText', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.sidebarActiveText} onChange={e => updateThemeSetting('sidebarActiveText', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Page & Text */}
                                <div>
                                    <h3 className="font-bold text-lg mb-4 text-text border-b border-border pb-2">Tło i Tekst</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Tło Strony (Body)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.backgroundColor} onChange={e => updateThemeSetting('backgroundColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.backgroundColor} onChange={e => updateThemeSetting('backgroundColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Główny Kolor Tekstu</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.textColor} onChange={e => updateThemeSetting('textColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.textColor} onChange={e => updateThemeSetting('textColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Kolor Obramowań</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.borderColor} onChange={e => updateThemeSetting('borderColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.borderColor} onChange={e => updateThemeSetting('borderColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Inputs */}
                                <div>
                                    <h3 className="font-bold text-lg mb-4 text-text border-b border-border pb-2">Formularze</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Tło Pól Input</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.inputBackgroundColor} onChange={e => updateThemeSetting('inputBackgroundColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.inputBackgroundColor} onChange={e => updateThemeSetting('inputBackgroundColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Tekst w Polach</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.inputTextColor} onChange={e => updateThemeSetting('inputTextColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.inputTextColor} onChange={e => updateThemeSetting('inputTextColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Colors */}
                                <div>
                                    <h3 className="font-bold text-lg mb-4 text-text border-b border-border pb-2">Statusy i Komunikaty</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Sukces (Success)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.successColor} onChange={e => updateThemeSetting('successColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.successColor} onChange={e => updateThemeSetting('successColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Ostrzeżenie (Warning)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.warningColor} onChange={e => updateThemeSetting('warningColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.warningColor} onChange={e => updateThemeSetting('warningColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Błąd (Error)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.errorColor} onChange={e => updateThemeSetting('errorColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.errorColor} onChange={e => updateThemeSetting('errorColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Roles */}
                                <div>
                                    <h3 className="font-bold text-lg mb-4 text-text border-b border-border pb-2">Role Użytkowników</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Admin (Kolor)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.adminColor} onChange={e => updateThemeSetting('adminColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.adminColor} onChange={e => updateThemeSetting('adminColor', e.target.value)} />
                                            </div>
                                            <label className="block text-sm font-medium text-text mt-2 mb-1">Admin (Tło)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.adminBackgroundColor} onChange={e => updateThemeSetting('adminBackgroundColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.adminBackgroundColor} onChange={e => updateThemeSetting('adminBackgroundColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text mb-1">Terapeuta (Kolor)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.therapistColor} onChange={e => updateThemeSetting('therapistColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.therapistColor} onChange={e => updateThemeSetting('therapistColor', e.target.value)} />
                                            </div>
                                            <label className="block text-sm font-medium text-text mt-2 mb-1">Terapeuta (Tło)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 shrink-0 border border-border bg-input-bg rounded-lg cursor-pointer p-0.5" value={currentPalette.therapistBackgroundColor} onChange={e => updateThemeSetting('therapistBackgroundColor', e.target.value)} />
                                                <input type="text" className="flex-1 min-w-0 p-2 border border-border rounded-lg uppercase bg-input-bg text-input-text font-mono text-sm" value={currentPalette.therapistBackgroundColor} onChange={e => updateThemeSetting('therapistBackgroundColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : <div className="text-center p-8">Ładowanie motywu...</div>}

                    </Tab.Panel>

                    {/* Email Settings */}
                    <Tab.Panel className="bg-surface border border-border p-6 rounded-2xl shadow-lg space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="emailEnabled"
                                checked={localSettings.emailSettings.enabled || false}
                                onChange={e => updateNestedSetting('emailSettings', 'enabled', e.target.checked)}
                                className="h-5 w-5"
                            />
                            <label htmlFor="emailEnabled" className="font-medium text-text">Włącz powiadomienia e-mail</label>
                        </div>

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!localSettings.emailSettings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Nadawca (Nazwa)</label>
                                <input type="text" className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" value={localSettings.emailSettings.fromName} onChange={e => updateNestedSetting('emailSettings', 'fromName', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Nadawca (Email)</label>
                                <input type="email" className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" value={localSettings.emailSettings.fromEmail} onChange={e => updateNestedSetting('emailSettings', 'fromEmail', e.target.value)} />
                            </div>
                        </div>

                        <h3 className={`font-bold text-lg mt-4 mb-2 ${!localSettings.emailSettings.enabled ? 'opacity-50' : ''}`}>Szablon Powiadomienia dla Terapeuty</h3>
                        <div className={`space-y-4 ${!localSettings.emailSettings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Temat Wiadomości</label>
                                <input type="text" className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" value={localSettings.emailSettings.therapistNotificationSubject} onChange={e => updateNestedSetting('emailSettings', 'therapistNotificationSubject', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Treść Wiadomości (HTML)</label>
                                <textarea className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text font-mono text-sm" rows={6} value={localSettings.emailSettings.therapistNotificationBody} onChange={e => updateNestedSetting('emailSettings', 'therapistNotificationBody', e.target.value)} />
                                <p className="text-xs text-text-muted mt-1">Dostępne zmienne: {`{therapistName}, {clientIdentifier}, {testTitle}, {completionDate}, {reportLink}, {appName}`}</p>
                            </div>
                        </div>

                        <h3 className={`font-bold text-lg mt-4 mb-2 ${!localSettings.emailSettings.enabled ? 'opacity-50' : ''}`}>Konfiguracja SMTP</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Host SMTP</label>
                                <input type="text" className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" value={localSettings.emailSettings.smtp.host} onChange={e => updateSmtpSetting('host', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Port</label>
                                <input type="number" className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" value={localSettings.emailSettings.smtp.port} onChange={e => updateSmtpSetting('port', parseInt(e.target.value))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Użytkownik</label>
                                <input type="text" className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" value={localSettings.emailSettings.smtp.username} onChange={e => updateSmtpSetting('username', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Hasło</label>
                                <input type="password" className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" value={localSettings.emailSettings.smtp.password || ''} onChange={e => updateSmtpSetting('password', e.target.value)} placeholder="Zostaw puste aby nie zmieniać" />
                            </div>
                        </div>

                        <div className={`mt-8 pt-6 border-t border-border ${!localSettings.emailSettings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h3 className="font-bold text-lg mb-2">Test Konfiguracji SMTP</h3>
                            <p className="text-sm text-text-muted mb-4">Pamiętaj o zapisaniu ustawień przed wykonaniem testu (test używa danych zapisanych w bazie).</p>
                            <div className="flex gap-4 items-center">
                                <input 
                                    type="email" 
                                    className="p-2.5 border border-border rounded-lg bg-input-bg text-input-text w-64 text-sm" 
                                    value={testEmail} 
                                    onChange={e => setTestEmail(e.target.value)} 
                                    placeholder="Adres e-mail do testu"
                                />
                                <button 
                                    onClick={handleTestEmail}
                                    disabled={testEmailStatus.loading}
                                    className="px-5 py-2.5 bg-primary text-primary-contrast font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                >
                                    {testEmailStatus.loading ? 'Wysyłanie...' : 'Wyślij Test'}
                                </button>
                            </div>
                            {testEmailStatus.message && (
                                <div className={`mt-4 p-3 rounded-lg text-sm ${testEmailStatus.success ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-error/15 text-error border border-error/30'}`}>
                                    {testEmailStatus.message}
                                </div>
                            )}
                        </div>
                    </Tab.Panel>

                    {/* AI Settings */}
                    <Tab.Panel className="bg-surface border border-border p-6 rounded-2xl shadow-lg space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="aiEnabled"
                                checked={localSettings.aiSettings.enabled}
                                onChange={e => updateNestedSetting('aiSettings', 'enabled', e.target.checked)}
                                className="h-5 w-5 accent-[var(--primary-color)]"
                            />
                            <label htmlFor="aiEnabled" className="font-medium text-text">Włącz analizę AI</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Dostawca</label>
                                <select
                                    className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text"
                                    value={localSettings.aiSettings.provider}
                                    onChange={e => {
                                        const nextProvider = e.target.value;
                                        updateNestedSetting('aiSettings', 'provider', nextProvider);
                                        const defaultModels: Record<string, string> = {
                                            gemini: 'gemini-2.5-flash',
                                            openai: 'gpt-4o-mini',
                                            anthropic: 'claude-sonnet-4-20250514',
                                        };
                                        if (defaultModels[nextProvider]) {
                                            updateNestedSetting('aiSettings', 'model', defaultModels[nextProvider]);
                                        }
                                    }}
                                >
                                    <option value="gemini">Google Gemini</option>
                                    <option value="openai">OpenAI (GPT)</option>
                                    <option value="anthropic">Anthropic (Claude)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Model AI</label>
                                <input
                                    type="text"
                                    list="ai-models-list"
                                    placeholder="np. gemini-2.5-flash"
                                    className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text font-mono text-sm"
                                    value={localSettings.aiSettings.model || ''}
                                    onChange={e => updateNestedSetting('aiSettings', 'model', e.target.value)}
                                />
                                <datalist id="ai-models-list">
                                    {localSettings.aiSettings.provider === 'gemini' && (
                                        <>
                                            <option value="gemini-2.5-flash" />
                                            <option value="gemini-2.5-pro" />
                                        </>
                                    )}
                                    {localSettings.aiSettings.provider === 'openai' && (
                                        <>
                                            <option value="gpt-4o-mini" />
                                            <option value="gpt-4o" />
                                            <option value="gpt-4.1-mini" />
                                        </>
                                    )}
                                    {localSettings.aiSettings.provider === 'anthropic' && (
                                        <>
                                            <option value="claude-sonnet-4-20250514" />
                                            <option value="claude-3-7-sonnet-latest" />
                                        </>
                                    )}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">API Key (szyfrowany AES-256-GCM)</label>
                                <input type="password" className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" value={localSettings.aiSettings.apiKey} onChange={e => updateNestedSetting('aiSettings', 'apiKey', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text mb-1">System Prompt</label>
                            <textarea className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text" rows={4} value={localSettings.aiSettings.systemPrompt} onChange={e => updateNestedSetting('aiSettings', 'systemPrompt', e.target.value)} />
                            <p className="text-xs text-text-muted mt-1">Instrukcja dla modelu AI opisująca jego rolę i zachowanie.</p>
                        </div>
                    </Tab.Panel>

                    {/* Report Settings */}
                    <Tab.Panel className="bg-surface border border-border p-6 rounded-2xl shadow-lg space-y-6">
                        {/* Logo */}
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3"><FaImage className="text-primary" /> Logo na raportach</h3>
                            <p className="text-sm text-text-muted mb-4">Jeśli nie wgrasz osobnego logo dla raportów, system użyje domyślnego logo platformy.</p>
                            
                            <div className="flex items-center gap-6">
                                <div className="w-48 h-32 border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-background/80 relative overflow-hidden">
                                    {localSettings.reportLogoUrl ? (
                                        <img src={localSettings.reportLogoUrl} alt="Logo raportu" className="max-w-full max-h-full object-contain p-2" />
                                    ) : (
                                        <span className="text-text-muted text-sm">Brak wybranego logo</span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary/15 text-primary border border-primary/30 rounded-lg hover:bg-primary/25 font-semibold transition-colors text-sm w-fit">
                                        <FaUpload /> Wgraj logo
                                        <input type="file" accept="image/*" className="hidden" onChange={handleReportLogoUpload} />
                                    </label>
                                    {localSettings.reportLogoUrl && (
                                        <button onClick={() => updateSetting('reportLogoUrl', '')} className="flex items-center gap-2 px-4 py-2 bg-error/15 text-error border border-error/30 rounded-lg hover:bg-error/25 font-semibold transition-colors text-sm">
                                            <FaTrash /> Usuń logo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <hr className="border-border" />

                        {/* Primary Color */}
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3"><FaPalette className="text-accent" /> Kolor wiodący</h3>
                            <p className="text-sm text-text-muted mb-4">Ten kolor będzie używany jako akcent w nagłówkach i przy generowaniu wykresów w pliku PDF.</p>
                            
                            <div className="flex items-center gap-4">
                                <input 
                                    type="color" 
                                    value={localSettings.reportPrimaryColor || '#314293'} 
                                    onChange={(e) => updateSetting('reportPrimaryColor', e.target.value)}
                                    className="w-12 h-12 rounded-lg cursor-pointer border border-border bg-input-bg p-0.5"
                                />
                                <input 
                                    type="text" 
                                    value={localSettings.reportPrimaryColor || '#314293'} 
                                    onChange={(e) => updateSetting('reportPrimaryColor', e.target.value)}
                                    className="p-2.5 border border-border rounded-lg bg-input-bg text-input-text font-mono text-sm uppercase w-32"
                                />
                            </div>
                        </div>

                        <hr className="border-border" />

                        {/* Footer */}
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3"><FaAlignLeft className="text-primary" /> Stopka strony</h3>
                            <p className="text-sm text-text-muted mb-4">Tekst, który będzie drukowany na samym dole każdej strony raportu. Paginacja (numer strony) dodawana jest automatycznie.</p>
                            
                            <textarea 
                                value={localSettings.reportFooterText || ''}
                                onChange={(e) => updateSetting('reportFooterText', e.target.value)}
                                className="w-full p-3 border border-border rounded-lg bg-input-bg text-input-text min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="Platforma Testów Psychologicznych | www.twojastrona.pl"
                            />
                        </div>

                        <hr className="border-border" />

                        {/* Methodological Disclaimer */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="reportDisclaimerEnabledPdfTab"
                                    checked={localSettings.reportDisclaimerEnabled !== false}
                                    onChange={(e) => updateSetting('reportDisclaimerEnabled', e.target.checked)}
                                    className="h-5 w-5 accent-[var(--primary-color)]"
                                />
                                <label htmlFor="reportDisclaimerEnabledPdfTab" className="font-semibold text-text text-sm cursor-pointer">
                                    Dołączaj klauzulę metodologiczną na końcu raportu PDF (charakter pomocniczy i przesiewowy badania)
                                </label>
                            </div>
                            <textarea
                                value={localSettings.reportDisclaimerText ?? DEFAULT_REPORT_DISCLAIMER_TEXT}
                                onChange={(e) => updateSetting('reportDisclaimerText', e.target.value)}
                                className="w-full p-3 border border-border rounded-lg bg-input-bg text-input-text min-h-[90px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                                placeholder="Informacja metodologiczna..."
                            />
                        </div>
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
}
