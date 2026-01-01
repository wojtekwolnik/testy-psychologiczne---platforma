
import React from 'react';

// Helper components for styling the documentation page
const DocumentationSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-[var(--secondary-color)] p-6 sm:p-8 rounded-xl shadow-lg mb-8">
    <h2 className="text-3xl font-bold mb-4 border-b border-[var(--border-color)] pb-3">{title}</h2>
    <div className="prose prose-lg max-w-none text-[var(--text-color)] prose-headings:text-[var(--text-color)] prose-strong:text-[var(--text-color)] prose-a:text-[var(--primary-color)]">
      {children}
    </div>
  </section>
);

const Alert: React.FC<{ type: 'info' | 'security'; title: string; children: React.ReactNode }> = ({ type, title, children }) => {
  const colors = {
    info: 'bg-sky-50 border-sky-400 text-sky-800',
    security: 'bg-red-50 border-red-400 text-red-800'
  };
  return (
    <div className={`p-4 border-l-4 rounded-r-lg mt-4 ${colors[type]}`}>
      <p className="font-bold">{title}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
};


const DocumentationPage: React.FC = () => {

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-5xl font-extrabold">Dokumentacja Panelu</h1>
        <p className="opacity-80 mt-2 text-lg">Przewodnik po funkcjach dostępnych dla administratora.</p>
      </div>

      <DocumentationSection title="Zarządzanie Testami">
        <p>
          Panel Administratora pozwala na pełne zarządzanie cyklem życia testów. Możesz tworzyć testy od zera w edytorze, importować je z plików lub eksportować w celu utworzenia kopii zapasowej.
        </p>
        <Alert type="info" title="JSON vs CSV: Kiedy używać którego formatu?">
          <ul>
            <li>Użyj importu <strong>JSON</strong>, aby <strong>przywrócić kopię zapasową</strong> lub przenieść istniejący, w pełni skonfigurowany test z innej instancji tej aplikacji.</li>
            <li>Użyj importu <strong>CSV</strong>, aby <strong>stworzyć nowy test od zera</strong> na podstawie listy pytań, np. z arkusza kalkulacyjnego lub pliku Word.</li>
          </ul>
        </Alert>
        <h3 className="text-2xl font-semibold mt-6 mb-2">Edytor Testów</h3>
        <p>
          Edytor pozwala na precyzyjne definiowanie każdego aspektu testu: od podstawowych informacji, przez skale, po pytania i skomplikowane reguły punktacji. Jedna odpowiedź może przyznawać punkty (również ujemne) do wielu skal jednocześnie.
        </p>
        <h3 className="text-2xl font-semibold mt-6 mb-2">Zarządzanie Wersjami</h3>
        <p>
          Podczas zapisywania zmian w istniejącym teście, masz dwie opcje:
        </p>
        <ul>
          <li><strong>Zapisz zmiany:</strong> Nadpisuje bieżącą wersję testu. Używaj do drobnych poprawek.</li>
          <li><strong>Zapisz jako nową wersję:</strong> Tworzy nową, oddzielną wersję testu, zachowując starą w nienaruszonym stanie. Jest to zalecana opcja przy wprowadzaniu istotnych zmian merytorycznych, ponieważ zapewnia spójność wyników zebranych na podstawie poprzedniej wersji.</li>
        </ul>
      </DocumentationSection>

      <DocumentationSection title="Wyniki i Zarządzanie Kodami">
        <h3 className="text-xl font-semibold mt-2 mb-2">Przeglądanie Wyników</h3>
        <p>
          Administrator ma dostęp do <strong>wszystkich wyników testów</strong> zebranych w systemie, niezależnie od tego, który terapeuta je zlecił.
        </p>
        <ul className="list-disc pl-5 mt-2 mb-4">
          <li>Aby zobaczyć wyniki, kliknij <strong>"Wyniki Testów"</strong> w lewym menu nawigacyjnym.</li>
          <li>Zostaniesz przeniesiony do panelu tożsamego z panelem terapeuty, ale z uprawnieniami administratora.</li>
          <li>Widoczne są tam wszystkie ukończone testy. Możesz używać filtrów (ID klienta, data, rodzaj testu) tak samo jak terapeuta.</li>
        </ul>

        <h3 className="text-xl font-semibold mt-4 mb-2">Generowanie i Przypisywanie Kodów (Nowość)</h3>
        <p>
          Jako administrator, masz unikalną możliwość generowania kodów dostępu w imieniu innych terapeutów. Jest to przydatne, gdy np. chcesz pomóc terapeucie w obsłudze klienta lub przetestować system.
        </p>
        <div className="bg-sky-50 border-l-4 border-sky-500 p-4 my-4 rounded-r">
          <h4 className="font-bold text-sky-800">Jak przypisać kod do terapeuty?</h4>
          <ol className="list-decimal pl-5 mt-2 text-sky-900">
            <li>Wejdź w zakładkę <strong>"Wyniki Testów"</strong>.</li>
            <li>W sekcji "Generator kodów dostępu" zobaczysz dodatkowe pole: <strong>"Przypisz do"</strong>.</li>
            <li>Wybierz z listy terapeutę, dla którego chcesz wygenerować kod. Możesz też wybrać siebie.</li>
            <li>Wybierz test i datę ważności, a następnie kliknij <strong>"Generuj kod"</strong>.</li>
          </ol>
        </div>
        <p>
          <strong>Efekt:</strong> Wygenerowany kod pojawi się w panelu wybranego terapeuty (oraz Twoim widoku admina). Gdy klient wypełni test używając tego kodu, wynik zostanie przypisany do konta wybranego terapeuty.
        </p>
      </DocumentationSection>

      <DocumentationSection title="Panel Terapeuty i Dostęp do Danych">
        <p>
          Panel terapeuty jest jego centrum pracy. Może w nim generować kody dostępu dla pacjentów i przeglądać ukończone wyniki.
        </p>
        <Alert type="security" title="Bezpieczeństwo Danych Pacjentów">
          <p>
            Zgodnie z modelem bezpieczeństwa aplikacji, terapeuta po zalogowaniu otrzymuje unikalny token (JWT), który jest jak cyfrowa karta dostępowa. Przy każdej próbie pobrania listy wyników, serwer weryfikuje ten token i wykonuje filtrowanie **po stronie serwera**.
          </p>
          <p className="mt-2">
            Oznacza to, że do przeglądarki terapeuty wysyłane są **wyłącznie i tylko te wyniki, które pochodzą z kodów dostępu wygenerowanych przez tego konkretnego terapeutę.** Gwarantuje to pełną separację i poufność danych między kontami terapeutów.
          </p>
        </Alert>
      </DocumentationSection>

      <DocumentationSection title="Prywatność i Anonimowość Klienta">
        <p>
          Ochrona danych i anonimowość osób badanych jest absolutnym priorytetem platformy.
        </p>
        <p>
          System został zaprojektowany tak, aby <strong>nie zbierać, nie przetwarzać ani nie przechowywać żadnych danych, które mogłyby pomóc w identyfikacji klienta</strong> (adres IP, dane przeglądarki, pliki cookie). Jedynym powiązaniem między wynikiem a osobą jest losowo wygenerowany, jednorazowy kod dostępu, który terapeuta przekazuje klientowi. Po stronie systemu, wynik jest całkowicie zanonimizowany.
        </p>
      </DocumentationSection>

    </div>
  );
};

export default DocumentationPage;
