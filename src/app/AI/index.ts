import { AIFactory } from "./aifactory/AIFactory";
import VoiceRoutes from "./voice/voice.route";
import ChatRoutes from "./chat/chat.route";
import ChatService from "./chat/chat.service";
import { VoiceService } from "./voice/voice.service";
import SpeechService from "./services/speech.service";
import { PoemNarrationRoutes } from "./poem-narration/poem-narration.route";
import { PoemInsightsRoutes } from "./poem-insights/poem-insights.route";
import TTSTestRoutes from "./edgetts/tts-test.route";

// Export all AI components
export {
  AIFactory,
  ChatRoutes,
  ChatService,
  VoiceService,
  VoiceRoutes,
  SpeechService,
  PoemNarrationRoutes,
  PoemInsightsRoutes,
  TTSTestRoutes,
};

/**
 * Initialize all AI services
 * @param server HTTP server instance
 */
export const initAIServices = (server: any) => {
  // Get the server base URL from environment variables or use a default
  let serverBaseUrl = process.env.SERVER_URL || "";

  // If not set in environment, try to construct it from the server settings
  if (!serverBaseUrl && server) {
    try {
      // Try to determine the URL from server settings
      const address = server.address();
      if (address) {
        const port = address.port;
        // Use localhost for development, but in production this should be configured properly
        serverBaseUrl = `http://localhost:${port}`;
        console.log(`Server base URL set to: ${serverBaseUrl}`);
      }
    } catch (error) {
      console.warn(
        "Could not automatically determine server URL, using relative paths"
      );
    }
  }

  // Set the server base URL for audio file references
  SpeechService.setServerBaseUrl(serverBaseUrl);

  // Load TTS voices in the background
  SpeechService.loadVoices().catch((err) => {
    console.error("Failed to load TTS voices:", err);
  });

  console.log("AI services initialized");
};
