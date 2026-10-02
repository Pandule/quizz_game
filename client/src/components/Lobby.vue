<script setup>
const props = defineProps({
  players: { type: Array, required: true },
  isHost: { type: Boolean, required: true },
  availableThemes: { type: Array, default: () => [] },
  availableDifficulties: { type: Array, default: () => [] },
  availableQuestionCounts: { type: Array, default: () => [5, 10, 15, 20, 30] },
  selectedThemes: { type: Array, default: () => [] },
  selectedDifficulty: { type: String, default: 'Toutes' },
  selectedQuestionCount: { type: Number, default: 10 },
});

const emit = defineEmits(['start', 'toggle-theme', 'set-difficulty', 'set-question-count']);
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl bg-slate-800 p-6 shadow-xl ring-1 ring-white/10">
      <h2 class="mb-4 text-xl font-bold text-white">Joueurs ({{ players.length }})</h2>
      <ul class="space-y-2">
        <li v-for="player in players" :key="player.id" class="flex items-center gap-3 rounded-lg bg-slate-700/50 px-4 py-3 text-slate-200">
          <div class="h-8 w-8 flex-shrink-0 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold">
            {{ player.name.charAt(0).toUpperCase() }}
          </div>
          <span class="font-medium">{{ player.name }}</span>
          <span v-if="player.isHost" class="ml-auto text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">Hôte</span>
        </li>
      </ul>
    </div>

    <!-- Paramètres de la partie (Hôte) -->
    <div v-if="isHost" class="rounded-2xl bg-slate-800 p-6 shadow-xl ring-1 ring-white/10 space-y-6">
      <h2 class="text-xl font-bold text-white mb-2">Paramètres de la partie</h2>

      <!-- Nombre de questions -->
      <div>
        <h3 class="text-sm font-semibold text-slate-300 mb-3">Nombre de questions</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="count in availableQuestionCounts"
            :key="count"
            @click="emit('set-question-count', count)"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="selectedQuestionCount === count ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
          >
            {{ count }}
          </button>
        </div>
      </div>
      
      <!-- Difficulté -->
      <div>
        <h3 class="text-sm font-semibold text-slate-300 mb-3">Difficulté</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="diff in availableDifficulties"
            :key="diff"
            @click="emit('set-difficulty', diff)"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="selectedDifficulty === diff ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
          >
            {{ diff }}
          </button>
        </div>
      </div>

      <!-- Thèmes -->
      <div>
        <h3 class="text-sm font-semibold text-slate-300 mb-1">Thèmes</h3>
        <p class="text-xs text-slate-400 mb-3 italic">Aucune sélection = tous les thèmes</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="theme in availableThemes"
            :key="theme"
            @click="emit('toggle-theme', theme)"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            :class="selectedThemes.includes(theme) ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
          >
            {{ theme }}
          </button>
        </div>
      </div>

      <button
        @click="emit('start')"
        class="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:from-indigo-400 hover:to-purple-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="players.length === 0"
      >
        Lancer la partie
      </button>
    </div>

    <!-- Info Paramètres (Joueurs non hôte) -->
    <div v-else class="rounded-2xl bg-slate-800 p-6 shadow-xl ring-1 ring-white/10 text-center">
      <p class="text-slate-300 mb-4 animate-pulse">En attente de l'hôte pour lancer la partie…</p>
      
      <div class="mt-4 pt-4 border-t border-slate-700/50 text-sm text-slate-400 space-y-2">
        <p><span class="font-semibold text-slate-300">Questions :</span> {{ selectedQuestionCount }}</p>
        <p><span class="font-semibold text-slate-300">Difficulté :</span> {{ selectedDifficulty }}</p>
        <p><span class="font-semibold text-slate-300">Thèmes :</span> {{ selectedThemes.length ? selectedThemes.join(', ') : 'Tous' }}</p>
      </div>
    </div>
  </div>
</template>
