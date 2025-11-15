import React, { createContext, useState, useEffect } from 'react';
import type { BrandingSettings } from '../components/types';

const defaultBranding: BrandingSettings = {
  appName: 'MindCare Platform',
  logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjY0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNFMkU4RjAiIHJ4PSI4IiByeT0iOCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiM0NzU1NjkiPgogICAgTE9HTwogIDwvdGV4dD4KPC9zdmc+Cg==',
  // Colors - A professional, calm theme based on Teal and Slate
  primaryColor: '#0d9488', // Teal-600
  secondaryColor: '#f8fafc', // Slate-50 (for cards)
  accentColor: '#2563eb', // Blue-600
  backgroundColor: '#e2e8f0', // Slate-200 (main background)
  textColor: '#1e293b', // Slate-800

  // Detailed Colors
  borderColor: '#cbd5e1', // Slate-300
  inputBackgroundColor: '#ffffff', // White
  inputTextColor: '#1e293b', // Slate-800
  errorColor: '#dc2626', // Red-600
  warningColor: '#f59e0b', // Amber-500
  successColor: '#16a34a', // Green-600
  
  adminColor: '#7e22ce', // Purple-700
  adminBackgroundColor: '#f3e8ff', // Purple-100
  therapistColor: '#0d9488', // Teal-600
  therapistBackgroundColor: '#ccfbf1', // Teal-100
  
  chartColors: ['#0d9488', '#2563eb', '#f59e0b', '#dc2626', '#9333ea'],

  // Client Page Texts
  clientPageTitle: 'Platforma testów MindCare',
  clientPageDescription: 'Witaj. Wpisz poniżej unikalny kod dostępu, który otrzymałeś/aś, aby rozpocząć badanie.',
  clientPageButtonText: 'Rozpocznij badanie',
  
  // Client Thank You Page Texts
  clientThankYouTitle: 'Dziękujemy za udział w badaniu.',
  clientThankYouMessage: 'Twoje odpowiedzi zostały zapisane. Wyniki zostaną omówione z Tobą przez specjalistę podczas najbliższej wizyty. Dziękujemy za zaufanie do platformy {appName}.',
  clientThankYouButtonText: 'Zamknij',

  // Client Confirmation Page Texts
  clientConfirmationTitle: 'Gotowy/a do rozpoczęcia?',
  clientConfirmationMessage: 'Za chwilę rozpoczniesz test: <strong>{testTitle}</strong>. Składa się on z <strong>{questionCount}</strong> pytań. Prosimy o zarezerwowanie wystarczającej ilości czasu na jego ukończenie.',
  clientConfirmationButtonText: 'Rozumiem, rozpocznij',

  aiSettings: {
      enabled: false,
      provider: 'gemini',
      apiKey: '',
      endpoint: '',
      model: 'gemini-2.5-flash',
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

interface BrandingContextType {
  branding: BrandingSettings;
  setBranding: (settings: BrandingSettings) => void;
}

export const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  setBranding: () => {},
});

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBrandingState] = useState<BrandingSettings>(() => {
    try {
      const storedBranding = localStorage.getItem('brandingSettings');
      if (storedBranding) {
        // Merge stored settings with defaults to ensure new fields are present
        const parsed = JSON.parse(storedBranding);
        // Deep merge for nested settings objects
        const mergedAiSettings = { ...defaultBranding.aiSettings, ...parsed.aiSettings };
        const mergedEmailSettings = {
            ...defaultBranding.emailSettings,
            ...parsed.emailSettings,
            smtp: {
                ...defaultBranding.emailSettings.smtp,
                ...(parsed.emailSettings ? parsed.emailSettings.smtp : {}),
            },
        };
        return { ...defaultBranding, ...parsed, aiSettings: mergedAiSettings, emailSettings: mergedEmailSettings };
      }
      return defaultBranding;
    } catch (error) {
       console.error("Failed to parse branding settings from localStorage:", error);
       // If parsing fails, clear the corrupted data to prevent future errors
       localStorage.removeItem('brandingSettings');
       return defaultBranding;
    }
  });

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
  
  return (
    <BrandingContext.Provider value={{ branding, setBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};