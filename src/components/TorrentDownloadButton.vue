<script setup lang="ts">
import { Ref, ref } from 'vue';
import { TorrentFile } from 'webtorrent';


interface Props {
    file: TorrentFile;
}
const {
    file
} = defineProps<Props>();

const state: Ref<'waiting' | 'creating'> = ref('waiting');

function downloadLinkClass() {
  if (state.value == 'waiting') {
    return "border-green-500 text-green-500 hover:(bg-green-600 border-green-700 text-white)";
  } else {
    return "border-green-400 text-green-400";
  }
}

function onDownload() {
  if (state.value == 'creating') return;
  state.value = 'creating';
  file.getBlobURL((err, url) => {
    if (err != null) {
      console.error(err);
      alert(err);
    }
    if (url != null) {
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style.display = "none";
      a.href = url;
      a.download = file.name;
      a.click();
      window.URL.revokeObjectURL(url);
      state.value = 'waiting';
    }
  });
}
</script>

<template>
  <button class="bg-transparent border-1 transition font-bold my-4 py-2 px-4 rounded"
          :class="downloadLinkClass()" @click="onDownload" :disabled="state == 'creating'">
    {{ state == 'waiting' ? 'Download' : 'Loading...'}}
  </button>
</template>
