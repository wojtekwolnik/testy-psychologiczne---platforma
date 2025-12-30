'use client';

import React, { useContext, useState, useEffect } from 'react';
import { BrandingContext } from '@/contexts/BrandingContext';
import { saveBrandingSettings } from '@/app/actions/brandingActions';
import { Tab } from '@headlessui/react';
import { FaPalette, FaGlobe, FaEnvelope, FaRobot, FaCog, FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import { ThemePalette } from '@/components/types';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

export default function BrandingPage() {
    const { branding, setBranding } = useContext(BrandingContext);
    const [localSettings, setLocalSettings] = useState(branding);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

    // Sync localSettings when branding context updates (async load from server)
    useEffect(() => {
        if (branding.lightTheme) {
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

    const updateSetting = (key: string, value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const updateNestedSetting = (parent: string, key: string, value: any) => {
        setLocalSettings(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent as keyof typeof prev] || {}),
                [key]: value
            }
        }));
    };

    // Default palettes for fallback
    const defaultLightPalette: ThemePalette = { primaryColor: '#0d9488', secondaryColor: '#f8fafc', accentColor: '#2563eb', backgroundColor: '#e2e8f0', textColor: '#1e293b', borderColor: '#cbd5e1', inputBackgroundColor: '#ffffff', inputTextColor: '#1e293b', errorColor: '#dc2626', warningColor: '#f59e0b', successColor: '#16a34a', adminColor: '#7e22ce', adminBackgroundColor: '#f3e8ff', therapistColor: '#0d9488', therapistBackgroundColor: '#ccfbf1', sidebarBackground: '#1e293b', sidebarTextColor: '#f1f5f9', sidebarActiveBackground: '#334155', sidebarActiveText: '#ffffff', sidebarHoverBackground: '#334155', sidebarHoverText: '#ffffff' };
    const defaultDarkPalette: ThemePalette = { primaryColor: '#2dd4bf', secondaryColor: '#1e293b', accentColor: '#60a5fa', backgroundColor: '#0f172a', textColor: '#e2e8f0', borderColor: '#334155', inputBackgroundColor: '#1e293b', inputTextColor: '#e2e8f0', errorColor: '#f87171', warningColor: '#fbbf24', successColor: '#4ade80', adminColor: '#c084fc', adminBackgroundColor: '#3b0764', therapistColor: '#2dd4bf', therapistBackgroundColor: '#115e59', sidebarBackground: '#020617', sidebarTextColor: '#e2e8f0', sidebarActiveBackground: '#1e293b', sidebarActiveText: '#ffffff', sidebarHoverBackground: '#1e293b', sidebarHoverText: '#ffffff' };

    const updateThemeSetting = (key: keyof ThemePalette, value: string) => {
        const themeKey = themeMode === 'light' ? 'lightTheme' : 'darkTheme';
        const defaults = themeMode === 'light' ? defaultLightPalette : defaultDarkPalette;
        setLocalSettings(prev => ({
            ...prev,
            [themeKey]: {
                ...defaults,
                ...(prev[themeKey] || {}),
                [key]: value
            }
        }));
    };

    const getCurrentTheme = (): ThemePalette => {
        const defaults = themeMode === 'light' ? defaultLightPalette : defaultDarkPalette;
        const palette = themeMode === 'light' ? localSettings.lightTheme : localSettings.darkTheme;

        // Filter out undefined/null values from palette before merging
        const cleanPalette: Partial<ThemePalette> = {};
        if (palette) {
            Object.entries(palette).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    cleanPalette[key as keyof ThemePalette] = value;
                }
            });
        }

        // Merge defaults with clean palette values
        return { ...defaults, ...cleanPalette };
    };

    const currentPalette = getCurrentTheme();

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
                <h1 className="text-3xl font-bold text-slate-800">Ustawienia Platformy</h1>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-[var(--primary-color)] text-white rounded hover:opacity-90 font-bold shadow-sm transition-all"
                >
                    {saved ? 'Zapisano!' : 'Zapisz Zmiany'}
                </button>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

            <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-slate-200 p-1 mb-6">
                    <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', selected ? 'bg-white shadow text-[var(--primary-color)]' : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800')}>
                        <div className="flex items-center justify-center gap-2"><FaCog /> Ogólne</div>
                    </Tab>
                    <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', selected ? 'bg-white shadow text-[var(--primary-color)]' : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800')}>
                        <div className="flex items-center justify-center gap-2"><FaGlobe /> Portal Klienta</div>
                    </Tab>
                    <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', selected ? 'bg-white shadow text-[var(--primary-color)]' : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800')}>
                        <div className="flex items-center justify-center gap-2"><FaPalette /> Kolorystyka</div>
                    </Tab>
                    <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', selected ? 'bg-white shadow text-[var(--primary-color)]' : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800')}>
                        <div className="flex items-center justify-center gap-2"><FaEnvelope /> E-mail</div>
                    </Tab>
                    <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', selected ? 'bg-white shadow text-[var(--primary-color)]' : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800')}>
                        <div className="flex items-center justify-center gap-2"><FaRobot /> AI</div>
                    </Tab>
                </Tab.List>

                <Tab.Panels>
                    {/* General Settings */}
                    <Tab.Panel className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nazwa Aplikacji</label>
                                <input type="text" className="w-full p-2 border rounded" value={localSettings.appName} onChange={e => updateSetting('appName', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL (Szerokie)</label>
                                <input type="text" className="w-full p-2 border rounded" value={localSettings.logoUrl} onChange={e => updateSetting('logoUrl', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tryb Domyślny</label>
                                <select className="w-full p-2 border rounded" value={localSettings.mode || 'system'} onChange={e => updateSetting('mode', e.target.value)}>
                                    <option value="system">Domyślny Systemu (Auto)</option>
                                    <option value="light">Jasny (Light)</option>
                                    <option value="dark">Ciemny (Dark)</option>
                                </select>
                            </div>
                        </div>
                    </Tab.Panel>

                    {/* Client Portal Settings */}
                    <Tab.Panel className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tytuł Strony Logowania</label>
                                <input type="text" className="w-full p-2 border rounded" value={localSettings.clientPageTitle} onChange={e => updateSetting('clientPageTitle', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Opis Strony Logowania</label>
                                <textarea className="w-full p-2 border rounded" rows={3} value={localSettings.clientPageDescription} onChange={e => updateSetting('clientPageDescription', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tytuł Podziękowania</label>
                                    <input type="text" className="w-full p-2 border rounded" value={localSettings.clientThankYouTitle} onChange={e => updateSetting('clientThankYouTitle', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Wiadomość Podziękowania</label>
                                    <textarea className="w-full p-2 border rounded" rows={2} value={localSettings.clientThankYouMessage} onChange={e => updateSetting('clientThankYouMessage', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </Tab.Panel>

                    {/* Colors Settings */}
                    <Tab.Panel className="bg-white p-6 rounded-lg shadow-sm space-y-8">

                        {/* Theme Toggle for Editing */}
                        <div className="flex justify-center mb-8 bg-slate-100 p-2 rounded-lg inline-flex self-center mx-auto w-full md:w-auto">
                            <button
                                onClick={() => setThemeMode('light')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all ${themeMode === 'light' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FaSun /> Edytuj Jasny (Light)
                            </button>
                            <button
                                onClick={() => setThemeMode('dark')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all ${themeMode === 'dark' ? 'bg-slate-800 shadow text-white font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FaMoon /> Edytuj Ciemny (Dark)
                            </button>
                        </div>

                        {currentPalette ? (
                            <>
                                <div>
                                    <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">Główne Elementy ({themeMode === 'light' ? 'Jasny' : 'Ciemny'})</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Kolor Podstawowy (Primary)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette?.primaryColor || '#0d9488'} onChange={e => updateThemeSetting('primaryColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette?.primaryColor || '#0d9488'} onChange={e => updateThemeSetting('primaryColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Kolor Akcentu (Accent)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.accentColor} onChange={e => updateThemeSetting('accentColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.accentColor} onChange={e => updateThemeSetting('accentColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Kolor Dodatkowy (Secondary)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.secondaryColor} onChange={e => updateThemeSetting('secondaryColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.secondaryColor} onChange={e => updateThemeSetting('secondaryColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {/* Sidebar Colors */}
                                <div>
                                    <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">Panel Boczny (Sidebar)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tło Panelu</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.sidebarBackground} onChange={e => updateThemeSetting('sidebarBackground', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.sidebarBackground} onChange={e => updateThemeSetting('sidebarBackground', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Kolor Tekstu</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.sidebarTextColor} onChange={e => updateThemeSetting('sidebarTextColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.sidebarTextColor} onChange={e => updateThemeSetting('sidebarTextColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tło Aktywnego Elementu</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.sidebarActiveBackground} onChange={e => updateThemeSetting('sidebarActiveBackground', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.sidebarActiveBackground} onChange={e => updateThemeSetting('sidebarActiveBackground', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tekst Aktywnego Slementu</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.sidebarActiveText} onChange={e => updateThemeSetting('sidebarActiveText', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.sidebarActiveText} onChange={e => updateThemeSetting('sidebarActiveText', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Page & Text */}
                                <div>
                                    <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">Tło i Tekst</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tło Strony (Body)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.backgroundColor} onChange={e => updateThemeSetting('backgroundColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.backgroundColor} onChange={e => updateThemeSetting('backgroundColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Główny Kolor Tekstu</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.textColor} onChange={e => updateThemeSetting('textColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.textColor} onChange={e => updateThemeSetting('textColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Kolor Obramowań</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.borderColor} onChange={e => updateThemeSetting('borderColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.borderColor} onChange={e => updateThemeSetting('borderColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Inputs */}
                                <div>
                                    <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">Formularze</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tło Pól Input</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.inputBackgroundColor} onChange={e => updateThemeSetting('inputBackgroundColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.inputBackgroundColor} onChange={e => updateThemeSetting('inputBackgroundColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tekst w Polach</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.inputTextColor} onChange={e => updateThemeSetting('inputTextColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.inputTextColor} onChange={e => updateThemeSetting('inputTextColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Colors */}
                                <div>
                                    <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">Statusy i Komunikaty</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Sukces (Success)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.successColor} onChange={e => updateThemeSetting('successColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.successColor} onChange={e => updateThemeSetting('successColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Ostrzeżenie (Warning)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.warningColor} onChange={e => updateThemeSetting('warningColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.warningColor} onChange={e => updateThemeSetting('warningColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Błąd (Error)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.errorColor} onChange={e => updateThemeSetting('errorColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.errorColor} onChange={e => updateThemeSetting('errorColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Roles */}
                                <div>
                                    <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">Role Użytkowników</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Admin (Kolor)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.adminColor} onChange={e => updateThemeSetting('adminColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.adminColor} onChange={e => updateThemeSetting('adminColor', e.target.value)} />
                                            </div>
                                            <label className="block text-sm font-medium text-slate-700 mt-2 mb-1">Admin (Tło)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.adminBackgroundColor} onChange={e => updateThemeSetting('adminBackgroundColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.adminBackgroundColor} onChange={e => updateThemeSetting('adminBackgroundColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Terapeuta (Kolor)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.therapistColor} onChange={e => updateThemeSetting('therapistColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.therapistColor} onChange={e => updateThemeSetting('therapistColor', e.target.value)} />
                                            </div>
                                            <label className="block text-sm font-medium text-slate-700 mt-2 mb-1">Terapeuta (Tło)</label>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-10 w-10 border rounded cursor-pointer" value={currentPalette.therapistBackgroundColor} onChange={e => updateThemeSetting('therapistBackgroundColor', e.target.value)} />
                                                <input type="text" className="flex-1 p-2 border rounded uppercase" value={currentPalette.therapistBackgroundColor} onChange={e => updateThemeSetting('therapistBackgroundColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : <div className="text-center p-8">Ładowanie motywu...</div>}

                    </Tab.Panel>

                    {/* Email Settings */}
                    <Tab.Panel className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="emailEnabled"
                                checked={localSettings.emailSettings.enabled || false}
                                onChange={e => updateNestedSetting('emailSettings', 'enabled', e.target.checked)}
                                className="h-5 w-5"
                            />
                            <label htmlFor="emailEnabled" className="font-medium text-slate-700">Włącz powiadomienia e-mail</label>
                        </div>

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!localSettings.emailSettings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nadawca (Nazwa)</label>
                                <input type="text" className="w-full p-2 border rounded" value={localSettings.emailSettings.fromName} onChange={e => updateNestedSetting('emailSettings', 'fromName', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nadawca (Email)</label>
                                <input type="email" className="w-full p-2 border rounded" value={localSettings.emailSettings.fromEmail} onChange={e => updateNestedSetting('emailSettings', 'fromEmail', e.target.value)} />
                            </div>
                        </div>

                        <h3 className={`font-bold text-lg mt-4 mb-2 ${!localSettings.emailSettings.enabled ? 'opacity-50' : ''}`}>Szablon Powiadomienia dla Terapeuty</h3>
                        <div className={`space-y-4 ${!localSettings.emailSettings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Temat Wiadomości</label>
                                <input type="text" className="w-full p-2 border rounded" value={localSettings.emailSettings.therapistNotificationSubject} onChange={e => updateNestedSetting('emailSettings', 'therapistNotificationSubject', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Treść Wiadomości (HTML)</label>
                                <textarea className="w-full p-2 border rounded font-mono text-sm" rows={6} value={localSettings.emailSettings.therapistNotificationBody} onChange={e => updateNestedSetting('emailSettings', 'therapistNotificationBody', e.target.value)} />
                                <p className="text-xs text-slate-500 mt-1">Dostępne zmienne: {`{therapistName}, {clientIdentifier}, {testTitle}, {completionDate}, {reportLink}, {appName}`}</p>
                            </div>
                        </div>

                        <h3 className={`font-bold text-lg mt-4 mb-2 ${!localSettings.emailSettings.enabled ? 'opacity-50' : ''}`}>Konfiguracja SMTP</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Host SMTP</label>
                                <input type="text" className="w-full p-2 border rounded" value={localSettings.emailSettings.smtp.host} onChange={e => updateSmtpSetting('host', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                                <input type="number" className="w-full p-2 border rounded" value={localSettings.emailSettings.smtp.port} onChange={e => updateSmtpSetting('port', parseInt(e.target.value))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Użytkownik</label>
                                <input type="text" className="w-full p-2 border rounded" value={localSettings.emailSettings.smtp.username} onChange={e => updateSmtpSetting('username', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hasło</label>
                                <input type="password" className="w-full p-2 border rounded" value={localSettings.emailSettings.smtp.password || ''} onChange={e => updateSmtpSetting('password', e.target.value)} placeholder="Zostaw puste aby nie zmieniać" />
                            </div>
                        </div>
                    </Tab.Panel>

                    {/* AI Settings */}
                    <Tab.Panel className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="aiEnabled"
                                checked={localSettings.aiSettings.enabled}
                                onChange={e => updateNestedSetting('aiSettings', 'enabled', e.target.checked)}
                                className="h-5 w-5"
                            />
                            <label htmlFor="aiEnabled" className="font-medium text-slate-700">Włącz analizę AI</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Dostawca</label>
                                <select className="w-full p-2 border rounded" value={localSettings.aiSettings.provider} onChange={e => updateNestedSetting('aiSettings', 'provider', e.target.value)}>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="openai">OpenAI (GPT)</option>
                                    <option value="anthropic">Anthropic (Claude)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                                <input type="password" className="w-full p-2 border rounded" value={localSettings.aiSettings.apiKey} onChange={e => updateNestedSetting('aiSettings', 'apiKey', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">System Prompt</label>
                            <textarea className="w-full p-2 border rounded" rows={4} value={localSettings.aiSettings.systemPrompt} onChange={e => updateNestedSetting('aiSettings', 'systemPrompt', e.target.value)} />
                            <p className="text-xs text-slate-500 mt-1">Instrukcja dla modelu AI opisująca jego rolę i zachowanie.</p>
                        </div>
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
}
