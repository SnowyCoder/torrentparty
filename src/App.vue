<script setup lang="ts">
import { computed, provide, ref, shallowRef } from 'vue';
import { torrentKey, socketKey } from './store';
import { Socket } from './socket/Socket';
import ChooseRoom from './components/ChooseRoom.vue';
import Room from './components/Room.vue';
import type WebTorrent from 'webtorrent';

interface Props {
  torrent: WebTorrent.Instance,
  socket: Socket,
};
const {
  torrent, socket
} = defineProps<Props>();

provide(torrentKey, torrent);
provide(socketKey, socket);

const room = socket.plugins.room.locHash;

</script>

<template>
  <ChooseRoom v-if="room == ''"></ChooseRoom>
  <Room v-else></Room>
</template>

<style scoped>
</style>
