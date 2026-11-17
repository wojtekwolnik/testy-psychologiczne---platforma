# Stałe Reguły Bezpieczeństwa Projektu (Real Moment – Platforma Testowa)

## 1. Bezwzględna Ochrona Produkcyjnej Bazy Danych (CRITICAL RULE)
Na serwerze produkcyjnym (`https://testy.realmoment.pl`, projekt Docker Compose `platforma-testowa-realmoment`, wolumen `postgres_data`) znajdują się **żywe, produkcyjne dane**:
- Konta terapeutów (`User` z rolą `therapist`),
- Konto administratora (`User` z rolą `admin`),
- Wygenerowane kody dostępu (`AccessCode`),
- Wyniki badań klientów oraz notatki/interpretacje terapeutów (`TestResult`),
- Opublikowane testy i szablony raportów (`Test`, `PdfTemplate`, `SystemSettings`).

**Zasady bezwzględne:**
1. **ZAKAZ USUWANIA I RESETOWANIA DANYCH:** Pod żadnym pozorem nie wolno usuwać wolumenu `postgres_data`, wykonywać `prisma migrate reset`, `prisma db push --force-reset`, `prisma db push --accept-data-loss`, `DROP TABLE`, `TRUNCATE` ani żadnych skryptów seedujących, które nadpisują lub kasują istniejących użytkowników (`User`), wyniki (`TestResult`) lub kody (`AccessCode`).
2. **BEZPIECZNE MIGRACJE I AKTUALIZACJE:** Wszelkie zmiany w kodzie i bazie danych muszą być w 100% niedestrukcyjne (additive / backward-compatible). Nowe testy lub aktualizacje kluczy testów muszą używać bezpiecznego `upsert` / aktualizacji w miejscu bez naruszania powiązanych rekordów `TestResult` i `User`.
3. **OBOWIĄZEK OSTRZEŻENIA PRZED ZMIANĄ BAZODANOWĄ:** Jeżeli jakakolwiek zmiana wymagałaby modyfikacji schematu bazy danych lub operacji mogącej w najmniejszym stopniu wpłynąć na istniejące elementy bazy danych, agent **MUSI najpierw wyraźnie ostrzec użytkownika**, szczegółowo opisać ryzyko, zaproponować bezpieczne rozwiązanie (np. wcześniejszy zrzut kopii zapasowej + plan bezstratnej migracji) i **poczekać na wyraźną zgodę użytkownika przed wykonaniem jakichkolwiek działań**.

## 2. Izolacja Projektu na VPS
- Na serwerze VPS (`virtualMachineId: 1057110`) wolno operować wyłącznie w obrębie projektu `platforma-testowa-realmoment`.
- Nigdy nie wolno modyfikować ani zatrzymywać innych projektów na serwerze (w szczególności `root` z Traefik i n8n oraz `db_vector_store`).

## 3. Anonimowość Badanych i Język
- Wszystkie interfejsy, komunikaty, skale, podskale i interpretacje muszą być w języku polskim.
- System nigdy nie zbiera danych osobowych ani adresów e-mail od osób badanych (klientów wypełniających test).
