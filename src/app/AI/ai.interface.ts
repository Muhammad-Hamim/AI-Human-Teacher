
export type TAIModelConfig = {
  modelName: string;
  apiKey: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
};

export type TAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type TAIRequestOptions = {
  messages: TAIMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
};

export type TAIResponseFormat = {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

export type TAIStreamCallbacks = {
  onContent: (content: string) => void;
  onComplete: (response: TAIResponseFormat) => void;
  onError: (error: Error) => void;
};

export interface IAIService {
  generateResponse(options: TAIRequestOptions): Promise<TAIResponseFormat>;
  generateStreamingResponse(
    options: TAIRequestOptions,
    callbacks: TAIStreamCallbacks
  ): Promise<void>;
}
