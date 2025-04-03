# Text-to-Speech Integration Guide

## Overview

The AI Human Teacher application supports Microsoft Edge TTS, a high-quality text-to-speech system that automatically generates audio for AI responses. The system converts markdown text to plain text for speech output and sends the audio data directly in the API response or stream.

## Setup

1. Make sure you have Python installed (Python 3.8 or higher recommended)
2. Run the installation script:
   ```
   install_edgetts.bat
   ```
   Or manually install the Edge TTS library:
   ```
   pip install edge-tts
   ```
3. Start the server as usual

## API Usage

### Getting Available Voices

```http
GET /api/v1/ai/tts/voices
```

Response:

```json
{
  "success": true,
  "message": "Voices retrieved successfully",
  "data": [
    {
      "id": "en-US-JennyNeural",
      "name": "Jenny (Female)",
      "language": "en-US",
      "gender": "Female"
    },
    ...
  ]
}
```

### Testing TTS Functionality

```http
POST /api/v1/ai/tts/test-tts
Content-Type: application/json

{
  "text": "Hello! I am testing text-to-speech conversion.",
  "voiceId": "en-US-JennyNeural"
}
```

Response:

```json
{
  "success": true,
  "message": "TTS generated successfully",
  "data": {
    "text": "Hello! I am testing text-to-speech conversion.",
    "audioUrl": "/dist/test-tts-1616161616.wav",
    "audioData": "base64-encoded-audio-data",
    "voiceId": "en-US-JennyNeural",
    "contentType": "audio/wav"
  }
}
```

### Processing Chat Messages (Regular)

```http
POST /api/v1/ai/chat/process-message
Content-Type: application/json

{
  "message": {
    "chatId": "123456",
    "message": {
      "content": "Hello, AI!",
      "contentType": "text"
    },
    "user": {
      "senderId": "user123",
      "senderType": "user"
    },
    "userId": "user123"
  },
  "modelName": "deepseek-r1",
  "options": {
    "voiceId": "en-US-GuyNeural"
  }
}
```

### Streaming Chat Messages

For a real-time streaming experience with both text and audio:

```http
POST /api/v1/ai/chat/stream-message
Content-Type: application/json

{
  "message": {
    "chatId": "123456",
    "message": {
      "content": "Tell me a joke",
      "contentType": "text"
    },
    "user": {
      "senderId": "user123",
      "senderType": "user"
    },
    "userId": "user123"
  },
  "modelName": "deepseek-r1",
  "options": {
    "voiceId": "en-US-JennyNeural"
  }
}
```

Stream Response (Server-Sent Events):

```
data: {"message":{"content":"Why"}, "isStreaming":true}

data: {"message":{"content":" did"}, "isStreaming":true}

data: {"message":{"content":" the"}, "isStreaming":true}

data: {"message":{"content":" chicken"}, "isStreaming":true}

data: {"message":{"content":" cross"}, "isStreaming":true}

data: {"message":{"content":" the"}, "isStreaming":true}

data: {"message":{"content":" road?"}, "isStreaming":true}

data: {"message":{"content":"\n\nTo"}, "isStreaming":true}

data: {"message":{"content":" get"}, "isStreaming":true}

data: {"message":{"content":" to"}, "isStreaming":true}

data: {"message":{"content":" the"}, "isStreaming":true}

data: {"message":{"content":" other"}, "isStreaming":true}

data: {"message":{"content":" side!"}, "isStreaming":true, "_id":"65fd8a0b1b19b84f9c55e0f1"}

data: {"type":"audio","messageId":"65fd8a0b1b19b84f9c55e0f1","audioUrl":"/dist/tts-65fd8a0b1b19b84f9c55e0f1.wav","voiceId":"en-US-JennyNeural","fileSize":14320,"contentType":"audio/wav","data":"BASE64_AUDIO_DATA"}

data: [DONE]
```

### Response Format

All responses (regular and streaming) that include audio will provide:

```json
{
  "success": true,
  "message": "AI response generated successfully",
  "data": {
    // AI response fields...
    "audio": {
      "url": "/dist/tts-message-id.wav",
      "voiceId": "en-US-JennyNeural",
      "data": "base64-encoded-audio-data",
      "fileSize": 123456,
      "contentType": "audio/wav"
    }
  }
}
```

## Client Usage

### For Regular Responses

The client can directly use the base64-encoded audio data from the response:

```javascript
// Example client-side code to play the audio from regular response
function playResponseAudio(response) {
  if (response.data.audio && response.data.audio.data) {
    // Create an audio element
    const audio = new Audio();

    // Convert base64 to blob
    const byteCharacters = atob(response.data.audio.data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: response.data.audio.contentType,
    });

    // Create a URL for the blob and set it as the audio source
    const audioUrl = URL.createObjectURL(blob);
    audio.src = audioUrl;

    // Play the audio
    audio.play();

    // Clean up the URL when done
    audio.onended = () => URL.revokeObjectURL(audioUrl);
  }
}
```

### For Streaming Responses

When receiving streaming responses, use an EventSource to process the chunks:

```javascript
// Example client-side code to handle streaming with audio
function streamWithAudio(inputMessage) {
  const eventSource = new EventSource(`/api/v1/ai/chat/stream-message`);

  let fullText = "";
  let messageId = null;

  // Process incoming stream chunks
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Check if this is the [DONE] message
    if (event.data === "[DONE]") {
      eventSource.close();
      return;
    }

    // Handle text content chunks
    if (data.message?.content) {
      fullText += data.message.content;
      // Update UI with new content
      document.getElementById("response").textContent = fullText;

      // If this is the final chunk, save the message ID
      if (data._id) {
        messageId = data._id;
      }
    }

    // Handle audio data
    if (data.type === "audio" && data.data) {
      const audio = new Audio();

      // Convert base64 to blob
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: data.contentType || "audio/wav",
      });

      // Create a URL for the blob and set it as the audio source
      const audioUrl = URL.createObjectURL(blob);
      audio.src = audioUrl;

      // Play the audio
      audio.play();

      // Clean up the URL when done
      audio.onended = () => URL.revokeObjectURL(audioUrl);
    }
  };

  // Send the actual request
  fetch("/api/v1/ai/chat/stream-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: inputMessage,
      modelName: "deepseek-r1",
      options: {
        voiceId: "en-US-JennyNeural",
      },
    }),
  });
}
```

## Markdown to Plain Text Conversion

The system automatically converts markdown formatted text to plain text before generating speech:

- Headers are converted to normal text
- Bold and italic formatting is removed
- Code blocks and inline code are converted to normal text
- Markdown links are simplified to just the link text

This ensures maximum compatibility with all edge-tts versions, while still providing clear and readable speech output.

## Voice Options

The system supports dozens of voices across multiple languages. Some popular choices:

- English (US): `en-US-JennyNeural` (female), `en-US-GuyNeural` (male)
- English (UK): `en-GB-SoniaNeural` (female), `en-GB-RyanNeural` (male)
- Chinese: `zh-CN-XiaoxiaoNeural` (female), `zh-CN-YunjianNeural` (male)
- And many more!

## Troubleshooting

- If you hear no audio, ensure Edge TTS is properly installed with Python
- If edge-tts is not working, check that you have a compatible version installed:
  ```
  pip install edge-tts --upgrade
  ```
- For more advanced speech features, consider upgrading to the latest version of edge-tts which supports SSML
- Check server logs for specific errors in TTS generation
- Run the test-tts.bat script to verify your edge-tts installation works
