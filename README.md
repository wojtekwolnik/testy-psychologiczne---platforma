# Platforma do Testów Psychologicznych Online

 Witaj w centrum dowodzenia Twojej platformy do testów psychologicznych. Ten dokument to Twój przewodnik – od pierwszego uruchomienia po zaawansowane zarządzanie. Aplikacja została zaprojektowana w filozofii "batteries-included": wszystko, czego potrzebujesz, jest już na pokładzie i działa w zautomatyzowany sposób.

---

## Wymagania: Dwa Narzędzia, Które Robią Wszystko

Aby uruchomić całą platformę, potrzebujesz na swoim serwerze lub komputerze tylko dwóch narzędzi:

- **Docker:** Wyobraź go sobie jako system do tworzenia miniaturowych, wirtualnych komputerów (nazywanych kontenerami). Każdy z nich ma jedno zadanie – jeden uruchamia bazę danych, drugi aplikację w Node.js. Są od siebie idealnie odizolowane.

- **Docker Compose:** To Twój "pilot" lub "dyrygent". Używa pliku `docker-compose.yml` jako instrukcji, aby za pomocą jednego polecenia uruchomić, połączyć ze sobą i zarządzać wszystkimi tymi wirtualnymi komputerami (kontenerami).

**Nie musisz instalować Node.js, PostgreSQLa ani niczego innego.** Docker i Docker Compose zajmą się tym za Ciebie.

---

## Pierwsze Uruchomienie i Konfiguracja (Deployment)

Proces wdrożenia sprowadza się do czterech prostych kroków, które zamienią ten kod w działającą aplikację.

### Krok 1: Pobierz Plany (Sklonuj Repozytorium)

To polecenie pobiera z Twojego repozytorium Git wszystkie "plany konstrukcyjne" aplikacji na Twój serwer lub komputer, a następnie przenosi Cię do nowo utworzonego katalogu `psycheform`.

```bash
# Pobierz kod z repozytorium
git clone [adres-twojego-repozytorium] psycheform

# Wejdź do folderu z aplikacją
cd psycheform
```

### Krok 2: Stwórz Pęk Kluczy (Plik Konfiguracyjny `.env`)

Każdy system potrzebuje sekretów: haseł, kluczy dostępu. Nasza aplikacja przechowuje je w pliku `.env`. Nigdy nie umieszczamy tego pliku w Git, aby poufne dane były bezpieczne.

To polecenie tworzy Twój własny plik `.env` na podstawie dostarczonego szablonu.

```bash
cp .env.example .env
```

**Twoje zadanie:** Otwórz nowo utworzony plik `.env` w edytorze tekstu i uzupełnij go. Na start najważniejsze są trzy zmienne, które pozwolą aplikacji połączyć się z bazą danych: `POSTGRES_USER`, `POSTGRES_PASSWORD` i `POSTGRES_DB`.

> **Ważne:** Zmienna `DATABASE_URL` jest już poprawnie skonfigurowana do komunikacji *wewnętrznej* między kontenerami. Nie musisz jej zmieniać!

### Krok 3: Włącz Zasilanie (Uruchom Całą Infrastrukturę)

To jest najważniejsze polecenie. Działa jak wciśnięcie głównego włącznika zasilania dla całego systemu. Uruchom je w głównym katalogu aplikacji.

```bash
docker-compose up -d
```

**Co dokładnie robi to polecenie?**
- `docker-compose up`: Czyta instrukcję z `docker-compose.yml` i uruchamia wszystkie zdefiniowane tam usługi (aplikację, bazę danych, monitoring etc.).
- `-d`: Uruchamia wszystko w trybie "detached" (w tle), zwalniając Twój terminal. System będzie działał, nawet gdy zamkniesz połączenie z serwerem.

### Krok 4: Skonfiguruj Aplikację (Kreator w Przeglądarce)

Twoja infrastruktura już działa, ale sama aplikacja potrzebuje jeszcze ostatniego szlifu.

Otwórz przeglądarkę i przejdź pod adres `http://localhost:3000` (lub adres IP Twojego serwera).

Zostaniesz automatycznie przekierowany do **Kreatora Konfiguracji**, który poprosi Cię o dwie rzeczy:
1.  **Stworzenie konta administratora:** To będzie pierwsze konto w systemie, z pełnymi uprawnieniami.
2.  **Wygenerowanie sekretu sesji (JWT_SECRET):** To kluczowy element bezpieczeństwa, używany do podpisywania sesji użytkowników. Kreator automatycznie wygeneruje silny klucz i **sam zapisze go w Twoim pliku `.env`**.

**Gratulacje! Twoja aplikacja jest w pełni skonfigurowana, bezpieczna i gotowa do pracy.**

---

## Kokpit Monitoringu i Logów (Grafana)

Twoja aplikacja jest wyposażona w profesjonalny system do centralnego zbierania i analizy logów w czasie rzeczywistym, oparty o **Grafana** i **Loki**. To Twój "kokpit kontrolny", który daje Ci pełen wgląd w to, co dzieje się "pod maską" całego systemu.

### Dostęp do Kokpitu

- **Adres:** `http://localhost:3001` (lub `http://<IP-serwera>:3001`)
- **Użytkownik:** `admin`
- **Hasło:** `admin` (zostaniesz poproszony o zmianę hasła przy pierwszym logowaniu)

### Jak z tego korzystać?

Po zalogowaniu, przejdź do sekcji **"Explore"** w menu po lewej stronie. Kluczem do sukcesu jest używanie **etykiet (labels)** do filtrowania logów (np. `{service="app"}`).

---

## Kopie Zapasowe i Odtwarzanie Danych

System dba o bezpieczeństwo Twoich danych poprzez automatyczne, regularne kopie zapasowe.

### Automatyczne Kopie Zapasowe

- **Częstotliwość:** Co 24 godziny.
- **Lokalizacja:** Folder `./backups`.
- **Retencja:** Automatyczne usuwanie kopii starszych niż 30 dni.

### Odtwarzanie Danych z Kopii Zapasowej

> **Uwaga!** Proces ten jest **operacją niszczącą**. Aktualna baza danych zostanie **całkowicie usunięta i zastąpiona** danymi z wybranego pliku kopii zapasowej. Wykonuj go z rozwagą.

Proces odtwarzania jest zautomatyzowany za pomocą jednego, potężnego polecenia. Oto, co musisz zrobić i co dokładnie się wydarzy:

**Krok 1: Wybierz plik kopii zapasowej**

Najpierw zajrzyj do folderu z kopiami, aby znaleźć nazwę pliku, którego chcesz użyć. Zazwyczaj będziesz szukać najnowszej dostępnej kopii.

```bash
ls -l backups
```

**Krok 2: Uruchom procedurę odtwarzania**

Skopiuj poniższe polecenie i **pamiętaj, aby podmienić `NAZWA-TWOJEJ-KOPII.sql.gz`** na rzeczywistą nazwę pliku wybraną w kroku 1.

```bash
docker-compose down && cat backups/NAZWA-TWOJEJ-KOPII.sql.gz | docker-compose run -T --rm db sh -c "gunzip | psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}" && docker-compose up -d
```

---

## Aktualizacja Aplikacji: Nowa Era z CI/CD

Twoja aplikacja została wyposażona w potok **Ciągłej Integracji (CI)** za pomocą GitHub Actions. Oznacza to, że proces aktualizacji jest teraz częściowo zautomatyzowany i o wiele bardziej niezawodny.

### Jak to działa?

1.  **Wypychasz kod do GitHuba:** Za każdym razem, gdy robisz `git push` do gałęzi `main`, robot w GitHub Actions automatycznie buduje nowy obraz Dockerowy Twojej aplikacji.
2.  **Publikacja w Rejestrze:** Nowy, świeży obraz jest publikowany w Twoim **prywatnym rejestrze kontenerów** na GitHubie (GHCR).
3.  **Aktualizacja na serwerze:** Twoim zadaniem jest już tylko poinstruowanie serwera, aby pobrał ten nowy obraz i zrestartował aplikację.

### Proces Aktualizacji (Nowa Wersja)

**Krok 1: Zaloguj się do Rejestru Kontenerów GitHub (jednorazowo)**

Aby Twój serwer mógł pobierać prywatne obrazy, musisz go najpierw uwierzytelnić. **Tę operację wykonujesz tylko raz.**

1.  **Wygeneruj Token Dostępowy:**
    -   Na GitHubie, wejdź w `Settings` > `Developer settings` > `Personal access tokens` > `Tokens (classic)`.
    -   Wygeneruj nowy token z uprawnieniem `read:packages`.
    -   **Skopiuj ten token!** To jedyny raz, kiedy go zobaczysz.

2.  **Zaloguj się na serwerze:**
    Użyj poniższego polecenia na swoim serwerze, podmieniając `TWOJA-NAZWA-UŻYTKOWNIKA` na Twój login z GitHuba. Gdy zostaniesz poproszony o hasło, **wklej wygenerowany token**.

    ```bash
    docker login ghcr.io -u TWOJA-NAZWA-UŻYTKOWNIKA
    ```

**Krok 2: Pobierz Najnowszą Wersję Aplikacji**

Po wypchnięciu zmian do GitHuba i upewnieniu się, że zadanie w zakładce "Actions" zakończyło się sukcesem, połącz się z serwerem i wykonaj poniższe polecenia w głównym katalogu aplikacji:

```bash
# Pobierz najnowsze pliki konfiguracyjne (w tym docker-compose.yml)
git pull

# Pobierz najnowszy obraz aplikacji z rejestru i zrestartuj tylko ją
docker-compose pull app
docker-compose up -d --no-deps app
```

**Co robią te polecenia?**
- `git pull`: Aktualizuje pliki na serwerze, w tym `docker-compose.yml`, aby upewnić się, że serwer wie, której wersji obrazu szukać.
- `docker-compose pull app`: To kluczowe polecenie. Nakazuje Docker Compose pobranie najnowszej wersji obrazu `app` z rejestru (GHCR), do którego się zalogowałeś.
- `docker-compose up -d --no-deps app`: Uruchamia ponownie **tylko i wyłącznie kontener aplikacji**, bez dotykania bazy danych czy innych usług (`--no-deps`). Docker Compose jest inteligentny - widząc, że ma nowszy obraz, automatycznie użyje go do restartu.

To wszystko! Proces jest szybszy i bezpieczniejszy, ponieważ nie budujesz już kodu na serwerze produkcyjnym.
