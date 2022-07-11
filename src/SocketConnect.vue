<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import { Socket } from './socket/Socket';
import App from './App.vue';

const torrent = new window.WebTorrent({
//  tracker: false,
//  webSeeds: false,
});

let isLoading = ref(true);
let isConnected = ref(false);

const socketRef = shallowRef<Socket | null>(null);

async function loadDht() {
  const socket = await Socket.create();
  socketRef.value = socket;

  isLoading.value = false;

  if (!socket.isOnline) {
    return;
  }
  isConnected.value = true;
}

loadDht();
</script>

<template>
  <div class="flex flex-col justify-center items-center">
    <p class="text-5xl text-center py-4">TorrentParty</p>

    <p class="text-xl" v-if="isLoading">Loading...</p>
    <p class="text-xl" v-else-if="!isConnected">Connection failed, try again later</p>
    <App v-else :socket="socketRef!" :torrent="torrent"/>
  </div>
</template>

<style scoped>
</style>
