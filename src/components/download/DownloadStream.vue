<script setup lang="ts">
import { socketKey } from '@/store';
import { inject, onMounted, onUnmounted, ref } from 'vue';


const socket = inject(socketKey)!.value;

const stream = new MediaStream();

for (const peer of socket.peers.values()) {
    const tracks = peer.connection.getReceivers().map(x => x.track);
    for (let track of tracks) {
        stream.addTrack(track);
    }
    peer.connection.ontrack = (ev) => {
        console.log("Track!", ev.track);
        stream.addTrack(ev.track);
    };
};

const videoEl = ref<HTMLVideoElement | null>();

onMounted(() => {
    videoEl.value!.srcObject = stream;
    videoEl.value!.autoplay = true;
})

onUnmounted(() => {
    for (const peer of socket.peers.values()) {
        peer.connection.ontrack = () => {};
    }
});

</script>

<template>
<div class="flex justify-center">
<video controls ref="videoEl" class="w-full md:w-3/4"></video>
</div>
</template>
