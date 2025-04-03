# AI-Human-Teacher API Documentation

## Overview

This documentation provides details about the REST API endpoints available in the AI-Human-Teacher application. The application is built using Express.js and offers various features including authentication, Chinese poem management, chat interactions with AI, text-to-speech capabilities, and vocabulary management.

## Base URL

```
http://localhost:5000/api/v1
```

## Authentication

### Register a new user

```
POST /auth/register
```

**Request Body:**

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com"
    },
    "token": "jwt_token"
  }
}
```

### Login

```
POST /auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com"
    },
    "token": "jwt_token"
  }
}
```

## User Management

### Get User Profile

```
GET /users/me
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Response:**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com"
    }
  }
}
```

### Update User Profile

```
PUT /users/:id
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Request Body:**

```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "Updated Name",
      "email": "updated@example.com"
    }
  }
}
```

## Poem Management

### Get All Poems

```
GET /poems
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Number of poems per page (default: 10)
- `dynasty`: Filter by dynasty
- `author`: Filter by author

**Response:**

```json
{
  "success": true,
  "message": "Poems retrieved successfully",
  "data": {
    "poems": [
      {
        "_id": "poem_id",
        "title": "静夜思",
        "author": "李白",
        "dynasty": "唐",
        "content": "床前明月光，疑是地上霜。举头望明月，低头思故乡。"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 53
    }
  }
}
```

### Get Poem by ID

```
GET /poems/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Poem retrieved successfully",
  "data": {
    "poem": {
      "_id": "poem_id",
      "title": "静夜思",
      "author": "李白",
      "dynasty": "唐",
      "content": "床前明月光，疑是地上霜。举头望明月，低头思故乡。"
    }
  }
}
```

### Create New Poem

```
POST /poems
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Request Body:**

```json
{
  "title": "新诗",
  "author": "作者",
  "dynasty": "朝代",
  "content": "诗歌内容"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Poem created successfully",
  "data": {
    "poem": {
      "_id": "new_poem_id",
      "title": "新诗",
      "author": "作者",
      "dynasty": "朝代",
      "content": "诗歌内容"
    }
  }
}
```

### Update Poem

```
PUT /poems/:id
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Request Body:**

```json
{
  "title": "更新后的诗歌",
  "content": "更新后的内容"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Poem updated successfully",
  "data": {
    "poem": {
      "_id": "poem_id",
      "title": "更新后的诗歌",
      "author": "李白",
      "dynasty": "唐",
      "content": "更新后的内容"
    }
  }
}
```

### Delete Poem

```
DELETE /poems/:id
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Response:**

```json
{
  "success": true,
  "message": "Poem deleted successfully"
}
```

## Chat Management

### Get User Chats

```
GET /chats
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Response:**

```json
{
  "success": true,
  "message": "Chats retrieved successfully",
  "data": {
    "chats": [
      {
        "_id": "chat_id",
        "title": "Chat about Chinese poetry",
        "userId": "user_id",
        "createdAt": "2023-04-15T12:00:00Z",
        "updatedAt": "2023-04-15T12:30:00Z"
      }
    ]
  }
}
```

### Get Chat by ID

```
GET /chats/:id
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Response:**

```json
{
  "success": true,
  "message": "Chat retrieved successfully",
  "data": {
    "chat": {
      "_id": "chat_id",
      "title": "Chat about Chinese poetry",
      "userId": "user_id",
      "createdAt": "2023-04-15T12:00:00Z",
      "updatedAt": "2023-04-15T12:30:00Z",
      "messages": [
        {
          "_id": "message_id",
          "chatId": "chat_id",
          "sender": "user",
          "message": {
            "content": "Tell me about Chinese poems.",
            "role": "user"
          },
          "createdAt": "2023-04-15T12:00:00Z"
        },
        {
          "_id": "message_id2",
          "chatId": "chat_id",
          "sender": "ai",
          "message": {
            "content": "Chinese poetry has a rich history...",
            "role": "assistant"
          },
          "createdAt": "2023-04-15T12:01:00Z"
        }
      ]
    }
  }
}
```

### Create New Chat

```
POST /chats
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Request Body:**

```json
{
  "title": "New Chat Topic"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Chat created successfully",
  "data": {
    "chat": {
      "_id": "new_chat_id",
      "title": "New Chat Topic",
      "userId": "user_id",
      "createdAt": "2023-04-15T13:00:00Z",
      "updatedAt": "2023-04-15T13:00:00Z"
    }
  }
}
```

### Update Chat

```
PUT /chats/:id
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Request Body:**

```json
{
  "title": "Updated Chat Title"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Chat updated successfully",
  "data": {
    "chat": {
      "_id": "chat_id",
      "title": "Updated Chat Title",
      "userId": "user_id",
      "createdAt": "2023-04-15T12:00:00Z",
      "updatedAt": "2023-04-15T14:00:00Z"
    }
  }
}
```

### Delete Chat

```
DELETE /chats/:id
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Response:**

```json
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

## Messages

### Get Messages for a Chat

```
GET /messages/chat/:chatId
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Response:**

```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": {
    "messages": [
      {
        "_id": "message_id",
        "chatId": "chat_id",
        "sender": "user",
        "message": {
          "content": "Tell me about Chinese poems.",
          "role": "user"
        },
        "createdAt": "2023-04-15T12:00:00Z"
      },
      {
        "_id": "message_id2",
        "chatId": "chat_id",
        "sender": "ai",
        "message": {
          "content": "Chinese poetry has a rich history...",
          "role": "assistant"
        },
        "createdAt": "2023-04-15T12:01:00Z"
      }
    ]
  }
}
```

### Create New Message

```
POST /messages
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Request Body:**

```json
{
  "chatId": "chat_id",
  "sender": "user",
  "message": {
    "content": "How do I analyze a Tang dynasty poem?",
    "role": "user"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Message created successfully",
  "data": {
    "message": {
      "_id": "new_message_id",
      "chatId": "chat_id",
      "sender": "user",
      "message": {
        "content": "How do I analyze a Tang dynasty poem?",
        "role": "user"
      },
      "createdAt": "2023-04-15T15:00:00Z"
    }
  }
}
```

## Vocabulary Management

### Get User's Vocabulary

```
GET /vocabulary
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Response:**

```json
{
  "success": true,
  "message": "Vocabulary retrieved successfully",
  "data": {
    "vocabulary": [
      {
        "_id": "vocab_id",
        "word": "明月",
        "pinyin": "míng yuè",
        "meaning": "bright moon",
        "example": "床前明月光",
        "userId": "user_id",
        "createdAt": "2023-04-15T12:00:00Z"
      }
    ]
  }
}
```

### Add New Vocabulary

```
POST /vocabulary
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Request Body:**

```json
{
  "word": "故乡",
  "pinyin": "gù xiāng",
  "meaning": "hometown",
  "example": "低头思故乡"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Vocabulary added successfully",
  "data": {
    "vocabulary": {
      "_id": "new_vocab_id",
      "word": "故乡",
      "pinyin": "gù xiāng",
      "meaning": "hometown",
      "example": "低头思故乡",
      "userId": "user_id",
      "createdAt": "2023-04-15T16:00:00Z"
    }
  }
}
```

### Update Vocabulary

```
PUT /vocabulary/:id
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Request Body:**

```json
{
  "meaning": "homeland; native place",
  "example": "低头思故乡。"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Vocabulary updated successfully",
  "data": {
    "vocabulary": {
      "_id": "vocab_id",
      "word": "故乡",
      "pinyin": "gù xiāng",
      "meaning": "homeland; native place",
      "example": "低头思故乡。",
      "userId": "user_id",
      "createdAt": "2023-04-15T16:00:00Z",
      "updatedAt": "2023-04-15T17:00:00Z"
    }
  }
}
```

### Delete Vocabulary

```
DELETE /vocabulary/:id
```

**Headers:**

```
Authorization: Bearer jwt_token
```

**Response:**

```json
{
  "success": true,
  "message": "Vocabulary deleted successfully"
}
```

## AI Features

### Process Chat Message

```
POST /ai/chat/process-message
```

**Request Body Format (Two supported formats):**

Format 1 (Original):

```json
{
  "message": {
    "chatId": "chat_id",
    "message": {
      "content": "Tell me about the Tang dynasty poets",
      "role": "user"
    }
  },
  "modelName": "gpt-3.5-turbo",
  "options": {
    "sendAudioData": true,
    "voiceId": "zh-CN-XiaoxiaoNeural"
  }
}
```

Format 2 (Full message object with content):

```json
{
  "message": {
    "chatId": "67ee6238572cd5b944430c20",
    "userId": "641e23bc79b28a2f9c8d4567",
    "user": {
      "senderId": "641e23bc79b28a2f9c8d4567",
      "senderType": "user"
    },
    "message": {
      "content": "我想学静夜思这首诗",
      "contentType": "text"
    },
    "isAIResponse": false,
    "isDeleted": false
  },
  "modelName": "deepseek/deepseek-r1:free",
  "options": {
    "temperature": 0.7,
    "maxTokens": 4000
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "AI response generated successfully",
  "data": {
    "_id": "response_id",
    "chatId": "chat_id",
    "userId": "user_id",
    "user": {
      "senderId": "ai-system",
      "senderType": "assistant"
    },
    "message": {
      "content": "好的，下面是《静夜思》这首诗的详细介绍：...",
      "contentType": "text"
    },
    "isAIResponse": true,
    "isDeleted": false,
    "audio": {
      "url": "/api/v1/ai/chat/stream-audio/response_id",
      "voiceId": "zh-CN-XiaoxiaoNeural",
      "fileSize": 102400,
      "contentType": "audio/wav"
    }
  }
}
```

### Stream Chat Message

```
POST /ai/chat/stream-message
```

**Request Body:**

```json
{
  "message": {
    "chatId": "chat_id",
    "message": {
      "content": "Tell me about the Tang dynasty poets",
      "role": "user"
    }
  },
  "modelName": "gpt-3.5-turbo",
  "options": {
    "voiceId": "zh-CN-XiaoxiaoNeural"
  }
}
```

**Response:**
This endpoint returns a server-sent events (SSE) stream with chunks of the response as they are generated:

```
data: {"isStreaming":true,"message":{"content":"The "}}

data: {"isStreaming":true,"message":{"content":"Tang "}}

data: {"isStreaming":true,"message":{"content":"dynasty "}}

data: {"isStreaming":false,"_id":"response_id","chatId":"chat_id","sender":"ai","message":{"content":"The Tang dynasty (618-907 CE) is considered the golden age of Chinese poetry...","role":"assistant"},"audio":{"url":"/api/v1/ai/chat/stream-audio/response_id"}}
```

### Stream Audio

```
GET /ai/chat/stream-audio/:messageId
```

**Response:**
Returns the audio file as a stream with appropriate content type headers.

### Get TTS Voices

```
GET /ai/chat/tts-voices
```

**Response:**

```json
{
  "success": true,
  "message": "TTS voices retrieved successfully",
  "data": {
    "voices": [
      {
        "id": "zh-CN-XiaoxiaoNeural",
        "name": "Xiaoxiao (Female)",
        "locale": "zh-CN",
        "gender": "Female"
      },
      {
        "id": "zh-CN-YunxiNeural",
        "name": "Yunxi (Male)",
        "locale": "zh-CN",
        "gender": "Male"
      }
    ]
  }
}
```

### Poem Narration

```
POST /ai/poem-narration/generate
```

**Request Body:**

```json
{
  "poemId": "poem_id",
  "voiceId": "zh-CN-XiaoxiaoNeural"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Poem narration generated successfully",
  "data": {
    "narration": {
      "poemId": "poem_id",
      "audio": {
        "url": "/api/v1/ai/poem-narration/stream/poem_id",
        "voiceId": "zh-CN-XiaoxiaoNeural"
      }
    }
  }
}
```

### Get Poem Insights

```
POST /ai/poem-insights/analyze
```

**Request Body:**

```json
{
  "poemId": "poem_id"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Poem analysis generated successfully",
  "data": {
    "insights": {
      "poemId": "poem_id",
      "title": "静夜思",
      "analysis": "This famous poem by Li Bai expresses feelings of homesickness...",
      "themes": ["homesickness", "night", "contemplation"],
      "techniques": ["imagery", "simple language", "emotional resonance"],
      "vocabulary": [
        {
          "word": "明月",
          "pinyin": "míng yuè",
          "meaning": "bright moon"
        },
        {
          "word": "故乡",
          "pinyin": "gù xiāng",
          "meaning": "hometown"
        }
      ]
    }
  }
}
```

### Voice Recognition

```
POST /ai/voice/recognize
```

**Request Body:**
Multipart form data with an audio file.

**Response:**

```json
{
  "success": true,
  "message": "Speech recognized successfully",
  "data": {
    "text": "床前明月光，疑是地上霜。",
    "confidence": 0.92
  }
}
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "statusCode": 400,
    "message": "Detailed error message"
  }
}
```

Common HTTP status codes:

- 200: Success
- 400: Bad Request (Invalid input)
- 401: Unauthorized (Missing or invalid authentication)
- 403: Forbidden (Not authorized to access resource)
- 404: Not Found (Resource doesn't exist)
- 500: Internal Server Error (Server-side issue)

## Rate Limiting

The API implements rate limiting to prevent abuse. Limits may vary by endpoint, but general guidelines are:

- 60 requests per minute for authenticated users
- 30 requests per minute for unauthenticated users

When rate limits are exceeded, the API returns:

```json
{
  "success": false,
  "message": "Too many requests",
  "error": {
    "statusCode": 429,
    "message": "Rate limit exceeded. Please try again in X seconds."
  }
}
```

## Implementation Notes

- The server is implemented using Express.js in TypeScript
- Authentication uses JWT tokens
- MongoDB is used as the database
- AI features are implemented using OpenAI, Qwen, and DeepSeek models
- Text-to-speech uses the Edge TTS service
- All dates and times are in ISO 8601 format (UTC)
