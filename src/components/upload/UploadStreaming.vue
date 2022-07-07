
<script setup lang="ts">
import { onEvent } from '@/socket';
import { socketKey } from '@/store';
import { inject, onMounted, ref } from 'vue';

const socket = inject(socketKey)!.value;

interface Props {
  stream: MediaStream,
}

const {
  stream
} = defineProps<Props>();

const videoElement = ref<HTMLVideoElement | null>(null);


socket.sendPacket({
  type: 'start-stream',
});
for (const peer of socket.peers.values()) {
  for (let track of stream.getTracks()) {
    console.log("addTrack", peer.connection);
    peer.connection.addTrack(track);
  }
}

onEvent(socket.events, 'connect', (peerId) => {
  socket.sendPacket({ type: 'start-stream' }, peerId);

  const peer = socket.peers.get(peerId)!.connection;
  for (let track of stream.getTracks()) {
    console.log("addTrack2", peer);
    peer.addTrack(track);
  }
});

onMounted(() => {
  const videoStream = new MediaStream([stream.getVideoTracks()[0]]);
  videoElement.value!.srcObject = videoStream;
  videoElement.value!.autoplay = true;
});
function shareLink() {
  navigator.clipboard.writeText(location.href);
}
</script>

<template>
<div class="flex flex-col justify-center items-center">
  <video controls ref="videoElement"></video>
  <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold my-4 py-2 px-4 rounded" :onclick="shareLink">Share link!</button>
</div>
</template>
