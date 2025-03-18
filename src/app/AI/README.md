# AI Services

This module provides a scalable and maintainable way to integrate multiple AI models into the application.

## Supported Models

- **OpenAI Models**:

  - gpt-3.5-turbo
  - gpt-4
  - gpt-4-turbo-preview

- **DeepSeek Models**:
  - deepseek-r1 (deepseek-chat)

## Configuration

1. Copy the `.env.example` file to `.env` in the root of your project
2. Add your API keys for the services you want to use

```
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# DeepSeek API Key and URL
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

## Usage

### Basic Usage

```typescript
import { aiService } from "../services/ai";

// Generate a response
const response = await aiService.generateResponse(
  [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, how are you?" },
  ],
  "gpt-3.5-turbo" // Optional, defaults to gpt-3.5-turbo
);

console.log(response.content);
```

### Streaming Responses

```typescript
import { aiService } from "../services/ai";

// Generate a streaming response
await aiService.generateStreamingResponse(
  [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, how are you?" },
  ],
  {
    onContent: (content) => {
      console.log("Received content:", content);
    },
    onComplete: (response) => {
      console.log("Complete response:", response);
    },
    onError: (error) => {
      console.error("Error:", error);
    },
  },
  "deepseek-r1" // Use DeepSeek model
);
```

### Using DeepSeek R1 Model

```typescript
import { aiService } from "../services/ai";

// Generate a response using DeepSeek R1
const response = await aiService.generateResponse(
  [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, how are you?" },
  ],
  "deepseek-r1"
);

console.log(response.content);
```

## Adding New Models

To add a new model provider:

1. Create a new service class that implements the `IAIService` interface
2. Add the model to the `AI_MODELS` and `MODEL_SERVICE_MAP` in `ai.config.ts`
3. Update the `AIServiceFactory` to handle the new service type

## API Endpoints

The following API endpoints are available:

- `POST /api/ai/generate`: Generate a response from the AI
- `POST /api/ai/generate-stream`: Generate a streaming response from the AI
- `POST /api/ai/process-message`: Process a message and get AI response

All endpoints require authentication.
