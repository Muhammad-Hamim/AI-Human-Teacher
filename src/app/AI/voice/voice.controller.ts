import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { VoiceService } from "./voice.service";
import AppError from "../../errors/AppError";
import ServerConfig from "../../config/server.config";
import SpeechService from "../services/speech.service";

/**
 * Controller to get voice service status
 */
const getVoiceStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const status = await VoiceService.getServiceStatus();

    res.status(httpStatus.OK).json({
      success: true,
      message: "Voice service status retrieved successfully",
      data: status,
    });
  }
);

/**
 * Controller to process a voice transcript and generate AI response
 * This endpoint can be used as a fallback when WebSocket is not available
 */
const processVoiceTranscript = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { transcript, chatId, modelName, voiceId } = req.body;

    // Validate request data
    if (!transcript || !chatId) {
      return next(
        new AppError(httpStatus.BAD_REQUEST, "Missing required data")
      );
    }

    try {
      // Get user ID from authenticated user or request body
      const userId = req.body.userId || "641e23bc79b28a2f9c8d4567"; // Default user ID if not provided

      // Process the transcript through the Voice service
      const response = await VoiceService.processVoiceTranscript(
        transcript,
        chatId,
        userId,
        modelName,
        voiceId
      );

      // Get the server base URL for audio references
      const serverBaseUrl = SpeechService.getServerBaseUrl();

      // Add null check for _id before using it
      const messageId = response._id ? response._id.toString() : undefined;

      // Generate the audio URL using ServerConfig
      const audioUrl = response._id
        ? ServerConfig.getAudioUrl(response._id.toString(), serverBaseUrl)
        : undefined;

      // Return the AI response
      res.status(httpStatus.OK).json({
        success: true,
        message: "Voice transcript processed successfully",
        data: {
          messageId: messageId,
          text: response.message.content,
          audioUrl: audioUrl, // Use the full URL with server base
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Controller to get available voices for speech synthesis
 * This is mainly for the frontend to provide voice options
 */
const getAvailableVoices = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const voices = await VoiceService.getAvailableVoices();

    res.status(httpStatus.OK).json({
      success: true,
      message: "Available voices retrieved successfully",
      data: voices,
    });
  }
);

export const VoiceController = {
  getVoiceStatus,
  processVoiceTranscript,
  getAvailableVoices,
};

export default VoiceController;
