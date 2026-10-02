import RoomManager from '../managers/RoomManager.js';
import { getAvailableThemes, getAvailableQuestionCounts } from '../managers/GameEngine.js';

const MAX_NAME_LENGTH = 20;

/** Valide et nettoie un pseudonyme. @returns {string | null} */
function sanitizeName(name) {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) return null;
  return trimmed;
}

function emitError(socket, code, message) {
  socket.emit('error:message', { code, message });
}

function broadcastPlayerList(io, room) {
  io.to(room.code).emit('room:player_list', {
    players: RoomManager.playerList(room),
  });
}

/**
 * Enregistre tous les gestionnaires d'événements Socket.io pour une connexion.
 */
export function registerHandlers({ io, socket, roomManager, gameEngine }) {
  // --- Création d'un salon (l'émetteur devient hôte) ---
  socket.on('room:create', ({ hostName } = {}) => {
    const name = sanitizeName(hostName);
    if (!name) {
      return emitError(
        socket,
        'INVALID_NAME',
        'Veuillez saisir un pseudonyme valide (1 à 20 caractères).'
      );
    }

    const room = roomManager.createRoom(socket.id, name);
    socket.join(room.code);

    socket.emit('room:joined', {
      roomCode: room.code,
      playerId: socket.id,
      isHost: true,
    });
    broadcastPlayerList(io, room);
  });

  // --- Rejoindre un salon existant ---
  socket.on('room:join', ({ roomCode, playerName } = {}) => {
    const name = sanitizeName(playerName);
    if (!name) {
      return emitError(
        socket,
        'INVALID_NAME',
        'Veuillez saisir un pseudonyme valide (1 à 20 caractères).'
      );
    }

    const room = roomManager.getRoom(roomCode);
    if (!room) {
      return emitError(socket, 'ROOM_NOT_FOUND', 'Salon introuvable. Vérifiez le code saisi.');
    }
    if (room.state !== 'LOBBY') {
      return emitError(socket, 'GAME_ALREADY_STARTED', 'La partie a déjà commencé dans ce salon.');
    }
    if (roomManager.isNameTaken(room, name)) {
      return emitError(socket, 'NAME_TAKEN', 'Ce pseudonyme est déjà pris dans ce salon.');
    }

    const { player } = roomManager.joinRoom(roomCode, socket.id, name);
    socket.join(room.code);

    socket.emit('room:joined', {
      roomCode: room.code,
      playerId: player.id,
      isHost: room.hostId === socket.id,
    });
    broadcastPlayerList(io, room);
  });

  socket.on('game:get_themes', () => {
    socket.emit('game:themes_list', {
      themes: getAvailableThemes(),
      difficulties: ["Toutes", "Facile", "Moyen", "Difficile"],
      questionCounts: getAvailableQuestionCounts(),
    });
  });

  // --- Lancement de la partie (hôte uniquement) ---
  socket.on('game:start', ({ roomCode, settings } = {}) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      return emitError(socket, 'ROOM_NOT_FOUND', 'Salon introuvable.');
    }
    if (room.hostId !== socket.id) {
      return emitError(socket, 'NOT_HOST', 'Seul l’hôte peut lancer la partie.');
    }
    if (room.state !== 'LOBBY') {
      return emitError(socket, 'INVALID_STATE', 'La partie est déjà en cours.');
    }

    room.settings = settings || {};
    gameEngine.startGame(room);
  });

  // --- Soumission de la réponse d'un joueur ---
  socket.on('game:submit_answer', ({ roomCode, answerIndex } = {}) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    if (room.state !== 'PLAYING') return;
    if (!Number.isInteger(answerIndex)) return;

    gameEngine.submitAnswer(room, socket.id, answerIndex);
  });

  // --- Déconnexion ---
  socket.on('disconnect', () => {
    const { room, code, deleted, hostChanged } = roomManager.removePlayer(socket.id);
    if (deleted) {
      // Salon vide : on libère les timers éventuels.
      if (code) gameEngine.destroyRoom(code);
      return;
    }
    if (!room) return;

    if (hostChanged && room.state === 'PLAYING') {
      // L'hôte a quitté pendant une partie : on informe les autres joueurs.
      io.to(room.code).emit('error:message', {
        code: 'HOST_LEFT',
        message: 'L’hôte a quitté la partie.',
      });
    }
    broadcastPlayerList(io, room);
  });
}
