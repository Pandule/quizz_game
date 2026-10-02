/**
 * Caractères utilisés pour générer les codes de salon.
 * On exclut les caractères ambigus (I, O, 0, 1) pour faciliter la saisie.
 */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 4;

/**
 * @typedef {{ id: string, name: string, score: number, answered: boolean, hasAnsweredCorrectly: boolean, lastGain: number }} Player
 * @typedef {{ code: string, hostId: string, players: Map<string, Player>, state: 'LOBBY' | 'PLAYING' | 'ENDED', currentQuestion: number }} Room
 */

/**
 * Encapsule l'état en mémoire de tous les salons de jeu.
 */
export default class RoomManager {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
  }

  /** Génère un code de salon court, unique et alphanumérique. */
  _generateCode() {
    let code;
    do {
      code = Array.from(
        { length: CODE_LENGTH },
        () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
      ).join('');
    } while (this.rooms.has(code));
    return code;
  }

  _createPlayer(id, name) {
    return {
      id,
      name,
      score: 0,
      answered: false,
      hasAnsweredCorrectly: false,
      lastGain: 0,
    };
  }

  /**
   * Crée un salon et assigne l'émetteur comme hôte.
   * @returns {Room}
   */
  createRoom(hostId, hostName) {
    const code = this._generateCode();
    const room = {
      code,
      hostId,
      players: new Map([[hostId, this._createPlayer(hostId, hostName)]]),
      state: 'LOBBY',
      currentQuestion: -1,
    };
    this.rooms.set(code, room);
    return room;
  }

  /** @returns {Room | undefined} */
  getRoom(code) {
    if (!code) return undefined;
    return this.rooms.get(String(code).toUpperCase());
  }

  /** Indique si un pseudonyme est déjà utilisé dans le salon. */
  isNameTaken(room, name) {
    const target = name.trim().toLowerCase();
    return [...room.players.values()].some(
      (player) => player.name.toLowerCase() === target
    );
  }

  /**
   * Ajoute un joueur à un salon existant.
   * @returns {{ room: Room, player: Player }}
   */
  joinRoom(code, playerId, playerName) {
    const room = this.getRoom(code);
    if (!room) return { room: undefined };

    const player = this._createPlayer(playerId, playerName.trim());
    room.players.set(playerId, player);
    return { room, player };
  }

  /**
   * Retire un joueur d'un salon.
   * Gère la fin d'hôte (transfert ou destruction) et supprime le salon s'il devient vide.
   * @returns {{ room?: Room, wasHost: boolean, hostChanged: boolean, deleted: boolean }}
   */
  removePlayer(playerId) {
    for (const room of this.rooms.values()) {
      const player = room.players.get(playerId);
      if (!player) continue;

      room.players.delete(playerId);
      const wasHost = room.hostId === playerId;

      if (room.players.size === 0) {
        this.rooms.delete(room.code);
        return { room: undefined, code: room.code, wasHost, hostChanged: false, deleted: true };
      }

      let hostChanged = false;
      if (wasHost) {
        // Transfert du rôle d'hôte au joueur suivant.
        const nextHost = room.players.values().next().value;
        room.hostId = nextHost.id;
        hostChanged = true;
      }

      return { room, wasHost, hostChanged, deleted: false };
    }

    return { wasHost: false, hostChanged: false, deleted: false };
  }

  /** Représentation sérialisable de la liste des joueurs. */
  static playerList(room) {
    if (!room) return [];
    return [...room.players.values()].map(({ id, name, score }) => ({
      id,
      name,
      score,
    }));
  }
}
