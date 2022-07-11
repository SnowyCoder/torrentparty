<script setup lang="ts">
import { onEvent } from '@/socket/Socket';
import { socketKey } from '@/store';
import { inject, onUnmounted } from 'vue';
import PlayStream from '../PlayStream.vue';

const socket = inject(socketKey)!;

interface Props {
    streamer: string;
}
const {
    streamer
} = defineProps<Props>();

const emit = defineEmits(['end']);

const stream = new MediaStream();

for (const peer of socket.peers.values()) {
    for (let rec of peer.connection.getReceivers()) {
        stream.addTrack(rec.track);
    }
    peer.connection.ontrack = (ev) => {
        console.log("Track!", ev.track);
        stream.addTrack(ev.track);
    };
};

onEvent(socket.events, 'p/stop-stream', () => {
    emit('end');
})

onUnmounted(() => {
    for (const peer of socket.peers.values()) {
        peer.connection.ontrack = () => {};
    }
});

</script>

<template>
<PlayStream :stream="stream" :streamer="streamer"></PlayStream>
</template>
