
# Dług Techniczny i Elementy do Dokończenia

Ten plik dokumentuje elementy systemu, które zostały zaimplementowane w uproszczony sposób ("na skróty") w celu szybszego dostarczenia działającego prototypu. Należy do nich wrócić, aby zapewnić pełną funkcjonalność, bezpieczeństwo i profesjonalną jakość produktu końcowego.

---

### 1. Mock Backend / Warstwa Danych (`services/apiClient.ts`)

*   **Problem:** Cała warstwa danych aplikacji jest **symulowana z użyciem `localStorage`**. Oznacza to, że wszystkie testy, wyniki i szablony są przechowywane wyłącznie w pamięci podręcznej przeglądarki. Jest to rozwiązanie wyłącznie dla celów prototypu - dane nie są trwałe, bezpieczne, ani współdzielone między użytkownikami czy urządzeniami.
*   **Ryzyko:** Krytyczne. Obecna implementacja uniemożliwia jakiekolwiek produkcyjne wdrożenie aplikacji. Utrata danych jest gwarantowana.
*   **Kierunek Rozwoju (Idea):** Należy zastąpić cały mock backend prawdziwą architekturą klient-serwer.
    1.  **Stworzyć serwer API:** Zbudować aplikację serwerową (np. w Node.js/Express, Python/Django), która będzie zarządzać logiką biznesową i dostępem do danych.
    2.  **Zintegrować bazę danych:** Podłączyć serwer do trwałej bazy danych (np. PostgreSQL, MongoDB, Firebase Firestore) w celu przechowywania wszystkich zasobów.
    3.  **Przepisać `apiClient.ts`:** Zaktualizować wszystkie funkcje w `apiClient.ts`, aby zamiast operować na `localStorage`, wysyłały zapytania HTTP (za pomocą `fetch` lub `axios`) do nowego serwera API.

---

### 2. Generator PDF (`components/pdfGenerator.ts`)

#### a) Wizualizacja Wykresów (`drawBarChart`, `drawRadarChart`)

*   **Problem:** Aktualna implementacja rysowania wykresów jest szczątkowa. `drawBarChart` renderuje proste prostokąty bez żadnych etykiet, osi wartości czy legendy. `drawRadarChart` to tylko atrapa.
*   **Kierunek Rozwoju (Idea):** Zaimplementować pełne renderowanie wykresów lub zintegrować bibliotekę trzecią (np. `chart.js` z `node-canvas` po stronie serwera) do generowania profesjonalnie wyglądających wykresów jako obrazów i wstawiania ich do PDF.

#### b) Renderowanie Tekstu Sformatowanego (`drawRichText`)

*   **Problem:** Funkcja `drawRichText` usuwa formatowanie HTML, przez co w PDF gubione jest pogrubienie, kursywa czy listy.
*   **Kierunek Rozwoju (Idea):** Zaimplementować prosty parser, który będzie interpretował podstawowe tagi HTML (`<b>`, `<i>`, `<ul><li>`) i odpowiednio zmieniał czcionkę lub rysował punktory w pliku PDF.

---

### 3. Ewaluacja Formuł w Mock Backendu (`services/apiClient.ts`)

*   **Problem:** Użycie `new Function('return ...')` do obliczania formuł jest potencjalnie niebezpieczne (Code Injection).
*   **Kierunek Rozwoju (Idea):** Zastąpić obecną implementację bezpieczną biblioteką do parsowania wyrażeń matematycznych, np. **`math.js`**, która wykonuje obliczenia w trybie "sandbox".

