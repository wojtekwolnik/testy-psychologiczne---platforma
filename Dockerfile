# Etap 1: Budowanie aplikacji
FROM node:20-slim as builder

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie plików package.json i package-lock.json (jeśli istnieje)
COPY package*.json ./

# Instalacja zależności
RUN npm install

# Kopiowanie reszty plików aplikacji
COPY . .

# Budowanie aplikacji
RUN npm run build

# Etap 2: Serwowanie aplikacji
FROM node:20-slim

WORKDIR /app

# Kopiowanie zbudowanej aplikacji z etapu "builder"
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --omit=dev

# Ustawienie domyślnego portu, na którym nasłuchuje aplikacja Vite preview
EXPOSE 4173

# Komenda do uruchomienia serwera preview
CMD [ "npm", "run", "preview" ]
