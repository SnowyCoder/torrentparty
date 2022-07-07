<script setup lang="ts">
import { computed, provide, ref, shallowRef } from 'vue';
import { torrentKey, socketKey } from './store';
import Upload from './components/upload/Upload.vue';
import Download from './components/download/Download.vue';
import { Socket } from './socket';

const torrent = new window.WebTorrent({
//  tracker: false,
//  webSeeds: false,
});
provide(torrentKey, torrent);

let isLoading = ref(true);
let isConnected = ref(false);

const socketRef = shallowRef<Socket | null>(null);

provide(socketKey, computed(() => socketRef.value!))

async function loadDht() {
  const socket = await Socket.create();
  socketRef.value = socket;

  isLoading.value = false;

  if (!socket.isOnline) {
    return;
  }
  isConnected.value = true;
}
const isActive = location.hash == '';

loadDht();
</script>

<template>
  <p class="text-xl" v-if="isLoading">Loading...</p>
  <p class="text-xl" v-else-if="!isConnected">Connection failed, try again later</p>
  <template v-else>
    <div class="flex flex-col content-center item-center">
      <p class="text-5xl text-center py-4">TorrentParty</p>
      <Upload v-if="isActive"></Upload>
      <Download v-else></Download>
    </div>
  </template>
</template>

<style scoped>
</style>
