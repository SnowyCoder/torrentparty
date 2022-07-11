<script setup lang="ts">
import NameEditor from './NameEditor.vue';
import FriendList from './FriendList.vue';
import { onEvent } from '@/socket/Socket';
import { inject, provide, ref, shallowRef } from 'vue';
import { friendListExtraKey, socketKey } from '@/store';
import DownloadStream from './download/DownloadStream.vue';
import DownloadTorrent from './download/DownloadTorrent.vue';
import Upload from './upload/Upload.vue';
const socket = inject(socketKey)!;

type State = { type: 'upload' } | {
  type: 'torrent',
  uri: string,
} | {
  type: 'stream',
  by: string,
};

const state = ref<State>({ type: 'upload' });

provide(friendListExtraKey, shallowRef(null));

onEvent(socket.events, 'p/magnet-uri', (data, peer) => {
  if (state.value.type == 'torrent' && state.value.uri == data.uri) return;
  state.value = {
    type: 'torrent',
    uri: data.uri,
  };
});

onEvent(socket.events, 'p/start-stream', (_pkt, peer) => {
  state.value = {
    type: 'stream',
    by: peer,
  };
});

function resetState() {
  state.value = { type: 'upload' };
}

function shareLink() {
    navigator.clipboard.writeText(location.href);
}

</script>

<template>

<NameEditor class="w-full lg:w-1/2"></NameEditor>
<div>
    <Upload v-if="state.type == 'upload'" @end="resetState"></Upload>
    <DownloadStream v-else-if="state.type == 'stream'" :streamer="state.by" @end="resetState"></DownloadStream>
    <DownloadTorrent v-else :magnet-uri="state.uri" @end="resetState"></DownloadTorrent>
</div>

<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold my-4 py-2 px-4 rounded w-fit"
      :onclick="shareLink">Share link!</button>

<div class="py-5 px-5">
    <FriendList></FriendList>
</div>


</template>
