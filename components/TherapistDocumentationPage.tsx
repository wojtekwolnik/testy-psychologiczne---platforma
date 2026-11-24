import React from 'react';

const DocSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-surface/90 border border-border p-6 sm:p-8 rounded-2xl shadow-xl mb-8">
    <h2 className="text-2xl sm:text-3xl font-bold mb-4 border-b border-border pb-3 text-text">{title}</h2>
    <div className="prose prose-invert max-w-none text-text-muted prose-headings:text-text prose-strong:text-text prose-code:text-primary">
      {children}
    </div>
  </section>
);

const TherapistDocumentationPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto text-text">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold">Instrukcja dla Terapeuty</h1>
        <p className="text-text-muted mt-2 text-lg">
          Przewodnik krok po kroku po przeprowadzaniu badań, analizie raportów i porównywaniu wyników na platformie Real Moment.
        </p>
      </div>

      <DocSection title="Krok 1: Generowanie Kodów (Pojedynczo lub w Serii) oraz Bezpośrednich Linków">
        <ol className="list-decimal pl-5 space-y-2.5">
          <li>Przejdź do zakładki <strong>Wyniki i Kody</strong> (Panel Główny).</li>
          <li>W sekcji generatora wybierz z listy opublikowany test psychologiczny (np. <em>Wielka Piątka</em> lub <em>DASS-42</em>).</li>
          <li>Ustaw datę ważności kodu (domyślnie 7 dni) oraz wpisz w polu <strong>Liczba kodów</strong> dokładnie taką liczbę kodów, jakiej potrzebujesz (np. 1, 4, 7 — od <strong>1 do 50 kodów jednocześnie</strong>, bez tworzenia nadmiarowych kodów).</li>
          <li>Kliknij <strong>„Generuj kod”</strong> (lub <strong>„Generuj (N)”</strong> przy serii).</li>
          <li>
            Przy wygenerowaniu serii kilku kodów pojawi się pasek szybkiego kopiowania: możesz jednym kliknięciem wybrać{' '}
            <strong>„Kopiuj wszystkie kody”</strong> lub <strong>„Kopiuj wszystkie linki”</strong>.
          </li>
          <li>
            Na liście aktywnych kodów przy każdym kodzie masz do dyspozycji trzy przyciski:
            <ul className="list-disc pl-5 mt-1.5 space-y-1">
              <li>
                <strong>„Kopiuj kod”</strong> — kopiuje sam jednorazowy kod dostępu, który klient może wpisać na stronie głównej.
              </li>
              <li>
                <strong>„Kopiuj link” (Zalecane)</strong> — kopiuje bezpośredni link do badania z automatycznie podstawionym kodem, dzięki czemu klient po kliknięciu trafia od razu do ekranu powitalnego testu bez ręcznego przepisywania znaków.
              </li>
              <li>
                <strong>„📱 Kod QR” (W gabinecie)</strong> — wyświetla na ekranie czytelny kod QR, który klient może zeskanować aparatem swojego telefonu bezpośrednio w gabinecie, aby natychmiast otworzyć badanie.
              </li>
            </ul>
          </li>
        </ol>
      </DocSection>

      <DocSection title="Krok 2: Przebieg Badania u Klienta (Warunki Badania, Auto-zapis i Walidacja)">
        <ul className="list-disc pl-5 space-y-2.5">
          <li>
            <strong>Akceptacja warunków badania:</strong> Przed rozpoczęciem testu klient widzi skrócone podsumowanie{' '}
            <em>Warunków wykonywania badań</em> (informujące o pomocniczym i przesiewowym charakterze narzędzia oraz zasadach bezpieczeństwa) i zatwierdza przystąpienie do badania.
          </li>
          <li>
            <strong>Trwały auto-zapis postępu w przeglądarce:</strong> Odpowiedzi klienta oraz numer aktualnej sekcji zapisują się automatycznie po każdym kliknięciu. Nawet jeśli klient wypełnia długi test (np. 120 pytań) na telefonie i przypadkowo odświeży stronę lub zamknie kartę, po ponownym otwarciu linku system przywróci wszystkie zaznaczone odpowiedzi i pozwoli kontynuować od miejsca przerwania.
          </li>
          <li>
            <strong>Wskazywanie pominiętych pytań:</strong> Jeśli klient pominie odpowiedź na stronie i kliknie <em>„Dalej”</em>, ekran płynnie przewinie się prosto do pierwszego brakującego pytania i wyróżni je czytelną ramką <strong>BRAK ODPOWIEDZI</strong>.
          </li>
        </ul>

        <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-r-xl mt-4">
          <p className="font-bold text-text mb-1">Powiadomienia o ukończeniu badania</p>
          <p className="text-sm text-text-muted">
            Gdy klient prześle odpowiedzi, kod dostępu wygasa, a Ty otrzymujesz powiadomienie w aplikacji (ikona dzwonka w panelu bocznym) oraz wiadomość e-mail (jeśli powiadomienia SMTP są aktywne).
          </p>
        </div>
      </DocSection>

      <DocSection title="Krok 3: Analiza Raportu, Filtrowanie Odpowiedzi po Skali, Klucz Testu i AI">
        <ul className="list-disc pl-5 space-y-2.5">
          <li>
            <strong>Wykresy i progi punktowe:</strong> W widoku raportu możesz przełączać wizualizację między{' '}
            <strong>wykresem słupkowym</strong> a <strong>wykresem radarowym (pajączkowym)</strong>. Wyniki są automatycznie przyporządkowane do progów interpretacyjnych zdefiniowanych w teście (np. poziomy <em>Niski / Przeciętny / Wysoki</em> w Wielkiej Piątce lub 6 poziomów stenowych w <em>DASS-42</em>).
          </li>
          <li>
            <strong>Filtrowanie i sortowanie odpowiedzi według skali:</strong> W prawej kolumnie <em>„Udzielone Odpowiedzi”</em> możesz:
            <ul className="list-disc pl-5 mt-1.5 space-y-1">
              <li>
                wybrać z listy konkretną skalę (np. <em>Lęk</em>, <em>Depresja</em>, <em>Neurotyczność</em>), aby zobaczyć wyłącznie pytania budujące wynik tej skali,
              </li>
              <li>
                kliknąć przycisk <strong>„↓ Najwyżej punktowane”</strong>, aby posortować odpowiedzi klienta od tych, które dodały najwięcej punktów do badanej skali (przy każdej odpowiedzi widoczny jest znacznik punktowy, np. <code>+4/5 pkt</code>).
              </li>
            </ul>
          </li>
          <li>
            <strong>Interpretacja z klucza testu oraz Synteza AI:</strong> W sekcji <em>Interpretacja i notatki terapeuty</em> masz do dyspozycji:
            <ul className="list-disc pl-5 mt-1.5 space-y-1">
              <li>
                <strong>„Wstaw z klucza testu”</strong> — automatycznie odtwarza pełną interpretację opisową przypisaną do osiągniętych progów punktowych we wszystkich skalach i podskalach.
              </li>
              <li>
                <strong>„Synteza profilu z AI”</strong> — generuje pogłębioną analizę interakcji między skalami oraz hipotezy kliniczne i pytania pogłębiające na sesję. Po wygenerowaniu możesz wybrać:{' '}
                <strong>„Dołącz pod obecną interpretacją i zapisz”</strong> (zachowując opis z klucza i dopisując pod nim syntezę AI) lub{' '}
                <strong>„Zastąp całość i zapisz”</strong>.
              </li>
            </ul>
          </li>
          <li>
            <strong>Wskaźniki stylu i spójności odpowiedzi:</strong> W prawej kolumnie raportu znajduje się rozwijana karta{' '}
            <em>„Wskaźniki stylu odpowiedzi”</em>, która automatycznie analizuje profil pod kątem długich serii identycznych wyborów z rzędu (<em>longstring</em>), tendencji centralnej (unikania deklaracji) oraz rozbieżności między pytaniami wprost a pytaniami odwróconymi.
          </li>
          <li>
            <strong>Dwa tryby eksportu do PDF (Gabinetowy vs dla Klienta):</strong> W sekcji <em>Opcje Eksportu PDF</em> możesz wygenerować:
            <ul className="list-disc pl-5 mt-1.5 space-y-1">
              <li>
                <strong>„PDF Gabinetowy (Pełny)”</strong> — pełny raport zawierający wykresy, tabele wyników, Twoje notatki robocze, syntezę AI oraz listę odpowiedzi zgodnie z szablonem.
              </li>
              <li>
                <strong>„PDF dla Klienta”</strong> — bezpieczna wersja do wydania osobie badanej: zawiera wykres profilu, tabelę wyników, neutralne opisy osiągniętych progów z klucza testu oraz klauzulę metodologiczną, z pominięciem prywatnych notatek roboczych terapeuty i surowej listy wszystkich pytań.
              </li>
            </ul>
          </li>
        </ul>
      </DocSection>

      <DocSection title="Krok 4: Porównywanie Dwóch Wyników Badań (Pre-test / Post-test)">
        <p>
          Jeśli klient wypełnił ten sam kwestionariusz dwukrotnie (np. na początku współpracy i po kilku tygodniach terapii), możesz zestawić oba badania obok siebie:
        </p>
        <ol className="list-decimal pl-5 space-y-2 mt-3">
          <li>
            Kliknij przycisk <strong>„⇄ Porównaj”</strong> przy wybranym wyniku w tabeli <em>Ukończone testy</em> albo przycisk{' '}
            <strong>„⇄ Porównaj z innym wynikiem (Pre / Post)”</strong> bezpośrednio wewnątrz otwartego raportu.
          </li>
          <li>
            W oknie porównania wybierz <strong>Badanie 1 (Bazowe / Pre-test)</strong> oraz <strong>Badanie 2 (Porównawcze / Post-test)</strong> (możesz też zamienić je miejscami przyciskiem <strong>„⇄”</strong>).
          </li>
          <li>
            Analizuj zmiany w trzech zakładkach:
            <ul className="list-disc pl-5 mt-1.5 space-y-1">
              <li>
                <strong>📊 Skale i Różnice (Δ):</strong> podwójne paski porównawcze pokazujące dokładną zmianę punktową i procentową (<code>Δ</code>) oraz wyróżniające skale, w których nastąpiła <strong>zmiana progu interpretacyjnego</strong> (np. <em>Wysoki &rarr; Umiarkowany</em>).
              </li>
              <li>
                <strong>🕸️ Wykres Radarowy:</strong> nakładany wykres pajączkowy obu badań na jednej siatce (linia przerywana dla Pre-testu i pełna dla Post-testu).
              </li>
              <li>
                <strong>📝 Odpowiedzi na Pytania:</strong> zestawienie konkretnych pytań, w których odpowiedź klienta uległa zmianie między pierwszym a drugim badaniem (z możliwością filtrowania po skali).
              </li>
            </ul>
          </li>
          <li>
            W dolnym pasku okna porównania możesz jednym kliknięciem wybrać{' '}
            <strong>„📥 Pobierz Raport Porównawczy PDF”</strong> (aby wygenerować osobny dokument PDF zestawiający wyniki Pre-test i Post-test, różnice punktowe <code>Δ</code> oraz przesunięcia progów) albo{' '}
            <strong>„➕ Dołącz zestawienie Pre/Post do notatek raportu”</strong>.
          </li>
        </ol>
        <p className="mt-3 text-sm">
          Dodatkowo w tabeli <em>Ukończone testy</em> w Panelu Terapeuty dostępny jest przycisk{' '}
          <strong>„📥 Eksportuj do CSV”</strong>, który pozwala pobrać aktualnie wyfiltrowane, zanonimizowane wyniki (kody, daty i wyniki punktowe wszystkich skal) do pliku kompatybilnego z programem Microsoft Excel.
        </p>
      </DocSection>

      <DocSection title="Krok 5: 100% Anonimowości Klienta i 60-dniowa Retencja Danych">
        <p>
          Platforma nie zbiera imion, nazwisk ani adresów e-mail osób badanych — jedynym identyfikatorem w systemie jest wygenerowany przez Ciebie jednorazowy kod dostępu. Zgodnie z polityką minimalizacji danych wyniki badań są automatycznie usuwane z bazy po upływie <strong>60 dni</strong> od daty ukończenia (w tabeli wyników widoczny jest licznik dni pozostałych do automatycznego usunięcia).
        </p>
      </DocSection>
    </div>
  );
};

export default TherapistDocumentationPage;
