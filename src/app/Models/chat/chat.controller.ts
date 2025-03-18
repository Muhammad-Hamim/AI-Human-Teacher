import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ChatService } from "./chat.service";

// Create a new chat
const createChat = catchAsync(async (req: Request, res: Response) => {
  console.log("create chat",req.body);
  const result = await ChatService.createChat(req.body);
    sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Chat created successfully",
    data: result,
  });
});

// Get all chats for a user
const getChatsForUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const result = await ChatService.getChatsForUser(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chats retrieved successfully",
    data: result,
  });
});

// Get a chat by ID
const getChatById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ChatService.getChatById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chat retrieved successfully",
    data: result,
  });
});

// Update a chat
const updateChat = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ChatService.updateChat(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chat updated successfully",
    data: result,
  });
});

// Delete a chat
const deleteChat = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ChatService.deleteChat(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chat deleted successfully",
    data: result,
  });
});

export const ChatController = {
  createChat,
  getChatsForUser,
  getChatById,
  updateChat,
  deleteChat,
};
