import React from 'react';

const DocumentationSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-[var(--secondary-color)] p-8 rounded-xl shadow-lg mb-8">
    <h2 className="text-3xl font-bold mb-4 border-b border-[var(--border-color)] pb-3">{title}</h2>
    <div className="prose prose-lg max-w-none text-[var(--text-color)] prose-headings:text-[var(--text-color)] prose-strong:text-[var(--text-color)]">
      {children}
    </div>
  </section>
);

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-slate-800 text-white p-4 rounded-lg overflow-x-auto text-sm">
        <code>{children}</code>
    </pre>
);

const DocumentationPage: React.FC = () => {
    const exampleJson = {
        "id": "test-example-v1",
        "canonicalId": "tid-example",
        "version": 1,
        "createdAt": "2023-10-27T10:00:00.000Z",
        "title": "<b>Przykładowy</b> Test Możliwości",
        "description": "<i>Ten test pokazuje zaawansowane możliwości systemu.</i>",
        "instructions": "Odpowiedz na pytania.",
        "questionsPerPage": 2,
        "scales": [
            { "id": "s-1", "name": "Spostrzegawczość", "description": "Mierzy zdolność do zauważania detali." },
            { "id": "s-2", "name": "Kreatywność", "description": "Mierzy zdolność do myślenia poza schematami." }
        ],
        "sections": [{
            "id": "sec-1",
            "title": "Sekcja 1: Analiza Wizualna",
            "questions": [{
                "id": "q-1",
                "text": "Który z poniższych kolorów <u>nie jest</u> kolorem podstawowym?",
                "type": "multiple-choice",
                "options": [
                    { "id": "o-1", "text": "Czerwony" },
                    { "id": "o-2", "text": "Zielony" },
                    { "id": "o-3", "text": "Niebieski" }
                ],
                "scoring": {
                    "o-1": [{ "scaleId": "s-1", "points": 0 }],
                    "o-2": [{ "scaleId": "s-1", "points": 1 }],
                    "o-3": [{ "scaleId": "s-1", "points": 0 }]
                }
            }, {
                "id": "q-2",
                "text": "Wybierz wszystkie cechy, które opisują Cię w pracy:",
                "type": "multiple-select",
                "options": [
                    { "id": "o-4", "text": "Terminowy" },
                    { "id": "o-5", "text": "Pomysłowy" },
                    { "id": "o-6", "text": "Dokładny" }
                ],
                "scoring": {
                    "o-4": [{ "scaleId": "s-1", "points": 1 }],
                    "o-5": [{ "scaleId": "s-2", "points": 2 }],
                    "o-6": [{ "scaleId": "s-1", "points": 1 }]
                }
            }]
        }],
        "defaultTemplateId": "tpl-default"
    };

    const exampleCsv = `section_title,question_text,question_type,option_text,scale_name_1,points_1,scale_name_2,points_2
"Cechy osobowości","Zgadzam się ze stwierdzeniem: <b>Jestem osobą otwartą na nowe doświadczenia.</b>","likert-5","Zdecydowanie się nie zgadzam","Otwartość",1,"",
"Cechy osobowości","Zgadzam się ze stwierdzeniem: <b>Jestem osobą otwartą na nowe doświadczenia.</b>","likert-5","Nie zgadzam się","Otwartość",2,"",
"Cechy osobowości","Zgadzam się ze stwierdzeniem: <b>Jestem osobą otwartą na nowe doświadczenia.</b>","likert-5","Ani tak, ani nie","Otwartość",3,"",
"Cechy osobowości","Zgadzam się ze stwierdzeniem: <b>Jestem osobą otwartą na nowe doświadczenia.</b>","likert-5","Zgadzam się","Otwartość",4,"",
"Cechy osobowości","Zgadzam się ze stwierdzeniem: <b>Jestem osobą otwartą na nowe doświadczenia.</b>","likert-5","Zdecydowanie się zgadzam","Otwartość",5,"",
"Reakcje na stres","Które z poniższych zachowań stosujesz w stresujących sytuacjach?","multiple-select","Rozmawiam z przyjaciółmi","Radzenie sobie ze stresem",2,"Poziom lęku",-1
"Reakcje na stres","Które z poniższych zachowań stosujesz w stresujących sytuacjach?","multiple-select","Unikam problemu","Radzenie sobie ze stresem",-1,"Poziom lęku",2
"Reakcje na stres","Które z poniższych zachowań stosujesz w stresujących sytuacjach?","multiple-select","Uprawiam sport","Radzenie sobie ze stresem",3,"Poziom lęku",-2
`;

    const aiPrompt = `Przekształć poniższą listę pytań na format CSV zgodny z podaną specyfikacją.

**Specyfikacja formatu CSV:**
Plik musi zawierać następujące nagłówki w pierwszej linii: section_title,question_text,question_type,option_text,scale_name_1,points_1
- Każdy wiersz reprezentuje JEDNĄ opcję odpowiedzi.
- Dla pytań z wieloma opcjami, powtórz ten sam 'section_title' i 'question_text' w kolejnych wierszach dla każdej opcji.
- W kolumnie 'question_type' użyj jednej z wartości: 'multiple-choice', 'multiple-select', 'likert-5'.
- Jeśli punkty mają być przypisane do więcej niż jednej skali, użyj kolejnych kolumn 'scale_name_2', 'points_2' itd.

**Twoje zadanie:**
1. Przeanalizuj listę pytań poniżej.
2. Zidentyfikuj sekcje, pytania, typy pytań i opcje odpowiedzi.
3. Jeśli informacje o skalach lub punktacji są niejasne lub ich brakuje, ZADAJ MI PYTANIE, aby je uzupełnić. Nie wymyślaj punktacji. Zapytaj na przykład: "Dla pytania '...' jakie punkty i do jakiej skali mam przypisać dla odpowiedzi '...?'".
4. Wygeneruj kompletny plik CSV, włączając w to linię z nagłówkami.

**Lista pytań do przetworzenia:**
[TUTAJ WKLEJ SWOJĄ LISTĘ PYTAŃ, NP. Z PLIKU WORD LUB TXT]
`;

    const handleDownload = (content: string, fileName: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold">Dokumentacja Systemu</h1>
        <p className="opacity-80 mt-2 text-lg">Przewodnik po kluczowych funkcjach platformy dla administratora.</p>
      </div>
      
      <DocumentationSection title="Zarządzanie Użytkownikami">
        <p>
            W panelu administratora, w sekcji <strong>"Użytkownicy"</strong>, możesz zarządzać kontami personelu (terapeutów i innych administratorów).
        </p>
        <ul>
            <li><strong>Dodawanie użytkownika:</strong> Kliknij "Dodaj użytkownika", wypełnij dane i ustaw rolę. Pamiętaj, aby przekazać nowemu użytkownikowi ustalone hasło.</li>
            <li><strong>Edycja użytkownika:</strong> Możesz zmienić imię, nazwisko, e-mail oraz status 2FA dla każdego konta.</li>
            <li><strong>Resetowanie hasła:</strong> Jeśli użytkownik zapomni hasła, możesz ustawić dla niego nowe. W oknie edycji wpisz nowe hasło w polu "Nowe hasło" (musi mieć co najmniej 6 znaków). Jeśli pozostawisz to pole puste, obecne hasło nie zostanie zmienione.</li>
            <li><strong>Usuwanie użytkownika:</strong> Usunięcie konta jest trwałe i nieodwracalne.</li>
        </ul>
      </DocumentationSection>

      <DocumentationSection title="Branding i Personalizacja Wyglądu">
        <p>
          Możesz w pełni dostosować wygląd aplikacji, aby pasował do identyfikacji wizualnej Twojej firmy. Wszystkie opcje znajdują się w panelu administratora w sekcji <strong>"Branding"</strong>.
        </p>
        <h3 className="text-2xl font-semibold mt-6 mb-2">Wytyczne dotyczące Logo</h3>
        <p>
          Logo jest kluczowym elementem brandingu. Pojawia się na stronach logowania, w panelu nawigacyjnym oraz w nagłówkach raportów PDF.
        </p>
         <ul>
            <li><strong>Rekomendowany rozmiar:</strong> Najlepsze rezultaty uzyskasz, przesyłając logo o szerokości <strong>256px</strong> i wysokości <strong>64px</strong> (proporcje 4:1).</li>
            <li><strong>Obsługa proporcji:</strong> Nie martw się, jeśli Twoje logo ma inne proporcje (np. jest kwadratowe). System automatycznie przeskaluje je, aby idealnie pasowało do wyznaczonego miejsca, <strong>bez zniekształcania i przycinania</strong>.</li>
             <li><strong>Format pliku:</strong> Zalecane formaty to <strong>SVG</strong> (zapewnia najlepszą jakość i skalowalność) lub <strong>PNG z przezroczystym tłem</strong>.</li>
        </ul>
        <h3 className="text-2xl font-semibold mt-6 mb-2">Paleta Kolorów i Teksty</h3>
        <p>
            Panel brandingu jest podzielony na dwie zakładki: <strong>"Wygląd i Identyfikacja"</strong> (logo, kolory) oraz <strong>"Komunikacja z Klientem"</strong> (wszystkie teksty widoczne dla klienta). System zawiera wbudowany <strong>walidator kontrastu WCAG</strong>, który pomoże Ci upewnić się, że wybrane kolory są czytelne i dostępne dla wszystkich użytkowników.
        </p>
      </DocumentationSection>

      <DocumentationSection title="Konfiguracja E-mail (SMTP)">
        <p>
          System może wysyłać powiadomienia e-mail do terapeutów po ukończeniu testu przez klienta. Aby funkcja działała, musisz skonfigurować połączenie z serwerem pocztowym SMTP. Przejdź do sekcji <strong>"Ustawienia E-mail"</strong> w panelu administratora.
        </p>
        <ul>
            <li><strong>Konfiguracja SMTP:</strong> Wprowadź dane swojego serwera pocztowego (host, port, dane logowania).</li>
            <li><strong>Ustawienia Nadawcy:</strong> Określ, jaka nazwa i adres e-mail mają pojawiać się jako nadawca wiadomości.</li>
            <li><strong>Szablon Powiadomienia:</strong> Możesz edytować temat i treść e-maila. Użyj dynamicznych tagów (np. <code>{'{clientIdentifier}'}</code>, <code>{'{testTitle}'}</code>), aby spersonalizować wiadomość. Pełna lista dostępnych tagów znajduje się w edytorze.</li>
        </ul>
      </DocumentationSection>
      
      <DocumentationSection title="Konfiguracja Asystenta AI">
        <p>
            Możesz zintegrować aplikację z modelem językowym Google Gemini, aby zapewnić terapeutom narzędzie do generowania wstępnych sugestii interpretacji wyników.
        </p>
        <ol>
            <li>Przejdź do sekcji <strong>"Ustawienia AI"</strong>.</li>
            <li><strong>Włącz Asystenta:</strong> Aktywuj przełącznik, aby udostępnić funkcję terapeutom.</li>
            <li><strong>Wprowadź Klucz API:</strong> Wklej swój klucz API dla Google Gemini. Klucz jest przechowywany w sposób bezpieczny.</li>
            <li><strong>Dostosuj Prompt Systemowy:</strong> Możesz edytować instrukcję, która definiuje rolę i zachowanie AI. Jest to kluczowy element, który wpływa na jakość generowanych odpowiedzi.</li>
        </ol>
         <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded mt-4">
            <p className="font-bold">Gwarancja Prywatności</p>
            <p className="text-sm">Do API wysyłane są <strong>wyłącznie zanonimizowane, zagregowane wyniki liczbowe</strong> oraz definicje skal. Żadne odpowiedzi na poszczególne pytania ani dane klienta nie opuszczają systemu.</p>
        </div>
      </DocumentationSection>


      <DocumentationSection title="Import i Eksport Testów">
        <p>Funkcje te pozwalają na łatwe przenoszenie testów między systemami, tworzenie kopii zapasowych oraz masowe dodawanie nowych testów.</p>
        
        <div className="p-4 bg-sky-100 border-l-4 border-sky-500 text-sky-800 rounded mt-4">
            <p className="font-bold">JSON vs CSV: Kiedy używać którego formatu?</p>
            <ul>
                <li>Użyj importu <strong>JSON</strong>, aby <strong>przywrócić kopię zapasową</strong> lub przenieść istniejący, w pełni skonfigurowany test z innej instancji tej aplikacji.</li>
                <li>Użyj importu <strong>CSV</strong>, aby <strong>stworzyć nowy test od zera</strong> na podstawie listy pytań, np. z arkusza kalkulacyjnego.</li>
            </ul>
        </div>
        
        <h3 className="text-2xl font-semibold mt-6 mb-2">Format JSON</h3>
        <p>
          Format JSON jest idealny do tworzenia pełnych kopii zapasowych. Zachowuje całą strukturę, włącznie z formatowaniem HTML w treści.
        </p>
         <div className="flex gap-4 mt-4">
            <button onClick={() => handleDownload(JSON.stringify(exampleJson, null, 2), 'przyklad_zaawansowany.json', 'application/json')} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700">Pobierz przykładowy plik JSON</button>
        </div>
        

        <h3 className="text-2xl font-semibold mt-6 mb-2">Format CSV</h3>
        <p>
          Import z pliku CSV to potężne narzędzie do masowego tworzenia testów. Poniższy przykład pokazuje zaawansowane użycie, w tym pytanie typu Likert oraz pytanie wielokrotnego wyboru z punktacją dla dwóch różnych skal jednocześnie (w tym punkty ujemne).
        </p>
        <div className="flex gap-4 mt-4">
           <button onClick={() => handleDownload(exampleCsv, 'przyklad_zaawansowany.csv', 'text/csv;charset=utf-8;')} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700">Pobierz przykładowy plik CSV</button>
        </div>
        <p className="mt-4"><strong>Przykład zaawansowany (Skala Likerta, wielokrotna punktacja):</strong></p>
        <CodeBlock>
          {exampleCsv}
        </CodeBlock>

        <h4 className="text-xl font-semibold mt-6 mb-2">Jak użyć AI do stworzenia pliku CSV?</h4>
        <p>Jeśli masz listę pytań w pliku tekstowym, możesz użyć modelu językowego (np. Gemini, ChatGPT), aby przyspieszyć tworzenie pliku CSV. Skopiuj poniższy prompt i wklej go do swojego narzędzia AI, a następnie dołącz swoją listę pytań.</p>
        <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 text-indigo-800 rounded mt-4">
            <p className="font-bold">Prompt dla AI:</p>
            <CodeBlock>{aiPrompt}</CodeBlock>
        </div>
      </DocumentationSection>
      
       <DocumentationSection title="Tworzenie i Edycja Testu">
        <p>
          Edytor testów jest sercem aplikacji, pozwalającym na tworzenie złożonych narzędzi diagnostycznych. Aby stworzyć nowy test, przejdź do <strong>Panelu Administratora</strong> i kliknij <strong>"Utwórz Test"</strong>.
        </p>
        <ol>
          <li><strong>Szczegóły Testu:</strong> Wypełnij podstawowe informacje. Możesz tu również ustawić paginację (ile pytań na stronę) oraz domyślny szablon raportu PDF.</li>
          <li>
            <strong>Formatowanie Tekstu:</strong> Wszystkie główne pola tekstowe (tytuły, opisy, pytania, odpowiedzi) obsługują formatowanie! Użyj wbudowanego edytora, aby dodać <strong>pogrubienie</strong>, <em>kursywę</em>, <u>podkreślenie</u> oraz linki.
          </li>
          <li><strong>Skale Oceny:</strong> Skale to wymiary, które mierzysz (np. "Lęk", "Depresja"). Zdefiniuj je przed dodaniem pytań. Każda skala musi mieć unikalną nazwę.</li>
          <li><strong>Sekcje i Pytania:</strong> Testy są podzielone na sekcje. W każdej sekcji możesz dodać pytania. Dostępne typy pytań to:
            <ul>
              <li><strong>Jednokrotny wybór:</strong> Użytkownik może wybrać tylko jedną odpowiedź.</li>
              <li><strong>Wielokrotny wybór:</strong> Użytkownik może wybrać wiele odpowiedzi.</li>
              <li><strong>Skala Likerta (5 st.):</strong> Gotowy zestaw 5 odpowiedzi od "Zdecydowanie się nie zgadzam" do "Zdecydowanie się zgadzam".</li>
            </ul>
          </li>
          <li><strong>Punktacja:</strong> To najważniejszy krok. Dla każdej opcji odpowiedzi w pytaniu możesz dodać <strong>"regułę punktacji"</strong>. Reguła przypisuje określoną liczbę punktów do wybranej skali. Jedna odpowiedź może przyznawać punkty do wielu skal jednocześnie (np. odpowiedź "Często czuję niepokój i smutek" może dodać punkty zarówno do skali "Lęk", jak i "Depresja").</li>
          <li><strong>Walidacja:</strong> System dba o integralność danych. Przed zapisaniem testu walidator sprawdza, czy wszystkie utworzone reguły punktacji mają przypisaną skalę oraz punkty. W przypadku błędu zapis zostanie zablokowany, a Ty zobaczysz komunikat wskazujący problematyczne miejsce.</li>
        </ol>
        <p>
          Podczas edycji istniejącego testu masz dwie opcje zapisu: <strong>"Zapisz zmiany"</strong> (nadpisuje bieżącą wersję) oraz <strong>"Zapisz jako nową wersję"</strong> (tworzy nową, oddzielną wersję testu, zachowując starą).
        </p>
      </DocumentationSection>

      <DocumentationSection title="Zarządzanie Szablonami PDF">
        <p>
          System pozwala na pełną personalizację wyglądu generowanych raportów PDF. Możesz tworzyć wiele szablonów i wybierać, który z nich ma być używany domyślnie dla danego testu.
        </p>
        <ol>
          <li><strong>Tworzenie i Edycja:</strong> W panelu administratora przejdź do "Szablony PDF". Możesz tu stworzyć nowy szablon lub edytować istniejący.</li>
          <li><strong>Opcje personalizacji:</strong> W edytorze szablonów możesz włączyć lub wyłączyć poszczególne sekcje raportu, takie jak wykresy, tabela wyników czy szczegółowe odpowiedzi. Możesz również dodać własny, sformatowany tekst do nagłówka raportu, używając dynamicznych tagów, np. <code>{'{clientIdentifier}'}</code>.</li>
          <li><strong>Przypisywanie do testu:</strong> W edytorze testów, w sekcji "Szczegóły Testu", możesz wybrać "Domyślny szablon raportu PDF". Wybrany szablon będzie domyślnie używany dla każdego wyniku tego testu, ale terapeuta wciąż będzie mógł go zmienić przed pobraniem pliku.</li>
        </ol>
      </DocumentationSection>

      <DocumentationSection title="Dane Zbiorcze i Analiza Psychometryczna">
        <p>
          Panel <strong>"Dane Zbiorcze"</strong> dostarcza anonimowych, zagregowanych danych na temat tego, jak poszczególne testy i pytania działają w praktyce. Dane te są kluczowe do oceny i ulepszania Twoich narzędzi diagnostycznych.
        </p>
        <h3 className="text-2xl font-semibold mt-6 mb-2">Zakładka "Dane Ogólne"</h3>
        <p>
          Tutaj znajdziesz wizualizacje rozkładu wyników w poszczególnych skalach (histogramy) oraz częstotliwości wyboru odpowiedzi dla każdego pytania (wykresy kołowe).
        </p>
        <h3 className="text-2xl font-semibold mt-6 mb-2">Zakładka "Analiza Psychometryczna"</h3>
        <p>
          Ta sekcja zawiera zaawansowane wskaźniki statystyczne:
        </p>
        <ul>
          <li><strong>Alfa Cronbacha:</strong> Mierzy wewnętrzną spójność (rzetelność) skali. Wartości powyżej 0.70 są generalnie uważane za akceptowalne, a powyżej 0.80 za dobre.</li>
          <li><strong>Moc Dyskryminacyjna:</strong> Wskazuje, jak dobrze pytanie różnicuje osoby o wysokich i niskich wynikach w całej skali. Wartości powyżej 0.30 są uważane za dobre. Pytania o niskiej lub ujemnej mocy dyskryminacyjnej mogą wymagać rewizji.</li>
          <li><strong>Trudność Pytania:</strong> Mierzy, jak łatwo było uzyskać punkty w danym pytaniu (w skali 0-1). Wartości bliskie 0 oznaczają pytania "trudne" (mało osób zdobyło punkty), a bliskie 1 - "łatwe". Pytania o skrajnych wartościach mogą być mniej efektywne w różnicowaniu badanych.</li>
        </ul>
      </DocumentationSection>
      
      <DocumentationSection title="Panel Stanu Systemu">
        <p>
          Panel Stanu Systemu to centrum diagnostyczne Twojej aplikacji. Pozwala on na uruchomienie serii automatycznych testów, które weryfikują, czy wszystkie kluczowe komponenty działają poprawnie.
        </p>
        <p>
          Aby uruchomić testy, przejdź do <strong>Panelu Administratora</strong> i kliknij <strong>"Stan Systemu"</strong> w menu nawigacyjnym, a następnie naciśnij przycisk <strong>"Uruchom ponowną weryfikację"</strong>.
        </p>
        <h3 className="text-2xl font-semibold mt-6 mb-2">Interpretacja Statusów</h3>
        <ul>
            <li><strong className="text-green-600">Działa:</strong> Moduł przeszedł testy pomyślnie.</li>
            <li><strong className="text-orange-600">Wykryto problem:</strong> Moduł działa, ale z pewnymi ograniczeniami (np. funkcja AI jest wyłączona w ustawieniach). Nie jest to błąd krytyczny.</li>
            <li><strong className="text-red-600">Błąd krytyczny:</strong> Wystąpił poważny błąd, który uniemożliwia prawidłowe działanie modułu. Wymaga to natychmiastowej uwagi technicznej.</li>
        </ul>
        <p>
            W przypadku wystąpienia błędu krytycznego, zalecany jest kontakt z pomocą techniczną i przekazanie szczegółów z panelu.
        </p>
      </DocumentationSection>


      <DocumentationSection title="Prywatność i Anonimowość Klienta">
        <p>
            Ochrona danych i anonimowość osób badanych jest absolutnym priorytetem platformy.
        </p>
        <div className="p-4 bg-sky-100 border-l-4 border-sky-500 text-sky-800 rounded mt-4">
            <p className="font-bold">Gwarancja Anonimowości</p>
            <p>
                System został zaprojektowany tak, aby <strong>nie zbierać, nie przetwarzać ani nie przechowywać żadnych danych, które mogłyby pomóc w identyfikacji klienta</strong>. Obejmuje to:
            </p>
            <ul>
                <li>Adres IP</li>
                <li>Dane przeglądarki (User Agent)</li>
                <li>Informacje o urządzeniu</li>
                <li>Jakiekolwiek pliki cookie śledzące</li>
            </ul>
            <p>
                Jedynym powiązaniem między wynikiem a osobą jest losowo wygenerowany, jednorazowy kod dostępu, który terapeuta przekazuje klientowi. Po stronie systemu, wynik jest całkowicie zanonimizowany.
            </p>
        </div>
      </DocumentationSection>

    </div>
  );
};

export default DocumentationPage;
