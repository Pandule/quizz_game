import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { Server as SocketServer } from 'socket.io';

import RoomManager from './managers/RoomManager.js';
import GameEngine from './managers/GameEngine.js';
import { registerHandlers } from './handlers/index.js';

// Gestion de __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port configuré par défaut à 3000 (comme dans le Dockerfile / compose)
const PORT = Number(process.env.PORT) || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// 1. Routes API / Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// 2. Servir les fichiers statiques du front (dossier public/ créé dans le Dockerfile)
const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

// 3. Redirection SPA (renvoie index.html pour les routes Vue Router)
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const httpServer = http.createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();
const gameEngine = new GameEngine(io, roomManager);

io.on('connection', (socket) => {
  console.log(`[socket] connexion ${socket.id}`);
  registerHandlers({ io, socket, roomManager, gameEngine });
  socket.on('disconnect', () => console.log(`[socket] déconnexion ${socket.id}`));
});

httpServer.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});