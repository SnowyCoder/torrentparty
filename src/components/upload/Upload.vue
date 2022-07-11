<script setup lang="ts">
import { shallowRef } from "vue";
import UploadTorrent from "./UploadTorrent.vue";
import UploadStreaming from "./UploadStreaming.vue";

type Status = 'selecting' | {
  type: 'torrent',
  file: File,
} | {
  type: 'stream',
  stream: MediaStream,
};
const status = shallowRef<Status>('selecting');

const emit = defineEmits(['end']);

function upload(file: File) {
  status.value = {
    type: 'torrent',
    file,
  };
}

async function stream() {
  const contraints = {
    audio: {
      autoGainControl: false,
      echoCancellation: false,
      noiseSuppression: false,
    },
    video: {
      frameRate: 60,
    },
  } as DisplayMediaStreamConstraints;
  const stream = await navigator.mediaDevices.getDisplayMedia(contraints);

  status.value = {
    type: 'stream',
    stream: stream,
  };
}

function resetState() {
  status.value = 'selecting';
  emit('end');
}

</script>

<template>
  <div v-if="status == 'selecting'" class="flex flex-row justify-center items-center">
    <div class="w-fit">
      <label class="bg-transparent border-1 border-blue-500 text-blue-500 hover:(bg-blue-600 border-blue-700 text-white) font-bold my-4 py-2 px-4 rounded transition" for="file_input">Upload file</label>
      <input class="hidden"
        id="file_input" type="file" accept="video/*" @change="event => upload((event.target as HTMLInputElement).files!.item(0)!)">
    </div>
    <p class="px-8">or</p>
    <div class="w-fit">
      <button @click="stream"
        class="bg-transparent border-1 border-blue-500 text-blue-500 hover:(bg-blue-600 border-blue-700 text-white) font-bold my-4 py-2 px-4 rounded transition">Stream</button>
    </div>
  </div>
  <template v-else-if="status.type == 'torrent'">
    <UploadTorrent :file="status.file" @end="resetState"></UploadTorrent>
  </template>
  <template v-else-if="status.type == 'stream'">
    <UploadStreaming :stream="status.stream" @end="resetState"></UploadStreaming>
  </template>
</template>
