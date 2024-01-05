
<script setup lang="ts">
import { inject, ref, shallowRef } from 'vue';
import { Storage as IdbChunkStore } from 'idb-chunk-store';
import { socketKey, torrentKey } from '@/store';
import PlayTorrent from '../PlayTorrent.vue';
import StopSharingBtn from './StopSharingBtn.vue';

const torrent = inject(torrentKey)!;
const socket = inject(socketKey)!;

type Status = 'creating-torrent' | 'hashing' | 'sharing';
const status = ref<Status>('creating-torrent');

const emit = defineEmits(['end']);

interface Props {
  file: File,
}

const {
  file
} = defineProps<Props>();

const sharingProgress = ref<number>(0);
const torrentDestroyed = ref(false);

const opts = {
  onProgress: (a: number, b: number) => {
    status.value = 'hashing';
    sharingProgress.value = a / b;
  },
  store: IdbChunkStore,
} as any;
const torrentStream = shallowRef(torrent.seed(file, opts, (torrent) => {
  if (torrentDestroyed.value) {
    torrent.destroy({ destroyStore: true });
    console.log("Torrent destroyed");
    return;
  }
  torrentStream.value = torrent;
  socket.sendPacket({
    type: 'magnet-uri',
    uri: torrent.magnetURI,
  });
  status.value = 'sharing';
}));

function stopSharing() {
  torrentStream.value.destroy({
    destroyStore: true,
  });
  torrentDestroyed.value = true;
  socket.sendPacket({
    type: 'stop-torrent'
  })
  emit('end');
}
</script>


<template>
<div class="flex flex-col items-center">
  <div v-if="status == 'creating-torrent'">
    Your torrent is being created...
  </div>
  <div v-else-if="status == 'hashing'">
    Sharing... {{ (sharingProgress * 100).toFixed(2) + '%' }}
  </div>
  <div v-else>
    <PlayTorrent :stream="torrentStream" @end="stopSharing"></PlayTorrent>
  </div>
  <StopSharingBtn @click="stopSharing"></StopSharingBtn>
</div>
</template>
