/* eslint-disable no-console */
import axios from "axios";
import {
  IAIService,
  TAIModelConfig,
  TAIRequestOptions,
  TAIResponseFormat,
  TAIStreamCallbacks,
} from "./ai.interface";

export class DeepSeekService implements IAIService {
  private apiKey: string;
  private baseURL: string;
  private modelName: string;
  private defaultConfig: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };

  constructor(config: TAIModelConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || "https://api.deepseek.com/v1";
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
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.modelName,
          messages: options.messages,
          temperature: options.temperature || this.defaultConfig.temperature,
          max_tokens: options.maxTokens || this.defaultConfig.maxTokens,
          top_p: options.topP || this.defaultConfig.topP,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const data = response.data;
      return {
        content: data.choices[0]?.message?.content || "",
        model: this.modelName,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error("DeepSeek API Error:", error);
      throw new Error(`DeepSeek API Error: ${(error as Error).message}`);
    }
  }

  async generateStreamingResponse(
    options: TAIRequestOptions,
    callbacks: TAIStreamCallbacks
  ): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.modelName,
          messages: options.messages,
          temperature: options.temperature || this.defaultConfig.temperature,
          max_tokens: options.maxTokens || this.defaultConfig.maxTokens,
          top_p: options.topP || this.defaultConfig.topP,
          stream: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          responseType: "stream",
        }
      );

      let fullContent = "";
      const usage = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };

      response.data.on("data", (chunk: Buffer) => {
        const lines = chunk
          .toString()
          .split("\n")
          .filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.substring(6);
            if (data === "[DONE]") {
              return;
            }

            try {
              const parsedData = JSON.parse(data);
              const content = parsedData.choices[0]?.delta?.content || "";
              if (content) {
                fullContent += content;
                callbacks.onContent(content);
              }
            } catch (e) {
              console.error("Error parsing stream data:", e);
            }
          }
        }
      });

      response.data.on("end", () => {
        callbacks.onComplete({
          content: fullContent,
          model: this.modelName,
          usage,
        });
      });

      response.data.on("error", (error: Error) => {
        callbacks.onError(error);
      });
    } catch (error) {
      console.error("DeepSeek Streaming Error:", error);
      callbacks.onError(error as Error);
    }
  }
}
