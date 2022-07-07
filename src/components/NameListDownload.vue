<script setup lang="ts">
import { computed, inject, shallowRef, triggerRef } from 'vue';
import { onEvent } from '../socket';
import { socketKey } from '../store';

const statusMap = shallowRef(new Map());

const socket = inject(socketKey)!.value;

onEvent(socket.events, 'p/download-status', (pkg) => {
    statusMap.value.set(pkg.sender, pkg.value);
    triggerRef(statusMap);
});

const nameStatus = computed(() => {
    let selfId = socket.dht.id;
    let masterId = socket.masterId;
    let res = [];
    for (let [peerId, name] of socket.peerNames.value) {
        if (peerId == selfId || peerId == masterId) continue;

        let stat = statusMap.value.get(peerId);
        let str;
        if (stat == undefined) {
            str = "0%";
        } else {
            str = (stat * 100).toFixed(2) + '%';
        }
        res.push({
            peerId,
            name,
            status: str,
        })
    }
    return res;
});
</script>

<template>
    <div v-for="arg in nameStatus" :key="arg.peerId">
        {{arg.name}}: {{arg.status}}
    </div>
</template>
