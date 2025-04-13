import { AIFactory } from "../aifactory/AIFactory";
import SpeechService from "../services/speech.service";
import { TMessage } from "../aifactory/AIFactory";

export interface TVoiceMessage extends Omit<TMessage, "_id"> {
  language?: "en-US" | "zh-CN";
}

export interface TVoiceResponse {
  audioUrl: string;
  message: TMessage;
}

export interface TVoiceResponseChunk {
  audioUrl?: string;
  messageChunk?: Partial<TMessage>;
}

export class VoiceService {
  async processVoiceChat(
    messageData: TVoiceMessage,
    language: "en-US" | "zh-CN"
  ): Promise<TVoiceResponse> {
    try {
      // Use DeepSeek model
      const ai = AIFactory.createAI();

      // Process the message
      const response = await ai.processMessage(messageData, language);

      // Convert response to speech
      const audioResponse = await SpeechService.textToSpeech(
        response.message.content,
        language
      );

      return {
        audioUrl: audioResponse.audioUrl,
        message: response,
      };
    } catch (error) {
      console.error("Error in voice chat:", error);
      throw error;
    }
  }

  async processStreamingVoiceChat(
    messageData: TVoiceMessage,
    language: "en-US" | "zh-CN"
  ): Promise<AsyncGenerator<TVoiceResponseChunk, void, unknown>> {
    try {
      const ai = AIFactory.createAI();
      return this.generateVoiceChatStream(ai, messageData, language);
    } catch (error) {
      console.error("Error in streaming voice chat:", error);
      throw error;
    }
  }

  private async *generateVoiceChatStream(
    ai: any,
    messageData: TVoiceMessage,
    language: "en-US" | "zh-CN"
  ): AsyncGenerator<TVoiceResponseChunk, void, unknown> {
    let accumulatedText = "";

    try {
      const messageStream = ai.processMessageStream(messageData, language);

      for await (const chunk of messageStream) {
        if (chunk.message?.content) {
          accumulatedText += chunk.message.content;

          // Yield the message chunk
          yield {
            messageChunk: chunk,
          };

          // Every few chunks, generate audio
          if (accumulatedText.length > 50) {
            const audioResponse = await SpeechService.textToSpeech(
              accumulatedText,
              language
            );

            yield {
              audioUrl: audioResponse.audioUrl,
            };

            accumulatedText = ""; // Reset accumulated text
          }
        }
      }

      // Generate audio for any remaining text
      if (accumulatedText.length > 0) {
        const audioResponse = await SpeechService.textToSpeech(
          accumulatedText,
          language
        );

        yield {
          audioUrl: audioResponse.audioUrl,
        };
      }
    } catch (error) {
      console.error("Error in voice chat stream:", error);
      throw error;
    }
  }

  /**
   * Get available voices for speech synthesis
   */
  async getAvailableVoices() {
    try {
      return await SpeechService.getVoices();
    } catch (error) {
      console.error("Error getting available voices:", error);
      // Return a minimal set of voices if there's an error
      return [
        {
          id: "zh-CN-XiaoxiaoNeural",
          name: "Xiaoxiao (Female)",
          language: "zh-CN",
          gender: "Female",
        },
        {
          id: "zh-CN-YunjianNeural",
          name: "Yunjian (Male)",
          language: "zh-CN",
          gender: "Male",
        },
      ];
    }
  }

  /**
   * Get service status
   */
  async getServiceStatus(): Promise<{
    speechSynthesis: boolean;
  }> {
    return {
      speechSynthesis: true,
    };
  }
}

export default VoiceService;
