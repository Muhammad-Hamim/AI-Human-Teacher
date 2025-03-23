# Voice Chat Components

This directory contains a set of components for implementing a ChatGPT-style voice chat experience with dark mode support.

## Components Overview

### 1. VoiceChatButton

Entry point for the voice chat feature. Displays a microphone button that when clicked, opens the TeacherVoiceModal.

Usage:

```jsx
import VoiceChatButton from "@/components/Pages/AskAi/voice-chat/VoiceChatButton";

// In your component's render function:
<VoiceChatButton className="your-custom-class" />;
```

### 2. TeacherVoiceModal

The main modal component that handles the voice interaction workflow, including:

- Speech recognition (listening to user)
- Speech synthesis (speaking AI responses)
- Word-by-word highlighting of responses
- Visual feedback (waveforms)
- Loading states
- Error handling

### 3. AudioAnalyzer

Responsible for analyzing audio input and calculating intensity values that drive animations.

Features:

- Real-time audio analysis
- Browser compatibility handling
- Smooth intensity transitions

### 4. SpeechWaveform

A customizable waveform visualization component that animates based on audio intensity.

Features:

- Multiple visualization modes (user, AI, loading)
- Customizable colors and appearance
- Dark mode optimized visualizations
- Smooth animations

## How to Use the Voice Chat

1. Click the microphone button to start speaking
2. Speak your query clearly
3. Click the microphone button again when you're done speaking (instead of automatic detection)
4. The system will show a loading animation while processing your query
5. The AI response will appear and be spoken aloud
6. You can click "Stop speaking" to interrupt the AI's speech
7. Click the microphone again to ask another question

## Integration

To integrate this voice chat feature in your application:

1. Import and use the `VoiceChatButton` component in your UI
2. Ensure your application has the required dependencies:
   - `framer-motion` for animations
   - `lucide-react` for icons
   - `sonner` for toast notifications

For a complete example, check the `VoiceChatExample.tsx` file which provides a ready-to-use implementation.

## Troubleshooting AI Responses

If you're not getting responses from the AI:

1. **Response Format Issues**: The component has been updated to handle multiple response formats from different AI providers. If you're still having issues, check the console logs to see what format your API is returning.

2. **API Connection**: Ensure your API endpoints are correctly configured and the `streamAiResponse` function is properly connected.

3. **Request Format**: Make sure the format of the request matches what your backend expects. You may need to modify the payload in `handleSendQuery` function.

4. **CORS Issues**: Check browser console for CORS errors if your API is on a different domain.

5. **Error Handling**: The component now has improved error handling that will display error messages when the AI doesn't respond.

## Dark Mode Support

All components are now optimized for dark mode with:

- Dark backgrounds and appropriate text colors
- Enhanced contrast for better readability
- Glowing effects for visual elements
- Color palette optimized for dark environments

If you need to integrate with a light theme, you'll need to modify the color variables in each component.

## Browser Compatibility

This feature is compatible with modern browsers that support the Web Speech API:

- Chrome
- Edge
- Safari
- Firefox (partial support)

The components include built-in compatibility checks and will display appropriate error messages on unsupported browsers.

## Customization

You can customize the appearance of the voice chat components by:

1. Passing className props to VoiceChatButton
2. Modifying the color schemes in SpeechWaveform
3. Adjusting animation parameters in the components
4. Editing the dialog content in TeacherVoiceModal

## Example Usage

```jsx
import React from "react";
import VoiceChatButton from "@/components/Pages/AskAi/voice-chat/VoiceChatButton";

const ChatInterface = () => {
  return (
    <div className="chat-container bg-gray-950 text-white">
      <div className="chat-messages">{/* Your chat messages here */}</div>

      <div className="chat-input-area">
        <textarea
          placeholder="Type your message..."
          className="chat-input bg-gray-800 text-white"
        />

        <div className="chat-actions">
          <button className="send-button bg-blue-600 text-white">Send</button>
          <VoiceChatButton className="ml-2" />
        </div>
      </div>
    </div>
  );
};
```

## Debugging

To debug AI response issues, uncomment the console.log statements in `TeacherVoiceModal.tsx` to see:

- The raw response chunks from your API
- The complete response after processing
- Any errors that occur during the process
