
<script setup lang="ts">
import { inject, ref, shallowRef } from 'vue';
import { Storage as IdbChunkStore } from 'idb-chunk-store';
import { socketKey, torrentKey } from '@/store';
import { Torrent, TorrentFile } from 'webtorrent';
import { onEvent } from '@/socket';

const torrent = inject(torrentKey)!;
const socket = inject(socketKey)!.value;

type Status = 'creating-torrent' | 'hashing' | 'sharing';
const status = ref<Status>('creating-torrent');


interface Props {
  file: File,
}

const {
  file
} = defineProps<Props>();

const sharingProgress = ref<number>(0);
const torrentStream = shallowRef<Torrent | undefined>();
const torrentFile = shallowRef<TorrentFile | null>(null);


onEvent(socket.events, 'connect', (peer) => {
  if (torrentFile.value) {
    socket.sendPacket({
      type: 'magnet-uri',
      uri: torrentStream.value!.magnetURI,
    }, peer);
  }
});


const opts = {
  onProgress: (a: number, b: number) => {
    status.value = 'hashing';
    sharingProgress.value = a / b;
  },
  store: IdbChunkStore,
} as any;

torrent.seed(file, opts, (torrent) => {
  torrentStream.value = torrent;
  socket.sendPacket({
    type: 'magnet-uri',
    uri: torrentStream.value!.magnetURI,
  });
  torrentFile.value = torrentStream.value!.files[0];
  status.value = 'sharing';
});
</script>


<template>
<div v-if="status == 'creating-torrent'">
  Your torrent is being created...
  </div>
  <div v-else-if="status == 'hashing'">
    Sharing... {{ (sharingProgress * 100).toFixed(2) + '%' }}
  </div>
  <div v-else>
    <Play v-if="torrentFile != null" :file="torrentFile"></Play>
  </div>
</template>
