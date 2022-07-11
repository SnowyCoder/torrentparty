<script setup lang="ts">
import { friendListExtraKey } from '@/store';
import { h, inject, onMounted, onUnmounted, ref } from 'vue';

type Props = {
    stream: MediaStream;
    streamer: string;
};

const {
    stream,
    streamer,
} = defineProps<Props>();

const videoEl = ref<HTMLVideoElement | null>();

onMounted(() => {
    videoEl.value!.srcObject = stream;
    videoEl.value!.autoplay = true;
});

function streamingExtra(props: Readonly<{ peer: string }>) {
  const { peer } = props;

   return h('div', {
      class: 'px-3 text-xl',
    }, peer == streamer ? '🎥' : '📺');
}
const friendListExtra = inject(friendListExtraKey)!;
friendListExtra.value = streamingExtra;
onUnmounted(() => {
  friendListExtra.value = null;
})

</script>

<template>
<div class="flex justify-center">
    <video controls ref="videoEl" class="w-full md:w-3/4"></video>
</div>
</template>
