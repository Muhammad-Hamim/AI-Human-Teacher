@echo off
echo Testing Qwen2 model integration...
echo.

echo 1. Testing with text request:
curl -X POST http://localhost:3000/api/v1/ai/chat/process-message ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": {\"chatId\": \"test123\", \"message\": {\"content\": \"Tell me about the Qwen2 model\", \"contentType\": \"text\"}, \"user\": {\"senderId\": \"test-user\", \"senderType\": \"user\"}, \"userId\": \"test-user\"}, \"modelName\": \"qwen/qwen2.5-vl-72b-instruct:free\", \"options\": {\"voiceId\": \"en-US-JennyNeural\"}}"

echo.
echo 2. Testing with streaming request:
curl -X POST http://localhost:3000/api/v1/ai/chat/stream-message ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": {\"chatId\": \"test123\", \"message\": {\"content\": \"Tell me a short joke using the Qwen2 model\", \"contentType\": \"text\"}, \"user\": {\"senderId\": \"test-user\", \"senderType\": \"user\"}, \"userId\": \"test-user\"}, \"modelName\": \"qwen/qwen2.5-vl-72b-instruct:free\", \"options\": {\"voiceId\": \"en-US-JennyNeural\"}}"

echo.
echo Test completed. 