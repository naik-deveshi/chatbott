<template>
    <div class="chat-container">
        <div class="header">
            <h2>Chat with AI</h2>
        </div>
        <div class="messages" ref="messagesContainer">
            <div v-for="msg in messages" :key="msg.id" :class="['message', msg.sender.toLowerCase()]">
                <div class="message-content">
                    <strong>{{ msg.sender }}:</strong>
                    <p>{{ msg.text }}</p>
                </div>
            </div>
        </div>
        <div class="input-container">
            <input v-model="inputMessage" @keyup.enter="sendMessage" placeholder="Type a message" />
            <button @click="sendMessage">Send</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import axios from 'axios';

interface Message {
    id: string;
    sender: string;
    text: string;
}

const messages = ref<Message[]>([]);
const inputMessage = ref('');
const messagesContainer = ref<HTMLDivElement | null>(null);

const sendMessage = async () => {
    if (inputMessage.value.trim() === '') return;

    const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'User',
        text: inputMessage.value
    };

    messages.value.push(newMessage);

    try {
        const response = await axios.post('http://localhost:5000/api/ai21/chat', {
            message: inputMessage.value
        });
        console.log('response', response);
        

        messages.value.push({
            id: Date.now().toString(),
            sender: 'Bot',
            text: response.data.outputs[0].text
        });
    } catch (error) {
        console.error('Error sending message:', error);
    }

    inputMessage.value = '';

    // Scroll to bottom of the messages container
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
    });
};

onMounted(() => {
    // Scroll to bottom of the messages container on load
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
    });
});
</script>

<style scoped>
.chat-container {
    position: fixed;
    /* Change to fixed to position in top-left */
    top: 0;
    left: 0;
    width: 400px;
    /* Increase width */
    height: 850px;
    /* Set a fixed height */
    max-width: 100vw;
    /* Ensure it doesn't overflow */
    max-height: 100vh;
    /* Ensure it doesn't overflow */
    margin: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    background-color: #f9f9f9;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.header {
    background-color: #4CAF50;
    color: white;
    padding: 10px;
    text-align: center;
}

.messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background: #fff;
    height: calc(100% - 95px);
}

.message {
    margin-bottom: 10px;
    padding: 8px;
    border-radius: 5px;
}

.message.user {
    background-color: #d1e7dd;
    align-self: flex-end;
}

.message.bot {
    background-color: #f1f1f1;
    align-self: flex-start;
}

.message-content p {
    margin: 0;
}

.input-container {
    display: flex;
    border-top: 1px solid #ddd;
    background-color: #fff;
}

input {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 0;
}

button {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 10px;
    cursor: pointer;
    border-radius: 0;
}

button:hover {
    background-color: #45a049;
}
</style>
