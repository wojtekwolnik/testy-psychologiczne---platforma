# Etap 1: Build aplikacji
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

# Etap 2: Stworzenie finalnego, lekkiego obrazu produkcyjnego
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

# Kopiujemy tylko niezbędne pliki z etapu 'builder'
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY server.js . 

# Kopiujemy i przygotowujemy skrypt entrypoint
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000

# Ustawiamy entrypoint, który uruchomi migracje przed startem aplikacji
ENTRYPOINT ["./entrypoint.sh"]

# Domyślna komenda, która zostanie przekazana do entrypoint.sh
CMD ["node", "server.js"]
