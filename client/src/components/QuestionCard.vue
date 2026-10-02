<script setup>
const props = defineProps({
  question: { type: Object, default: null },
  phase: { type: String, default: 'question' },
  selectedAnswer: { type: Number, default: null },
  correctAnswer: { type: Number, default: null },
  explanation: { type: String, default: '' },
});

const emit = defineEmits(['submit']);

// Palette « façon Kahoot » : rouge, bleu, jaune, vert.
const CHOICE_STYLES = [
  { bg: 'bg-red-500 hover:bg-red-400', shape: '▲' },
  { bg: 'bg-blue-500 hover:bg-blue-400', shape: '◆' },
  { bg: 'bg-yellow-500 hover:bg-yellow-400', shape: '●' },
  { bg: 'bg-green-500 hover:bg-green-400', shape: '■' },
];

function canAnswer() {
  return props.phase === 'question' && props.selectedAnswer === null;
}

function choiceClass(index) {
  const base = CHOICE_STYLES[index % CHOICE_STYLES.length].bg;
  if (props.phase === 'reveal') {
    if (index === props.correctAnswer) {
      return 'bg-green-600 ring-4 ring-green-300 opacity-100';
    }
    if (index === props.selectedAnswer) {
      return 'bg-slate-600 opacity-60';
    }
    return 'bg-slate-700 opacity-40';
  }
  if (index === props.selectedAnswer) {
    return `${base} ring-4 ring-white/70 opacity-90`;
  }
  return base;
}

function selectAnswer(index) {
  if (!canAnswer()) return;
  emit('submit', index);
}
</script>

<template>
  <section v-if="question" class="rounded-2xl bg-slate-800 p-6 shadow-xl ring-1 ring-white/10">
    <div class="mb-4 flex items-center justify-between text-sm text-slate-400">
      <span class="rounded-full bg-slate-700 px-3 py-1">{{ question.theme }}</span>
      <span>Question {{ question.questionIndex + 1 }} / {{ question.total }}</span>
    </div>

    <h2 class="text-2xl font-bold leading-snug sm:text-3xl">{{ question.prompt }}</h2>

    <div class="mt-6 grid gap-3 sm:grid-cols-2">
      <button
        v-for="(choice, index) in question.choices"
        :key="index"
        type="button"
        :disabled="!canAnswer()"
        class="flex items-center gap-3 rounded-xl px-4 py-4 text-left text-lg font-semibold text-white shadow-lg transition disabled:cursor-not-allowed"
        :class="choiceClass(index)"
        @click="selectAnswer(index)"
      >
        <span class="text-white/80">{{ CHOICE_STYLES[index % CHOICE_STYLES.length].shape }}</span>
        <span>{{ choice }}</span>
      </button>
    </div>

    <p v-if="phase === 'question' && selectedAnswer !== null" class="mt-4 text-center text-sm text-slate-400">
      Réponse envoyée — en attente des autres joueurs…
    </p>

    <div v-if="phase === 'reveal'" class="mt-6 rounded-xl bg-slate-900/60 p-4">
      <p class="font-semibold text-emerald-300">
        Bonne réponse&nbsp;: {{ question.choices[correctAnswer] }}
      </p>
      <p v-if="explanation" class="mt-1 text-sm text-slate-300">{{ explanation }}</p>
    </div>
  </section>
</template>
