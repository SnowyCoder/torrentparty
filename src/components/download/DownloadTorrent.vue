<script setup lang="ts">
import { torrentKey, socketKey } from '@/store';
import { inject, ref, shallowRef } from 'vue';
import type { Torrent } from 'webtorrent';
import PlayTorrent from '../PlayTorrent.vue';

const torrent = inject(torrentKey)!;
const socket = inject(socketKey)!;

const emit = defineEmits(['end']);

interface Props {
    magnetUri: string;
}

const {
    magnetUri,
} = defineProps<Props>();

const torrentStream = shallowRef<Torrent | undefined>();

torrent.add(magnetUri, x => {
  torrentStream.value = x;
});

function stop() {
  torrentStream.value?.destroy({
    destroyStore: true,
  });
  emit('end');
}
</script>


<template>
<PlayTorrent v-if="torrentStream != null" :stream="torrentStream" @end="stop"></PlayTorrent>
</template>
