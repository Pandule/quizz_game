# 1. Étape de build du frontend Vue.js
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# 2. Image finale pour le backend Node.js
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Dépendances backend
COPY server/package*.json ./
RUN npm ci --omit=dev

# Code source backend
COPY server/ ./

# Récupération du build frontend (dossier dist)
COPY --from=client-builder /app/client/dist ./public

# Sécurité : exécution avec un utilisateur non-root
USER node

EXPOSE 3000

CMD ["node", "src/server.js"]