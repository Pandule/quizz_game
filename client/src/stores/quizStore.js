import { defineStore } from 'pinia';

import { socket } from '../socket.js';

const initialState = () => ({
  connected: false,
  roomCode: '',
  playerId: '',
  isHost: false,
  players: [],
  view: 'home', // 'home' | 'room'
  gameState: 'LOBBY', // 'LOBBY' | 'PLAYING' | 'ENDED'
  phase: 'lobby', // 'lobby' | 'question' | 'reveal' | 'over'
  availableThemes: [],
  availableDifficulties: ['Toutes', 'Facile', 'Moyen', 'Difficile'],
  availableQuestionCounts: [5, 10, 15, 20, 30],
  selectedThemes: [],
  selectedDifficulty: 'Toutes',
  selectedQuestionCount: 10,
  question: null, // { questionIndex, total, theme, prompt, choices, timeLimit }
  endsAt: 0,
  timeOffset: 0,
  selectedAnswer: null,
  correctAnswer: null,
  explanation: '',
  roundScores: [],
  ranking: [],
  podium: [],
  error: '',
  listenersReady: false,
});

export const useQuizStore = defineStore('quiz', {
  state: initialState,

  getters: {
    /** Joueurs triés par score décroissant. */
    sortedPlayers: (state) => [...state.players].sort((a, b) => b.score - a.score),
    /** Nombre de joueurs ayant répondu (utile pour l'affichage). */
    answeredCount: (state) => state.roundScores.length,
  },

  actions: {
    /** Branche les écouteurs Socket.io (une seule fois). */
    initListeners() {
      if (this.listenersReady) return;
      this.listenersReady = true;

      socket.on('connect', () => {
        this.connected = true;
        socket.emit('game:get_themes');
      });
      socket.on('disconnect', () => {
        this.connected = false;
      });

      socket.on('game:themes_list', ({ themes, difficulties, questionCounts }) => {
        this.availableThemes = themes || [];
        if (difficulties) {
          this.availableDifficulties = difficulties;
        }
        if (questionCounts) {
          this.availableQuestionCounts = questionCounts;
        }
      });

      socket.on('room:joined', ({ roomCode, playerId, isHost }) => {
        this.roomCode = roomCode;
        this.playerId = playerId;
        this.isHost = isHost;
        this.view = 'room';
      });

      socket.on('room:player_list', ({ players }) => {
        this.players = players;
      });

      socket.on('game:new_question', (payload) => {
        const { endsAt, serverNow } = payload;
        // Synchronisation temporelle : décalage entre l'horloge serveur et locale.
        this.timeOffset = serverNow - Date.now();
        this.question = payload;
        this.endsAt = endsAt;
        this.selectedAnswer = null;
        this.correctAnswer = null;
        this.explanation = '';
        this.roundScores = [];
        this.gameState = 'PLAYING';
        this.phase = 'question';
      });

      socket.on('game:round_ended', ({ correctAnswer, explanation, scores }) => {
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
        this.roundScores = scores;
        this.players = this.players.map((player) => {
          const updated = scores.find((s) => s.name === player.name);
          return updated ? { ...player, score: updated.score } : player;
        });
        this.phase = 'reveal';
      });

      socket.on('game:game_over', ({ podium, ranking }) => {
        this.podium = podium;
        if (ranking) this.ranking = ranking;
        this.gameState = 'ENDED';
        this.phase = 'over';
      });

      socket.on('error:message', ({ message }) => {
        this.error = message;
      });
    },

    createRoom(hostName) {
      this.error = '';
      socket.emit('room:create', { hostName });
    },

    joinRoom(roomCode, playerName) {
      this.error = '';
      socket.emit('room:join', {
        roomCode: String(roomCode).trim().toUpperCase(),
        playerName,
      });
    },

    startGame() {
      this.error = '';
      socket.emit('game:start', {
        roomCode: this.roomCode,
        settings: {
          themes: this.selectedThemes,
          difficulty: this.selectedDifficulty,
          questionCount: this.selectedQuestionCount,
        },
      });
    },

    submitAnswer(answerIndex) {
      if (this.phase !== 'question' || this.selectedAnswer !== null) return;
      this.selectedAnswer = answerIndex;
      socket.emit('game:submit_answer', {
        roomCode: this.roomCode,
        answerIndex,
      });
    },

    toggleTheme(theme) {
      const index = this.selectedThemes.indexOf(theme);
      if (index === -1) {
        this.selectedThemes.push(theme);
      } else {
        this.selectedThemes.splice(index, 1);
      }
    },

    setDifficulty(difficulty) {
      this.selectedDifficulty = difficulty;
    },

    setQuestionCount(count) {
      this.selectedQuestionCount = count;
    },

    clearError() {
      this.error = '';
    },
  },
});
