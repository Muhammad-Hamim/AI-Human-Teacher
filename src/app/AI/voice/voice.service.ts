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

// In the function where userData is assigned
// Add proper type interfaces
interface UserData {
  name: string;
  [key: string]: any;
}

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

          // Initialize userData with a default name
          let userData: UserData = { name: "User" };

          // Get user data if available
          if (UserModel && userId) {
            try {
              const user = await UserModel.findById(userId).lean();
              if (user) {
                // When assigning the user data, ensure it has a name property
                if (Array.isArray(user)) {
                  // If it's an array, take the first element
                  userData =
                    user.length > 0
                      ? { name: user[0].name || "User", ...user[0] }
                      : userData;
                } else {
                  // Otherwise, use the object directly
                  userData = { name: user.name || "User", ...user };
                }
              }
            } catch (error) {
              console.error("Error fetching user data:", error);
            }
          }

          // Create message data for initial greeting
          const messageData: Omit<TMessage, "_id"> = {
            userId,
            chatId: sessionId, // Use sessionId as chatId
            message: {
              content: `Hello${userData.name ? " " + userData.name : ""}, how can I assist you today?`,
              contentType: "text",
            },
            user: {
              senderId: null,
              senderType: "assistant" as const, // Use a const assertion to specify the exact type
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
          const aiType = session.model?.includes("gpt")
            ? "openai"
            : session.model?.includes("deepseek")
              ? "deepseek"
              : "qwen2";

          // Create AI instance with custom model or default
          const ai = session.model
            ? AIFactory.createCustomAI(
                aiType as "openai" | "deepseek" | "qwen2",
                session.model
              )
            : AIFactory.createAI();

          // Create message data object
          const messageData: Omit<TMessage, "_id"> = {
            userId: session.userId,
            chatId: sessionId, // Use sessionId as chatId
            message: {
              content: message,
              contentType: "text",
            },
            user: {
              senderId: session.userId,
              senderType: "user" as const, // Use a const assertion to specify the exact type
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
            }
          }

          // Save the full response
          if (fullResponse) {
            const aiModel = ai as any;
            if (aiModel.saveMessage) {
              await aiModel.saveMessage({
                userId: session.userId,
                chatId: sessionId,
                message: {
                  content: fullResponse,
                  contentType: "text",
                },
                user: {
                  senderId: session.userId,
                  senderType: "user" as const,
                },
                isAIResponse: false,
                isDeleted: false,
              });
            }
          }
        } catch (error) {
          console.error("Error processing user message:", error);
          socket.emit("error", {
            message: "Failed to process user message",
            details: (error as Error).message,
          });
        }
      }
    );

    // Handle session end
    socket.on("end_session", (data: { sessionId: string }) => {
      const { sessionId } = data;
      activeSessions.delete(sessionId);
      socket.leave(sessionId);
      socket.emit("session_ended", { sessionId });
    });

    // Handle socket disconnect
    socket.on("disconnect", () => {
      console.log("Voice client disconnected:", socket.id);
      activeSessions.forEach((session, sessionId) => {
        if (session.userId === socket.id) {
          activeSessions.delete(sessionId);
          socket.leave(sessionId);
          socket.emit("session_ended", { sessionId });
        }
      });
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
    const model = modelName || "qwen/qwen2.5-vl-72b-instruct:free";

    // Determine AI model type and create instance
    const useOpenAI = model?.includes("gpt");
    const useQwen = model?.includes("qwen");
    let aiType = "qwen2"; // Default to qwen2

    if (useOpenAI) {
      aiType = "openai";
    } else if (model?.includes("deepseek")) {
      aiType = "deepseek";
    }

    // Create AI with specified model or default
    const ai = model
      ? AIFactory.createCustomAI(
          aiType as "openai" | "deepseek" | "qwen2",
          model
        )
      : AIFactory.createAI();

    // Get the User model
    let UserModel;
    try {
      UserModel = mongoose.model("User");
    } catch (error) {
      // If model doesn't exist, create a placeholder
      console.warn("User model not found, creating placeholder data");
    }

    // Initialize userData with a default name
    let userData: UserData = { name: "User" };

    if (UserModel && userId) {
      try {
        const user = await UserModel.findById(userId).lean();
        if (user) {
          // When assigning the user data, ensure it has a name property
          if (Array.isArray(user)) {
            // If it's an array, take the first element
            userData =
              user.length > 0
                ? { name: user[0].name || "User", ...user[0] }
                : userData;
          } else {
            // Otherwise, use the object directly
            userData = { name: user.name || "User", ...user };
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    // Use the Chat service to process the transcript
    const response = await ChatService.generateAIResponse(
      transcript,
      chatId,
      userId,
      model,
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
        gender: "Female",
      },
      {
        id: "en-US-GuyNeural",
        name: "Guy (Male)",
        language: "en-US",
        gender: "Male",
      },
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
