<script setup lang="ts">
import { socketKey } from "../store";
import { inject, onMounted } from "vue";
import { onEvent } from "../socket";
import { TorrentFile } from "webtorrent";

interface Props {
  file: TorrentFile,
};

const {
  file
} = defineProps<Props>();

const socket = inject(socketKey)!.value;

let lastAction = {
  type: 'play',
  time: 0,
};

let mediaElem : HTMLMediaElement | undefined;

function onMediaEvent(type: 'play' | 'pause' | 'seek', time: number) {
  if ((time - lastAction.time) < 1) return;
  socket.sendPacket({
    type: 'video-interact',
    class: type,
    currentTime: time,
  })
}

onMounted(() => {
  const opts = {
    maxBlobLength: 2 * 10**(3*3),
  };
  file.appendTo(document.getElementById('play-container') as HTMLElement, opts, (err, media) => {
    if (err) {
      console.error(err);
    }
    if (media === undefined) return;
    mediaElem = media;
    media.onplay = () => {
      console.log("Play", media.currentTime);
      onMediaEvent('play', media.currentTime);
    }
    media.onpause = () => {
      onMediaEvent('pause', media.currentTime);
    }
    media.onseeking = (x) => {
      console.log("Seeking", x, media.currentTime);
      onMediaEvent('seek', media.currentTime);
    };
  });
});

let seekingTimer: undefined | any = undefined;

onEvent(socket.events, 'p/video-interact', pkt => {
  if (seekingTimer) {
    clearTimeout(seekingTimer);
    seekingTimer = undefined;
  }
  lastAction = {
    type: pkt.class,
    time: pkt.currentTime,
  };
  if (mediaElem === undefined) return;
  let el = mediaElem;
  el.currentTime = pkt.currentTime;
  if (pkt.class == 'play') {
    el!.play();
  } else if (pkt.class == 'pause') {
    el!.pause();
  } else {
    el.play();
    seekingTimer = setTimeout(() => el.pause(), 100);
  }
});

</script>

<template>
  <div id="play-container" class="flex place-content-center"></div>
</template>
