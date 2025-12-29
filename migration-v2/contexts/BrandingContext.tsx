
import React, { createContext, useState, useEffect } from 'react';
import type { BrandingSettings, ThemePalette } from '../components/types';
import { getBrandingSettings } from '../app/actions/brandingActions';

// --- Utility for deep merging --- //
const deepMerge = (target: any, source: any) => {
  const output = { ...target };
  if (target && typeof target === 'object' && source && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
};


// --- Base Settings --- //
const baseSettings = {
  appName: 'MindCare Platform',
  logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjY0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNFMkU4RjAiIHJ4PSI4IiByeT0iOCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiM0NzU1NjkiPgogICAgTE9HTwogIDwvdGV4dD4KPC9zdmc+Cg==',
  fontFamily: `'Inter', sans-serif`,
  borderRadius: 0.75,
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  chartColors: ['#0d9488', '#2563eb', '#f59e0b', '#dc2626', '#9333ea'],
  clientPageTitle: 'Platforma testów MindCare',
  clientPageDescription: 'Witaj. Wpisz poniżej unikalny kod dostępu, który otrzymałeś/aś, aby rozpocząć badanie.',
  clientPageButtonText: 'Rozpocznij badanie',
  clientThankYouTitle: 'Dziękujemy za udział w badaniu.',
  clientThankYouMessage: 'Twoje odpowiedzi zostały zapisane. Wyniki zostaną omówione z Tobą przez specjalistę podczas najbliższej wizyty. Dziękujemy za zaufanie do platformy {appName}.',
  clientThankYouButtonText: 'Zamknij',
  clientConfirmationTitle: 'Gotowy/a do rozpoczęcia?',
  clientConfirmationMessage: 'Za chwilę rozpoczniesz test: <strong>{testTitle}</strong>. Składa się on z <strong>{questionCount}</strong> pytań. Prosimy o zarezerwowanie wystarczającej ilości czasu na jego ukończenie.',
  clientConfirmationButtonText: 'Rozumiem, rozpocznij',
  aiSettings: {
    enabled: false,
    provider: 'gemini',
    apiKey: '',
    endpoint: '',
    model: 'gemini-1.5-flash',
    systemPrompt: 'Jesteś pomocnym asystentem AI dla psychologów. Twoim zadaniem jest dostarczanie zwięzłych, profesjonalnych i neutralnych interpretacji zanonimizowanych wyników testów. Nie stawiaj diagnoz. Skup się na wskazaniu potencjalnych wzorców i obszarów do dalszej eksploracji przez terapeutę.',
  },
  emailSettings: {
    enabled: false,
    smtp: {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      username: 'user@example.com',
      password: '',
    },
    fromName: 'MindCare Platform',
    fromEmail: 'noreply@example.com',
    therapistNotificationSubject: 'Nowy wynik testu: {testTitle}',
    therapistNotificationBody: 'Witaj {therapistName},<br><br>Klient o identyfikatorze <strong>{clientIdentifier}</strong> ukończył test "<strong>{testTitle}</strong>" w dniu {completionDate}.<br><br>Możesz zobaczyć pełny raport, klikając link poniżej:<br>{reportLink}<br><br>Pozdrawiamy,<br>Zespół {appName}',
  },
};

// --- Themes --- //
export const lightPalette: ThemePalette = {
  primaryColor: '#0d9488',
  secondaryColor: '#f8fafc',
  accentColor: '#2563eb',
  backgroundColor: '#e2e8f0',
  textColor: '#1e293b',
  borderColor: '#cbd5e1',
  inputBackgroundColor: '#ffffff',
  inputTextColor: '#1e293b',
  errorColor: '#dc2626',
  warningColor: '#f59e0b',
  successColor: '#16a34a',
  adminColor: '#7e22ce',
  adminBackgroundColor: '#f3e8ff',
  therapistColor: '#0d9488',
  therapistBackgroundColor: '#ccfbf1',
  sidebarBackground: '#1e293b',
  sidebarTextColor: '#f1f5f9',
  sidebarActiveBackground: '#334155',
  sidebarActiveText: '#ffffff',
  sidebarHoverBackground: '#334155',
  sidebarHoverText: '#ffffff',
};

export const darkPalette: ThemePalette = {
  primaryColor: '#2dd4bf',
  secondaryColor: '#1e293b',
  accentColor: '#60a5fa',
  backgroundColor: '#0f172a',
  textColor: '#e2e8f0',
  borderColor: '#334155',
  inputBackgroundColor: '#1e293b',
  inputTextColor: '#e2e8f0',
  errorColor: '#f87171',
  warningColor: '#fbbf24',
  successColor: '#4ade80',
  adminColor: '#c084fc',
  adminBackgroundColor: '#3b0764',
  therapistColor: '#2dd4bf',
  therapistBackgroundColor: '#115e59',
  sidebarBackground: '#020617',
  sidebarTextColor: '#e2e8f0',
  sidebarActiveBackground: '#1e293b',
  sidebarActiveText: '#ffffff',
  sidebarHoverBackground: '#1e293b',
  sidebarHoverText: '#ffffff',
};

const defaultBranding: BrandingSettings = {
  ...baseSettings,
  mode: 'system',
  lightTheme: lightPalette,
  darkTheme: darkPalette,
  ...lightPalette
};

// --- Context Definition --- //
interface BrandingContextType {
  branding: BrandingSettings;
  setBranding: (settings: BrandingSettings) => void;
  applyTheme: (theme: 'light' | 'dark') => void;
}

export const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  setBranding: () => { },
  applyTheme: () => { },
});


// --- Provider Component --- //
export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBrandingState] = useState<BrandingSettings>(defaultBranding);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const serverSettings = await getBrandingSettings();
        if (serverSettings) {
          const merged = deepMerge(defaultBranding, serverSettings);

          // MIGRATION: If serverSettings has legacy top-level colors but no lightTheme,
          // copy them into lightTheme to preserve user customization.
          if (!serverSettings.lightTheme && serverSettings.primaryColor) {
            console.log("Migrating legacy branding settings to lightTheme...");
            merged.lightTheme = {
              primaryColor: serverSettings.primaryColor || lightPalette.primaryColor,
              secondaryColor: serverSettings.secondaryColor || lightPalette.secondaryColor,
              accentColor: serverSettings.accentColor || lightPalette.accentColor,
              backgroundColor: serverSettings.backgroundColor || lightPalette.backgroundColor,
              textColor: serverSettings.textColor || lightPalette.textColor,
              borderColor: serverSettings.borderColor || lightPalette.borderColor,
              inputBackgroundColor: serverSettings.inputBackgroundColor || lightPalette.inputBackgroundColor,
              inputTextColor: serverSettings.inputTextColor || lightPalette.inputTextColor,
              errorColor: serverSettings.errorColor || lightPalette.errorColor,
              warningColor: serverSettings.warningColor || lightPalette.warningColor,
              successColor: serverSettings.successColor || lightPalette.successColor,
              adminColor: serverSettings.adminColor || lightPalette.adminColor,
              adminBackgroundColor: serverSettings.adminBackgroundColor || lightPalette.adminBackgroundColor,
              therapistColor: serverSettings.therapistColor || lightPalette.therapistColor,
              therapistBackgroundColor: serverSettings.therapistBackgroundColor || lightPalette.therapistBackgroundColor,
              sidebarBackground: serverSettings.sidebarBackground || lightPalette.sidebarBackground,
              sidebarTextColor: serverSettings.sidebarTextColor || lightPalette.sidebarTextColor,
              sidebarActiveBackground: serverSettings.sidebarActiveBackground || lightPalette.sidebarActiveBackground,
              sidebarActiveText: serverSettings.sidebarActiveText || lightPalette.sidebarActiveText,
              sidebarHoverBackground: serverSettings.sidebarHoverBackground || lightPalette.sidebarHoverBackground,
              sidebarHoverText: serverSettings.sidebarHoverText || lightPalette.sidebarHoverText,
            };
          }
          setBrandingState(merged);
        } else {
          const storedBranding = localStorage.getItem('brandingSettings');
          if (storedBranding) {
            setBrandingState(deepMerge(defaultBranding, JSON.parse(storedBranding)));
          }
        }
      } catch (error) {
        console.error("Failed to load branding settings:", error);
      }
    };
    loadBranding();
  }, []);

  const setBranding = (newBranding: BrandingSettings) => {
    setBrandingState(newBranding);
  };

  const applyTheme = (theme: 'light' | 'dark') => {
    // Deprecated - handled by ThemeInjector
  }

  return (
    <BrandingContext.Provider value={{ branding, setBranding, applyTheme }}>
      {children}
    </BrandingContext.Provider>
  );
};
