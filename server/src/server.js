import http from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server as SocketServer } from 'socket.io';

import RoomManager from './managers/RoomManager.js';
import GameEngine from './managers/GameEngine.js';
import { registerHandlers } from './handlers/index.js';

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
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
  console.log(`✅ Serveur du quiz démarré sur http://localhost:${PORT}`);
  console.log(`   Origine client autorisée : ${CLIENT_ORIGIN}`);
});
