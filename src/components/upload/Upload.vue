<script setup lang="ts">
import { socketKey } from "@/store";
import { inject, shallowRef } from "vue";
import NameListDownload from "../NameListDownload.vue";
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

const socket = inject(socketKey)!.value;

socket.initActive();
location.hash = socket.dht.id;

const torrentFile = shallowRef<File | null>();

function upload() {
  if (!torrentFile.value) {
    alert("Select a file");
    return;
  }
  status.value = {
    type: 'torrent',
    file: torrentFile.value,
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

</script>

<template>
  <div v-if="status == 'selecting'" class="flex flex-row justify-center items-center">
    <div class="w-64">
      <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300" for="file_input">Upload file</label>
      <input class="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
        id="file_input" type="file" accept="video/*" @change="event => torrentFile = (event.target as HTMLInputElement).files!.item(0)">
      <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold my-4 py-2 px-4 rounded" @click="upload">Share</button>
    </div>
    <p class="px-8">or</p>
    <div class="w-64">
      <button @click="stream"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold my-4 py-2 px-4 rounded">Stream</button>
    </div>
  </div>
  <section v-else-if="status.type == 'torrent'">
    <UploadTorrent :file="status.file"></UploadTorrent>
  </section>
  <section v-else-if="status.type == 'stream'">
    <UploadStreaming :stream="status.stream"></UploadStreaming>
  </section>

  <div class="py-5 px-5">
    <NameListDownload></NameListDownload>
  </div>

</template>
