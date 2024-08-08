import { createRouter, createWebHistory } from 'vue-router'
import ChatBot from '../components/Chat.vue'
import ChatClarifai from '../components/ChatClarifai.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: ChatBot
    },
    {
      path: '/chat',
      name: 'chat with clarifai',
      component: ChatClarifai
    }
  ]
})

export default router
