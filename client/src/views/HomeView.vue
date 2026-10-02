<script setup>
import { ref } from 'vue';

import { useQuizStore } from '../stores/quizStore.js';

const store = useQuizStore();

const hostName = ref('');
const roomCode = ref('');
const playerName = ref('');

function createRoom() {
  if (!hostName.value.trim()) {
    store.error = 'Veuillez saisir un pseudonyme.';
    return;
  }
  store.createRoom(hostName.value);
}

function joinRoom() {
  if (!playerName.value.trim()) {
    store.error = 'Veuillez saisir un pseudonyme.';
    return;
  }
  if (!roomCode.value.trim()) {
    store.error = 'Veuillez saisir un code de salon.';
    return;
  }
  store.joinRoom(roomCode.value, playerName.value);
}
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-4 py-10">
    <header class="text-center">
      <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">
        Quiz <span class="text-indigo-400">Multijoueur</span>
      </h1>
      <p class="mt-3 text-slate-400">
        Créez un salon ou rejoignez une partie en temps réel.
      </p>
    </header>

    <p
      v-if="!store.connected"
      class="rounded-lg bg-amber-500/15 px-4 py-2 text-sm text-amber-300"
    >
      Connexion au serveur en cours…
    </p>

    <p
      v-if="store.error"
      class="w-full rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300"
      role="alert"
    >
      {{ store.error }}
    </p>

    <div class="grid w-full gap-6 sm:grid-cols-2">
      <!-- Créer une partie -->
      <section class="rounded-2xl bg-slate-800 p-6 shadow-xl ring-1 ring-white/10">
        <h2 class="text-xl font-semibold">Créer une partie</h2>
        <p class="mt-1 text-sm text-slate-400">Vous serez l’hôte de la partie.</p>
        <form class="mt-4 flex flex-col gap-3" @submit.prevent="createRoom">
          <input
            v-model="hostName"
            type="text"
            maxlength="20"
            placeholder="Votre pseudonyme"
            class="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            :disabled="!store.connected"
            class="rounded-lg bg-indigo-600 px-4 py-2 font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Créer le salon
          </button>
        </form>
      </section>

      <!-- Rejoindre une partie -->
      <section class="rounded-2xl bg-slate-800 p-6 shadow-xl ring-1 ring-white/10">
        <h2 class="text-xl font-semibold">Rejoindre une partie</h2>
        <p class="mt-1 text-sm text-slate-400">Saisissez le code fourni par l’hôte.</p>
        <form class="mt-4 flex flex-col gap-3" @submit.prevent="joinRoom">
          <input
            v-model="roomCode"
            type="text"
            maxlength="5"
            placeholder="Code du salon (ex. K7X9)"
            class="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 uppercase tracking-widest outline-none focus:border-indigo-500"
          />
          <input
            v-model="playerName"
            type="text"
            maxlength="20"
            placeholder="Votre pseudonyme"
            class="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            :disabled="!store.connected"
            class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Rejoindre
          </button>
        </form>
      </section>
    </div>
  </main>
</template>
