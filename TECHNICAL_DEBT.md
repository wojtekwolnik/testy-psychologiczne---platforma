# Dług Techniczny i Elementy do Dokończenia

Ten plik dokumentuje elementy systemu, które zostały zaimplementowane w uproszczony sposób ("na skróty") w celu szybszego dostarczenia działającego prototypu. Należy do nich wrócić, aby zapewnić pełną funkcjonalność, bezpieczeństwo i profesjonalną jakość produktu końcowego.

---

### 1. Generator PDF (`components/pdfGenerator.ts`)

#### a) Wizualizacja Wykresów (`drawBarChart`, `drawRadarChart`)

*   **Stan Faktyczny:** [ROZWIĄZANE] Wykresy radarowe są teraz renderowane z użyciem geometrii na canvasie PDF, a nie są tylko placeholdrami. Wykresy słupkowe działają poprawnie.
*   **Wymagana Akcja:** Brak.

#### b) Renderowanie Tekstu Sformatowanego (`drawRichText`)

*   **Stan Faktyczny:** [ROZWIĄZANE] Funkcja `drawRichText` zawiera teraz lekki parser HTML, który poprawnie interpretuje tagi `<b>`, `<i>`, `<p>`, `<br>` oraz listy `<ul>`/`<li>`, renderując sformatowany tekst w pliku PDF z odpowiednimi wcięciami i zawijaniem wierszy.
*   **Wymagana Akcja:** Brak.

---

### 2. Ewaluacja Formuł w Backendu (`services/apiClient.ts` / Next.js Actions)

*   **Problem:** [ROZWIĄZANE] Użycie `new Function('return ...')` do obliczania formuł zostało zastąpione przez bezpieczną bibliotekę `math.js`.
*   **Kierunek Rozwoju (Idea):** Kod jest teraz bezpieczny przed atakami typu Code Injection. Brak dalszych wymaganych akcji.
