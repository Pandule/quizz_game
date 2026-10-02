<script setup>
defineProps({
  players: { type: Array, default: () => [] },
  playerId: { type: String, default: '' },
  roundScores: { type: Array, default: () => [] },
});

function gained(player) {
  return player?.gained ?? 0;
}
</script>

<template>
  <section class="rounded-2xl bg-slate-800 p-5 shadow-xl ring-1 ring-white/10">
    <h3 class="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
      Classement
    </h3>
    <ul class="flex flex-col gap-2">
      <li
        v-for="(player, index) in players"
        :key="player.id"
        class="flex items-center gap-3 rounded-lg px-4 py-3"
        :class="player.id === playerId ? 'bg-indigo-500/20' : 'bg-slate-900/50'"
      >
        <span class="w-6 text-center font-bold text-slate-400">{{ index + 1 }}</span>
        <span class="flex-1 font-medium">
          {{ player.name }}
          <span v-if="player.id === playerId" class="text-xs text-indigo-300">(vous)</span>
        </span>
        <span
          v-if="gained(roundScores.find((s) => s.name === player.name)) > 0"
          class="text-sm font-semibold text-emerald-400"
        >
          +{{ gained(roundScores.find((s) => s.name === player.name)) }}
        </span>
        <span class="font-bold tabular-nums">{{ player.score }}</span>
      </li>
    </ul>
  </section>
</template>
