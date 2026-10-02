<script setup>
import { onMounted } from 'vue';

import HomeView from './views/HomeView.vue';
import RoomView from './views/RoomView.vue';
import { useQuizStore } from './stores/quizStore.js';

const store = useQuizStore();

onMounted(() => store.initListeners());
</script>

<template>
  <div class="min-h-full">
    <Transition name="fade" mode="out-in">
      <HomeView v-if="store.view === 'home'" key="home" />
      <RoomView v-else key="room" />
    </Transition>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
