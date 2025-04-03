@echo off
echo Testing Text-to-Speech functionality...
echo.

echo 1. Testing direct edge-tts command (plain text):
python -m edge_tts --text "This is a test of edge-tts installation" --voice "en-US-JennyNeural" --write-media test-direct.wav
if %errorlevel% neq 0 (
  echo Direct edge-tts test failed. Please check your Python installation and ensure edge-tts is installed correctly.
  echo Try running: pip install edge-tts
  echo.
) else (
  echo Direct edge-tts test successful! Created test-direct.wav
  echo.
)

echo 2. Testing the TTS API endpoint:
curl -X POST http://localhost:3000/api/v1/ai/tts/test-tts ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"Hello! I am testing the markdown to text conversion. How does it sound?\", \"voiceId\": \"en-US-JennyNeural\"}"

echo.
echo 3. Testing the streaming message endpoint:
curl -X POST http://localhost:3000/api/v1/ai/chat/stream-message ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": {\"chatId\": \"test123\", \"message\": {\"content\": \"Tell me a short joke\", \"contentType\": \"text\"}, \"user\": {\"senderId\": \"test-user\", \"senderType\": \"user\"}, \"userId\": \"test-user\"}, \"modelName\": \"deepseek-r1\", \"options\": {\"voiceId\": \"en-US-JennyNeural\"}}"

echo.
echo Test completed. 