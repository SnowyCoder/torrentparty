<script setup lang="ts">
import { socketKey } from "@/store";
import { inject, ref } from "vue";
import { onEvent } from "@/socket";
import NameEditor from "../NameEditor.vue";
import NameListDownload from "../NameListDownload.vue";
import DownloadTorrent from "./DownloadTorrent.vue";
import DownloadStream from "./DownloadStream.vue";

const socket = inject(socketKey)!.value;

type State = 'loading' | {
  type: 'torrent',
  uri: string,
} | 'streaming';

const state = ref<State>('loading');

socket.initPassive(location.hash.substring(1))
  .catch(x => {
    console.error(x)
    location.hash = '';
    location.reload();
  });

onEvent(socket.events, 'p/magnet-uri', (data) => {
  if (state.value != 'loading') return;
  state.value = {
    type: 'torrent',
    uri: data.uri,
  };
});

onEvent(socket.events, 'p/start-stream', () => {
  if (state.value != 'loading') return;
  state.value = 'streaming';
});

</script>

<template>
  <div v-if="state == 'loading'">
    Waiting for master's decision...
  </div>
  <div v-else>
    <NameEditor/>

    <section v-if="state == 'streaming'">
      <DownloadStream></DownloadStream>
    </section>
    <section v-else>
      <DownloadTorrent :magnet-uri="state.uri"></DownloadTorrent>
    </section>

    <NameListDownload></NameListDownload>
  </div>
</template>
