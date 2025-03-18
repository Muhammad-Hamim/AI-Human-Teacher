import { IAIService, TAIModelConfig } from "./ai.interface";
import { OpenAIService } from "./openai.service";
import { DeepSeekService } from "./deepseek.service";

export type AIServiceType = "openai" | "deepseek";

export class AIServiceFactory {
  private static instances: Map<string, IAIService> = new Map();

  static createService(
    type: AIServiceType,
    config: TAIModelConfig
  ): IAIService {
    const key = `${type}-${config.modelName}`;

    if (!this.instances.has(key)) {
      let service: IAIService;

      switch (type) {
        case "openai":
          service = new OpenAIService(config);
          break;
        case "deepseek":
          service = new DeepSeekService(config);
          break;
        default:
          throw new Error(`Unsupported AI service type: ${type}`);
      }

      this.instances.set(key, service);
    }

    return this.instances.get(key)!;
  }

  static getService(
    type: AIServiceType,
    modelName: string
  ): IAIService | undefined {
    const key = `${type}-${modelName}`;
    return this.instances.get(key);
  }
}
