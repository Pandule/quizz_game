<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  endsAt: { type: Number, required: true },
  timeOffset: { type: Number, default: 0 },
  duration: { type: Number, default: 15000 },
});

const remaining = ref(0);
let frame = null;

function tick() {
  const serverNow = Date.now() + props.timeOffset;
  remaining.value = Math.max(0, props.endsAt - serverNow);
  frame = requestAnimationFrame(tick);
}

onMounted(tick);
onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame);
});

const seconds = computed(() => Math.ceil(remaining.value / 1000));
const percent = computed(() =>
  Math.max(0, Math.min(100, (remaining.value / props.duration) * 100))
);
const urgent = computed(() => seconds.value <= 5);
</script>

<template>
  <div class="mb-4 flex items-center gap-4">
    <div
      class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold"
      :class="urgent ? 'bg-red-500/20 text-red-300' : 'bg-indigo-500/20 text-indigo-300'"
    >
      {{ seconds }}
    </div>
    <div class="h-3 w-full overflow-hidden rounded-full bg-slate-700">
      <div
        class="h-full rounded-full transition-[width] duration-100 ease-linear"
        :class="urgent ? 'bg-red-500' : 'bg-indigo-500'"
        :style="{ width: percent + '%' }"
      />
    </div>
  </div>
</template>
