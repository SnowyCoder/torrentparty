<script setup lang="ts">
import { inject, shallowRef, triggerRef } from 'vue';
import { onEvent } from '../socket/Socket';
import { socketKey, friendListExtraKey } from '../store';

const statusMap = shallowRef(new Map());

const socket = inject(socketKey)!;
const extraComp = inject(friendListExtraKey);

onEvent(socket.events, 'p/download-status', (pkg, sender) => {
    statusMap.value.set(sender, pkg.value);
    triggerRef(statusMap);
});

const names = socket.plugins.name.peerNames;
const selfId = socket.dht.id;

function classFor(peerId: string): string {
    if (peerId == selfId) return "font-bold";
    return "";
}

</script>

<template>
    <div v-for="[peerId, name] in names" :key="peerId" class="flex flex-row h-10 text-lg">
        <p :class="classFor(peerId)">{{name}}</p>
        <component v-bind:is="extraComp" v-if="extraComp" :peer="peerId"/>
    </div>
</template>
