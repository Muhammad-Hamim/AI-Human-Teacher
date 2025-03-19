import { Request, Response } from "express";
import { aiService, TAIMessage } from ".";
import catchAsync from "../utils/catchAsync";
import sendResponse from "../utils/sendResponse";
import httpStatus from "http-status";
import { Message } from "../Models/message/message.model";
import { Chat } from "../Models/chat/chat.model";
import mongoose from "mongoose";
import { defaultSystemPrompt } from "../utils/systemPrompt";

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
          content: defaultSystemPrompt,
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
    const { message, modelName, options } = req.body;

    // **Step 1: Save the user's message with a transaction**
    let session = await mongoose.startSession();
    session.startTransaction();
    let userMessage;
    try {
      userMessage = await Message.create(
        [
          {
            ...message,
            isAIResponse: false,
            isDeleted: false,
          },
        ],
        { session }
      );
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    // **Step 2: Retrieve chat history for context**
    const chatHistory = await Message.find({
      chatId: message.chatId,
      isDeleted: false,
    }).sort({ createdAt: 1 });

    // Convert to AI messages format
    const aiMessages: TAIMessage[] = chatHistory.map((msg) => ({
      role: msg.isAIResponse ? "assistant" : "user",
      content: msg.message.content,
    }));

    // Add system prompt if missing, matching generateResponse
    if (!aiMessages.some((m) => m.role === "system")) {
      aiMessages.unshift({
        role: "system",
        content: defaultSystemPrompt,
      });
    }

    // **Step 3: Set up streaming**
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");

    let fullResponse = "";

    const callbacks = {
      onContent: (content: string) => {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      },
      onComplete: async () => {
        // **Step 4: Save AI message with a separate transaction**
        session = await mongoose.startSession();
        session.startTransaction();
        try {
          const aiMessage = await Message.create(
            [
              {
                ...message,
                message: {
                  contentType: "text",
                  content: fullResponse,
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

          // Update chat if chatId exists
          if (message.chatId) {
            await Chat.findByIdAndUpdate(
              message.chatId,
              {
                lastMessageSnippet: fullResponse.substring(0, 50),
                lastMessageAt: new Date(),
              },
              { session }
            );
          }

          await session.commitTransaction();
        } catch (error) {
          await session.abortTransaction();
          throw error;
        } finally {
          session.endSession();
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      },
      onError: (error: Error) => {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      },
    };

    // **Step 5: Generate streaming response**
    await aiService.generateStreamingResponse(
      aiMessages,
      callbacks,
      modelName,
      options
    );
  }
);

// Process a message and get AI response
const processMessage = catchAsync(async (req: Request, res: Response) => {
  const { message, modelName, options } = req.body; // Adjusted to take a message object
  const chatId = message.chatId; // Extract chatId from message object

  // **Step 1: Start transaction**
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // **Step 2: Save user message**
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

    // **Step 3: Retrieve chat history**
    const chatHistory = await Message.find(
      {
        chatId: chatId,
        isDeleted: false,
      },
      null,
      { session }
    ).sort({ createdAt: 1 });

    // Convert to AI messages format
    const aiMessages: TAIMessage[] = chatHistory.map((msg) => ({
      role: msg.isAIResponse ? "assistant" : "user",
      content: msg.message.content,
    }));

    // Add system prompt, matching generateResponse
    aiMessages.unshift({
      role: "system",
      content: `
      **Context Awareness**:
- The messages following this system prompt form the ${chatHistory.toString()}. Use this history as context when the users current prompt relates to it.
- If the users prompt refers to a poem, poet, or concept mentioned earlier, build on that discussion...
- If the prompt is standalone or unrelated, treat it as a fresh query...
      ${defaultSystemPrompt}`,
    });

    // **Step 4: Generate AI response**
    const aiResponse = await aiService.generateResponse(
      aiMessages,
      modelName,
      options
    );

    // **Step 5: Save AI message**
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

    // **Step 6: Update chat**
    await Chat.findByIdAndUpdate(
      chatId,
      {
        lastMessageSnippet: aiResponse.content.substring(0, 50),
        lastMessageAt: new Date(),
      },
      { session }
    );

    // **Step 7: Commit transaction**
    await session.commitTransaction();

    // **Step 8: Send response**
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Message processed successfully",
      data: {
        userMessage: userMessage[0],
        aiMessage: aiMessage[0],
        chat: await Chat.findById(chatId),
      },
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const AIController = {
  generateResponse,
  generateStreamingResponse,
  processMessage,
};
