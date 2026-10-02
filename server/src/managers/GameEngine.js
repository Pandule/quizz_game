import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Charge la banque de questions depuis les fichiers locaux. */
function loadQuestions() {
  const files = [
    'questions_cultureg.json',
    'questions_musique.json',
    'questions_pop_culture.json',
    'questions_science.json',
    'question_sport.json'
  ];
  const all = [];
  for (const file of files) {
    try {
      const raw = readFileSync(join(__dirname, '..', 'data', file), 'utf-8');
      all.push(...JSON.parse(raw));
    } catch (e) {
      console.warn(`Impossible de charger ${file}:`, e.message);
    }
  }
  return all;
}

const QUESTIONS = loadQuestions();

export function getAvailableThemes() {
  const themes = new Set(QUESTIONS.map(q => q.theme).filter(Boolean));
  return Array.from(themes).sort();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const DEFAULT_ROUNDS = 10;
const ALLOWED_ROUND_COUNTS = [5, 10, 15, 20, 30];
const QUESTION_TIME_MS = 15_000;
const REVEAL_TIME_MS = 5_000;
const BASE_POINTS = 500;
const SPEED_POINTS = 300;

export function getAvailableQuestionCounts() {
  return ALLOWED_ROUND_COUNTS;
}

export default class GameEngine {
  constructor(io, roomManager) {
    this.io = io;
    this.roomManager = roomManager;
    this.timers = new Map();
  }

  _clearTimers(code) {
    const timers = this.timers.get(code);
    if (!timers) return;
    if (timers.question) clearTimeout(timers.question);
    if (timers.reveal) clearTimeout(timers.reveal);
    this.timers.delete(code);
  }

  destroyRoom(code) {
    this._clearTimers(code);
  }

  _pickQuestions(settings = {}) {
    let { themes = [], difficulty = 'Toutes', questionCount = DEFAULT_ROUNDS } = settings;

    // Sécurité : forcer une valeur autorisée.
    if (!ALLOWED_ROUND_COUNTS.includes(questionCount)) {
      questionCount = DEFAULT_ROUNDS;
    }

    let filtered = QUESTIONS.filter(q => {
      if (themes && themes.length > 0 && !themes.includes(q.theme)) {
        return false;
      }
      if (difficulty !== 'Toutes' && q.difficulty !== difficulty) {
        return false;
      }
      return true;
    });
    
    shuffleArray(filtered);
    return filtered.slice(0, questionCount);
  }

  startGame(room) {
    this._clearTimers(room.code);
    room.state = 'PLAYING';
    room.currentQuestion = 0;
    room.questions = this._pickQuestions(room.settings);
    for (const player of room.players.values()) {
      player.score = 0;
      player.answered = false;
      player.hasAnsweredCorrectly = false;
      player.lastGain = 0;
    }
    this._sendQuestion(room);
  }

  _currentQuestion(room) {
    return room.questions[room.currentQuestion];
  }

  _sendQuestion(room) {
    const question = this._currentQuestion(room);
    const endsAt = Date.now() + QUESTION_TIME_MS;
    room.endsAt = endsAt;
    room.roundEnded = false;

    for (const player of room.players.values()) {
      player.answered = false;
      player.hasAnsweredCorrectly = false;
      player.answeredAt = null;
      player.lastGain = 0;
    }

    this.io.to(room.code).emit('game:new_question', {
      questionIndex: room.currentQuestion,
      total: room.questions.length,
      theme: question.theme,
      prompt: question.prompt,
      choices: question.choices,
      timeLimit: QUESTION_TIME_MS,
      endsAt,
      serverNow: Date.now(),
    });

    const timers = this.timers.get(room.code) ?? {};
    timers.question = setTimeout(() => this._endRound(room), QUESTION_TIME_MS);
    this.timers.set(room.code, timers);
  }

  /**
   * Enregistre la réponse d'un joueur.
   * Les points ne sont PAS calculés ici — ils le sont dans _endRound,
   * en fonction du classement relatif parmi les bonnes réponses.
   */
  submitAnswer(room, playerId, answerIndex) {
    if (!room || room.state !== 'PLAYING') return;
    const player = room.players.get(playerId);
    if (!player || player.answered) return;

    const question = this._currentQuestion(room);
    if (!question) return;

    player.answered = true;
    player.hasAnsweredCorrectly = answerIndex === question.correctIndex;
    player.answeredAt = Date.now();

    // Fin anticipée de la manche si tout le monde a répondu.
    const everyoneAnswered = [...room.players.values()].every((p) => p.answered);
    if (everyoneAnswered) {
      this._endRound(room);
    }
  }

  /**
   * Clôture la manche : calcule les points selon le classement relatif
   * de rapidité parmi les bonnes réponses, puis révèle le résultat.
   *
   * Formule : points = BASE_POINTS + SPEED_POINTS × (N - rang) / max(N - 1, 1)
   *   - 1er correct → 200 + 800 = 1000
   *   - Dernier correct → 200 + 0 = 200
   *   - Mauvaise réponse / pas de réponse → 0
   */
  _endRound(room) {
    if (room.state !== 'PLAYING' || room.roundEnded) return;
    room.roundEnded = true;

    const timers = this.timers.get(room.code);
    if (timers?.question) {
      clearTimeout(timers.question);
      timers.question = undefined;
    }

    // --- Calcul des points basé sur le rang relatif ---
    const players = [...room.players.values()];

    // Bonnes réponses triées par rapidité (answeredAt croissant = le plus rapide en premier).
    const correctPlayers = players
      .filter((p) => p.hasAnsweredCorrectly && p.answeredAt != null)
      .sort((a, b) => a.answeredAt - b.answeredAt);

    const N = correctPlayers.length;

    for (let i = 0; i < N; i++) {
      const p = correctPlayers[i];
      // rang 0 = le plus rapide, rang N-1 = le plus lent parmi les corrects.
      const speedBonus = Math.round((N - 1 - i) / Math.max(N - 1, 1) * SPEED_POINTS);
      const gained = BASE_POINTS + speedBonus;
      p.score += gained;
      p.lastGain = gained;
    }

    // Les joueurs qui ont eu faux ou n'ont pas répondu → 0 pts.
    for (const p of players) {
      if (!p.hasAnsweredCorrectly || p.answeredAt == null) {
        p.lastGain = 0;
      }
    }

    const question = this._currentQuestion(room);
    const scores = players
      .map((p) => ({ name: p.name, score: p.score, gained: p.lastGain }))
      .sort((a, b) => b.score - a.score);

    this.io.to(room.code).emit('game:round_ended', {
      correctAnswer: question.correctIndex,
      explanation: question.explanation ?? '',
      scores,
    });

    this.timers.get(room.code).reveal = setTimeout(
      () => this._nextRound(room),
      REVEAL_TIME_MS
    );
  }

  _nextRound(room) {
    if (room.state !== 'PLAYING') return;

    room.currentQuestion += 1;
    if (room.currentQuestion >= room.questions.length) {
      this._endGame(room);
      return;
    }
    this._sendQuestion(room);
  }

  _endGame(room) {
    this._clearTimers(room.code);
    room.state = 'ENDED';

    const ranking = [...room.players.values()]
      .map((p) => ({ name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score);

    const podium = ranking.slice(0, 3).map((entry, index) => ({
      rank: index + 1,
      name: entry.name,
      score: entry.score,
    }));

    this.io.to(room.code).emit('game:game_over', { podium, ranking });
  }
}