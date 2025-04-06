import { OpenAI } from "openai";
import config from "../../../app/config";
import mongoose, { Document } from "mongoose";
import { systemPrompt } from "../../utils/testSystemResponse";
import { TLine, TPoem } from "../../Models/poem/poem.interface";
import {
  generatePoemDatabaseContext,
  getAllPoemSummaries,
} from "../../utils/poemTraining";
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
    language: "en-US" | "zh-CN",
    options?: AIModelOptions
  ): Promise<string>;
  generateCompletionStream(
    messages: AIMessage[],
    options?: AIModelOptions
  ): AsyncGenerator<string, void, unknown>;
  processMessage(
    messageData: Omit<TMessage, "_id">,
    language: "en-US" | "zh-CN"
  ): Promise<TMessage>;
  processMessageStream(
    messageData: Omit<TMessage, "_id">
  ): AsyncGenerator<Partial<TMessage>, TMessage, unknown>;
}

// Abstract base class for AI models
abstract class BaseAIModel implements IAIModel {
  protected client: OpenAI;
  protected model: string;
  protected messageModel: mongoose.Model<TMessageDocument>;
  protected poemModel!: mongoose.Model<TPoem & Document>;

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

      this.messageModel = mongoose.model<TMessageDocument>("Message");
    }

    // Get the Poem model - try multiple collection names
    this.getPoemModel();
  }

  // Move the poem model initialization to a separate method without async
  private getPoemModel(): void {
    try {
      // Default to "Poem" if no collection found
      this.poemModel = mongoose.model<TPoem & Document>("Poem");
      console.log("Using default Poem model");
    } catch (error) {
      console.error("Error finding poem collections:", error);

      // Try with lowercase collection name as MongoDB might be case-sensitive
      try {
        this.poemModel = mongoose.model<TPoem & Document>("poems");
        console.log("Successfully loaded poems model (lowercase)");
      } catch (innerError) {
        console.error("Error loading poem model:", error);
        console.error("Error loading poems model:", innerError);

        // Get all model names for debugging
        console.log("Available models:", Object.keys(mongoose.models));

        // Last resort - use any available poem model
        const poemModelName = Object.keys(mongoose.models).find((name) =>
          name.toLowerCase().includes("poem")
        );

        if (poemModelName) {
          console.log(`Using found poem model: ${poemModelName}`);
          this.poemModel = mongoose.model(poemModelName) as mongoose.Model<
            TPoem & Document
          >;
        } else {
          // If no model is found, create a placeholder to prevent errors
          console.log("No poem model found, creating placeholder model");
          this.poemModel = mongoose.model<TPoem & Document>("Poem");
        }
      }
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

  // Get relevant poem data based on user query
  protected async getRelevantPoemData(userMessage: string): Promise<string> {
    // Parse the user message to determine if it's a poem query
    const isPoemQuery = this.isPoemRelatedQuery(userMessage);

    console.log(
      `Checking if message is poem-related: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? "..." : ""}"`
    );
    console.log(`Is poem query: ${isPoemQuery}`);

    if (!isPoemQuery) {
      return "";
    }

    // Check if the query is about the database contents
    const isDatabaseQuery =
      userMessage.toLowerCase().includes("database") ||
      userMessage.toLowerCase().includes("how many") ||
      userMessage.toLowerCase().includes("list") ||
      userMessage.toLowerCase().includes("what poems");

    if (isDatabaseQuery) {
      console.log("Processing database contents query");
      return await this.getAllPoemSummaries();
    }

    // Make sure we have a valid poemModel
    if (!this.poemModel) {
      console.error("Poem model not initialized");
      return "Database error: Poem model not initialized.";
    }

    // Look for text inside quotation marks (single or double)
    const quotationMatch =
      userMessage.match(/["'](.+?)["']/i) ||
      userMessage.match(/[「」""《》](.+?)[」」""《》]/i);

    if (quotationMatch && quotationMatch[1]) {
      // The user provided text in quotation marks - do an exact match query
      const exactSearchText = quotationMatch[1].trim();
      console.log(`Detected text in quotation marks: "${exactSearchText}"`);

      try {
        // Try to find the exact poem by exact match
        const exactPoem = await this.poemModel
          .findOne({
            $or: [
              { title: exactSearchText },
              { author: exactSearchText },
              { "lines.chinese": exactSearchText },
            ],
          })
          .lean();

        if (exactPoem) {
          console.log(
            `Found exact match: "${exactPoem.title}" by ${exactPoem.author}`
          );

          // Format just this specific poem data for context
          let poemContext = "POEM DATABASE CONTEXT:\n\n";
          poemContext += `Title: ${exactPoem.title}\n`;
          poemContext += `Author: ${exactPoem.author}\n`;
          poemContext += `Dynasty: ${exactPoem.dynasty}\n`;
          poemContext += "Lines:\n";

          exactPoem.lines.forEach((line: TLine, lineIndex: number) => {
            poemContext += `  ${lineIndex + 1}. ${line.chinese}\n`;
            poemContext += `     Pinyin: ${line.pinyin}\n`;
            poemContext += `     Translation: ${line.translation}\n`;
            if (line.explanation) {
              poemContext += `     Line Explanation: ${line.explanation}\n`;
            }
          });

          poemContext += `Explanation: ${exactPoem.explanation}\n`;
          poemContext += `Historical & Cultural Context: ${exactPoem.historicalCulturalContext}\n\n`;

          // If JSON format was requested, add the JSON representation
          if (
            userMessage.toLowerCase().includes("json") ||
            userMessage.toLowerCase().includes("format") ||
            userMessage.toLowerCase().includes("stored")
          ) {
            poemContext += "JSON FORMAT:\n```json\n";
            poemContext += JSON.stringify(exactPoem, null, 2);
            poemContext += "\n```\n\n";
            poemContext +=
              "INSTRUCTION: When asked for JSON format, provide the data exactly as shown in the JSON FORMAT section above.";
          }

          console.log(
            `Generated exact match poem context of length: ${poemContext.length}`
          );
          return poemContext;
        } else {
          console.log(`No exact match found for: "${exactSearchText}"`);
          return "No relevant data found in the database for your exact search. Please try a different query.";
        }
      } catch (error) {
        console.error(
          `Error searching for exact match "${exactSearchText}":`,
          error
        );
        return "No relevant data found in the database for your exact search. Please try a different query.";
      }
    }

    // Check if the query is requesting a random poem
    const isRandomPoemRequest =
      userMessage.toLowerCase().includes("random poem") ||
      (userMessage.toLowerCase().includes("random") &&
        userMessage.toLowerCase().includes("poem")) ||
      (userMessage.toLowerCase().includes("any") &&
        userMessage.toLowerCase().includes("poem")) ||
      !quotationMatch; // If no quotation marks, treat as random request

    if (isRandomPoemRequest) {
      console.log("Processing random poem request");
      try {
        // Get a random poem from the database
        const count = await this.poemModel.countDocuments();
        if (count === 0) {
          return "No poems found in the database.";
        }

        // Get a random poem using aggregation with $sample
        const randomPoems = await this.poemModel.aggregate([
          { $sample: { size: 1 } },
        ]);

        if (randomPoems.length === 0) {
          return "No relevant data found in the database.";
        }

        const randomPoem = randomPoems[0];
        console.log(
          `Retrieved random poem: "${randomPoem.title}" by ${randomPoem.author}`
        );

        // Format the poem data
        let poemContext = "RANDOM POEM FROM DATABASE:\n\n";
        poemContext += `Title: ${randomPoem.title}\n`;
        poemContext += `Author: ${randomPoem.author}\n`;
        poemContext += `Dynasty: ${randomPoem.dynasty}\n`;
        poemContext += "Lines:\n";

        randomPoem.lines.forEach((line: TLine, lineIndex: number) => {
          poemContext += `  ${lineIndex + 1}. ${line.chinese}\n`;
          poemContext += `     Pinyin: ${line.pinyin}\n`;
          poemContext += `     Translation: ${line.translation}\n`;
          if (line.explanation) {
            poemContext += `     Line Explanation: ${line.explanation}\n`;
          }
        });

        poemContext += `Explanation: ${randomPoem.explanation}\n`;
        poemContext += `Historical & Cultural Context: ${randomPoem.historicalCulturalContext}\n\n`;

        // Always include JSON representation for random poem requests
        poemContext += "JSON FORMAT:\n```json\n";
        poemContext += JSON.stringify(randomPoem, null, 2);
        poemContext += "\n```\n\n";
        poemContext +=
          "INSTRUCTION: If the user asked for JSON format, provide the data exactly as shown in the JSON FORMAT section above.";

        return poemContext;
      } catch (error) {
        console.error("Error retrieving random poem:", error);
        return "No relevant data found in the database.";
      }
    }

    // If we reach here, try to do a keyword search as a fallback
    try {
      // Extract potential keywords from user message
      const keywords = this.extractKeywords(userMessage);
      console.log("Extracted keywords for fallback search:", keywords);

      // Create a regex search condition for poem title, author, or dynasty
      const searchConditions = keywords.map((keyword) => ({
        $or: [
          { title: { $regex: keyword, $options: "i" } },
          { author: { $regex: keyword, $options: "i" } },
          { dynasty: { $regex: keyword, $options: "i" } },
          { "lines.chinese": { $regex: keyword, $options: "i" } },
          { explanation: { $regex: keyword, $options: "i" } },
        ],
      }));

      console.log(
        "Searching poems with conditions:",
        searchConditions.length > 0
          ? JSON.stringify(searchConditions, null, 2)
          : "No specific conditions (retrieving samples)"
      );

      // Find relevant poems (limit to prevent context overflow)
      const poems = await this.poemModel
        .find(
          searchConditions.length > 0 ? { $or: searchConditions } : {},
          null,
          { limit: 3 }
        )
        .lean();

      console.log(`Found ${poems.length} matching poems in database`);

      if (poems.length === 0) {
        console.log(
          "No specific poems found matching the query, returning general summary"
        );
        return "No relevant data found in the database for your query.";
      }

      // Format poem data for context
      let poemContext = "POEM DATABASE CONTEXT:\n\n";

      poems.forEach((poem: TPoem, index: number) => {
        console.log(`Including poem: ${poem.title} by ${poem.author}`);
        poemContext += `POEM ${index + 1}:\n`;
        poemContext += `Title: ${poem.title}\n`;
        poemContext += `Author: ${poem.author}\n`;
        poemContext += `Dynasty: ${poem.dynasty}\n`;
        poemContext += "Lines:\n";

        poem.lines.forEach((line: TLine, lineIndex: number) => {
          poemContext += `  ${lineIndex + 1}. ${line.chinese}\n`;
          poemContext += `     Pinyin: ${line.pinyin}\n`;
          poemContext += `     Translation: ${line.translation}\n`;
          if (line.explanation) {
            poemContext += `     Line Explanation: ${line.explanation}\n`;
          }
        });

        poemContext += `Explanation: ${poem.explanation}\n`;
        poemContext += `Historical & Cultural Context: ${poem.historicalCulturalContext}\n\n`;
      });

      console.log(`Generated poem context of length: ${poemContext.length}`);
      return poemContext;
    } catch (error) {
      console.error("Error fetching poem data:", error);
      return "No relevant data found in the database.";
    }
  }

  // Check if a message is likely to be a poem-related query
  private isPoemRelatedQuery(message: string): boolean {
    // Match requests for JSON format
    if (
      (message.toLowerCase().includes("json") ||
        message.toLowerCase().includes("format") ||
        message.toLowerCase().includes("data structure") ||
        message.toLowerCase().includes("raw data")) &&
      (message.toLowerCase().includes("poem") ||
        message.toLowerCase().includes("title"))
    ) {
      console.log("Detected request for poem data in JSON format");
      return true;
    }

    // Match queries about database contents
    if (
      message.toLowerCase().includes("database") &&
      (message.toLowerCase().includes("title") ||
        message.toLowerCase().includes("collection"))
    ) {
      console.log("Detected database inquiry about poems");
      return true;
    }

    // Original poem keywords check
    const poemKeywords = [
      "poem",
      "poetry",
      "verse",
      "stanza",
      "couplet",
      "quatrain",
      "author",
      "poet",
      "dynasty",
      "chinese",
      "ancient",
      "classical",
      "tang",
      "song",
      "ming",
      "qing",
      "yuan",
      "han",
      "jin",
      "诗",
      "唐诗",
      "宋词",
      "元曲",
      "诗人",
      "作者",
      "朝代",
      "Li Bai",
      "李白",
      "Du Fu",
      "杜甫",
      "Wang Wei",
      "王维",
      "Meng Haoran",
      "孟浩然",
      "Bai Juyi",
      "白居易",
    ];

    const lowercaseMessage = message.toLowerCase();
    return poemKeywords.some((keyword) =>
      lowercaseMessage.includes(keyword.toLowerCase())
    );
  }

  // Extract potential keywords from a message
  private extractKeywords(message: string): string[] {
    // Remove common words and punctuation
    const cleanedMessage = message
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
      .replace(/\s{2,}/g, " ")
      .toLowerCase();

    // Split into words
    const words = cleanedMessage.split(" ");

    // Filter out common words
    const commonWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "with",
      "about",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "by",
      "from",
      "that",
      "this",
      "these",
      "those",
      "what",
      "which",
      "who",
      "whom",
      "whose",
      "when",
      "where",
      "why",
      "how",
      "can",
      "could",
      "do",
      "does",
      "did",
      "have",
      "has",
      "had",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "me",
      "him",
      "her",
      "us",
      "them",
    ];

    // Return words that are not common and are at least 3 characters
    return words.filter(
      (word) => !commonWords.includes(word) && word.length >= 3
    );
  }

  // Convert TMessage array to AIMessage array for API
  protected async conversationToMessages(
    history: TMessage[],
    language: "en-US" | "zh-CN"
  ): Promise<AIMessage[]> {
    // Start with a system message
    const messages: AIMessage[] = [
      {
        role: "system",
        content: systemPrompt(language),
      },
    ];

    // Always include the poem database context if available
    const poemDatabaseContext = AIFactory.getPoemDatabaseContext();
    if (poemDatabaseContext) {
      console.log("Adding poem database context to conversation:");
      console.log("Context length:", poemDatabaseContext.length);
      messages.push({
        role: "system",
        content: poemDatabaseContext,
      });
    } else {
      console.warn("No poem database context available for this conversation");
    }

    // Get poem context based on the most recent user message
    const lastUserMessage =
      history.find((msg) => !msg.isAIResponse)?.message?.content || "";
    const poemContext = await this.getRelevantPoemData(lastUserMessage);

    // Add poem context if available
    if (poemContext) {
      console.log("Adding specific poem context based on query:");
      console.log("Query:", lastUserMessage);
      console.log("Context length:", poemContext.length);
      messages.push({
        role: "system",
        content: poemContext,
      });
    } else {
      console.log("No specific poem context found for query:", lastUserMessage);
    }

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
    messageData: Omit<TMessage, "_id">,
    language: "en-US" | "zh-CN"
  ): Promise<TMessageDocument> {
    // 1. Save the user message to database
    const savedUserMessage = await this.saveMessage(messageData);

    // 2. Get conversation history
    const history = await this.getConversationHistory(messageData.chatId);

    // 3. Convert to AI messages format with poem context
    const messages = await this.conversationToMessages(history, language);

    // 4. Generate AI response
    const aiResponseContent = await this.generateCompletion(messages, language);

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
    messageData: Omit<TMessage, "_id">,
    language?: "en-US" | "zh-CN"
  ): AsyncGenerator<Partial<TMessage>, TMessageDocument, unknown> {
    try {
      // 1. Save the user message to database
      const savedUserMessage = await this.saveMessage(messageData);

      // 2. Get conversation history
      const history = await this.getConversationHistory(messageData.chatId);

      // 3. Convert to AI messages format with poem context
      const messages = await this.conversationToMessages(
        history,
        language as "zh-CN" | "en-US"
      );

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
    language: "en-US" | "zh-CN",
    options: AIModelOptions = {}
  ): Promise<string> {
    // Changed default maxTokens from 2000 to 4000 to allow longer responses
    const { maxTokens = 4000, temperature = 0.7, ...rest } = options;
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: maxTokens,
      temperature,
      ...rest, // ensure no stop parameter is inadvertently provided
    });
    return response.choices[0]?.message?.content || "";
  }

  // Stream a completion from messages
  async *generateCompletionStream(
    messages: AIMessage[],
    options: AIModelOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    // Changed default maxTokens from 2000 to 4000 to support longer streams
    const { maxTokens = 4000, temperature = 0.7, ...rest } = options;
    const stream = (await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
      ...rest, // ensure no stop sequence is set
    })) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  // Get all poems from the database when no specific query is found
  // but we want to provide information about available poems
  protected async getAllPoemSummaries(): Promise<string> {
    try {
      // Try to use the new getAllPoemSummaries function from poemTraining.ts
      const poemSummaries = await getAllPoemSummaries();

      console.log(
        `Found ${poemSummaries.length} poems for summary using new database function`
      );

      if (poemSummaries.length === 0) {
        // Fall back to old method if the new one returns empty results
        return this.fallbackGetAllPoemSummaries();
      }

      // Format as a list for the AI to reference
      let poemList = "POEM DATABASE CONTENTS:\n\n";
      poemList += `I have access to ${poemSummaries.length} Chinese poems. Here are some examples:\n\n`;

      // Group by dynasty
      const poemsByDynasty: Record<
        string,
        { title: string; author: string }[]
      > = {};

      poemSummaries.forEach((poem) => {
        const dynasty = poem.dynasty || "Unknown Dynasty";
        if (!poemsByDynasty[dynasty]) {
          poemsByDynasty[dynasty] = [];
        }
        poemsByDynasty[dynasty].push({
          title: poem.title || "Untitled",
          author: poem.author || "Unknown Author",
        });
      });

      // List poems by dynasty, showing up to 5 poems per dynasty
      for (const [dynasty, dynastyPoems] of Object.entries(poemsByDynasty)) {
        poemList += `${dynasty} (${dynastyPoems.length} poems):\n`;
        dynastyPoems.slice(0, 5).forEach((poem) => {
          poemList += `- "${poem.title}" by ${poem.author}\n`;
        });
        if (dynastyPoems.length > 5) {
          poemList += `  (and ${dynastyPoems.length - 5} more...)\n`;
        }
        poemList += "\n";
      }

      return poemList;
    } catch (error) {
      console.error("Error getting all poem summaries:", error);
      return this.fallbackGetAllPoemSummaries();
    }
  }

  // Fallback method to get poem summaries directly from the model
  private async fallbackGetAllPoemSummaries(): Promise<string> {
    try {
      // Try to get all poems with a limit to prevent context explosion
      console.log(
        "Using fallback method to get summary of all poems in database"
      );

      const poems = await this.poemModel
        .find({}, "title author dynasty")
        .limit(20)
        .lean();

      console.log(
        `Found ${poems.length} poems for summary with fallback method`
      );

      if (poems.length === 0) {
        return "There are no poems in the database.";
      }

      // Format as a list for the AI to reference
      let poemList = "POEM DATABASE CONTENTS:\n\n";
      poemList += `I have access to ${poems.length} Chinese poems. Here are the titles:\n\n`;

      // Group by dynasty
      const poemsByDynasty: Record<
        string,
        { title: string; author: string }[]
      > = {};

      poems.forEach((poem) => {
        if (!poemsByDynasty[poem.dynasty]) {
          poemsByDynasty[poem.dynasty] = [];
        }
        poemsByDynasty[poem.dynasty].push({
          title: poem.title,
          author: poem.author,
        });
      });

      // List poems by dynasty
      for (const [dynasty, dynastyPoems] of Object.entries(poemsByDynasty)) {
        poemList += `${dynasty}:\n`;
        dynastyPoems.forEach((poem) => {
          poemList += `- "${poem.title}" by ${poem.author}\n`;
        });
        poemList += "\n";
      }

      return poemList;
    } catch (error) {
      console.error(
        "Error getting all poem summaries with fallback method:",
        error
      );
      return "I'm having trouble accessing the poem database at the moment.";
    }
  }
}

// Keep only DeepSeek model implementation
class DeepseekModel extends BaseAIModel {
  constructor() {
    super(
      config.ai_api_key as string,
      "deepseek/deepseek-r1:free",
      config.ai_base_url
    );
  }
}

// Simplify AI Factory class
export class AIFactory {
  // Store poem database context for reuse
  private static poemDatabaseContext: string | null = null;

  // Initialize the AI Factory with poem database context
  static async initialize(): Promise<void> {
    try {
      if (process.env.POETRY_TRAINING === "true") {
        console.log("Initializing AI Factory with poem database context...");
        console.log(
          "Environment variables: POETRY_TRAINING =",
          process.env.POETRY_TRAINING
        );

        // Check other collections for poems
        if (
          mongoose.connection &&
          mongoose.connection.readyState === 1 &&
          mongoose.connection.db
        ) {
          // Get all collections
          try {
            const collections = await mongoose.connection.db
              .listCollections()
              .toArray();
            console.log("All collections in database:");
            collections.forEach((coll) => console.log(`- ${coll.name}`));

            // Check each collection for poem-like data
            for (const coll of collections) {
              try {
                // Get a sample document to inspect
                const sample = await mongoose.connection.db
                  .collection(coll.name)
                  .findOne(
                    {},
                    { projection: { title: 1, author: 1, dynasty: 1 } }
                  );

                if (
                  sample &&
                  (sample.title || sample.author || sample.dynasty)
                ) {
                  const count = await mongoose.connection.db
                    .collection(coll.name)
                    .countDocuments();
                  console.log(
                    `Found potential poem collection: ${coll.name} with ${count} documents`
                  );
                  console.log(
                    `Sample document:`,
                    JSON.stringify(sample, null, 2)
                  );
                }
              } catch (err) {
                const error = err as Error;
                console.log(
                  `Error inspecting collection ${coll.name}:`,
                  error.message
                );
              }
            }
          } catch (error) {
            console.error("Error listing collections:", error);
          }
        }

        this.poemDatabaseContext = await generatePoemDatabaseContext();

        console.log("Poem database context generated:");
        console.log("-----------------------------");
        console.log(this.poemDatabaseContext);
        console.log("-----------------------------");

        if (this.poemDatabaseContext && this.poemDatabaseContext.length > 0) {
          console.log(
            "AI Factory initialized successfully with poem database context"
          );
        } else {
          console.warn("Poem database context is empty or null");
        }
      } else {
        console.log(
          "Poetry training is not enabled. Set POETRY_TRAINING=true to enable it."
        );
      }
    } catch (error) {
      console.error("Error initializing AI Factory:", error);
      this.poemDatabaseContext = null;
    }
  }

  // Get the poem database context
  static getPoemDatabaseContext(): string {
    return this.poemDatabaseContext || "";
  }

  static createAI(): IAIModel {
    return new DeepseekModel();
  }
}

export default AIFactory;
