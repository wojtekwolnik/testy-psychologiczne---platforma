# Platforma do Testów Psychologicznych Online

Ta aplikacja to kompleksowa platforma do przeprowadzania i zarządzania testami psychologicznymi online. Umożliwia tworzenie testów, zarządzanie użytkownikami (administratorzy, terapeuci) oraz generowanie raportów.

---

## Koncepcja Architektury Konfiguracji

Ta aplikacja została zaprojektowana z myślą o maksymalnym bezpieczeństwie i elastyczności konfiguracji. Kluczowym założeniem jest **separacja kodu od konfiguracji**, zwłaszcza w przypadku danych wrażliwych (sekrety, klucze API, hasła).

**Wszystkie dane konfiguracyjne serwera są zarządzane za pomocą zmiennych środowiskowych i pliku `.env`.**

Panel administracyjny aplikacji (front-end) dostarcza jedynie **bezpiecznych interfejsów** do modyfikacji tych zmiennych, autoryzowanych za pomocą jednorazowego `SETUP_KEY`. Gwarantuje to, że zmiany mogą być wprowadzane tylko przez osobę z dostępem do środowiska serwerowego, ale w wygodny sposób, bez konieczności każdorazowego logowania się do terminala serwera.

---

## Konfiguracja Serwera i Zmienne Środowiskowe (`.env`)

Aplikacja back-endowa ładuje swoją konfigurację ze zmiennych środowiskowych. Najprostszym sposobem na zarządzanie nimi podczas dewelopmentu jest stworzenie pliku `.env` w głównym katalogu projektu.

**Nigdy nie umieszczaj pliku `.env` w systemie kontroli wersji (Git)!** Plik `.gitignore` jest już skonfigurowany, aby go ignorować.

### Krok 1: Utwórz plik `.env`

Skopiuj zawartość pliku `.env.example` (jeśli istnieje) lub utwórz nowy plik `.env` i uzupełnij go według poniższego wzoru:

```env
#====================================================================================
# ZMIENNE KRYTYCZNE (wymagane do uruchomienia aplikacji)
#====================================================================================

# Adres URL połączenia z bazą danych PostgreSQL.
# Format: postgresql://[uzytkownik]:[haslo]@[host]:[port]/[nazwa-bazy]
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"

# Długi, losowy i tajny klucz używany do podpisywania tokenów sesji (JWT).
# Użyj generatora haseł (min. 32 znaki).
JWT_SECRET="twoj-super-tajny-i-dlugi-klucz-do-podpisywania-tokenow"

# Klucz używany do jednorazowej autoryzacji operacji wysokiego ryzyka,
# takich jak pierwsza konfiguracja i późniejsza zmiana kluczy API/SMTP.
# Użyj generatora haseł.
SETUP_KEY="unikalny-i-trudny-do-zgadniecia-klucz-konfiguracyjny"

#====================================================================================
# KONFIGURACJA USŁUG ZEWNĘTRZNYCH (opcjonalne, zarządzane z panelu admina)
#====================================================================================

# --- Ustawienia serwera pocztowego SMTP (do wysyłania powiadomień) ---
# Te pola są celowo pozostawione puste. Można je uzupełnić podczas pierwszej
# konfiguracji w interfejsie webowym lub później w panelu Zarządzania Konfiguracją Serwera.
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS="" # To hasło zostanie zapisane tutaj po konfiguracji w UI
SMTP_SECURE="false" # Zmieni się na "true", jeśli zaznaczysz SSL/TLS

# --- Ustawienia Asystenta AI (do generowania sugestii) ---
# Te pola również są zarządzane z poziomu panelu administracyjnego.
AI_PROVIDER="gemini" # Domyślny dostawca, może być zmieniony w UI
GEMINI_API_KEY="" # Klucz API zostanie zapisany tutaj po konfiguracji w UI
AI_MODEL="gemini-1.5-flash" # Domyślny model, może być zmieniony w UI

```

### Krok 2: Pierwsza Konfiguracja Aplikacji

Po ustawieniu zmiennych krytycznych (`DATABASE_URL`, `JWT_SECRET`, `SETUP_KEY`) w pliku `.env` i uruchomieniu aplikacji, przejdź do przeglądarki.

1.  Zostaniesz automatycznie przekierowany do **Kreatora Konfiguracji** (`/setup`).
2.  W formularzu:
    *   Utwórz konto **głównego administratora**.
    *   Wklej swój `SETUP_KEY` z pliku `.env`, aby autoryzować operację.
    *   **(Opcjonalnie)** Od razu skonfiguruj działanie **usługi e-mail (SMTP)** oraz **Asystenta AI**, podając odpowiednie dane (host, port, hasła, klucze API). Te dane zostaną bezpiecznie zapisane w Twoim pliku `.env` na serwerze.
3.  Po zakończeniu, aplikacja jest gotowa do pracy.

### Krok 3: Zarządzanie Konfiguracją w Przyszłości

Jeśli w przyszłości będziesz potrzebować zmienić klucz API do AI lub hasło do serwera SMTP:

1.  Zaloguj się na swoje konto administratora.
2.  Przejdź do ustawień "AI" lub "E-mail" i kliknij przycisk **"Zarządzaj Konfiguracją Serwera"**.
3.  Zostaniesz poproszony o **ponowne podanie `SETUP_KEY`**, aby potwierdzić, że masz uprawnienia do tak istotnej zmiany.
4.  Po autoryzacji, będziesz mógł wprowadzić nowe wartości, które zaktualizują odpowiednie pola w pliku `.env` na serwerze.

---

## Dostępne Skrypty

W projekcie dostępne są następujące skrypty:

- `npm run dev`: Uruchamia serwer deweloperski Vite.
- `npm run build`: Kompiluje aplikację do statycznych plików produkcyjnych.
- `npm run preview`: Uruchamia lokalny serwer do podglądu wersji produkcyjnej.
