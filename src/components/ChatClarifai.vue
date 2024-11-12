<template>
    <div class="chat-container" @dragover.prevent @drop.prevent="handleDrop" @paste="handlePaste">
        <div class="header">
            <h2>Chat with Clarifai AI Tool</h2>
        </div>
        <div></div>
        <p class="abc"></p>
        <div class="messages" ref="messagesContainer">
            <div v-for="message in messages" :key="message.id" :class="['message', message.user ? 'user' : 'bot']">
                <div class="message-content" v-html="renderMarkdown(message.text)"></div>
                <img v-if="message.image" :src="'data:image/jpeg;base64,' + message.image" class="message-image" />
            </div>
            <div v-if="isLoading" class="loader">
                <div class="spinner"></div>
            </div>
        </div>
        <div class="input-container">
            <textarea v-model="input" @keydown.enter="handleKeyPress" placeholder="Type your message..."></textarea>
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
        <div v-if="imagePreview" class="image-preview">
            <img :src="imagePreview" alt="Image Preview" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css';

const input = ref('');
const messages = ref([]);
const messagesContainer = ref(null);
const isBotResponding = ref(false);
const isLoading = ref(false);
const eventSource = ref(null);
const base64Image = ref(null);
const imagePreview = ref(null);

watch(input, (newValue, oldValue) => {
    console.log(`input changed from ${oldValue} to ${newValue}`);
}); 


const renderMarkdown = (text) => {
    return marked(text, {
        highlight: function (code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    });
};

const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        base64Image.value = e.target.result.replace(/^data:image\/[a-z]+;base64,/, '');
        imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
};

const handleDrop = (event) => {
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFile(file);
    }
};

const handlePaste = (event) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            handleFile(file);
        }
    }
};

const uploadImage = (event) => {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
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

const handleKeyPress = (event) => {
    if (event.shiftKey) {
        return;
    } else {
        sendMessage();
    }
};

const sendMessage = async () => {
    if (input.value.trim() === '' && !base64Image.value) return;

    const userMessage = {
        id: Date.now(),
        text: input.value,
        image: base64Image.value,
        user: true
    };
    messages.value.push(userMessage);
    isLoading.value = true;
    isBotResponding.value = true;

    const payload = {
        message: input.value ? input.value : '',
        image: base64Image.value ? base64Image.value : ''
    };

    input.value = '';
    base64Image.value = '';
    imagePreview.value = '';

    const payloadString = JSON.stringify(payload);
    const encodedPayload = encodeURIComponent(payloadString);
    const url = `http://localhost:5000/api/chat?payload=${encodedPayload}`;

    eventSource.value = new EventSource(url);

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
};

onMounted(() => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
    });
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

.chat-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 600px;
    height: 900px;
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
    
    .message-content {
        padding: 10px;
        border-radius: 5px;
        overflow-x: auto;
    }
    
        .message-image {
            max-width: 100%;
            max-height: 200px;
            border-radius: 5px;
            margin-top: 10px;
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

textarea {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 0;
    resize: none;
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

.image-preview {
    display: flex;
    justify-content: center;
    padding: 10px;
    background-color: #fff;
}

.image-preview img {
    max-width: 100%;
    max-height: 200px;
    border: 1px solid #ddd;
    border-radius: 8px;
}
</style>
