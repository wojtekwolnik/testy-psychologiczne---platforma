import React from 'react';

const DocSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-surface/90 border border-border p-6 sm:p-8 rounded-2xl shadow-xl mb-8">
    <h2 className="text-2xl sm:text-3xl font-bold mb-4 border-b border-border pb-3 text-text">{title}</h2>
    <div className="prose prose-invert max-w-none text-text-muted prose-headings:text-text prose-strong:text-text">
      {children}
    </div>
  </section>
);

const TherapistDocumentationPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto text-text">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold">Instrukcja dla Terapeuty</h1>
        <p className="text-text-muted mt-2 text-lg">Przewodnik krok po kroku po przeprowadzaniu badań na platformie Real Moment.</p>
      </div>

      <DocSection title="Krok 1: Generowanie Kodu lub Bezpośredniego Linku">
        <ol className="list-decimal pl-5 space-y-2">
          <li>Przejdź do <strong>Panelu Głównego</strong>.</li>
          <li>W sekcji <strong>Generator kodów dostępu</strong> wybierz z listy opublikowany test psychologiczny.</li>
          <li>Ustaw datę ważności kodu (domyślnie 7 dni) i kliknij <strong>„Generuj kod”</strong>.</li>
          <li>Na liście aktywnych kodów możesz kliknąć <strong>„Kopiuj kod”</strong> (sam kod <code>AC-...</code>) lub <strong>„Kopiuj link”</strong> (bezpośredni link, po kliknięciu którego klient od razu trafia do potwierdzenia testu bez konieczności ręcznego wpisywania kodu).</li>
        </ol>
      </DocSection>

      <DocSection title="Krok 2: Wypełnienie Testu przez Klienta i Powiadomienia">
        <p>
          Klient otwiera otrzymany link (lub wpisuje kod na stronie głównej) i odpowiada na pytania. Postęp odpowiedzi klienta jest zapisywany w pamięci jego przeglądarki na wypadek przypadkowego odświeżenia karty.
        </p>
        <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-r-xl mt-4">
          <p className="font-bold text-text mb-1">Powiadomienia o ukończeniu badania</p>
          <p className="text-sm text-text-muted">
            Gdy klient zakończy badanie, otrzymasz powiadomienie w aplikacji (ikona dzwonka w menu bocznym) oraz wiadomość e-mail z bezpośrednim linkiem do raportu.
          </p>
        </div>
      </DocSection>

      <DocSection title="Krok 3: Analiza Raportu, Wykresy i Notatki">
        <ul className="list-disc pl-5 space-y-2">
          <li>Kliknij <strong>„Zobacz raport”</strong> przy wybranym wyniku w tabeli ukończonych testów.</li>
          <li>W raporcie online możesz przełączać widok między <strong>wykresem słupkowym</strong> a <strong>wykresem radarowym (pajączkowym)</strong>.</li>
          <li>W sekcji <strong>Interpretacja i notatki terapeuty</strong> możesz wygenerować wspomagającą analizę AI (przycisk <strong>„Generuj z AI”</strong>), edytować własne wnioski i zapisać je na stałe przyciskiem <strong>„Zapisz notatki w bazie”</strong>.</li>
          <li>Przycisk <strong>„Pobierz PDF”</strong> generuje gotowy dokument PDF z wybranym szablonem.</li>
        </ul>
      </DocSection>

      <DocSection title="Krok 4: 100% Anonimowości i 60-dniowa Retencja">
        <p>
          Platforma nie zbiera żadnych danych osobowych ani adresów e-mail osób badanych — tylko Ty w swoich notatkach poza systemem wiesz, któremu klientowi przekazałeś dany kod. Wyniki są automatycznie usuwane z bazy danych po upływie <strong>60 dni</strong> od ukończenia badania.
        </p>
      </DocSection>
    </div>
  );
};

export default TherapistDocumentationPage;
