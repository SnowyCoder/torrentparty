<script setup lang="ts">
import { friendListExtraKey, socketKey } from "../store";
import { h, inject, onMounted, onUnmounted, ref, shallowRef, triggerRef } from "vue";
import { onEvent } from "../socket/Socket";
import type { Torrent } from "webtorrent";
import TorrentDownloadButton from "./TorrentDownloadButton.vue";

const emit = defineEmits(['end']);

interface Props {
  stream: Torrent,
};

const {
  stream,
} = defineProps<Props>();
let file = stream.files[0];
// Trick: usually the video is the heaviest file in the torrent.
for (let i = 1; i < stream.files.length; i++) {
  if (stream.files[i].length > file.length) {
    file = stream.files[i];
  }
}

const downloadLink = ref<string | undefined>(undefined);
file.getBlobURL((err, url) => {
  if (err != null) {
    console.error(err);
  }
  if (url != null) {
    console.log("Download available");
    downloadLink.value = url;
  }
})


const socket = inject(socketKey)!;

let lastAction = {
  type: 'play',
  time: -1000,
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

function play() {
  mediaElem?.play().catch(error => {
    console.log("Autoplay error!");
    mediaElem!.muted = true;
    mediaElem!.play();
  });
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
      onMediaEvent('play', media.currentTime);
    };
    media.onpause = () => {
      onMediaEvent('pause', media.currentTime);
    };
    media.onseeking = () => {
      onMediaEvent('seek', media.currentTime);
    };

    socket.sendPacket({
      type: 'torrent-query-state',
    });
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
    play();
  } else if (pkt.class == 'pause') {
    el.pause();
  } else {
    play();
    seekingTimer = setTimeout(() => el.pause(), 100);
  }
});

onEvent(socket.events, 'p/stop-torrent', pkt => {
  emit('end');
});

onEvent(socket.events, 'connect', peer => {
  socket.sendPacket({
    type: 'magnet-uri',
    uri: stream.magnetURI,
  }, peer);
});

// Torrent status display
const selfId = socket.dht.id;
const status = shallowRef(new Map<string, number>());
let shareStateTimer: any;

function shareState() {
  const stat = stream.downloaded / stream.length;
  status.value.set(selfId, stat);
  triggerRef(status);
  socket.sendPacket({
    type: 'download-status',
    value: stat,
  });
  const waitTime = stat != 1.0 ? 0.2 : 10;
  shareStateTimer = setTimeout(shareState, waitTime * 1000);
}
const stat = stream.downloaded / stream.length;
status.value.set(selfId, stat);
shareStateTimer = setTimeout(shareState, 0.2 * 1000 * Math.random());

onEvent(socket.events, 'p/download-status', (pkt, sender) => {
  status.value.set(sender, pkt.value);
  triggerRef(status);
});
onEvent(socket.events, 'p/torrent-state', (pkt) => {
  if (!mediaElem) return;
  if (Math.abs(mediaElem.currentTime - pkt.time) > 1) {
    mediaElem.currentTime = pkt.time;
  }
  if (pkt.paused != mediaElem.paused) {
    lastAction = {
      type: pkt.paused ? 'pause' : 'play',
      time: pkt.time,
    }
    if (pkt.paused) mediaElem.pause();
    else play();
  }
});
onEvent(socket.events, 'p/torrent-query-state', (pkt, sender) => {
  if (mediaElem == undefined) return;
  socket.sendPacket({
    type: 'torrent-state',
    time: mediaElem.currentTime,
    paused: mediaElem.paused,
  }, sender)
});

function torrentExtra(props: Readonly<{ peer: string }>) {
  const { peer } = props;

  const s = status.value.get(peer) ?? 1;
  return h('div', {
    class: 'px-3 text-xl',
  }, (s * 100).toFixed(2) + '%');
}
const friendListExtra = inject(friendListExtraKey)!;
friendListExtra.value = torrentExtra;
onUnmounted(() => {
  friendListExtra.value = null;
  clearTimeout(shareStateTimer);
})

</script>

<template>
  <div  class="flex place-content-center flex-col">
    <div id="play-container">
    </div>
    <div class="flex flex-row justify-end ">
      <TorrentDownloadButton :file="file"/>
    </div>
  </div>
</template>
