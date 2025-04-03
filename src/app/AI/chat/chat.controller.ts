import { Request, Response, NextFunction } from "express";
import { ChatService } from "./chat.service";
import catchAsync from "../../utils/catchAsync";

/**
 * Controller to process a chat message and generate AI response
 */
const processMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await ChatService.processMessage(req, res, next);
};

/**
 * Controller to stream a chat response for real-time display
 */
const streamMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await ChatService.streamMessage(req, res, next);
};

/**
 * Stream an audio file for a given message ID
 */
const streamAudioFile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await ChatService.streamAudioFile(req, res, next);
  }
);

/**
 * Controller to get available TTS voices
 */
const getTTSVoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await ChatService.getAvailableTTSVoices(req, res, next);
};

export const ChatController = {
  processMessage,
  streamMessage,
  streamAudioFile,
  getTTSVoices,
};

export default ChatController;
