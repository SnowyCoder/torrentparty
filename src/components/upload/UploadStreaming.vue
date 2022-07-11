
<script setup lang="ts">
import { onEvent } from '@/socket/Socket';
import { friendListExtraKey, socketKey } from '@/store';
import { defineComponent, h, inject, onUnmounted, ref, toRefs } from 'vue';
import PlayStream from '../PlayStream.vue';
import StopSharingBtn from './StopSharingBtn.vue';

const socket = inject(socketKey)!;

interface Props {
  stream: MediaStream,
}

const emit = defineEmits(['end']);

const {
  stream
} = defineProps<Props>();

socket.sendPacket({
  type: 'start-stream',
});
for (const peer of socket.peers.values()) {
  const oldSenders = peer.connection.getSenders();
  let oldi = 0;
  for (let track of stream.getTracks()) {
    if (oldi < oldSenders.length) {
      oldSenders[oldi].replaceTrack(track);
      oldi++;
    } else {
      peer.connection.addTrack(track);
    }
  }
}

onEvent(socket.events, 'connect', (peerId) => {
  socket.sendPacket({ type: 'start-stream' }, peerId);

  const peer = socket.peers.get(peerId)!.connection;
  for (let track of stream.getTracks()) {
    peer.addTrack(track);
  }
});
stream.getVideoTracks()[0].onended = () => {
  stop();
}
function stop() {
  for (const track of stream.getTracks()) {
    track.stop();
  }
  socket.sendPacket({
    type: 'stop-stream',
  });
  emit("end");
}

const videoStream = new MediaStream([stream.getVideoTracks()[0]]);

const me = socket.dht.id;
</script>

<template>
<div class="flex flex-col items-center">
  <PlayStream :streamer="me" :stream="videoStream"></PlayStream>
  <StopSharingBtn @click="stop"></StopSharingBtn>
</div>
</template>
