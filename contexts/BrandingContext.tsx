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


export const DEFAULT_TERMS_OF_TESTING_TITLE = 'Warunki wykonywania badań';

export const DEFAULT_TERMS_OF_TESTING_SUMMARY = `<ul>
  <li><strong>Charakter pomocniczy i przesiewowy:</strong> Wyniki kwestionariusza mają charakter orientacyjny, pomocniczy oraz rozwojowy — nie stanowią samodzielnej diagnozy medycznej (psychiatrycznej) ani oficjalnego orzeczenia klinicznego.</li>
  <li><strong>Omówienie ze specjalistą:</strong> Uzyskane odpowiedzi trafiają bezpośrednio do Twojego terapeuty, psychologa lub coacha w celu profesjonalnego omówienia podczas sesji.</li>
  <li><strong>Zasady wypełniania:</strong> Wypełnij badanie samodzielnie, w spokojnym miejscu, kierując się pierwszym odczuciem (w badaniu nie ma „dobrych” ani „złych” odpowiedzi).</li>
  <li><strong>Bezpieczeństwo:</strong> Platforma testowa nie służy do zgłaszania nagłego zagrożenia zdrowia lub życia. W sytuacji kryzysu skontaktuj się bezpośrednio ze specjalistą lub pod numerem alarmowym <strong>112</strong> / telefonem zaufania <strong>116 123</strong>.</li>
</ul>`;

export const DEFAULT_TERMS_OF_TESTING_CONTENT = `<h3>1. Postanowienia ogólne i cel badania</h3>
<p>Kwestionariusze udostępniane na platformie diagnostycznej <strong>Real Moment</strong> są realizowane na zaproszenie prowadzącego specjalisty (psychologa, psychoterapeuty, terapeuty lub coacha) przy użyciu indywidualnego, jednorazowego kodu dostępu. Celem badania jest wsparcie procesu terapeutycznego, konsultacyjnego lub rozwojowego poprzez lepsze poznanie aktualnego samopoczucia, sposobów reagowania lub cech osobowości osoby badanej.</p>

<h3>2. Charakter pomocniczy i przesiewowy narzędzi (brak automatycznej diagnozy medycznej)</h3>
<p>Wyniki uzyskiwane w ramach kwestionariuszy mają charakter <strong>wyłącznie pomocniczy, przesiewowy i orientacyjny</strong>. Uzyskany wynik liczbowy ani automatyczne podsumowanie skali:</p>
<ul>
  <li><strong>nie stanowią</strong> samodzielnej diagnozy lekarskiej (w szczególności psychiatrycznej) ani oficjalnego orzeczenia klinicznego,</li>
  <li><strong>nie zastępują</strong> bezpośredniej konsultacji lekarskiej, psychiatrycznej ani pełnego procesu diagnostyki psychologicznej,</li>
  <li>stanowią punkt wyjścia do pogłębionej rozmowy i interpretacji wspólnie ze specjalistą prowadzącym podczas sesji.</li>
</ul>

<h3>3. Dobrowolność udziału i świadoma akceptacja</h3>
<p>Przystąpienie do badania jest całkowicie dobrowolne. Rozpoczęcie wypełniania kwestionariusza po zatwierdzeniu komunikatu startowego oznacza, że osoba badana zapoznała się z niniejszymi warunkami, rozumie pomocniczy charakter narzędzia i wyraża zgodę na przekazanie swoich odpowiedzi specjaliście, od którego otrzymała kod dostępu.</p>

<h3>4. Zasady rzetelnego wypełniania kwestionariusza (higiena badania)</h3>
<p>Aby wyniki badania były jak najbardziej miarodajne i użyteczne podczas spotkania ze specjalistą, zaleca się:</p>
<ul>
  <li>wypełnianie kwestionariusza <strong>samodzielnie</strong>, w spokojnym miejscu i w chwili wolnej od pośpiechu oraz czynników rozpraszających,</li>
  <li>odpowiadanie <strong>szczerze i spontanicznie</strong>, zgodnie z pierwszym odczuciem oraz stanem faktycznym (w kwestionariuszach psychologicznych nie ma odpowiedzi „dobrych” ani „złych”),</li>
  <li>uważne przeczytanie instrukcji danego kwestionariusza (np. czy pytania dotyczą ostatniego tygodnia, czy ogólnego sposobu funkcjonowania).</li>
</ul>

<h3>5. Wyłączenie interwencji kryzysowej i bezpieczeństwo</h3>
<p>Platforma testowa służy wyłącznie do wypełniania kwestionariuszy omawianych podczas umówionych spotkań i <strong>nie jest monitorowana w trybie całodobowym (24/7)</strong> ani nie służy do zgłaszania nagłego zagrożenia zdrowia lub życia. Specjalista zapoznaje się z wynikami w ramach swojego harmonogramu pracy.</p>
<p>W przypadku gwałtownego pogorszenia samopoczucia, silnego kryzysu psychicznego lub myśli zagrażających życiu należy niezwłocznie skorzystać z bezpośredniej pomocy doraźnej:</p>
<ul>
  <li>Numer alarmowy: <strong>112</strong> lub najbliższy Szpitalny Oddział Ratunkowy (SOR) / Izba Przyjęć,</li>
  <li>Całodobowe Centrum Wsparcia dla Osób Dorosłych w Kryzysie Psychicznym: <strong>800 70 2222</strong> (bezpłatnie),</li>
  <li>Telefon Zaufania dla Dorosłych: <strong>116 123</strong>, dla Dzieci i Młodzieży: <strong>116 111</strong>.</li>
</ul>

<h3>6. Jednorazowość kodu dostępu i prawa autorskie</h3>
<p>Indywidualny kod dostępu jest przeznaczony wyłącznie dla osoby zaproszonej do badania i wygasa automatycznie po przesłaniu wypełnionego kwestionariusza lub po upływie terminu ważności. Treści pytań, skale oraz materiały udostępnione na platformie podlegają ochronie prawnej i nie mogą być kopiowane, fotografowane ani rozpowszechniane poza systemem.</p>`;

export const DEFAULT_TERMS_CONSENT_CHECKBOX_TEXT =
  'Zapoznałem/am się z {termsLink} i rozumiem, że badanie ma charakter pomocniczy oraz nie zastępuje diagnozy medycznej ani konsultacji ze specjalistą.';

export const DEFAULT_CLIENT_THANK_YOU_SAFETY_NOTE =
  'Wyniki zostały bezpiecznie przekazane Twojemu specjaliście do omówienia podczas sesji. Pamiętaj, że platforma testowa nie służy do kontaktu w sytuacjach nagłych — w razie pilnej potrzeby wsparcia skontaktuj się bezpośrednio ze swoim specjalistą lub pod numerem 112 / 116 123.';

export const DEFAULT_REPORT_DISCLAIMER_TEXT =
  'Informacja metodologiczna: Wyniki niniejszego kwestionariusza mają charakter pomocniczy, przesiewowy i orientacyjny. Stanowią one materiał wspierający pracę ze specjalistą i nie zastępują pełnej diagnozy klinicznej ani lekarskiej.';

// --- Base Settings (Real Moment - realmoment.pl) --- //
const baseSettings = {
  appName: 'Real Moment',
  logoUrl: '/logo-realmoment-light.png',
  faviconUrl: '/favicon-realmoment.png',
  reportLogoUrl: '/logo-realmoment-main.png',
  reportPrimaryColor: '#314293',
  reportFooterText: 'Real Moment – Przestrzeń Rozwojowa i Diagnostyczna | www.realmoment.pl',
  reportDisclaimerEnabled: true,
  reportDisclaimerText: DEFAULT_REPORT_DISCLAIMER_TEXT,
  termsOfTestingTitle: DEFAULT_TERMS_OF_TESTING_TITLE,
  termsOfTestingSummary: DEFAULT_TERMS_OF_TESTING_SUMMARY,
  termsOfTestingContent: DEFAULT_TERMS_OF_TESTING_CONTENT,
  requireTermsConsent: true,
  termsConsentCheckboxText: DEFAULT_TERMS_CONSENT_CHECKBOX_TEXT,
  clientThankYouSafetyNote: DEFAULT_CLIENT_THANK_YOU_SAFETY_NOTE,
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
