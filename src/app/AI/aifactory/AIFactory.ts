import { OpenAI } from "openai";
import config from "../../../app/config";
import mongoose, { Document } from "mongoose";
import { systemPrompt } from "../../utils/systemPrompt";

// Type definitions for messages
export type TUser = {
  senderType: "user" | "assistant";
  senderId: string | null;
};

export type TContent = {
  contentType: string;
  content: string;
};

export type TMessage = {
  _id?: string;
  userId: string;
  user: TUser;
  chatId: string;
  message: TContent;
  isAIResponse: boolean;
  replyToMessageId?: string;
  isDeleted: boolean;
  isStreaming?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

// Document type for saved messages
type TMessageDocument = TMessage & Document;

// Model options interface for better type safety
interface AIModelOptions {
  maxTokens?: number;
  temperature?: number;
  [key: string]: any;
}

// Message interface for chat interactions
interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Interface for AI models
interface IAIModel {
  generateCompletion(
    messages: AIMessage[],
    options?: AIModelOptions
  ): Promise<string>;
  generateCompletionStream(
    messages: AIMessage[],
    options?: AIModelOptions
  ): AsyncGenerator<string, void, unknown>;
  processMessage(messageData: Omit<TMessage, "_id">): Promise<TMessage>;
  processMessageStream(
    messageData: Omit<TMessage, "_id">
  ): AsyncGenerator<Partial<TMessage>, TMessage, unknown>;
}

// Abstract base class for AI models
abstract class BaseAIModel implements IAIModel {
  protected client: OpenAI;
  protected model: string;
  protected messageModel: mongoose.Model<TMessageDocument>;

  constructor(apiKey: string, model: string, baseURL?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
    this.model = model;

    // Get the Message model
    try {
      this.messageModel = mongoose.model<TMessageDocument>("Message");
    } catch (error) {
      // Since we can't directly import the model (it might not be registered yet),
      // we'll register it when needed in the actual service
      this.messageModel = mongoose.model<TMessageDocument>("Message");
    }
  }

  // Function to save message to database
  protected async saveMessage(
    messageData: Omit<TMessage, "_id">
  ): Promise<TMessageDocument> {
    const message = new this.messageModel(messageData);
    return await message.save();
  }

  // Function to get conversation history
  protected async getConversationHistory(
    chatId: string,
    limit: number = 50
  ): Promise<TMessage[]> {
    return await this.messageModel
      .find({ chatId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  // Convert TMessage array to AIMessage array for API
  protected conversationToMessages(history: TMessage[]): AIMessage[] {
    // Start with a system message
    const messages: AIMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Add messages in chronological order (oldest first)
    history.reverse().forEach((msg) => {
      messages.push({
        role: msg.isAIResponse ? "assistant" : "user",
        content: msg.message.content,
      });
    });

    return messages;
  }

  // Process a new message and generate a response
  async processMessage(
    messageData: Omit<TMessage, "_id">
  ): Promise<TMessageDocument> {
    // 1. Save the user message to database
    const savedUserMessage = await this.saveMessage(messageData);

    // 2. Get conversation history
    const history = await this.getConversationHistory(messageData.chatId);

    // 3. Convert to AI messages format
    const messages = this.conversationToMessages(history);

    // 4. Generate AI response
    const aiResponseContent = await this.generateCompletion(messages);

    // 5. Create AI response message
    const aiResponseData: Omit<TMessage, "_id"> = {
      userId: messageData.userId,
      user: {
        senderId: null,
        senderType: "assistant",
      },
      chatId: messageData.chatId,
      message: {
        content: aiResponseContent,
        contentType: "text",
      },
      isAIResponse: true,
      isDeleted: false,
      replyToMessageId: savedUserMessage._id?.toString(),
    };

    // 6. Save AI response to database
    return await this.saveMessage(aiResponseData);
  }

  // Process a message and stream the response
  async *processMessageStream(
    messageData: Omit<TMessage, "_id">
  ): AsyncGenerator<Partial<TMessage>, TMessageDocument, unknown> {
    try {
      // 1. Save the user message to database
      const savedUserMessage = await this.saveMessage(messageData);

      // 2. Get conversation history
      const history = await this.getConversationHistory(messageData.chatId);

      // 3. Convert to AI messages format
      const messages = this.conversationToMessages(history);

      // 4. Create initial AI response message with streaming flag
      const aiResponseData: Omit<TMessage, "_id"> = {
        userId: messageData.userId,
        user: {
          senderId: null,
          senderType: "assistant",
        },
        chatId: messageData.chatId,
        message: {
          content: "I'm thinking...", // Initial non-empty content
          contentType: "text",
        },
        isAIResponse: true,
        isDeleted: false,
        isStreaming: true,
        replyToMessageId: savedUserMessage._id?.toString(),
      };

      // 5. Save initial AI response
      const savedAiMessage = await this.saveMessage(aiResponseData);

      // 6. Stream response content
      let accumulatedContent = "";

      try {
        for await (const contentChunk of this.generateCompletionStream(
          messages
        )) {
          accumulatedContent += contentChunk;

          // Yield partial update for streaming to client
          yield {
            _id: savedAiMessage._id,
            message: {
              content: contentChunk,
              contentType: "text",
            },
            isStreaming: true,
          };
        }

        // 7. Update the saved message with complete content and remove streaming flag
        if (accumulatedContent.length === 0) {
          // If no content was generated, use a default message
          accumulatedContent =
            "I'm sorry, I couldn't generate a response. Please try again.";
        }

        savedAiMessage.message.content = accumulatedContent;
        savedAiMessage.isStreaming = false;
        await savedAiMessage.save();

        return savedAiMessage;
      } catch (error) {
        // If streaming fails, update the message with an error
        savedAiMessage.message.content =
          "I apologize, but I encountered an error while generating a response.";
        savedAiMessage.isStreaming = false;
        await savedAiMessage.save();

        throw error;
      }
    } catch (error) {
      console.error("Error in processMessageStream:", error);
      throw error;
    }
  }

  // Generate a completion from messages
  async generateCompletion(
    messages: AIMessage[],
    options: AIModelOptions = {}
  ): Promise<string> {
    const { maxTokens = 500, temperature = 0.7, ...rest } = options;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: maxTokens,
      temperature,
      ...rest,
    });

    return response.choices[0]?.message?.content || "";
  }

  // Stream a completion from messages
  async *generateCompletionStream(
    messages: AIMessage[],
    options: AIModelOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const { maxTokens = 500, temperature = 0.7, ...rest } = options;

    const stream = (await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
      ...rest,
    })) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}

// OpenAI model implementation
class OpenAIModel extends BaseAIModel {
  constructor(apiKey: string, model: string = "gpt-3.5-turbo") {
    super(apiKey, model);
  }
}

// DeepSeek model implementation
class DeepseekModel extends BaseAIModel {
  constructor(apiKey: string, model: string = "deepseek/deepseek-r1:free") {
    super(apiKey, model, config.ai_base_url);
  }
}

// AI model types
type AIModelType = "openai" | "deepseek";

// AI Factory class
export class AIFactory {
  static createAI(type: AIModelType = "deepseek"): IAIModel {
    const apiKey = config.ai_api_key as string;

    if (!apiKey) {
      throw new Error("AI API key is not defined");
    }

    switch (type) {
      case "openai":
        return new OpenAIModel(apiKey);
      case "deepseek":
        return new DeepseekModel(apiKey);
    }
  }

  static createCustomAI(type: AIModelType, model: string): IAIModel {
    const apiKey = config.ai_api_key as string;

    if (!apiKey) {
      throw new Error("AI API key is not defined");
    }

    switch (type) {
      case "openai":
        return new OpenAIModel(apiKey, model);
      case "deepseek":
        return new DeepseekModel(apiKey, model);
      default:
        throw new Error(`Unsupported AI type: ${type}`);
    }
  }
}

export default AIFactory;
