import { Request, Response } from "express";
import { aiService, TAIMessage } from ".";
import catchAsync from "../utils/catchAsync";
import sendResponse from "../utils/sendResponse";
import httpStatus from "http-status";
import { Message } from "../Models/message/message.model";
import { Chat } from "../Models/chat/chat.model";
import { Types } from "mongoose";
import mongoose from "mongoose";

// Generate a response from the AI
const generateResponse = catchAsync(async (req: Request, res: Response) => {
  const { message, modelName, options } = req.body;
  // Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // First create user message
    const userMessage = await Message.create(
      [
        {
          ...message,
          isAIResponse: false,
          isDeleted: false,
        },
      ],
      { session }
    );

    // Get AI response
    const aiResponse = await aiService.generateResponse(
      [
        {
          role: "system",
          content:
            "You are a Chinese poetry expert. your job is to teach Chinese classic poetry according to the user request. you should write,explain poem in chinese and give a translation after you explain it in. you should give response in markdown format, with proper format to ensure high readability you can add color, highlight any specific text, link should in clickable format, with hover it should preview the link, try to send response as colorful as possible with proper contrast, it'll be shown on the dark mood. and make it interactive",
        },
        {
          role: "user",
          content: message.message.content,
        },
      ],
      modelName,
      options
    );

    // Create AI response message
    const aiMessage = await Message.create(
      [
        {
          ...message,
          message: {
            contentType: "text",
            content: aiResponse.content,
          },
          user: {
            senderType: "assistance",
            senderId: null,
          },
          isAIResponse: true,
          replyToMessageId: userMessage[0]._id,
          isDeleted: false,
        },
      ],
      { session }
    );

    // Update chat with last message if chatId exists
    if (message.chatId) {
      await Chat.findByIdAndUpdate(
        message.chatId,
        {
          lastMessageSnippet: aiResponse.content.substring(0, 50),
          lastMessageAt: new Date(),
        },
        { session }
      );
    }

    // Commit transaction
    await session.commitTransaction();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "AI response generated successfully",
      data: {
        userMessage: userMessage[0],
        aiMessage: aiMessage[0],
        aiResponse,
      },
    });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    // End session
    session.endSession();
  }
});

// Generate a streaming response from the AI
const generateStreamingResponse = catchAsync(
  async (req: Request, res: Response) => {
    const { messages, modelName, options } = req.body;
    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Create callbacks for streaming
    const callbacks = {
      onContent: (content: string) => {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      },
      onComplete: (response: any) => {
        res.write(`data: ${JSON.stringify({ done: true, ...response })}\n\n`);
        res.end();
      },
      onError: (error: Error) => {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      },
    };

    // Generate streaming response
    await aiService.generateStreamingResponse(
      messages,
      callbacks,
      modelName,
      options
    );
  }
);

// Process a message and get AI response
const processMessage = catchAsync(async (req: Request, res: Response) => {
  const { chatId, message, userId, modelName } = req.body;

  // Find or create chat
  let chat;
  if (chatId) {
    chat = await Chat.findById(chatId);
  }

  if (!chat) {
    // Create a new chat using the message as title (truncated if too long)
    const title =
      message.length > 50 ? `${message.substring(0, 47)}...` : message;
    chat = await Chat.create({
      userId: new Types.ObjectId(userId),
      user: "User",
      title,
    });
  }

  // Save user message
  const userMessage = await Message.create({
    userId: new Types.ObjectId(userId),
    user: {
      senderType: "user",
      senderId: new Types.ObjectId(userId),
    },
    chatId: chat._id,
    message: {
      contentType: "text",
      content: message,
    },
    isAIResponse: false,
    isDeleted: false,
  });

  // Get chat history
  const chatHistory = await Message.find({
    chatId: chat._id,
    isDeleted: false,
  }).sort({ createdAt: 1 });

  // Convert chat history to AI messages format
  const aiMessages: TAIMessage[] = chatHistory.map((msg) => ({
    role: msg.isAIResponse ? "assistant" : "user",
    content: msg.message.content,
  }));

  // Add system message if needed
  aiMessages.unshift({
    role: "system",
    content:
      "You are a helpful AI assistant that provides accurate and concise information.",
  });

  // Generate AI response using non-streaming method
  const aiResponse = await aiService.generateResponse(aiMessages, modelName);

  // Save AI response
  const aiMessageDoc = await Message.create({
    userId: new Types.ObjectId(userId),
    user: {
      senderType: "ai",
      senderId: null,
    },
    chatId: chat._id,
    message: {
      contentType: "text",
      content: aiResponse.content,
    },
    isAIResponse: true,
    isDeleted: false,
  });

  // Update chat with last message
  await Chat.findByIdAndUpdate(chat._id, {
    lastMessageSnippet: aiResponse.content.substring(0, 50),
    lastMessageAt: new Date(),
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message processed successfully",
    data: {
      userMessage,
      aiMessage: aiMessageDoc,
      chat,
    },
  });
});

export const AIController = {
  generateResponse,
  generateStreamingResponse,
  processMessage,
};
