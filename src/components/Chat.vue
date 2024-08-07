<template>
    <div class="chat-container">
        <div class="header">
            <h2>Chat with AI</h2>
        </div>
        <div class="messages" ref="messagesContainer">
            <div v-for="msg in messages" :key="msg.id" :class="['message', msg.sender.toLowerCase()]">
                <div class="message-content" v-html="renderMarkdown(msg.text)"></div>
                <img v-if="msg.image" :src="msg.image" class="message-image" />
            </div>
            <div v-if="isLoading" class="loader">
                <div class="spinner"></div>
            </div>
        </div>
        <div class="input-container">
            <input v-model="inputMessage" @keyup.enter="sendMessage" placeholder="Type a message" />
            <label for="file-upload" class="upload-logo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
            </label>
            <input id="file-upload" type="file" @change="uploadImage" style="display: none;" />
            <button @click="isBotResponding ? stopBot() : sendMessage()">
                {{ isBotResponding ? 'Stop' : 'Send' }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css';
import axios from 'axios';

interface Message {
    id: string;
    sender: string;
    text: string;
    image?: string;
}

const messages = ref<Message[]>([]);
const inputMessage = ref('');
const messagesContainer = ref<HTMLDivElement | null>(null);
const eventSource = ref<EventSource | null>(null);
const isBotResponding = ref(false);
const isLoading = ref(false);

const renderMarkdown = (text: string) => {
    return marked(text, {
        highlight: function (code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    });
};

const sendMessage = async () => {
    if (inputMessage.value.trim() === '') return;

    const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'User',
        text: inputMessage.value
    };

    messages.value.push(newMessage);
    isBotResponding.value = true;
    isLoading.value = true;

    eventSource.value = new EventSource(`http://localhost:5000/api/ai21/stream?message=${encodeURIComponent(inputMessage.value)}`);

    eventSource.value.onmessage = (event) => {
        isLoading.value = false;
        const lastMessage = messages.value[messages.value.length - 1];
        if (lastMessage && lastMessage.sender === 'Bot') {
            lastMessage.text += event.data;
        } else {
            messages.value.push({
                id: Date.now().toString(),
                sender: 'Bot',
                text: event.data
            });
        }
        nextTick(() => {
            if (messagesContainer.value) {
                messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
            }
        });
    };

    eventSource.value.onerror = (error) => {
        console.error('Error receiving message:', error);
        eventSource.value?.close();
        isBotResponding.value = false;
        isLoading.value = false;
    };

    inputMessage.value = '';
};

const uploadImage = async (event: Event) => {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files ? fileInput.files[0] : null;

    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
        isLoading.value = true;
        const response = await axios.post('http://localhost:5000/api/analyze-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        messages.value.push({
            id: Date.now().toString(),
            sender: 'Bot',
            text: response.data.description,
            image: URL.createObjectURL(file)
        });
        isLoading.value = false;
    } catch (error) {
        console.error('Error uploading image:', error);
        messages.value.push({
            id: Date.now().toString(),
            sender: 'Bot',
            text: `Error uploading image: ${error.message}`
        });
        isLoading.value = false;
    }
};

const handlePaste = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
                uploadImage({ target: { files: [file] } } as any);
            }
        }
    }
};

const stopBot = () => {
    if (eventSource.value) {
        eventSource.value.close();
        eventSource.value = null;
        isBotResponding.value = false;
        isLoading.value = false;
    }
};

onMounted(() => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
    });

    window.addEventListener('paste', handlePaste); // Add paste event listener
});
</script>

<style scoped>
.upload-logo {
    display: inline-block;
    cursor: pointer;
    margin-right: 6px;
    margin-top: 4px;
}

.upload-logo img {
    width: 24px;
    height: 24px;
}

.message-image {
    max-width: 100%;
    height: auto;
    margin-top: 8px;
}
.chat-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 400px;
    height: 850px;
    max-width: 100vw;
    max-height: 100vh;
    margin: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    background-color: #f9f9f9;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
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
    display: flex;
    flex-direction: column;
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
.message-content pre {
    background: #f5f5f5;
    padding: 10px;
    border-radius: 5px;
    overflow-x: auto;
}

.loader {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
}

.spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border-left-color: #4CAF50;
    animation: spin 1s ease infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
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
