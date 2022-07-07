<script setup lang="ts">
import { torrentKey, socketKey } from '@/store';
import { inject, ref, shallowRef } from 'vue';
import { Torrent, TorrentFile } from 'webtorrent';

const torrent = inject(torrentKey)!;
const socket = inject(socketKey)!.value;

type Props = {
    magnetUri: string;
}

const {
    magnetUri
} = defineProps<Props>();

const torrentStream = shallowRef<Torrent | undefined>();
const torrentFile = shallowRef<TorrentFile | undefined>();
const progress = ref('0%');

torrent.add(magnetUri, x => {
  torrentStream.value = x;
  console.log("Torrent initialized", x);
  x.on('done', () => {
    console.log("Torrent done(?)");
    progress.value = '100%';
    socket.sendPacket({
      type: 'download-status',
      value: 1,
    });
  });
  x.on('download', () => {
    progress.value = (x.progress * 100).toFixed(2) + '%';
    socket.sendPacket({
      type: 'download-status',
      value: x.progress,
    });
    torrentFile.value = x.files[0];
  })
});
</script>


<template>
Progress: {{progress}}
<Play v-if="torrentFile != null" :file="torrentFile"></Play>
</template>
