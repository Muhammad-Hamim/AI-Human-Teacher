import { AI_MODELS, DEFAULT_MODEL, MODEL_SERVICE_MAP } from "./ai.config";
import { AIServiceFactory } from "./ai.factory";
import {
  IAIService,
  TAIMessage,
  TAIRequestOptions,
  TAIResponseFormat,
  TAIStreamCallbacks,
} from "./ai.interface";

class AIService {
  private getServiceForModel(modelName: string): IAIService {
    const model = AI_MODELS[modelName] || AI_MODELS[DEFAULT_MODEL];
    const serviceType = MODEL_SERVICE_MAP[model.modelName];

    return AIServiceFactory.createService(serviceType, model);
  }

  async generateResponse(
    messages: TAIMessage[],
    modelName: string = DEFAULT_MODEL,
    options: Partial<TAIRequestOptions> = {}
  ): Promise<TAIResponseFormat> {
    const service = this.getServiceForModel(modelName);

    return service.generateResponse({
      messages,
      ...options,
    });
  }

  async generateStreamingResponse(
    messages: TAIMessage[],
    callbacks: TAIStreamCallbacks,
    modelName: string = DEFAULT_MODEL,
    options: Partial<TAIRequestOptions> = {}
  ): Promise<void> {
    const service = this.getServiceForModel(modelName);

    return service.generateStreamingResponse(
      {
        messages,
        ...options,
        stream: true,
      },
      callbacks
    );
  }
}

export const aiService = new AIService();
export * from "./ai.interface";
export * from "./ai.config";
