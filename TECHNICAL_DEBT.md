# Dług Techniczny i Elementy do Dokończenia

Ten plik dokumentuje elementy systemu, które zostały zaimplementowane w uproszczony sposób ("na skróty") w celu szybszego dostarczenia działającego prototypu. Należy do nich wrócić, aby zapewnić pełną funkcjonalność, bezpieczeństwo i profesjonalną jakość produktu końcowego.

---

### 1. Generator PDF (`components/pdfGenerator.ts`)

#### a) Wizualizacja Wykresów (`drawBarChart`, `drawRadarChart`)

*   **Stan Faktyczny:** 
    *   `drawBarChart`: Rysuje proste prostokąty, ale może brakować skalowania i legendy.
    *   `drawRadarChart`: **TYLKO TEKSTOWY PLACEHOLDER**. Kod zawiera jedynie instrukcję wypisującą tekst "[Komponent Wykresu Radarowego...]", brak faktycznego rysowania wykresu pajęczynowego.
*   **Wymagana Akcja:** Integracja biblioteki do wykresów (np. QuickChart.io API lub server-side rendering chart.js) lub ręczna implementacja skomplikowanej geometrii na canvasie PDF.

#### b) Renderowanie Tekstu Sformatowanego (`drawRichText`)

*   **Stan Faktyczny:** Funkcja jawnie **usuwa wszystkie tagi HTML** (`replace(/<[^>]+>/g, '')`). Wszelkie pogrubienia, kursywy czy listy z edytora WYSIWYG są tracone i renderowane jako lity blok tekstu.
*   **Wymagana Akcja:** Implementacja parsera HTML-to-PDF lub użycie biblioteki wspierającej HTML w pdf-lib.

---

### 2. Ewaluacja Formuł w Backendu (`services/apiClient.ts` / Next.js Actions)

*   **Problem:** Użycie `new Function('return ...')` do obliczania formuł jest potencjalnie niebezpieczne (Code Injection).
*   **Kierunek Rozwoju (Idea):** Zastąpić obecną implementację bezpieczną biblioteką do parsowania wyrażeń matematycznych, np. **`math.js`**, która wykonuje obliczenia w trybie "sandbox".
