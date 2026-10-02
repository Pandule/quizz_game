<script setup>
import Lobby from '../components/Lobby.vue';
import QuestionCard from '../components/QuestionCard.vue';
import ScoreBoard from '../components/ScoreBoard.vue';
import Timer from '../components/Timer.vue';
import Podium from '../components/Podium.vue';
import { useQuizStore } from '../stores/quizStore.js';

const store = useQuizStore();
</script>

<template>
  <main class="mx-auto max-w-4xl px-4 py-8">
    <header
      class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-800 px-5 py-4 shadow-lg ring-1 ring-white/10"
    >
      <div>
        <p class="text-xs uppercase tracking-widest text-slate-400">Code du salon</p>
        <p class="text-2xl font-bold tracking-[0.3em] text-indigo-300">{{ store.roomCode }}</p>
      </div>
      <div class="flex items-center gap-4 text-sm text-slate-300">
        <span>{{ store.players.length }} joueur(s)</span>
        <span
          class="inline-flex items-center gap-2 rounded-full px-3 py-1"
          :class="store.connected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'"
        >
          <span class="h-2 w-2 rounded-full" :class="store.connected ? 'bg-emerald-400' : 'bg-red-400'" />
          {{ store.connected ? 'Connecté' : 'Déconnecté' }}
        </span>
      </div>
    </header>

    <p
      v-if="store.error"
      class="mb-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300"
      role="alert"
    >
      {{ store.error }}
    </p>

    <!-- Salle d'attente -->
    <Lobby
      v-if="store.gameState === 'LOBBY'"
      :players="store.players"
      :is-host="store.isHost"
      :available-themes="store.availableThemes"
      :available-difficulties="store.availableDifficulties"
      :available-question-counts="store.availableQuestionCounts"
      :selected-themes="store.selectedThemes"
      :selected-difficulty="store.selectedDifficulty"
      :selected-question-count="store.selectedQuestionCount"
      @start="store.startGame()"
      @toggle-theme="store.toggleTheme($event)"
      @set-difficulty="store.setDifficulty($event)"
      @set-question-count="store.setQuestionCount($event)"
    />

    <!-- Partie en cours -->
    <template v-else-if="store.gameState === 'PLAYING'">
      <Timer
        v-if="store.phase === 'question'"
        :ends-at="store.endsAt"
        :time-offset="store.timeOffset"
        :duration="store.question?.timeLimit || 15000"
      />
      <QuestionCard
        :question="store.question"
        :phase="store.phase"
        :selected-answer="store.selectedAnswer"
        :correct-answer="store.correctAnswer"
        :explanation="store.explanation"
        @submit="store.submitAnswer($event)"
      />
      <ScoreBoard
        class="mt-6"
        :players="store.sortedPlayers"
        :player-id="store.playerId"
        :round-scores="store.roundScores"
      />
    </template>

    <!-- Fin de partie -->
    <Podium v-else :podium="store.podium" :ranking="store.ranking" />
  </main>
</template>
