#!/bin/sh
# Ten skrypt jest punktem wejściowym dla kontenera aplikacji.
# Zapewnia, że wszystkie niezbędne kroki przygotowawcze są wykonane przed uruchomieniem aplikacji.

# Zatrzymaj wykonanie skryptu w przypadku błędu
set -e

echo "🚀 Entrypoint: Uruchamianie procedury startowej..."

# 1. Zastosuj migracje Prisma
# To polecenie sprawia, że schemat bazy danych jest zawsze aktualny w stosunku do tego, co jest zdefiniowane w /prisma/schema.prisma
echo "    1/2: Stosowanie migracji bazy danych..."
npx prisma migrate deploy

# 2. Uruchom główną komendę kontenera
# Polecenie `exec "$@"` przekazuje kontrolę do komendy zdefiniowanej jako CMD w Dockerfile (czyli `node server.js`).
# Dzięki temu aplikacja Node.js staje się głównym procesem kontenera.
echo "    2/2: Uruchamianie aplikacji Node.js..."
exec "$@"
