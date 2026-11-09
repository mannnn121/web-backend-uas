FROM node:22-alpine
WORKDIR /app

# postinstall menjalankan `prisma generate`, jadi schema harus ada sebelum npm ci
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["node", "app.js"]
