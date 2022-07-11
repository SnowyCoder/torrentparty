<script setup lang="ts">
import { inject } from 'vue';
import { socketKey } from '../store';

const socket = inject(socketKey)!;

const name = socket.plugins.name.name;

</script>

<template>
  <div class="mb-4 py-5">
    <label class="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2" for="username">
      Name
    </label>
    <input class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      type="text" placeholder="unknown" v-model="name">
  </div>
</template>
