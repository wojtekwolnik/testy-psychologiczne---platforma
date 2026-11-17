---
trigger: always_on
description: Bezwzględna ochrona produkcyjnej bazy danych (kont terapeutów, admina oraz wyników testów) przed usunięciem lub nadpisaniem.
---

# Bezwzględna Ochrona Produkcyjnej Bazy Danych (CRITICAL)

1. Na serwerze produkcyjnym (`platforma-testowa-realmoment`, wolumen `postgres_data`) znajdują się aktywne konta terapeutów, konto administratora oraz wyniki testów klientów. **Dane te nie mogą zniknąć ani zostać uszkodzone pod żadnym pozorem.**
2. Zabronione jest używanie flag i poleceń mogących prowadzić do utraty danych (w szczególności `--accept-data-loss`, `--force-reset`, `migrate reset`, usuwanie wolumenów bazy danych lub destrukcyjne seedowanie tabeli `User` / `TestResult`).
3. Gdyby jakiegokolwiek zadania nie dało się wykonać bez ingerencji w strukturę lub elementy bazy danych, **musisz najpierw wyraźnie ostrzec użytkownika**, wyjaśnić powód oraz zaproponować bezpieczne rozwiązanie (np. weryfikację świeżego backupu i plan migracji bezstratnej) i poczekać na akceptację przed wdrożeniem.
