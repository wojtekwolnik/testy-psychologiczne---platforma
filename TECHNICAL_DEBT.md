
# Dług Techniczny i Elementy do Dokończenia

Ten plik dokumentuje elementy systemu, które zostały zaimplementowane w uproszczony sposób ("na skróty") w celu szybszego dostarczenia działającego prototypu. Należy do nich wrócić, aby zapewnić pełną funkcjonalność, bezpieczeństwo i profesjonalną jakość produktu końcowego.

---

### 1. Mock Backend / Brak Trwałości Danych (`services/apiClient.ts`)

*   **Stan Faktyczny:** Aplikacja **nie posiada żadnej trwałej bazy danych**. Cały stan aplikacji (użytkownicy, wyniki testów, szablony) jest przechowywany w **zmiennych w pamięci RAM** (JavaScript variables).
*   **Konsekwencje:** **Odświeżenie strony (F5) powoduje całkowity reset danych** do stanu początkowego (utrata zarejestrowanych klientów, wyników i stworzonych testów).
    *   *Wyjątek:* Jedynie ustawienia wizualne (branding) są zapisywane w `localStorage`.
*   **Ryzyko:** Krytyczne. Aplikacja w obecnym stanie jest **bezużyteczna produkcyjnie**. Służy jedynie do prezentacji interfejsu (demo high-fidelity).
*   **Wymagana Akcja:**
    1.  **Budowa Backend:** Należy stworzyć prawdziwy backend (Node.js/Python/Go).
    2.  **Baza Danych:** Podłączenie PostgreSQL lub MongoDB.
    3.  **Migracja API:** Przepisanie `apiClient.ts` na `fetch/axios` do komunikacji z nowym backendem.

---

### 2. Generator PDF (`components/pdfGenerator.ts`)

#### a) Wizualizacja Wykresów (`drawBarChart`, `drawRadarChart`)

*   **Stan Faktyczny:** 
    *   `drawBarChart`: Rysuje proste prostokąty, ale może brakować skalowania i legendy.
    *   `drawRadarChart`: **TYLKO TEKSTOWY PLACEHOLDER**. Kod zawiera jedynie instrukcję wypisującą tekst "[Komponent Wykresu Radarowego...]", brak faktycznego rysowania wykresu pajęczynowego.
*   **Wymagana Akcja:** Integracja biblioteki do wykresów (np. QuickChart.io API lub server-side rendering chart.js) lub ręczna implementacja skomplikowanej geometrii na canvasie PDF.

#### b) Renderowanie Tekstu Sformatowanego (`drawRichText`)

*   **Stan Faktyczny:** Funkcja jawnie **usuwa wszystkie tagi HTML** (`replace(/<[^>]+>/g, '')`). Wszelkie pogrubienia, kursywy czy listy z edytora WYSIWYG są tracone i renderowane jako lity blok tekstu.
*   **Wymagana Akcja:** Implementacja parsera HTML-to-PDF lub użycie biblioteki wspierającej HTML w pdf-lib.

---

### 3. Ewaluacja Formuł w Mock Backendu (`services/apiClient.ts`)

*   **Problem:** Użycie `new Function('return ...')` do obliczania formuł jest potencjalnie niebezpieczne (Code Injection).
*   **Kierunek Rozwoju (Idea):** Zastąpić obecną implementację bezpieczną biblioteką do parsowania wyrażeń matematycznych, np. **`math.js`**, która wykonuje obliczenia w trybie "sandbox".

