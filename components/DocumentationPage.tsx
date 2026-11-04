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
        <p className="text-text-muted mt-2 text-lg">Przewodnik po funkcjach zarządzania platformą Real Moment.</p>
      </div>

      <DocumentationSection title="1. Tworzenie i Importowanie Testów (CSV oraz JSON)">
        <p>
          W zakładce <strong>Testy</strong> możesz tworzyć narzędzia diagnostyczne na trzy sposoby: ręcznie w edytorze wizualnym, importując plik <strong>CSV (Excel)</strong> lub przywracając pełną kopię <strong>JSON</strong>.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-2">Jak przygotować plik CSV do importu testu?</h3>
        <p>
          Kliknij <strong>Utwórz Test &rarr; Importuj z pliku CSV (Excel)</strong>, aby otworzyć kreator i pobrać gotowy szablon. Plik CSV powinien mieć w pierwszym wierszu następujące kolumny oddzielone średnikiem (<code>;</code>) lub przecinkiem (<code>,</code>):
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
          <li><strong><code>pytanie</code></strong> — treść pytania wyświetlana osobie badanej.</li>
          <li><strong><code>typ</code></strong> — <code>likert-5</code> (skala 1–5), <code>yes-no</code> (Tak/Nie), <code>scale-1-10</code> (skala 1–10) lub <code>multiple-choice</code> (własne opcje).</li>
          <li><strong><code>skala</code></strong> — nazwa skali (np. <code>Ekstrawersja</code>). System automatycznie utworzy skale i zsumuje ich maksymalną punktację (<code>maxScore</code>).</li>
          <li><strong><code>odwrocone</code></strong> — wpisz <code>TAK</code> dla pytań odwróconych lub <code>NIE</code> dla zwykłych.</li>
          <li><strong><code>opcje</code></strong> — (tylko dla <code>multiple-choice</code>) lista odpowiedzi z punktami oddzielona znakiem <code>|</code>, np. <code>Nigdy:0|Czasami:1|Często:2</code>.</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-2">Wersjonowanie Testów (v1, v2...)</h3>
        <p>
          Podczas edycji istniejącego testu możesz kliknąć <strong>„Zapisz jako nową wersję (v+1)”</strong>. System utworzy nową wersję z tym samym identyfikatorem kanonicznym, pozostawiając poprzednią wersję i powiązane z nią historyczne wyniki w nienaruszonym stanie.
        </p>
      </DocumentationSection>

      <DocumentationSection title="2. Zarządzanie Kodami Dostępu i Przekazywanie ich Terapeutom">
        <p>
          Kody dostępu mogą być generowane wyłącznie dla testów o statusie <strong>Opublikowany (PUBLISHED)</strong>. Obok każdego kodu dostępny jest przycisk <strong>„Kopiuj link”</strong>, który kopiuje bezpośredni adres URL do badania.
        </p>
        <Alert type="info" title="Przekazywanie kodów między terapeutami (tylko Administrator)">
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>W zakładce <strong>Kody dostępu</strong> możesz w każdej chwili zmienić przypisanego terapeutę dla dowolnego aktywnego kodu za pomocą listy rozwijanej w tabeli.</li>
            <li>W zakładce <strong>Użytkownicy</strong> podczas usuwania konta terapeuty system wyświetli okno dialogowe pozwalające <strong>przekazać wszystkie aktywne kody i wyniki innemu terapeucie</strong>, aby żaden wygenerowany kod nie przepadł wraz z usuwanym kontem.</li>
          </ul>
        </Alert>
      </DocumentationSection>

      <DocumentationSection title="3. Bezpieczeństwo, Prywatność i Automatyczna Retencja (60 dni)">
        <Alert type="security" title="100% Anonimowości Klienta i Szyfrowanie AES-256-GCM">
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>System nie pobiera ani nie przechowuje adresów e-mail, imion ani nazwisk osób badanych. Jedynym łącznikiem jest jednorazowy kod <code>AC-XXXXXXXX</code>.</li>
            <li>Klucze API modeli AI oraz hasła SMTP są szyfrowane w bazie danych algorytmem <strong>AES-256-GCM</strong>.</li>
            <li>Wyniki badań starsze niż <strong>60 dni</strong> oraz przeterminowane kody dostępu są automatycznie usuwane z bazy danych, a codzienne kopie zapasowe PostgreSQL są zapisywane w kontenerze <code>testy_db_backup</code>.</li>
          </ul>
        </Alert>
      </DocumentationSection>
    </div>
  );
};

export default DocumentationPage;
