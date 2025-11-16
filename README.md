# Platforma do Testów Psychologicznych Online

Ta aplikacja to kompleksowa platforma do przeprowadzania i zarządzania testami psychologicznymi online. Umożliwia tworzenie testów, zarządzanie użytkownikami (administratorzy, terapeuci) oraz generowanie raportów.

---

## Architektura i Model Bezpieczeństwa

Platforma została zaprojektowana z myślą o maksymalnym bezpieczeństwie i rozdziale danych. Zrozumienie poniższych koncepcji jest kluczowe do poprawnego wdrożenia i zarządzania systemem.

### Plik `.env` i Zmienne Środowiskowe

Konfiguracja serwera (backendu) jest w całości zarządzana przez plik `.env` umieszczony w głównym katalogu aplikacji. **Plik ten nigdy nie może być udostępniany ani dodawany do systemu kontroli wersji (np. Git).** Zawiera on klucze niezbędne do działania aplikacji.

Plik `.gitignore` jest już skonfigurowany, aby go ignorować.

### Klucze Bezpieczeństwa

System opiera się na dwóch fundamentalnych kluczach, które musisz zdefiniować w pliku `.env`:

*   `SETUP_KEY`: Jednorazowy "klucz główny" używany wyłącznie do autoryzacji operacji najwyższego ryzyka, takich jak pierwsza konfiguracja systemu. Jest to Twoja gwarancja, że tylko osoba z dostępem do serwera może wykonać te krytyczne czynności.
*   `JWT_SECRET`: Długi, losowy sekret używany do cyfrowego podpisywania "kart dostępu" (tokenów JWT) dla każdego zalogowanego użytkownika. To ten sekret gwarantuje, że serwer jest w stanie bezpiecznie weryfikować tożsamość użytkownika przy każdym zapytaniu.

> ### Czym jest i dlaczego potrzebuję Tokenu JWT?
>
> Wyobraź sobie, że **ID terapeuty** to Twój dowód osobisty, a **Token JWT** to karta magnetyczna do Twojego gabinetu.
>
> Sam dowód nie wystarczy, aby wejść do gabinetu – każdy mógłby podać Twoje imię. Potrzebujesz unikalnej, sekretnej karty, którą dostajesz w recepcji po okazaniu dowodu i podaniu hasła (w procesie logowania).
>
> Token JWT to właśnie taka cyfrowa karta. Serwer wydaje ją po poprawnym logowaniu, a przeglądarka okazuje ją przy każdej próbie dostępu do chronionych danych (np. listy wyników). Serwer, widząc ważny token, wie, że żądanie jest autentyczne i pochodzi od właściwej osoby, dzięki czemu może bezpiecznie odesłać **tylko te dane, do których dany terapeuta ma uprawnienia.**

---

## Konfiguracja i Pierwsze Uruchomienie

### Krok 1: Utwórz plik `.env`

Skopiuj zawartość pliku `.env.example` (jeśli istnieje) lub utwórz nowy plik `.env` i uzupełnij go według poniższego wzoru. **Uzupełnij `DATABASE_URL` i `SETUP_KEY`. Pozostaw `JWT_SECRET` pusty.**

```env
#====================================================================================
# ZMIENNE KRYTYCZNE (wymagane do uruchomienia aplikacji)
#====================================================================================

# Adres URL połączenia z bazą danych PostgreSQL.
# Format: postgresql://[uzytkownik]:[haslo]@[host]:[port]/[nazwa-bazy]
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"

# Klucz używany do jednorazowej autoryzacji operacji wysokiego ryzyka.
# Użyj generatora haseł lub wpisz długą, trudną do odgadnięcia frazę.
SETUP_KEY="unikalny-i-trudny-do-zgadniecia-klucz-konfiguracyjny"

# Sekret do podpisywania tokenów JWT. Musi być długi i losowy.
# Zostanie automatycznie wygenerowany i zapisany przez Kreator Konfiguracji.
JWT_SECRET=""

#====================================================================================
# KONFIGURACJA USŁUG ZEWNĘTRZNYCH (opcjonalne, zarządzane z panelu admina)
#====================================================================================

# Pola dla SMTP i AI są celowo pozostawione puste. 
# Zostaną uzupełnione przez Kreator Konfiguracji lub później w panelu admina.
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_SECURE="false"

AI_PROVIDER="gemini"
GEMINI_API_KEY=""
AI_MODEL="gemini-1.5-flash"
```

### Krok 2: Uruchom Kreator Konfiguracji

Po ustawieniu zmiennych w pliku `.env` i uruchomieniu aplikacji, przejdź do niej w przeglądarce.

1.  Zostaniesz automatycznie przekierowany do **Kreatora Konfiguracji** (`/setup`).
2.  W formularzu postępuj zgodnie z krokami:
    *   **Klucze Bezpieczeństwa**: Wklej swój `SETUP_KEY` z pliku `.env`. Następnie, **użyj przycisku "Generuj"**, aby stworzyć bezpieczny `JWT_SECRET`. Zostanie on automatycznie zapisany w pliku `.env` na serwerze.
    *   **Konto Administratora**: Utwórz pierwsze konto, które będzie służyło do zarządzania całym systemem.
    *   **(Opcjonalnie)** Skonfiguruj od razu działanie **usługi e-mail (SMTP)** oraz **Asystenta AI**.
3.  Po kliknięciu "Zakończ i Zapisz", aplikacja jest w pełni skonfigurowana i gotowa do pracy. Zostaniesz przekierowany do strony logowania.

---

## Dostępne Skrypty

W projekcie dostępne są następujące skrypty:

- `npm run dev`: Uruchamia serwer deweloperski Vite.
- `npm run build`: Kompiluje aplikację do statycznych plików produkcyjnych.
- `npm run preview`: Uruchamia lokalny serwer do podglądu wersji produkcyjnej.
