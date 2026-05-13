import React from 'react';

const DocSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-[var(--secondary-color)] p-8 rounded-xl shadow-lg mb-8">
    <h2 className="text-3xl font-bold mb-4 border-b border-[var(--border-color)] pb-3">{title}</h2>
    <div className="prose prose-lg max-w-none text-[var(--text-color)] prose-headings:text-[var(--text-color)] prose-strong:text-[var(--text-color)]">
      {children}
    </div>
  </section>
);

const TherapistDocumentationPage: React.FC = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold">Instrukcja dla Terapeuty</h1>
        <p className="opacity-80 mt-2 text-lg">Przewodnik krok po kroku po procesie przeprowadzania testu z klientem.</p>
      </div>

      <DocSection title="Krok 1: Generowanie Kodu Dostępu">
        <p>
          Pierwszym krokiem jest wygenerowanie unikalnego, jednorazowego kodu dostępu dla Twojego klienta.
        </p>
        <ol>
          <li>Przejdź do <strong>Panelu Głównego</strong>.</li>
          <li>W sekcji <strong>"Generator kodów dostępu"</strong> znajdź rozwijaną listę ze wszystkimi dostępnymi testami.</li>
          <li>Wybierz z listy test, który ma wypełnić klient.</li>
          <li>Ustaw datę ważności kodu. Domyślnie jest to 7 dni, ale możesz ją skrócić lub wydłużyć.</li>
          <li>Kliknij przycisk <strong>"Generuj kod"</strong>. Nowy kod pojawi się na liście "Aktywne kody" poniżej.</li>
        </ol>
        <p>
          <strong>Ważne:</strong> Każdy kod jest jednorazowy i ma datę ważności. Po jego użyciu lub po upływie terminu, kod znika z listy aktywnych i nie można go użyć ponownie.
        </p>
      </DocSection>

      <DocSection title="Krok 2: Przekazanie Kodu i Oczekiwanie na Wynik">
        <p>
          Skopiuj wygenerowany kod i przekaż go swojemu klientowi w bezpieczny sposób (np. podczas sesji, mailem lub komunikatorem).
        </p>
        <p>
          Klient wprowadza ten kod na głównej stronie aplikacji, aby uzyskać dostęp do testu. Po wypełnieniu i przesłaniu wszystkich odpowiedzi, system automatycznie przetworzy wyniki.
        </p>
        <div className="p-4 bg-sky-100 border-l-4 border-sky-500 text-sky-800 rounded mt-4">
          <p className="font-bold">Powiadomienia w Aplikacji i E-mail</p>
          <p>
            Gdy tylko klient ukończy test, <strong>otrzymasz powiadomienie na dwa sposoby</strong>:
          </p>
          <ul>
            <li><strong>W aplikacji:</strong> Ikona dzwonka w prawym górnym rogu menu nawigacyjnego zaświeci się na czerwono.</li>
            <li><strong>E-mail:</strong> Otrzymasz automatyczne powiadomienie na Twój adres e-mail zarejestrowany w systemie.</li>
          </ul>
           <p>Dzięki temu nie musisz ciągle sprawdzać, czy pojawiły się nowe wyniki.</p>
        </div>
      </DocSection>

      <DocSection title="Krok 3: Analiza Raportu">
        <p>
          Nowy wynik będzie widoczny na górze listy w tabeli <strong>"Ukończone testy"</strong>. Możesz użyć wbudowanych filtrów, aby przeszukiwać wyniki po ID klienta, nazwie testu lub zakresie dat.
        </p>
        <ul>
            <li>Kliknij przycisk <strong>"Zobacz raport"</strong>, aby przejść do szczegółowej analizy wyników.</li>
            <li>W widoku raportu znajdziesz tabelę z punktacją, wizualne wykresy oraz, w zależności od wybranego szablonu, listę odpowiedzi klienta.</li>
            <li><strong>Wybór szablonu:</strong> W prawym górnym rogu widoku raportu możesz dynamicznie zmieniać szablon PDF, aby dostosować wygląd do swoich potrzeb.</li>
            <li><strong>Pobieranie PDF:</strong> Użyj przycisku <strong>"Pobierz PDF"</strong>, aby zapisać raport na swoim komputerze.</li>
        </ul>
      </DocSection>
      
      <DocSection title="Korzystanie z Asystenta AI">
        <p>
            Jeśli administrator włączył tę funkcję, w widoku raportu dostępny będzie przycisk <strong>"Asystent AI"</strong>. Narzędzie to generuje wstępną, neutralną sugestię interpretacji wyników na podstawie danych liczbowych.
        </p>
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded mt-4">
            <p className="font-bold">Ważne Zastrzeżenie</p>
            <p>
                Sugestie generowane przez AI mają <strong>charakter wyłącznie pomocniczy i informacyjny</strong>. Nie stanowią diagnozy i nie zastępują Twojej profesjonalnej oceny klinicznej. Zawsze traktuj je jako punkt wyjścia do własnej, pogłębionej analizy.
            </p>
        </div>
      </DocSection>
      
      <DocSection title="Bezpieczeństwo i Anonimowość Klienta">
        <p>
            Dbamy o prywatność Twoich klientów. Wszystkie wyniki testów są przechowywane w systemie przez ograniczony czas i w sposób gwarantujący anonimowość.
        </p>
        <div className="p-4 bg-green-100 border-l-4 border-green-500 text-green-800 rounded mt-4">
            <p className="font-bold">Gwarancja Anonimowości</p>
            <p>
                Podczas wypełniania testu, system <strong>nie zbiera żadnych danych identyfikujących klienta</strong>, takich jak adres IP, informacje o przeglądarce czy urządzeniu. Jedynym identyfikatorem jest przekazany przez Ciebie kod.
            </p>
        </div>
        <div className="p-4 bg-amber-100 border-l-4 border-amber-500 text-amber-800 rounded mt-4">
            <p className="font-bold">Automatyczne Usuwanie Danych</p>
            <p>
                Każdy wynik jest <strong>automatycznie i trwale usuwany z systemu po 60 dniach</strong> od daty jego ukończenia. Kolumna "Usuwanie za" w panelu głównym informuje, ile dni pozostało do usunięcia danego raportu.
            </p>
        </div>
        <p className="mt-4">
            Możesz również ręcznie usunąć wynik w dowolnym momencie, klikając ikonę kosza. Aby zapobiec przypadkowemu usunięciu, <strong>system poprosi Cię o dodatkowe potwierdzenie</strong> w oknie dialogowym. Pamiętaj, że po potwierdzeniu operacja jest nieodwracalna.
        </p>
      </DocSection>
    </div>
  );
};

export default TherapistDocumentationPage;
