/* eslint-disable no-console */
import OpenAI from "openai";
import {
  IAIService,
  TAIModelConfig,
  TAIRequestOptions,
  TAIResponseFormat,
  TAIStreamCallbacks,
} from "./ai.interface";

export class OpenAIService implements IAIService {
  private client: OpenAI;
  private modelName: string;
  private defaultConfig: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };

  constructor(config: TAIModelConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.modelName = config.modelName;
    this.defaultConfig = {
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      topP: config.topP || 1,
    };
  }

  async generateResponse(
    options: TAIRequestOptions
  ): Promise<TAIResponseFormat> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: options.messages,
        temperature: options.temperature || this.defaultConfig.temperature,
        max_tokens: options.maxTokens || this.defaultConfig.maxTokens,
        top_p: options.topP || this.defaultConfig.topP,
      });

      return {
        content: response.choices[0]?.message?.content || "",
        model: this.modelName,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw new Error(`OpenAI API Error: ${(error as Error).message}`);
    }
  }

  async generateStreamingResponse(
    options: TAIRequestOptions,
    callbacks: TAIStreamCallbacks
  ): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.modelName,
        messages: options.messages,
        temperature: options.temperature || this.defaultConfig.temperature,
        max_tokens: options.maxTokens || this.defaultConfig.maxTokens,
        top_p: options.topP || this.defaultConfig.topP,
        stream: true,
      });

      let fullContent = "";
      const usage = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullContent += content;
          callbacks.onContent(content);
        }
      }

      callbacks.onComplete({
        content: fullContent,
        model: this.modelName,
        usage,
      });
    } catch (error) {
      console.error("OpenAI Streaming Error:", error);
      callbacks.onError(error as Error);
    }
  }
}
