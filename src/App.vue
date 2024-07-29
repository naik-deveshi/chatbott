<!-- src/App.vue -->
<template>
  <div id="app">
    <Chat />
    <!-- <ChatGPT /> -->
  </div>
</template>

<script setup lang="ts">
// import ChatGPT from './components/ChatGPT.vue';
import Chat from './components/Chat.vue';
// import { ref, onBeforeMount } from 'vue';
// import Anthropic from '@anthropic-ai/sdk';

// const data = ref<string | null>(null);

// onBeforeMount(async () => {
//   console.log('Component is about to be mounted');
//   console.log('===================');
//   const anthropic = new Anthropic({
//     apiKey: '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',
//   });
//   const message = await anthropic.messages.create({
//     max_tokens: 1024,
//     messages: [{ role: 'user', content: 'Hello, Claude' }],
//     model: 'claude-3-opus-20240229',
//   });
//   console.log('message.content === ', message.content);
//   // Example of fetching data before component mounts
//   try {
//     const response = await fetch('https://api.example.com/data');
//     data.value = await response.json();
//   } catch (error) {
//     console.error('Failed to fetch data:', error);
//   }
// });
</script>


<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
