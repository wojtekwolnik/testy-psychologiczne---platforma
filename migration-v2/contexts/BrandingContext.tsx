
import React, { createContext, useState, useEffect } from 'react';
import type { BrandingSettings } from '../components/types';

// --- Utility for deep merging --- //
// A simple deep merge function that handles nested objects and arrays.
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
  borderRadius: 0.75, // in rem
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
export const lightTheme: Partial<BrandingSettings> = {
  primaryColor: '#0d9488', // Teal-600
  secondaryColor: '#f8fafc', // Slate-50 (cards)
  accentColor: '#2563eb', // Blue-600
  backgroundColor: '#e2e8f0', // Slate-200 (main bg)
  textColor: '#1e293b', // Slate-800
  borderColor: '#cbd5e1', // Slate-300
  inputBackgroundColor: '#ffffff', // White
  inputTextColor: '#1e293b', // Slate-800
  errorColor: '#dc2626', // Red-600
  warningColor: '#f59e0b', // Amber-500
  successColor: '#16a34a', // Green-600
  adminColor: '#7e22ce', // Purple-700
  adminBackgroundColor: '#f3e8ff',
  therapistColor: '#0d9488', // Teal-600
  therapistBackgroundColor: '#ccfbf1',
};

export const darkTheme: Partial<BrandingSettings> = {
  primaryColor: '#2dd4bf', // Teal-400
  secondaryColor: '#1e293b', // Slate-800 (cards)
  accentColor: '#60a5fa', // Blue-400
  backgroundColor: '#0f172a', // Slate-900 (main bg)
  textColor: '#e2e8f0', // Slate-200
  borderColor: '#334155', // Slate-700
  inputBackgroundColor: '#1e293b', // Slate-800
  inputTextColor: '#e2e8f0', // Slate-200
  errorColor: '#f87171', // Red-400
  warningColor: '#fbbf24', // Amber-400
  successColor: '#4ade80', // Green-400
  adminColor: '#c084fc', // Purple-400
  adminBackgroundColor: '#3b0764',
  therapistColor: '#2dd4bf', // Teal-400
  therapistBackgroundColor: '#115e59',
};

const defaultBranding: BrandingSettings = deepMerge(baseSettings, lightTheme);

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
    try {
      const storedBranding = localStorage.getItem('brandingSettings');
      if (storedBranding) {
        setBrandingState(deepMerge(defaultBranding, JSON.parse(storedBranding)));
      }
    } catch (error) {
      console.error("Failed to parse branding settings from localStorage:", error);
      localStorage.removeItem('brandingSettings');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('brandingSettings', JSON.stringify(branding));
    } catch (error) {
      console.error("Could not save branding settings to localStorage", error);
    }
  }, [branding]);

  const setBranding = (newBranding: BrandingSettings) => {
    setBrandingState(newBranding);
  };

  const applyTheme = (theme: 'light' | 'dark') => {
    const themeSettings = theme === 'dark' ? darkTheme : lightTheme;
    // Preserve settings that are not part of the theme
    setBrandingState(prev => deepMerge(prev, themeSettings));
  }

  return (
    <BrandingContext.Provider value={{ branding, setBranding, applyTheme }}>
      {children}
    </BrandingContext.Provider>
  );
};
