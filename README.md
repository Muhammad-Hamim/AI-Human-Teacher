## Voice Interaction with AI

The application includes a Socket.io-based voice interaction feature that allows real-time voice conversations with the AI.

### How It Works

1. The server uses Socket.io to maintain persistent, bi-directional connections between the client and server
2. The user sends text (transcribed from speech on the client-side)
3. The AI responds with text that can be converted to speech on the client-side
4. The connection remains open throughout the conversation

### Socket.io Events

#### Client to Server:

- `start_session`: Initialize a new voice conversation

  ```javascript
  socket.emit("start_session", {
    sessionId: "unique-session-id",
    userId: "optional-user-id",
    model: "deepseek-r1", // optional
    maxTokens: 500, // optional
  });
  ```

- `user_message`: Send a user message to the AI

  ```javascript
  socket.emit("user_message", {
    sessionId: "unique-session-id",
    message: "Hello, how can you help me today?",
  });
  ```

- `end_session`: End the voice conversation
  ```javascript
  socket.emit("end_session", {
    sessionId: "unique-session-id",
  });
  ```

#### Server to Client:

- `session_started`: Confirmation that session has started
- `ai_message_chunk`: Chunked AI response for real-time streaming
- `ai_message_complete`: Signals that the AI response is complete
- `session_ended`: Confirmation that session has ended
- `error`: Error message

### Frontend Implementation Example

```javascript
import { io } from "socket.io-client";

// Connect to the voice socket
const socket = io("http://your-server-url/voice");

// Session state
let sessionId = null;
let isAISpeaking = false;

// Speech synthesis setup
const synth = window.speechSynthesis;

// Speech recognition setup (using Web Speech API)
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = "en-US";

// Handle socket connection
socket.on("connect", () => {
  console.log("Connected to voice server");

  // Start a new session
  sessionId = "session-" + Date.now();
  socket.emit("start_session", { sessionId });
});

// Handle session started
socket.on("session_started", (data) => {
  console.log("Session started:", data);
  // The AI will send an initial greeting automatically
});

// Handle AI message chunks
socket.on("ai_message_chunk", (data) => {
  // Append to UI
  appendMessage("ai", data.content);

  // If not already speaking, start TTS
  if (!isAISpeaking) {
    speakText(data.content);
    isAISpeaking = true;
  }
});

// Handle AI message complete
socket.on("ai_message_complete", () => {
  isAISpeaking = false;

  // Start listening for user input after AI is done
  setTimeout(() => {
    startListening();
  }, 500);
});

// Handle errors
socket.on("error", (data) => {
  console.error("Voice error:", data);
});

// Handle disconnection
socket.on("disconnect", () => {
  console.log("Disconnected from voice server");
});

// Function to start listening for user speech
function startListening() {
  recognition.start();
}

// Handle speech recognition results
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;

  // Append to UI
  appendMessage("user", transcript);

  // Send to server
  socket.emit("user_message", {
    sessionId,
    message: transcript,
  });
};

// Function to speak text using TTS
function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1.0;
  synth.speak(utterance);
}

// Function to append message to UI
function appendMessage(sender, text) {
  // Implementation depends on your UI
  console.log(`${sender}: ${text}`);
}

// Function to end the voice session
function endVoiceSession() {
  socket.emit("end_session", { sessionId });
  recognition.stop();
  synth.cancel();
}

// Call endVoiceSession when user wants to end the conversation
document
  .getElementById("end-call-button")
  .addEventListener("click", endVoiceSession);
```

## Error Handling

The API uses a comprehensive error handling system with several components:

1. **AppError Class**: Custom error class that extends the native Error class to include HTTP status codes.

2. **Global Error Handler**: Middleware that catches and formats all errors thrown in the application, providing consistent error responses.

3. **Stream Error Handler**: Specialized middleware to handle errors in streaming endpoints, formatting errors as Server-Sent Events.

4. **catchAsync Utility**: A wrapper function that catches async errors and passes them to the next middleware in the chain.

### Error Handling in AI Chat Service

The AI chat service implements robust error handling:

- **Input Validation**: Validates request data before processing messages.
- **Graceful Streaming Errors**: Errors during streaming are sent to the client as formatted SSE events.
- **Consistent Error Format**: All errors follow the same format for easier debugging and client handling.
- **Failed Message Recovery**: If message generation fails, the system will save an appropriate error message instead of failing silently.

Example error response:

```json
{
  "success": false,
  "message": "Invalid request data",
  "errorSources": [
    {
      "path": "",
      "message": "Invalid request data"
    }
  ]
}
```

For streaming endpoints, errors are sent as SSE events:

```
data: {"success":false,"error":true,"statusCode":500,"message":"Stream processing failed"}

data: [DONE]
```

## WebRTC Voice Communication with AI

This project includes a WebRTC-based voice communication system that allows real-time voice conversations with the AI assistant. The system uses:

1. **WebRTC** for peer-to-peer audio transmission
2. **Socket.io** for signaling
3. **Web Speech API** for speech recognition and synthesis

### How It Works

1. The client initiates a voice session with the AI by clicking the microphone button
2. A WebRTC connection is established for high-quality audio transmission
3. The user's speech is transcribed using the Speech Recognition API
4. Transcribed text is sent to the AI through the same conversation context as text chat
5. The AI generates a response using the same models and conversation history
6. The response is converted to speech using the Speech Synthesis API
7. The entire conversation is saved in the database like regular text conversations

### Using Voice Mode

To use the voice communication feature:

1. Start a chat or open an existing conversation
2. Click the microphone icon in the bottom right corner
3. Grant microphone permissions when prompted
4. Click "Start Call" in the voice modal
5. Speak naturally - the AI will respond through voice
6. Use the mute button to temporarily disable your microphone
7. Click the phone button to end the call

### Key Features

- **Real-time Communication**: Low-latency audio transmission using WebRTC
- **Session Management**: Secure voice sessions with timeout handling
- **Conversation Context**: Voice interactions maintain the same conversation context as text chat
- **Accessibility**: Voice input/output for users who prefer speaking over typing
- **Fallback Mechanisms**: Text-based UI shows transcriptions and responses even when audio fails

### Technical Implementation

The implementation uses a hybrid approach:

- Socket.io for signaling and session management
- WebRTC for peer connection and audio transmission
- Web Speech API for client-side voice processing
- The same AI backend handles both text and voice requests
