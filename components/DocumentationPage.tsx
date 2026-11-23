import React from 'react';

const DocumentationSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-surface/90 border border-border p-6 sm:p-8 rounded-2xl shadow-xl mb-8">
    <h2 className="text-2xl sm:text-3xl font-bold mb-4 border-b border-border pb-3 text-text">{title}</h2>
    <div className="prose prose-invert max-w-none text-text-muted prose-headings:text-text prose-strong:text-text prose-code:text-primary">
      {children}
    </div>
  </section>
);

const Alert: React.FC<{ type: 'info' | 'security'; title: string; children: React.ReactNode }> = ({ type, title, children }) => {
  const colors = {
    info: 'bg-primary/10 border-primary text-text',
    security: 'bg-accent/10 border-accent text-text'
  };
  return (
    <div className={`p-4 border-l-4 rounded-r-xl mt-4 ${colors[type]}`}>
      <p className="font-bold text-text mb-1">{title}</p>
      <div className="text-sm text-text-muted">{children}</div>
    </div>
  );
};

const DocumentationPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto text-text">
      <div className="mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold">Dokumentacja Administratora</h1>
        <p className="text-text-muted mt-2 text-lg">
          Kompleksowy przewodnik po tworzeniu i audytowaniu testów, symulacji raportów, porównywaniu wyników oraz konfiguracji platformy Real Moment.
        </p>
      </div>

      <DocumentationSection title="1. Tworzenie, Edycja i Importowanie Testów (CSV, JSON, Wieloskalowość i N-progów)">
        <p>
          W zakładce <strong>Testy</strong> możesz tworzyć narzędzia diagnostyczne na trzy sposoby: w edytorze wizualnym, importując arkusz <strong>CSV (Excel)</strong> lub przywracając pełną kopię <strong>JSON</strong>.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-2">Import z pliku CSV (Excel / LibreOffice / Arkusze Google)</h3>
        <p>
          Kliknij <strong>Utwórz Test &rarr; Importuj z pliku CSV (Excel)</strong>, aby pobrać gotowy szablon z polskimi znakami (UTF-8 BOM). Pierwszy wiersz pliku zawiera nagłówki oddzielone średnikiem (<code>;</code>) lub przecinkiem (<code>,</code>):
        </p>
        <pre className="bg-background p-3 rounded-xl border border-border text-xs font-mono text-primary overflow-x-auto">
{`sekcja;pytanie;typ;skala;odwrocone;opcje
Część 1;Lubię przebywać w dużym gronie ludzi.;likert-5;Ekstrawersja;NIE;
Część 1;Wolę spędzać wolny czas w samotności.;likert-5;Ekstrawersja;TAK;
Część 2;Czy masz trudności z zasypianiem?;yes-no;Napięcie;NIE;
Część 2;Jak często odczuwasz zmęczenie?;multiple-choice;Napięcie;NIE;Nigdy:0|Rzadko:1|Często:2|Codziennie:3`}
        </pre>
        <ul className="list-disc pl-5 space-y-1 text-sm mt-3">
          <li><strong><code>sekcja</code></strong> — nazwa strony/sekcji, na której pojawi się pytanie.</li>
          <li><strong><code>pytanie</code></strong> — pełna treść pytania wyświetlana badanemu.</li>
          <li><strong><code>typ</code></strong> — <code>likert-5</code> (skala 1–5), <code>yes-no</code> (Tak/Nie), <code>scale-1-10</code> (skala 1–10) lub <code>multiple-choice</code> (własne opcje).</li>
          <li><strong><code>skala</code></strong> — nazwa skali (np. <code>Ekstrawersja</code>). System automatycznie utworzy skale i wyliczy ich maksymalną punktację (<code>maxScore</code>).</li>
          <li><strong><code>odwrocone</code></strong> — wpisz <code>TAK</code> dla pytań z odwróconą punktacją lub <code>NIE</code> dla zwykłych.</li>
          <li><strong><code>opcje</code></strong> — (tylko dla <code>multiple-choice</code>) warianty odpowiedzi z punktami oddzielone znakiem <code>|</code>, np. <code>Nigdy:0|Czasami:1|Często:2</code>.</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-2">Wieloskalowość Pytań oraz Generator Dowolnej Liczby Progów (N-progów)</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>
            <strong>Przypisanie pytania do wielu skal naraz:</strong> W Edytorze Testu przy każdym pytaniu możesz wybrać z listy{' '}
            <em>„+ Dodaj skalę do pytania...”</em> dowolną liczbę skal (np. główną domenę <em>Ekstrawersja</em> oraz podskalę <em>E1: Serdeczność</em>). Każde przypisanie pojawia się jako niebieski znacznik bez nadpisywania poprzednich skal.
          </li>
          <li>
            <strong>Dowolna liczba progów interpretacyjnych (2, 3, 4, 5, 6, 10...):</strong> Przy każdej skali w Edytorze Testu system na bieżąco wylicza realny zakres możliwych punktów z przypisanych pytań (<code>minPossible–maxPossible pkt</code>). Możesz wpisać dowolną liczbę progów i kliknąć{' '}
            <strong>„Wygeneruj równe progi”</strong> (od 0 do Max) albo <strong>„Od Min do Max”</strong> (np. 24–120 pkt), a także ręcznie dodawać i edytować opisy interpretacyjne każdego poziomu.
          </li>
          <li>
            <strong>Wersjonowanie (v1, v2...):</strong> Przycisk <strong>„Zapisz jako nową wersję (v+1)”</strong> tworzy nową wersję testu z tym samym identyfikatorem kanonicznym, chroniąc historyczne wyniki powiązane ze starszą wersją.
          </li>
        </ul>
      </DocumentationSection>

      <DocumentationSection title="2. Diagnostyka Spójności Testów oraz Symulator Raportu i Widoku Klienta">
        <ul className="list-disc pl-5 space-y-2.5 text-sm">
          <li>
            <strong><code>✓ Diagnostyka spójności testów</code> (w górnym pasku Panelu Administratora):</strong> Przeszukuje wszystkie testy i automatycznie weryfikuje:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>czy każde pytanie ma przypisaną przynajmniej jedną regułę punktową,</li>
              <li>czy maksymalna liczba punktów skali (<code>maxScore</code>) zgadza się z sumą maksymalnych punktów pytań,</li>
              <li>czy w progach interpretacyjnych (<code>levels</code>) nie ma luk punktowych ani nakładających się przedziałów.</li>
            </ul>
          </li>
          <li>
            <strong><code>▶ Podgląd / Symuluj</code> (przy każdym teście na liście):</strong> Pozwala przetestować dowolny kwestionariusz (również w statusie <em>SZKIC</em>) bez generowania kodu dostępu i bez zapisywania testowych rekordów w bazie danych:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                <strong>📊 Symulator Raportu:</strong> jednym kliknięciem wypełnia test odpowiedziami (<em>🎲 Losowe</em>, <em>📉 Minimum</em>, <em>⚖️ Środek skali</em>, <em>📈 Maksimum</em>), rysuje wykres słupkowy i radarowy, prezentuje automatyczną interpretację z klucza oraz pozwala pobrać <strong>próbny raport PDF</strong>.
              </li>
              <li>
                <strong>👁️ Widok Klienta:</strong> prezentuje wszystkie sekcje i pytania oczami osoby badanej wraz z przełącznikiem{' '}
                <em>„Pokaż punktację opcji (diagnostyka klucza)”</em>.
              </li>
            </ul>
          </li>
        </ul>
      </DocumentationSection>

      <DocumentationSection title="3. Analiza Raportów, Filtrowanie Odpowiedzi po Skali i Porównywanie Wyników (Pre / Post)">
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>
            <strong>Filtrowanie i sortowanie odpowiedzi w raporcie:</strong> W widoku raportu kolumna <em>„Udzielone Odpowiedzi”</em> pozwala przefiltrować pytania po konkretnej skali psychometrycznej oraz posortować je według najwyżej punktowanych odpowiedzi (<code>↓ Najwyżej punktowane</code>).
          </li>
          <li>
            <strong>Porównywanie dwóch badań (<code>⇄ Porównaj</code> — Pre-test / Post-test):</strong> W zakładce <strong>Wyniki</strong> oraz wewnątrz każdego raportu dostępny jest moduł porównawczy zestawiający dwa badania tego samego testu:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>podwójne wykresy słupkowe ze zmianą punktową i procentową (<code>Δ</code>) oraz oznaczeniem <strong>zmiany progu interpretacyjnego</strong>,</li>
              <li>nakładany wykres radarowy dwóch pomiarów (Pre vs Post),</li>
              <li>lista pytań, w których odpowiedź klienta zmieniła się między pierwszym a drugim badaniem,</li>
              <li>przycisk <strong>„➕ Dołącz zestawienie Pre/Post do notatek raportu”</strong> wstawiający tabelę porównawczą wprost do interpretacji raportu i wydruku PDF.</li>
            </ul>
          </li>
        </ul>
      </DocumentationSection>

      <DocumentationSection title="4. Zarządzanie Kodami Dostępu (Generator Seryjny) i Użytkownikami">
        <p>
          W zakładce <strong>Kody dostępu</strong> możesz wpisać dokładną liczbę potrzebnych kodów (od <strong>1 do 50 jednorazowych kodów naraz</strong>) z przypisaniem do wybranego terapeuty oraz kopiować bezpośrednie linki do badania.
        </p>
        <Alert type="info" title="Przekazywanie kodów i wyników między terapeutami">
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>W tabeli aktywnych kodów możesz w każdej chwili przekazać niewykorzystany kod innemu terapeucie za pomocą listy rozwijanej.</li>
            <li>W zakładce <strong>Użytkownicy</strong> możesz zmieniać hasła i role kont, a podczas usuwania konta terapeuty przekazać wszystkie jego aktywne kody i zapisane wyniki innemu specjaliście.</li>
          </ul>
        </Alert>
      </DocumentationSection>

      <DocumentationSection title="5. Ustawienia Platformy, Kontrast Kolorów (WCAG), Warunki Badań i Szablony PDF">
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>
            <strong>Ogólne i Favicon:</strong> Konfiguracja nazwy aplikacji, głównego logo oraz ikony karty przeglądarki (<em>Favicon</em> — z przyciskiem przywracania domyślnego sygnetu Real Moment).
          </li>
          <li>
            <strong>Warunki Badań:</strong> Edycja skróconego podsumowania zasad przed startem badania, checkboxa zgody, pełnej treści podstrony{' '}
            <a href="/warunki-badania" target="_blank" rel="noopener noreferrer" className="text-primary underline">/warunki-badania</a>{' '}
            oraz klauzuli metodologicznej drukowanej w stopce raportów PDF.
          </li>
          <li>
            <strong>Kolorystyka z podglądem kontrastu WCAG:</strong> System automatycznie wylicza kontrastowy kolor tekstu (jasny lub ciemny) dla przycisków głównych, pomocniczych, statusów i pól formularzy oraz udostępnia pasek podglądu na żywo i przycisk{' '}
            <em>„Przywróć domyślną paletę Real Moment”</em>.
          </li>
          <li>
            <strong>Konfiguracja Raportów PDF:</strong> W zakładce <strong>Konfiguracja PDF</strong> możesz tworzyć własne szablony układów raportów PDF dla poszczególnych testów i ustawiać szablon domyślny.
          </li>
        </ul>
      </DocumentationSection>

      <DocumentationSection title="6. Bezpieczeństwo, Szyfrowanie AES-256-GCM, Retencja (60 dni) i Diagnostyka /api/health">
        <Alert type="security" title="Ochrona Danych i Monitoring Spójności">
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>100% Anonimowości Klienta:</strong> System nie gromadzi danych osobowych ani adresów e-mail osób badanych.</li>
            <li><strong>Szyfrowanie sekretów:</strong> Klucze API modeli AI (Gemini, OpenAI, Anthropic) oraz hasła SMTP są szyfrowane w bazie algorytmem <strong>AES-256-GCM</strong>.</li>
            <li><strong>Automatyczna retencja i kopie zapasowe:</strong> Wyniki starsze niż <strong>60 dni</strong> oraz przeterminowane kody dostępu są automatycznie czyszczone, a codzienne kopie zapasowe bazy PostgreSQL są zapisywane w kontenerze <code>testy_db_backup</code>.</li>
            <li><strong>Endpoint diagnostyczny <code>/api/health</code>:</strong> Bezdotykowy (<code>READ-ONLY</code>) punkt kontrolny weryfikujący połączenie z bazą danych oraz spójność kluczy wszystkich opublikowanych testów.</li>
          </ul>
        </Alert>
      </DocumentationSection>
    </div>
  );
};

export default DocumentationPage;
