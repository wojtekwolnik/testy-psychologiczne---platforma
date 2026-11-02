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
  fontFamily: `system-ui, sans-serif`,
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

// --- Unified Default Theme (Dark) --- //
export const unifiedPalette: ThemePalette = {
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
  ...unifiedPalette
};

// --- Context Definition --- //
interface BrandingContextType {
  branding: BrandingSettings;
  setBranding: (settings: BrandingSettings) => void;
}

export const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  setBranding: () => { },
});


// --- Provider Component --- //
export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBrandingState] = useState<BrandingSettings>(defaultBranding);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const serverSettings = await getBrandingSettings();
        if (serverSettings) {
          // MIGRATION LOGIC:
          // If the user had set a custom darkTheme before, pull values from it
          // to preserve their exact color overrides.
          let migrationData: Partial<BrandingSettings> = {};
          
          if (serverSettings.darkTheme) {
            console.log("Migrating legacy darkTheme settings...");
            Object.keys(unifiedPalette).forEach((key) => {
              const themeKey = key as keyof ThemePalette;
              if (serverSettings.darkTheme[themeKey]) {
                migrationData[themeKey] = serverSettings.darkTheme[themeKey];
              }
            });
            // Cleanup legacy fields to prevent issues with deepMerge
            delete serverSettings.darkTheme;
            delete serverSettings.lightTheme;
            delete serverSettings.mode;
          }

          const merged = deepMerge(defaultBranding, serverSettings);
          const fullyMerged = { ...merged, ...migrationData };
          
          setBrandingState(fullyMerged);
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

  return (
    <BrandingContext.Provider value={{ branding, setBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};
