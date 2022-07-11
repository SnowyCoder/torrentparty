<script setup lang="ts">

defineEmits(['click'])
</script>

<template>
<button class="bg-transparent border-1 border-red-500 text-red-500 hover:(bg-red-600 border-red-700 text-white) transition font-bold my-4 py-2 px-4 rounded"
      @click="$emit('click')">Stop sharing</button>
</template>
