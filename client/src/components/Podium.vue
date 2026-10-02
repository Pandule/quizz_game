<script setup>
import { computed } from 'vue';

const props = defineProps({
  podium: { type: Array, default: () => [] },
  ranking: { type: Array, default: () => [] },
});

const medals = ['🥇', '🥈', '🥉'];

const fullRanking = computed(() =>
  props.ranking.length ? props.ranking : props.podium.map((p) => ({ name: p.name, score: p.score }))
);

/** Recharge l'application : la reconnexion nettoie l'ancien salon côté serveur. */
function restart() {
  window.location.reload();
}
</script>

<template>
  <section class="rounded-2xl bg-slate-800 p-6 text-center shadow-xl ring-1 ring-white/10">
    <h2 class="text-3xl font-extrabold">🏆 Partie terminée</h2>

    <div class="mt-8 grid gap-4 sm:grid-cols-3">
      <div
        v-for="entry in podium"
        :key="entry.rank"
        class="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-white/10"
        :class="entry.rank === 1 ? 'sm:order-2 sm:-translate-y-4' : entry.rank === 2 ? 'sm:order-1' : 'sm:order-3'"
      >
        <p class="text-4xl">{{ medals[entry.rank - 1] }}</p>
        <p class="mt-2 text-lg font-bold">{{ entry.name }}</p>
        <p class="text-indigo-300">{{ entry.score }} pts</p>
      </div>
    </div>

    <div class="mt-8 text-left">
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
        Classement complet
      </h3>
      <ul class="flex flex-col gap-2">
        <li
          v-for="(entry, index) in fullRanking"
          :key="entry.name"
          class="flex items-center justify-between rounded-lg bg-slate-900/50 px-4 py-2"
        >
          <span><span class="mr-2 text-slate-400">{{ index + 1 }}.</span>{{ entry.name }}</span>
          <span class="font-bold">{{ entry.score }} pts</span>
        </li>
      </ul>
    </div>

    <button
      type="button"
      class="mt-8 rounded-lg bg-indigo-600 px-6 py-3 font-semibold transition hover:bg-indigo-500"
      @click="restart"
    >
      Nouvelle partie
    </button>
  </section>
</template>
