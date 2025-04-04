import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { MessageService } from "./message.service";

// Create a new message
const createMessage = catchAsync(async (req: Request, res: Response) => {
<<<<<<< HEAD
  
=======
>>>>>>> 5d346501064e48b47dd7da9cea64176bd413d6d9
  const result = await MessageService.createMessage(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Message created successfully",
    data: result,
  });
});

// Get all messages for a chat
const getMessagesForChat = catchAsync(async (req: Request, res: Response) => {
  const chatId = req.params.chatId;
  const result = await MessageService.getMessagesForChat(chatId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Messages retrieved successfully",
    data: result,
  });
});

// Get a message by ID
const getMessageById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await MessageService.getMessageById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message retrieved successfully",
    data: result,
  });
});

// Update a message
const updateMessage = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await MessageService.updateMessage(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message updated successfully",
    data: result,
  });
});

// Delete a message
const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await MessageService.deleteMessage(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message deleted successfully",
    data: result,
  });
});

export const MessageController = {
  createMessage,
  getMessagesForChat,
  getMessageById,
  updateMessage,
  deleteMessage,
};
