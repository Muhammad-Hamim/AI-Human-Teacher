import { Server, Socket } from "socket.io";
import { AIFactory } from "../aifactory/AIFactory";
import mongoose from "mongoose";
import { TMessage } from "../aifactory/AIFactory";
import ChatService from "../chat/chat.service";
import SpeechService from "../services/speech.service";

// Active voice sessions
interface VoiceSession {
  userId: string;
  sessionId: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Map to store active sessions
const activeSessions = new Map<string, VoiceSession>();

/**
 * Initialize voice socket handlers
 */
const initVoiceSocket = (io: Server) => {
  // Create a namespace for voice
  const voiceNamespace = io.of("/voice");

  voiceNamespace.on("connection", (socket: Socket) => {
    console.log("Voice client connected:", socket.id);

    // Handle session start
    socket.on(
      "start_session",
      async (data: {
        sessionId: string;
        userId: string;
        model?: string;
        maxTokens?: number;
        temperature?: number;
      }) => {
        try {
          const { sessionId, userId, model, maxTokens, temperature } = data;

          // Store session data
          activeSessions.set(sessionId, {
            userId,
            sessionId,
            model,
            maxTokens,
            temperature,
          });

          // Join a room specific to this session
          socket.join(sessionId);

          // Acknowledge session start
          socket.emit("session_started", { sessionId });

          // Send an initial greeting
          const aiType = model?.includes("gpt") ? "openai" : "deepseek";
          const ai = model
            ? AIFactory.createCustomAI(aiType as "openai" | "deepseek", model)
            : AIFactory.createAI();

          // Get the User model
          let UserModel;
          try {
            UserModel = mongoose.model("User");
          } catch (error) {
            // If model doesn't exist, create a placeholder
            console.warn("User model not found, creating placeholder data");
          }

          // Get user data if available
          let userData = { name: "User" };
          if (UserModel && userId) {
            try {
              const user = await UserModel.findById(userId).lean();
              if (user) {
                userData = user;
              }
            } catch (error) {
              console.error("Error fetching user data:", error);
            }
          }

          // Create message data for initial greeting
          const messageData = {
            userId,
            chatId: sessionId, // Use sessionId as chatId
            message: {
              content: `Hello${userData.name ? " " + userData.name : ""}, how can I assist you today?`,
              contentType: "text",
            },
            user: {
              senderId: null,
              senderType: "assistant",
            },
            isAIResponse: true,
            isDeleted: false,
          };

          // Save the greeting message
          const aiModel = ai as any;
          if (aiModel.saveMessage) {
            await aiModel.saveMessage(messageData);
          }

          // Send the greeting to the client
          socket.emit("ai_message_complete", {
            sessionId,
            content: messageData.message.content,
          });
        } catch (error) {
          console.error("Error starting voice session:", error);
          socket.emit("error", {
            message: "Failed to start session",
            details: (error as Error).message,
          });
        }
      }
    );

    // Handle user message
    socket.on(
      "user_message",
      async (data: { sessionId: string; message: string }) => {
        try {
          const { sessionId, message } = data;

          // Get session data
          const session = activeSessions.get(sessionId);
          if (!session) {
            throw new Error("Session not found");
          }

          // Get AI instance based on session data
          const aiType = session.model?.includes("gpt") ? "openai" : "deepseek";
          const ai = session.model
            ? AIFactory.createCustomAI(
                aiType as "openai" | "deepseek",
                session.model
              )
            : AIFactory.createAI();

          // Create message data object
          const messageData = {
            userId: session.userId,
            chatId: sessionId, // Use sessionId as chatId
            message: {
              content: message,
              contentType: "text",
            },
            user: {
              senderId: session.userId,
              senderType: "user",
            },
            isAIResponse: false,
            isDeleted: false,
          };

          // Process message stream
          const messageStream = ai.processMessageStream(messageData);

          // Collect the full response for completion event
          let fullResponse = "";

          // Stream each chunk to the client
          for await (const chunk of messageStream) {
            if (chunk.message?.content) {
              // Emit chunk to client
              socket.emit("ai_message_chunk", {
                sessionId,
                content: chunk.message.content,
              });

              // Add to full response
              fullResponse += chunk.message.content;
            }
          }

          // Signal that the AI message is complete
          socket.emit("ai_message_complete", {
            sessionId,
            content: fullResponse,
          });
        } catch (error) {
          console.error("Error processing voice message:", error);
          socket.emit("error", {
            message: "Failed to process message",
            details: (error as Error).message,
          });
        }
      }
    );

    // Handle session end
    socket.on("end_session", (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;

        // Remove session data
        activeSessions.delete(sessionId);

        // Leave the room
        socket.leave(sessionId);

        // Acknowledge session end
        socket.emit("session_ended", { sessionId });

        console.log(`Voice session ended: ${sessionId}`);
      } catch (error) {
        console.error("Error ending voice session:", error);
        socket.emit("error", {
          message: "Failed to end session",
          details: (error as Error).message,
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Voice client disconnected:", socket.id);

      // Find and clean up any sessions for this socket
      for (const [sessionId, session] of activeSessions.entries()) {
        if (socket.rooms.has(sessionId)) {
          activeSessions.delete(sessionId);
          console.log(`Auto-cleaned voice session: ${sessionId}`);
        }
      }
    });
  });

  return voiceNamespace;
};

/**
 * Process a voice transcript and generate an AI response
 * This is a wrapper around the Chat service's generateAIResponse function
 * but specifically optimized for voice interactions
 */
const processVoiceTranscript = async (
  transcript: string,
  chatId: string,
  userId: string,
  modelName?: string,
  voiceId?: string
): Promise<TMessage> => {
  try {
    // Log the incoming transcript
    console.log(
      `Processing voice transcript for chat ${chatId}: "${transcript}"`
    );

    // Use the Chat service to process the transcript
    const response = await ChatService.generateAIResponse(
      transcript,
      chatId,
      userId,
      modelName || "deepseek-r1", // Use specified model or default
      { voiceId } // Pass voice ID for TTS generation
    );

    // Log the response
    console.log(
      `Generated voice response for chat ${chatId}: "${response.message.content.substring(0, 50)}..."`
    );

    return response;
  } catch (error) {
    console.error("Error processing voice transcript:", error);
    throw error;
  }
};

/**
 * Get service status
 * Returns information about the voice service status
 */
const getServiceStatus = async (): Promise<{
  webrtc: boolean;
  speechRecognition: boolean;
  speechSynthesis: boolean;
}> => {
  // In a production environment, we would check the actual service status
  // For now, we'll just return that everything is running
  return {
    webrtc: true,
    speechRecognition: true,
    speechSynthesis: true,
  };
};

/**
 * Get available voices for speech synthesis
 * 
 * @returns Array of available voice models
 */
const getAvailableVoices = async () => {
  try {
    // Use the EdgeTTS voices
    return await SpeechService.getVoices();
  } catch (error) {
    console.error("Error getting available voices:", error);
    // Return a minimal set of voices if there's an error
    return [
      {
        id: "en-US-JennyNeural",
        name: "Jenny (Female)",
        language: "en-US",
        gender: "Female"
      },
      {
        id: "en-US-GuyNeural",
        name: "Guy (Male)",
        language: "en-US",
        gender: "Male"
      }
    ];
  }
};

export const VoiceService = {
  initVoiceSocket,
  processVoiceTranscript,
  getServiceStatus,
  getAvailableVoices,
};

export default VoiceService;
