import { TAIModelConfig } from "./ai.interface";
import config from "../config";

// Default configurations for different models
export const AI_MODELS: Record<string, TAIModelConfig> = {
  // OpenAI models
  "gpt-3.5-turbo": {
    modelName: "gpt-3.5-turbo",
    apiKey: config.ai_api_key || "",
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1,
  },
  "gpt-4": {
    modelName: "gpt-4",
    apiKey: config.ai_api_key || "",
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1,
  },
  "gpt-4-turbo": {
    modelName: "gpt-4-turbo-preview",
    apiKey: config.ai_api_key || "",
    temperature: 0.7,
    maxTokens: 4000,
    topP: 1,
  },

  // DeepSeek models
  "deepseek-r1": {
    modelName: "deepseek/deepseek-r1:free",
    apiKey: config.ai_api_key || "",
    baseURL: config.ai_base_url || "",
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1,
  },
};

// Map model names to their service types
export const MODEL_SERVICE_MAP: Record<string, "openai" | "deepseek"> = {
  "gpt-3.5-turbo": "openai",
  "gpt-4": "openai",
  "gpt-4-turbo-preview": "openai",
  "deepseek-chat": "deepseek",
  "deepseek/deepseek-r1:free": "deepseek",
};

// Default model to use if none specified
export const DEFAULT_MODEL = "deepseek-r1";
