import { Request, Response, NextFunction } from "express";
import { AIFactory, TMessage } from "../aifactory/AIFactory";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import fs from "fs";
import path from "path";
import SpeechService from "../services/speech.service";

// File size threshold for streaming (in bytes) - 1MB
const STREAM_THRESHOLD = 1024 * 1024;

/**
 * Process a message from the frontend and generate AI response
 */
const processMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { message, modelName, options } = req.body;
    const sendAudioData = options?.sendAudioData === true;
    console.log("🔍 message", req.body);
    // Validate request data
    if (!message || !message.chatId || !message.message?.content) {
      return next(new AppError(httpStatus.BAD_REQUEST, "Invalid request data"));
    }

    try {
      // Determine AI model type and create instance
      const useOpenAI = modelName?.includes("gpt");
      const useQwen = modelName?.includes("qwen");
      let aiType = "qwen2"; // Default to qwen2

      if (useOpenAI) {
        aiType = "openai";
      } else if (modelName?.includes("deepseek")) {
        aiType = "deepseek";
      }

      // Create AI with specified model or default
      const ai = modelName
        ? AIFactory.createCustomAI(
            aiType as "openai" | "deepseek" | "qwen2",
            modelName
          )
        : AIFactory.createAI();

      // Process the message and get AI response
      const aiResponse = await ai.processMessage(
        message as Omit<TMessage, "_id">
      );

      // Generate TTS for the AI response
      const responseText = aiResponse.message.content;
      const voiceId = options?.voiceId || "en-US-JennyNeural";
      const outputFileName = `tts-${aiResponse._id}.wav`;

      try {
        // Get the server base URL for audio references
        const serverBaseUrl = SpeechService.getServerBaseUrl();

        // Generate TTS synchronously to ensure we have audio before responding
        console.log("🎙️ Generating TTS for AI response...");
        const { audioUrl, audioData } = await SpeechService.speak({
          text: responseText,
          voiceId,
          outputFileName,
          baseUrl: serverBaseUrl,
        });

        // Get the audio file size to determine how to deliver it
        const fileSize = await SpeechService.getAudioFileSize(audioUrl);
        console.log(`📊 Audio file size: ${fileSize} bytes`);

        // Create base response object with audio data
        const responseWithAudio = {
          ...((aiResponse as any).toObject
            ? (aiResponse as any).toObject()
            : aiResponse),
          audio: {
            url: audioUrl,
            voiceId,
            data: audioData,
            fileSize: await SpeechService.getAudioFileSize(audioUrl),
            contentType: "audio/wav",
          },
        };

        // If direct audio data is requested
        if (sendAudioData) {
          try {
            if (fileSize > STREAM_THRESHOLD) {
              // For large files, use streaming response
              const filename = path.basename(
                audioUrl.startsWith("/") ? audioUrl.substring(1) : audioUrl
              );

              // Add streaming info to the response
              responseWithAudio.audio.streaming = true;
              responseWithAudio.audio.fileSize = fileSize;
              responseWithAudio.audio.contentType = "audio/wav";

              // Send the response with streaming info
              res.status(httpStatus.OK).json({
                success: true,
                message:
                  "AI response generated successfully (audio available for streaming)",
                data: responseWithAudio,
              });

              // Delete the audio file after a delay
              setTimeout(async () => {
                try {
                  await SpeechService.deleteAudioFile(audioUrl);
                } catch (error) {
                  console.error("Error deleting audio file:", error);
                }
              }, 60000); // Keep file for 1 minute to allow streaming
            } else {
              // For small files, include the audio data directly in the response
              const audioData = await SpeechService.readAudioFile(audioUrl);

              // Add the audio data to the response
              responseWithAudio.audio.data = audioData.toString("base64");
              responseWithAudio.audio.fileSize = fileSize;
              responseWithAudio.audio.contentType = "audio/wav";

              // Return the AI response to the client
              res.status(httpStatus.OK).json({
                success: true,
                message:
                  "AI response generated successfully with embedded audio",
                data: responseWithAudio,
              });

              // Delete the audio file after sending
              setTimeout(async () => {
                try {
                  await SpeechService.deleteAudioFile(audioUrl);
                } catch (error) {
                  console.error("Error deleting audio file:", error);
                }
              }, 5000); // Short delay to ensure response is fully sent
            }
          } catch (error) {
            console.error("Error processing audio data:", error);
            // If there's an error processing the audio data, just send the URL
            res.status(httpStatus.OK).json({
              success: true,
              message:
                "AI response generated successfully (with audio URL only)",
              data: responseWithAudio,
            });
          }
        } else {
          // Always include audio data in the response
          res.status(httpStatus.OK).json({
            success: true,
            message: "AI response generated successfully",
            data: responseWithAudio,
          });
        }
      } catch (error) {
        console.error("Error generating TTS:", error);
        // If TTS fails, still send the response with an error note
        res.status(httpStatus.OK).json({
          success: true,
          message: "AI response generated successfully (TTS generation failed)",
          data: {
            ...((aiResponse as any).toObject
              ? (aiResponse as any).toObject()
              : aiResponse),
            audio: {
              error: "TTS generation failed",
              errorDetails: (error as Error).message,
            },
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Stream a chat response for real-time display
 */
const streamMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { message, modelName, options } = req.body;

    // Validate request data before setting streaming headers
    if (!message || !message.chatId || !message.message?.content) {
      return next(new AppError(httpStatus.BAD_REQUEST, "Invalid request data"));
    }

    // Set headers for SSE (Server-Sent Events)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      // Fix the model name format for deepseek
      let modelToUse = modelName;
      if (modelName === "deepseek-r1") {
        modelToUse = "deepseek/deepseek-r1:free";
      }

      // Determine AI model type and create instance
      const useOpenAI = modelToUse?.includes("gpt");
      const useQwen = modelToUse?.includes("qwen");
      let aiType = "qwen2"; // Default to qwen2

      if (useOpenAI) {
        aiType = "openai";
      } else if (modelToUse?.includes("deepseek")) {
        aiType = "deepseek";
      }

      // Create AI with specified model or default
      const ai = modelToUse
        ? AIFactory.createCustomAI(
            aiType as "openai" | "deepseek" | "qwen2",
            modelToUse
          )
        : AIFactory.createAI();

      // Initialize stream processing
      const messageStream = ai.processMessageStream(
        message as Omit<TMessage, "_id">
      );

      // Track the completed message content for TTS generation
      let completeContent = "";
      let messageId: string | null = null;
      let isFinalChunk = false;

      // Handle the stream processing
      for await (const chunk of messageStream) {
        // If this is the final message with the ID, save it for TTS generation
        if (!chunk.isStreaming && chunk._id) {
          messageId = chunk._id.toString();
          isFinalChunk = true;
        }

        // Accumulate content if it's part of the message
        if (chunk.message?.content) {
          completeContent += chunk.message.content;
        }

        res.write(`data: ${JSON.stringify(chunk)}\n\n`);

        // Ensure the data is sent immediately
        if ("flush" in res && typeof res.flush === "function") {
          res.flush();
        }
      }

      // Generate TTS after streaming is complete
      if (messageId && completeContent) {
        const voiceId = options?.voiceId || "en-US-JennyNeural";
        const outputFileName = `tts-${messageId}.wav`;

        // Get the server base URL for audio references
        const serverBaseUrl = SpeechService.getServerBaseUrl();

        try {
          // Generate TTS asynchronously
          const { audioUrl, audioData } = await SpeechService.speak({
            text: completeContent,
            voiceId,
            outputFileName,
            baseUrl: serverBaseUrl,
          });

          // Always send audio data with the response, regardless of size
          const fileSize = await SpeechService.getAudioFileSize(audioUrl);

          // Send audio data to the client
          res.write(
            `data: ${JSON.stringify({
              type: "audio",
              messageId,
              audioUrl,
              voiceId,
              fileSize,
              contentType: "audio/wav",
              data: audioData, // Always include audio data
            })}\n\n`
          );

          // Ensure the data is sent immediately
          if ("flush" in res && typeof res.flush === "function") {
            res.flush();
          }

          // Delete the audio file after a delay
          setTimeout(async () => {
            try {
              await SpeechService.deleteAudioFile(audioUrl);
            } catch (error) {
              console.error("Error deleting audio file:", error);
            }
          }, 10000); // Keep file for 10 seconds
        } catch (error) {
          console.error("Error generating TTS for streamed response:", error);

          // Send audio error information
          res.write(
            `data: ${JSON.stringify({
              type: "audio_error",
              messageId,
              error: "Failed to generate audio",
            })}\n\n`
          );

          // Ensure the data is sent immediately
          if ("flush" in res && typeof res.flush === "function") {
            res.flush();
          }
        }
      }

      // End the stream
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      // Let our stream error handler middleware take care of this
      next(error);
    }
  }
);

/**
 * Stream an audio file for a specific message
 */
const streamAudioFile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { messageId } = req.params;

    if (!messageId) {
      return next(
        new AppError(httpStatus.BAD_REQUEST, "Message ID is required")
      );
    }

    try {
      // Construct the audio filename
      const filename = `tts-${messageId}.wav`;
      const distDir = path.resolve(__dirname, "../../../../../dist");
      const filePath = path.join(distDir, filename);

      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        return next(new AppError(httpStatus.NOT_FOUND, "Audio file not found"));
      }

      // Get file stats
      const stat = fs.statSync(filePath);

      // Set appropriate headers
      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Content-Length", stat.size);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      // Create a read stream and pipe it to the response
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);

      // Handle stream completion
      stream.on("end", async () => {
        try {
          // Delete the file after streaming
          await SpeechService.deleteAudioFile(filename);
        } catch (error) {
          console.error("Error deleting audio file after streaming:", error);
        }
      });

      // Handle stream errors
      stream.on("error", (error) => {
        console.error("Error streaming audio file:", error);
        // Don't call next(error) here as headers have already been sent
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Utility function to generate AI response programmatically
 */
async function generateAIResponse(
  prompt: string,
  chatId: string,
  userId: string,
  modelName?: string,
  options?: { voiceId?: string }
): Promise<TMessage> {
  try {
    // Fix the model name format for deepseek
    let modelToUse = modelName;
    if (modelName === "deepseek-r1") {
      modelToUse = "deepseek/deepseek-r1:free";
    }

    // Determine AI model type
    const useOpenAI = modelToUse?.includes("gpt");
    const useQwen = modelToUse?.includes("qwen");
    let aiType = "qwen2"; // Default to qwen2

    if (useOpenAI) {
      aiType = "openai";
    } else if (modelToUse?.includes("deepseek")) {
      aiType = "deepseek";
    }

    // Create AI with specified model or default
    const ai = modelToUse
      ? AIFactory.createCustomAI(
          aiType as "openai" | "deepseek" | "qwen2",
          modelToUse
        )
      : AIFactory.createAI();

    // Create message data object
    const messageData: Omit<TMessage, "_id"> = {
      userId,
      chatId,
      message: {
        content: prompt,
        contentType: "text",
      },
      user: {
        senderId: userId,
        senderType: "user",
      },
      isAIResponse: false,
      isDeleted: false,
    };

    // Get AI response (stored in database)
    const response = await ai.processMessage(messageData);

    // Generate TTS for the response
    try {
      const voiceId = options?.voiceId || "en-US-JennyNeural";
      const outputFileName = `tts-${response._id}.wav`;

      // Generate TTS and attach to response
      const audioResult = await SpeechService.speak({
        text: response.message.content,
        voiceId,
        outputFileName,
      });

      console.log(
        `✅ TTS generated for programmatic response ${response._id}: ${audioResult.audioUrl}`
      );

      // Attach audio data to the response if needed
      // Note: This is commented out as we can't modify the mongoose document after it's saved
      // You would need to modify your data model to store audio info if needed

      // For example:
      /*
      await YourMessageModel.findByIdAndUpdate(response._id, {
        $set: {
          'audio': {
            url: audioResult.audioUrl,
            data: audioResult.audioData,
            voiceId: voiceId,
            contentType: 'audio/wav'
          }
        }
      });
      */
    } catch (error) {
      console.error("Error generating TTS for programmatic response:", error);
    }

    return response;
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw error; // Rethrow to allow caller to handle
  }
}

/**
 * Get available TTS voices
 */
const getAvailableTTSVoices = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const voices = await SpeechService.getVoices();

      res.status(httpStatus.OK).json({
        success: true,
        message: "TTS voices retrieved successfully",
        data: voices,
      });
    } catch (error) {
      next(error);
    }
  }
);

export const ChatService = {
  processMessage,
  streamMessage,
  streamAudioFile,
  generateAIResponse,
  getAvailableTTSVoices,
};

export default ChatService;
