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


// --- Base Settings (Real Moment - realmoment.pl) --- //
const baseSettings = {
  appName: 'Real Moment',
  logoUrl: '/logo-realmoment-light.png',
  reportLogoUrl: '/logo-realmoment-main.png',
  fontFamily: `'Jost', system-ui, sans-serif`,
  borderRadius: 0.85,
  boxShadow: '0 10px 30px -5px rgba(20, 22, 29, 0.35)',
  chartColors: ['#4e9054', '#314293', '#e89183', '#7c85a3', '#d0a5db'],
  clientPageTitle: 'Real Moment – Przestrzeń Diagnostyczna',
  clientPageDescription: 'Witaj w spokojnej przestrzeni Real Moment. Wpisz poniżej swój indywidualny kod dostępu otrzymany od terapeuty lub coacha, aby rozpocząć badanie.',
  clientPageButtonText: 'Rozpocznij badanie',
  clientThankYouTitle: 'Dziękujemy za udział w badaniu.',
  clientThankYouMessage: 'Twoje odpowiedzi zostały bezpiecznie zapisane. Wyniki zostaną omówione z Tobą przez specjalistę podczas najbliższego spotkania w {appName}.',
  clientThankYouButtonText: 'Zamknij',
  clientConfirmationTitle: 'Gotowy/a do rozpoczęcia?',
  clientConfirmationMessage: 'Za chwilę rozpoczniesz badanie: <strong>{testTitle}</strong>. Składa się ono z <strong>{questionCount}</strong> pytań. Zadbaj o spokojną chwilę tylko dla siebie.',
  clientConfirmationButtonText: 'Rozumiem, zaczynamy',
  aiSettings: {
    enabled: false,
    provider: 'gemini',
    apiKey: '',
    endpoint: '',
    model: 'gemini-2.5-flash',
    systemPrompt: 'Jesteś pomocnym asystentem AI dla psychologów i coachów w centrum Real Moment. Twoim zadaniem jest dostarczanie zwięzłych, profesjonalnych i empatycznych interpretacji zanonimizowanych wyników testów. Nie stawiaj diagnoz medycznych. Skup się na wskazaniu potencjalnych wzorców i obszarów do dalszej pracy terapeutycznej lub coachingowej.',
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
    fromName: 'Real Moment',
    fromEmail: 'kontakt@realmoment.pl',
    therapistNotificationSubject: 'Nowy wynik badania: {testTitle}',
    therapistNotificationBody: 'Witaj {therapistName},<br><br>Klient o identyfikatorze <strong>{clientIdentifier}</strong> ukończył badanie "<strong>{testTitle}</strong>" w dniu {completionDate}.<br><br>Możesz zobaczyć pełny raport, klikając link poniżej:<br>{reportLink}<br><br>Pozdrawiamy,<br>Zespół {appName}',
  },
};

// --- Unified Real Moment Theme (realmoment.pl) --- //
export const unifiedPalette: ThemePalette = {
  primaryColor: '#4e9054',
  secondaryColor: '#1f222b',
  accentColor: '#e89183',
  backgroundColor: '#14161d',
  textColor: '#fbfaf7',
  borderColor: '#313647',
  inputBackgroundColor: '#14161d',
  inputTextColor: '#fbfaf7',
  errorColor: '#e42806',
  warningColor: '#fcb900',
  successColor: '#4e9054',
  adminColor: '#e89183',
  adminBackgroundColor: '#314293',
  therapistColor: '#7bdcb5',
  therapistBackgroundColor: '#1b3620',
  sidebarBackground: '#0c0d0e',
  sidebarTextColor: '#e5e7ee',
  sidebarActiveBackground: '#314293',
  sidebarActiveText: '#ffffff',
  sidebarHoverBackground: '#1f222b',
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
          let migrationData: Partial<BrandingSettings> = {};
          
          if (serverSettings.darkTheme) {
            Object.keys(unifiedPalette).forEach((key) => {
              const themeKey = key as keyof ThemePalette;
              if (serverSettings.darkTheme[themeKey]) {
                migrationData[themeKey] = serverSettings.darkTheme[themeKey];
              }
            });
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
            const parsed = JSON.parse(storedBranding);
            if (parsed.appName !== 'MindCare Platform') {
              setBrandingState(deepMerge(defaultBranding, parsed));
            } else {
              localStorage.removeItem('brandingSettings');
            }
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
