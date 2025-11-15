
# Platforma do Testów Psychologicznych Online

Ta aplikacja to kompleksowa platforma do przeprowadzania i zarządzania testami psychologicznymi online. Umożliwia tworzenie testów, zarządzanie użytkownikami (administratorzy, terapeuci) oraz generowanie raportów.

## Pierwsza Konfiguracja (First-Time Setup)

Przy pierwszym uruchomieniu aplikacji, konieczne jest utworzenie konta głównego administratora. Proces ten jest zabezpieczony za pomocą jednorazowego **Klucza Konfiguracyjnego (Setup Key)**, aby upewnić się, że tylko osoba z dostępem do środowiska serwerowego może wykonać tę krytyczną operację.

### Krok 1: Ustawienie Zmiennej Środowiskowej `SETUP_KEY`

Przed pierwszym uruchomieniem aplikacji, musisz ustawić zmienną środowiskową o nazwie `SETUP_KEY` na serwerze, na którym aplikacja będzie hostowana.

1.  **Wygeneruj bezpieczny, losowy klucz**. Możesz użyć do tego dowolnego generatora haseł lub UUID. Klucz powinien być trudny do odgadnięcia.
    *Przykład: `twoj-super-tajny-klucz-12345-abcdef`*

2.  **Dodaj zmienną do pliku `.env`** w głównym katalogu projektu:

    ```
    SETUP_KEY="twoj-super-tajny-klucz-12345-abcdef"
    ```

    **Ważne:** Jeśli wdrażasz aplikację na platformie takiej jak Vercel, Netlify, Heroku, lub używasz Dockera, dodaj `SETUP_KEY` w panelu konfiguracyjnym zmiennych środowiskowych dla Twojego projektu. **Nigdy nie umieszczaj prawdziwego klucza bezpośrednio w kodzie źródłowym!**

### Krok 2: Uruchomienie Aplikacji i Kreator Konfiguracji

Po ustawieniu zmiennej środowiskowej, uruchom aplikację.

1.  Otwórz aplikację w przeglądarce. Zostaniesz automatycznie przekierowany do **Kreatora Konfiguracji** (`/setup`).

2.  W formularzu:
    *   Podaj **adres e-mail** dla głównego konta administratora.
    *   Ustaw **bezpieczne hasło** (minimum 8 znaków).
    *   Wklej wygenerowany wcześniej **Klucz Konfiguracyjny** w odpowiednie pole.

3.  Kliknij przycisk "Zakończ Konfigurację".

Po pomyślnym utworzeniu konta, zostaniesz przekierowany do strony logowania. Aplikacja jest gotowa do użytku. Klucz konfiguracyjny został wykorzystany i nie będzie już potrzebny (choć pozostaje w zmiennych środowiskowych).

---

## Dostępne Skrypty

W projekcie dostępne są następujące skrypty:

- `npm run dev`: Uruchamia serwer deweloperski Vite.
- `npm run build`: Kompiluje aplikację do statycznych plików produkcyjnych.
- `npm run preview`: Uruchamia lokalny serwer do podglądu wersji produkcyjnej.

