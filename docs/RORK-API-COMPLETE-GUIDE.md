# 📚 Rork Toolkit API - Complete Technical Documentation

> **Complete reference guide for Rork AI Toolkit APIs**  
> Version: 1.0 | Last Updated: 2025-10-15

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Base URL & Authentication](#base-url--authentication)
3. [API Endpoints](#api-endpoints)
   - [Text LLM (Chat)](#1-text-llm-chat)
   - [Speech-to-Text (STT)](#2-speech-to-text-stt)
   - [Image Generation](#3-image-generation)
   - [Image Analysis/OCR](#4-image-analysisocr)
4. [SDK Integration](#sdk-integration)
5. [Code Examples](#code-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## 🌐 Overview

**Rork Toolkit** provides AI-powered APIs for:
- 💬 **Conversational AI** (LLM Chat)
- 🎤 **Speech Recognition** (Voice-to-Text)
- 🎨 **Image Generation** (Text-to-Image)
- 📸 **Image Analysis & OCR** (Vision AI)

### Key Features
- ✅ No API key required (for basic usage)
- ✅ RESTful JSON API
- ✅ Streaming support (for LLM)
- ✅ Cross-platform compatible
- ✅ Production-ready

---

## 🔗 Base URL & Authentication

### Base URL
```
https://toolkit.rork.com
```

### Authentication
**Currently**: No authentication required for basic usage  
**Future**: May require API keys for production

### Headers
```javascript
{
  'Content-Type': 'application/json'
}
```

---

## 🚀 API Endpoints

---

## 1. Text LLM (Chat)

### Endpoint
```
POST https://toolkit.rork.com/text/llm/
```

### Description
Conversational AI endpoint for chat completions. Supports multi-turn conversations with context.

### Request Format

```javascript
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}
```

### Message Roles
- `system` - System instructions/context
- `user` - User messages
- `assistant` - AI responses (for conversation history)

### Response Format

```javascript
{
  "completion": "I'm doing well, thank you! How can I help you today?"
}
```

### Example Usage

```javascript
// Basic Chat
const response = await fetch('https://toolkit.rork.com/text/llm/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is 2+2?' }
    ]
  })
});

const data = await response.json();
console.log(data.completion); // "2+2 equals 4."
```

### Advanced: Conversation Context

```javascript
const conversationHistory = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'My name is Ahmed' },
  { role: 'assistant', content: 'Nice to meet you, Ahmed!' },
  { role: 'user', content: 'What is my name?' }
];

const response = await fetch('https://toolkit.rork.com/text/llm/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: conversationHistory })
});

const data = await response.json();
console.log(data.completion); // "Your name is Ahmed."
```

### Performance Tips
- Keep conversation history to last 10-15 messages
- Use clear system prompts
- Limit message length to 2000 characters

---

## 2. Speech-to-Text (STT)

### Endpoint
```
POST https://toolkit.rork.com/stt/transcribe/
```

### Description
Converts audio recordings to text. Supports multiple audio formats.

### Request Format
**Content-Type:** `multipart/form-data`

```javascript
FormData {
  audio: File (audio file)
}
```

### Supported Audio Formats
- ✅ `.wav` - WAV (recommended)
- ✅ `.m4a` - MPEG-4 Audio
- ✅ `.webm` - WebM Audio
- ✅ `.mp3` - MP3
- ✅ `.ogg` - Ogg Vorbis

### Response Format

```javascript
{
  "text": "Hello, this is a test transcription."
}
```

### Example Usage

#### Web (Browser)

```javascript
// Record audio using MediaRecorder
let mediaRecorder;
let audioChunks = [];

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
  
  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    await transcribeAudio(audioBlob);
  };
  
  mediaRecorder.start();
}

function stopRecording() {
  mediaRecorder.stop();
}

async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  
  const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  console.log('Transcription:', data.text);
}
```

#### React Native (Expo)

```javascript
import { Audio } from 'expo-av';

async function recordAndTranscribe() {
  // Request permissions
  await Audio.requestPermissionsAsync();
  
  // Configure audio mode
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });
  
  // Start recording
  const { recording } = await Audio.Recording.createAsync({
    android: {
      extension: '.m4a',
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
    },
    ios: {
      extension: '.wav',
      outputFormat: Audio.IOSOutputFormat.LINEARPCM,
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
  });
  
  // Stop after some time
  setTimeout(async () => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    
    // Transcribe
    const formData = new FormData();
    formData.append('audio', {
      uri,
      name: 'recording.wav',
      type: 'audio/wav'
    });
    
    const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    console.log('Transcription:', data.text);
  }, 5000);
}
```

### Audio Quality Recommendations

| Setting | Value | Notes |
|---------|-------|-------|
| Sample Rate | 44100 Hz | Standard quality |
| Bit Rate | 128000 | Good balance |
| Channels | 2 (Stereo) | Better quality |
| Format | WAV/M4A | Best compatibility |

### Error Handling

```javascript
try {
  const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.text || data.text.trim() === '') {
    console.warn('Empty transcription');
  }
  
  return data.text;
} catch (error) {
  console.error('Transcription failed:', error);
  return null;
}
```

---

## 3. Image Generation

### Endpoint
```
POST https://toolkit.rork.com/images/generate/
```

### Description
Generates AI images from text descriptions.

### Request Format

```javascript
{
  "prompt": "A beautiful sunset over mountains",
  "size": "1024x1024"  // Optional
}
```

### Supported Sizes
- `512x512` - Small (faster)
- `1024x1024` - Standard (recommended)
- `1024x1792` - Portrait
- `1792x1024` - Landscape

### Response Format

```javascript
{
  "image": {
    "mimeType": "image/png",
    "base64Data": "iVBORw0KGgoAAAANSUhEUgAA..."
  },
  "size": "1024x1024"
}
```

### Example Usage

```javascript
async function generateImage(prompt) {
  const response = await fetch('https://toolkit.rork.com/images/generate/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt,
      size: '1024x1024'
    })
  });
  
  if (!response.ok) {
    throw new Error('Image generation failed');
  }
  
  const data = await response.json();
  
  // Create image URL from base64
  const imageUrl = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
  
  // Display in HTML
  const img = document.createElement('img');
  img.src = imageUrl;
  document.body.appendChild(img);
  
  return imageUrl;
}

// Usage
generateImage('A futuristic city at night with neon lights');
```

### React Native Usage

```javascript
import { Image } from 'expo-image';

async function generateAndDisplay(prompt) {
  const response = await fetch('https://toolkit.rork.com/images/generate/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, size: '1024x1024' })
  });
  
  const data = await response.json();
  const imageUri = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
  
  return (
    <Image 
      source={{ uri: imageUri }} 
      style={{ width: 300, height: 300 }}
      contentFit="cover"
    />
  );
}
```

### Prompt Engineering Tips

✅ **Good Prompts:**
- "A photorealistic portrait of a cat wearing sunglasses"
- "Minimalist logo design for a tech startup, blue and white"
- "Watercolor painting of a Japanese garden in spring"

❌ **Avoid:**
- Too vague: "nice picture"
- Too complex: "a cat and dog and bird and..."
- Inappropriate content

---

## 4. Image Analysis/OCR

### Endpoint
```
POST https://toolkit.rork.com/images/edit/
```

### Description
Analyzes images, extracts text (OCR), and provides descriptions.

### Request Format

```javascript
{
  "prompt": "Describe this image in detail",
  "images": [
    {
      "type": "image",
      "image": "base64_encoded_image_data"
    }
  ]
}
```

### Image Input Format
- **Type:** Base64 encoded string
- **Supported formats:** JPG, PNG, WebP
- **Max size:** ~10MB recommended
- **Remove prefix:** Remove `data:image/...;base64,` prefix

### Response Format

```javascript
{
  "image": {
    "base64Data": "Description or extracted text"
  }
}
```

### Example Usage

#### Basic Image Analysis

```javascript
async function analyzeImage(imageFile) {
  // Convert image to base64
  const base64 = await fileToBase64(imageFile);
  const base64Data = base64.split(',')[1]; // Remove prefix
  
  const response = await fetch('https://toolkit.rork.com/images/edit/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Describe this image in detail',
      images: [{ type: 'image', image: base64Data }]
    })
  });
  
  const data = await response.json();
  console.log('Analysis:', data.image.base64Data);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

#### OCR (Text Extraction)

```javascript
async function extractText(imageFile) {
  const base64 = await fileToBase64(imageFile);
  const base64Data = base64.split(',')[1];
  
  const response = await fetch('https://toolkit.rork.com/images/edit/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Extract all text from this image. If it\'s a receipt, extract amounts and dates.',
      images: [{ type: 'image', image: base64Data }]
    })
  });
  
  const data = await response.json();
  return data.image.base64Data; // Extracted text
}
```

#### Receipt/Document Analysis

```javascript
async function analyzeReceipt(imageFile) {
  const base64 = await fileToBase64(imageFile);
  const base64Data = base64.split(',')[1];
  
  const response = await fetch('https://toolkit.rork.com/images/edit/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Analyze this receipt and extract:
        - Store name
        - Date
        - Total amount
        - Items purchased
        Format as JSON.`,
      images: [{ type: 'image', image: base64Data }]
    })
  });
  
  const data = await response.json();
  const analysis = JSON.parse(data.image.base64Data);
  
  return {
    store: analysis.store,
    date: analysis.date,
    total: analysis.total,
    items: analysis.items
  };
}
```

### React Native Image Picker Integration

```javascript
import * as ImagePicker from 'expo-image-picker';

async function pickAndAnalyzeImage() {
  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    base64: true // Get base64 directly
  });
  
  if (!result.canceled && result.assets[0]) {
    const base64Data = result.assets[0].base64;
    
    // Analyze
    const response = await fetch('https://toolkit.rork.com/images/edit/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'What do you see in this image?',
        images: [{ type: 'image', image: base64Data }]
      })
    });
    
    const data = await response.json();
    console.log('AI says:', data.image.base64Data);
  }
}
```

### Use Cases

| Use Case | Prompt Example |
|----------|----------------|
| **General Description** | "Describe this image in detail" |
| **OCR** | "Extract all text from this image" |
| **Receipt Analysis** | "Extract store name, date, total, and items from this receipt" |
| **ID Card** | "Extract name, ID number, and expiry date from this ID card" |
| **Business Card** | "Extract name, phone, email, and company from this business card" |
| **Handwriting** | "Read and transcribe the handwritten text in this image" |
| **Object Detection** | "List all objects visible in this image" |
| **Scene Understanding** | "Describe the scene, location, and context of this image" |

---

## 🛠️ SDK Integration

### React Native with Rork SDK

```javascript
import { createRorkTool, useRorkAgent } from '@rork/toolkit-sdk';
import { z } from 'zod';

// Define tools
const tools = {
  imageAnalysis: createRorkTool({
    description: 'Analyze images and extract information',
    zodSchema: z.object({
      imageBase64: z.string(),
      prompt: z.string()
    }),
    async execute(input) {
      const response = await fetch('https://toolkit.rork.com/images/edit/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input.prompt,
          images: [{ type: 'image', image: input.imageBase64 }]
        })
      });
      
      const data = await response.json();
      return data.image.base64Data;
    }
  }),
  
  speechToText: createRorkTool({
    description: 'Convert speech to text',
    zodSchema: z.object({
      audioUri: z.string()
    }),
    async execute(input) {
      const formData = new FormData();
      formData.append('audio', {
        uri: input.audioUri,
        name: 'recording.wav',
        type: 'audio/wav'
      });
      
      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      return data.text;
    }
  })
};

// Use in component
function ChatComponent() {
  const { messages, sendMessage } = useRorkAgent({ tools });
  
  return (
    // Your UI
  );
}
```

---

## ⚠️ Error Handling

### Common Error Codes

| Status | Meaning | Solution |
|--------|---------|----------|
| 400 | Bad Request | Check request format |
| 413 | Payload Too Large | Reduce image/audio size |
| 429 | Too Many Requests | Implement rate limiting |
| 500 | Server Error | Retry with exponential backoff |
| 503 | Service Unavailable | API temporarily down |

### Robust Error Handler

```javascript
async function callRorkAPI(endpoint, body, options = {}) {
  const maxRetries = options.maxRetries || 3;
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`https://toolkit.rork.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000) // 30s timeout
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait and retry
          await new Promise(r => setTimeout(r, 2000 * (i + 1)));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

// Usage
try {
  const result = await callRorkAPI('/text/llm/', {
    messages: [{ role: 'user', content: 'Hello' }]
  });
} catch (error) {
  console.error('All retries failed:', error);
}
```

---

## 💡 Best Practices

### 1. Performance Optimization

```javascript
// ✅ Good: Compress images before upload
async function compressAndAnalyze(imageFile) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  img.src = URL.createObjectURL(imageFile);
  await img.decode();
  
  // Resize to max 1024px
  const maxSize = 1024;
  let width = img.width;
  let height = img.height;
  
  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = (height / width) * maxSize;
      width = maxSize;
    } else {
      width = (width / height) * maxSize;
      height = maxSize;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  
  const base64 = canvas.toDataURL('image/jpeg', 0.8);
  // Now use this compressed base64
}
```

### 2. Caching

```javascript
// Cache LLM responses
const responseCache = new Map();

async function cachedLLMCall(messages) {
  const key = JSON.stringify(messages);
  
  if (responseCache.has(key)) {
    return responseCache.get(key);
  }
  
  const response = await fetch('https://toolkit.rork.com/text/llm/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  
  const data = await response.json();
  responseCache.set(key, data);
  
  return data;
}
```

### 3. Rate Limiting

```javascript
class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }
  
  async acquire() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      await new Promise(r => setTimeout(r, waitTime));
      return this.acquire();
    }
    
    this.requests.push(now);
  }
}

// Usage: Max 10 requests per minute
const limiter = new RateLimiter(10, 60000);

async function rateLimitedCall(endpoint, body) {
  await limiter.acquire();
  return fetch(`https://toolkit.rork.com${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}
```

### 4. Conversation Management

```javascript
class ConversationManager {
  constructor(maxMessages = 10) {
    this.messages = [];
    this.maxMessages = maxMessages;
  }
  
  addMessage(role, content) {
    this.messages.push({ role, content });
    
    // Keep only recent messages (excluding system)
    const systemMessages = this.messages.filter(m => m.role === 'system');
    const otherMessages = this.messages.filter(m => m.role !== 'system');
    
    if (otherMessages.length > this.maxMessages) {
      this.messages = [
        ...systemMessages,
        ...otherMessages.slice(-this.maxMessages)
      ];
    }
  }
  
  getMessages() {
    return this.messages;
  }
  
  clear() {
    const systemMessages = this.messages.filter(m => m.role === 'system');
    this.messages = systemMessages;
  }
}
```

---

## 📊 Complete Working Example

### Full-Featured Chat App

```javascript
class RorkChatApp {
  constructor() {
    this.conversationManager = new ConversationManager();
    this.rateLimiter = new RateLimiter(10, 60000);
    
    this.conversationManager.addMessage('system', 
      'You are a helpful AI assistant with vision and voice capabilities.'
    );
  }
  
  async sendTextMessage(text) {
    await this.rateLimiter.acquire();
    
    this.conversationManager.addMessage('user', text);
    
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: this.conversationManager.getMessages()
      })
    });
    
    const data = await response.json();
    this.conversationManager.addMessage('assistant', data.completion);
    
    return data.completion;
  }
  
  async analyzeImage(imageFile, question = 'Describe this image') {
    await this.rateLimiter.acquire();
    
    const base64 = await this.fileToBase64(imageFile);
    const base64Data = base64.split(',')[1];
    
    const response = await fetch('https://toolkit.rork.com/images/edit/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: question,
        images: [{ type: 'image', image: base64Data }]
      })
    });
    
    const data = await response.json();
    const analysis = data.image.base64Data;
    
    this.conversationManager.addMessage('user', `[Image uploaded] ${question}`);
    this.conversationManager.addMessage('assistant', analysis);
    
    return analysis;
  }
  
  async transcribeAudio(audioBlob) {
    await this.rateLimiter.acquire();
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    return data.text;
  }
  
  async generateImage(prompt) {
    await this.rateLimiter.acquire();
    
    const response = await fetch('https://toolkit.rork.com/images/generate/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, size: '1024x1024' })
    });
    
    const data = await response.json();
    return `data:${data.image.mimeType};base64,${data.image.base64Data}`;
  }
  
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  clearConversation() {
    this.conversationManager.clear();
  }
}

// Usage
const app = new RorkChatApp();

// Text chat
const response = await app.sendTextMessage('Hello!');

// Image analysis
const analysis = await app.analyzeImage(imageFile, 'What is in this image?');

// Voice input
const transcription = await app.transcribeAudio(audioBlob);
const response2 = await app.sendTextMessage(transcription);

// Image generation
const imageUrl = await app.generateImage('A beautiful sunset');
```

---

## 🎯 Quick Reference

### API Endpoints Summary

| Feature | Endpoint | Method | Input | Output |
|---------|----------|--------|-------|--------|
| **Chat** | `/text/llm/` | POST | JSON (messages) | JSON (completion) |
| **STT** | `/stt/transcribe/` | POST | FormData (audio) | JSON (text) |
| **Image Gen** | `/images/generate/` | POST | JSON (prompt) | JSON (base64 image) |
| **Image Analysis** | `/images/edit/` | POST | JSON (prompt + image) | JSON (analysis) |

### Request Size Limits

| Type | Max Size | Recommended |
|------|----------|-------------|
| Text Message | 10,000 chars | 2,000 chars |
| Audio File | 25 MB | 5 MB |
| Image File | 20 MB | 2 MB |
| Conversation History | 50 messages | 10 messages |

---

## 📝 Notes

- All endpoints use HTTPS
- No authentication currently required
- Rate limiting may apply
- Base64 encoding increases size by ~33%
- Responses are JSON format (non-streaming)

---

**Last Updated:** 2025-10-15  
**Version:** 1.0  
**Author:** Technical Documentation

