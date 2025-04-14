import mongoose, { Document } from "mongoose";
import config from "../../../app/config";
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
  getCompletion(params: {
    systemPrompt: string;
    userPrompt: string;
    options?: AIModelOptions;
  }): Promise<string>;
}

// Base class for AI models
abstract class BaseAIModel implements IAIModel {
  protected model: string;
  protected messageModel: mongoose.Model<TMessageDocument>;
  protected poemModel!: mongoose.Model<TPoem & Document>;
  protected apiKey: string;
  protected baseURL?: string;

  constructor(apiKey: string, model: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = baseURL;

    // Get the Message model
    try {
      this.messageModel = mongoose.model<TMessageDocument>("Message");
    } catch (error) {
      this.messageModel = mongoose.model<TMessageDocument>("Message");
    }

    // Get the Poem model
    this.getPoemModel();
  }

  // Move the poem model initialization to a separate method without async
  private getPoemModel(): void {
    try {
      this.poemModel = mongoose.model<TPoem & Document>("Poem");
    } catch (error) {
      try {
        this.poemModel = mongoose.model<TPoem & Document>("poems");
      } catch (innerError) {
        const poemModelName = Object.keys(mongoose.models).find((name) =>
          name.toLowerCase().includes("poem")
        );

        if (poemModelName) {
          this.poemModel = mongoose.model(poemModelName) as mongoose.Model<
            TPoem & Document
          >;
        } else {
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
    const isPoemQuery = this.isPoemRelatedQuery(userMessage);

    if (!isPoemQuery) {
      return "";
    }

    const isDatabaseQuery =
      userMessage.toLowerCase().includes("database") ||
      userMessage.toLowerCase().includes("how many") ||
      userMessage.toLowerCase().includes("list") ||
      userMessage.toLowerCase().includes("what poems");

    if (isDatabaseQuery) {
      return await this.getAllPoemSummaries();
    }

    if (!this.poemModel) {
      return "Database error: Poem model not initialized.";
    }

    const quotationMatch =
      userMessage.match(/["'](.+?)["']/i) ||
      userMessage.match(/[「」""《》](.+?)[」」""《》]/i);

    if (quotationMatch && quotationMatch[1]) {
      const exactSearchText = quotationMatch[1].trim();

      try {
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

          return poemContext;
        } else {
          return "No relevant data found in the database for your exact search. Please try a different query.";
        }
      } catch (error) {
        return "No relevant data found in the database for your exact search. Please try a different query.";
      }
    }

    const isRandomPoemRequest =
      userMessage.toLowerCase().includes("random poem") ||
      (userMessage.toLowerCase().includes("random") &&
        userMessage.toLowerCase().includes("poem")) ||
      (userMessage.toLowerCase().includes("any") &&
        userMessage.toLowerCase().includes("poem")) ||
      !quotationMatch;

    if (isRandomPoemRequest) {
      try {
        const count = await this.poemModel.countDocuments();
        if (count === 0) {
          return "No poems found in the database.";
        }

        const randomPoems = await this.poemModel.aggregate([
          { $sample: { size: 1 } },
        ]);

        if (randomPoems.length === 0) {
          return "No relevant data found in the database.";
        }

        const randomPoem = randomPoems[0];

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

        poemContext += "JSON FORMAT:\n```json\n";
        poemContext += JSON.stringify(randomPoem, null, 2);
        poemContext += "\n```\n\n";
        poemContext +=
          "INSTRUCTION: If the user asked for JSON format, provide the data exactly as shown in the JSON FORMAT section above.";

        return poemContext;
      } catch (error) {
        return "No relevant data found in the database.";
      }
    }

    try {
      const keywords = this.extractKeywords(userMessage);

      const searchConditions = keywords.map((keyword) => ({
        $or: [
          { title: { $regex: keyword, $options: "i" } },
          { author: { $regex: keyword, $options: "i" } },
          { dynasty: { $regex: keyword, $options: "i" } },
          { "lines.chinese": { $regex: keyword, $options: "i" } },
          { explanation: { $regex: keyword, $options: "i" } },
        ],
      }));

      const poems = await this.poemModel
        .find(
          searchConditions.length > 0 ? { $or: searchConditions } : {},
          null,
          { limit: 3 }
        )
        .lean();

      if (poems.length === 0) {
        return "No relevant data found in the database for your query.";
      }

      let poemContext = "POEM DATABASE CONTEXT:\n\n";

      poems.forEach((poem: TPoem, index: number) => {
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

      return poemContext;
    } catch (error) {
      return "No relevant data found in the database.";
    }
  }

  private isPoemRelatedQuery(message: string): boolean {
    if (
      (message.toLowerCase().includes("json") ||
        message.toLowerCase().includes("format") ||
        message.toLowerCase().includes("data structure") ||
        message.toLowerCase().includes("raw data")) &&
      (message.toLowerCase().includes("poem") ||
        message.toLowerCase().includes("title"))
    ) {
      return true;
    }

    if (
      message.toLowerCase().includes("database") &&
      (message.toLowerCase().includes("title") ||
        message.toLowerCase().includes("collection"))
    ) {
      return true;
    }

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

  private extractKeywords(message: string): string[] {
    const cleanedMessage = message
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
      .replace(/\s{2,}/g, " ")
      .toLowerCase();

    const words = cleanedMessage.split(" ");

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

    return words.filter(
      (word) => !commonWords.includes(word) && word.length >= 3
    );
  }

  protected async conversationToMessages(
    history: TMessage[],
    language: "en-US" | "zh-CN"
  ): Promise<AIMessage[]> {
    const messages: AIMessage[] = [
      {
        role: "system",
        content: systemPrompt(language),
      },
    ];

    const poemDatabaseContext = AIFactory.getPoemDatabaseContext();
    if (poemDatabaseContext) {
      messages.push({
        role: "system",
        content: poemDatabaseContext,
      });
    }

    const lastUserMessage =
      history.find((msg) => !msg.isAIResponse)?.message?.content || "";
    const poemContext = await this.getRelevantPoemData(lastUserMessage);

    if (poemContext) {
      messages.push({
        role: "system",
        content: poemContext,
      });
    }

    history.reverse().forEach((msg) => {
      messages.push({
        role: msg.isAIResponse ? "assistant" : "user",
        content: msg.message.content,
      });
    });

    return messages;
  }

  async processMessage(
    messageData: Omit<TMessage, "_id">,
    language: "en-US" | "zh-CN"
  ): Promise<TMessageDocument> {
    const savedUserMessage = await this.saveMessage(messageData);

    const history = await this.getConversationHistory(messageData.chatId);

    const messages = await this.conversationToMessages(history, language);

    const aiResponseContent = await this.generateCompletion(messages);

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

    return await this.saveMessage(aiResponseData);
  }

  async *processMessageStream(
    messageData: Omit<TMessage, "_id">,
    language?: "en-US" | "zh-CN"
  ): AsyncGenerator<Partial<TMessage>, TMessageDocument, unknown> {
    const savedUserMessage = await this.saveMessage(messageData);

    const history = await this.getConversationHistory(messageData.chatId);

    const messages = await this.conversationToMessages(
      history,
      language as "zh-CN" | "en-US"
    );

    const aiResponseData: Omit<TMessage, "_id"> = {
      userId: messageData.userId,
      user: {
        senderId: null,
        senderType: "assistant",
      },
      chatId: messageData.chatId,
      message: {
        content: "I'm thinking...",
        contentType: "text",
      },
      isAIResponse: true,
      isDeleted: false,
      isStreaming: true,
      replyToMessageId: savedUserMessage._id?.toString(),
    };

    const savedAiMessage = await this.saveMessage(aiResponseData);

    let accumulatedContent = "";

    try {
      for await (const contentChunk of this.generateCompletionStream(
        messages
      )) {
        accumulatedContent += contentChunk;

        yield {
          _id: savedAiMessage._id,
          message: {
            content: contentChunk,
            contentType: "text",
          },
          isStreaming: true,
        };
      }

      if (accumulatedContent.length === 0) {
        accumulatedContent =
          "I'm sorry, I couldn't generate a response. Please try again.";
      }

      savedAiMessage.message.content = accumulatedContent;
      savedAiMessage.isStreaming = false;
      await savedAiMessage.save();

      return savedAiMessage;
    } catch (error) {
      savedAiMessage.message.content =
        "I apologize, but I encountered an error while generating a response.";
      savedAiMessage.isStreaming = false;
      await savedAiMessage.save();

      throw error;
    }
  }

  async generateCompletion(
    messages: AIMessage[],
    options: AIModelOptions = {}
  ): Promise<string> {
    const { maxTokens = 4000, temperature = 0.7 } = options;

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async *generateCompletionStream(
    messages: AIMessage[],
    options: AIModelOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const { maxTokens = 4000, temperature = 0.7 } = options;

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      }),
    });

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(Boolean);

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) yield content;
        }
      }
    }
  }

  protected async getAllPoemSummaries(): Promise<string> {
    try {
      const poemSummaries = await getAllPoemSummaries();

      if (poemSummaries.length === 0) {
        return this.fallbackGetAllPoemSummaries();
      }

      let poemList = "POEM DATABASE CONTENTS:\n\n";
      poemList += `I have access to ${poemSummaries.length} Chinese poems. Here are some examples:\n\n`;

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
      return this.fallbackGetAllPoemSummaries();
    }
  }

  private async fallbackGetAllPoemSummaries(): Promise<string> {
    try {
      const poems = await this.poemModel
        .find({}, "title author dynasty")
        .limit(20)
        .lean();

      if (poems.length === 0) {
        return "There are no poems in the database.";
      }

      let poemList = "POEM DATABASE CONTENTS:\n\n";
      poemList += `I have access to ${poems.length} Chinese poems. Here are the titles:\n\n`;

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

      for (const [dynasty, dynastyPoems] of Object.entries(poemsByDynasty)) {
        poemList += `${dynasty}:\n`;
        dynastyPoems.forEach((poem) => {
          poemList += `- "${poem.title}" by ${poem.author}\n`;
        });
        poemList += "\n";
      }

      return poemList;
    } catch (error) {
      return "I'm having trouble accessing the poem database at the moment.";
    }
  }

  async getCompletion({
    systemPrompt,
    userPrompt,
    options = {},
  }: {
    systemPrompt: string;
    userPrompt: string;
    options?: AIModelOptions;
  }): Promise<string> {
    const messages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    return this.generateCompletion(messages, options);
  }
}

// DeepSeek model implementation
class DeepseekModel extends BaseAIModel {
  constructor() {
    super(
      config.ai_api_key as string,
      "deepseek/deepseek-r1:free",
      config.ai_base_url
    );
  }
}

// AI Factory class
export class AIFactory {
  private static poemDatabaseContext: string | null = null;

  static async initialize(): Promise<void> {
    try {
      if (process.env.POETRY_TRAINING === "true") {
        this.poemDatabaseContext = await generatePoemDatabaseContext();
      }
    } catch (error) {
      this.poemDatabaseContext = null;
    }
  }

  static getPoemDatabaseContext(): string {
    return this.poemDatabaseContext || "";
  }

  static createAI(): IAIModel {
    return new DeepseekModel();
  }
}

export default AIFactory;
