@echo off
echo Testing Chinese Text-to-Speech functionality...
echo.

echo 1. Testing direct edge-tts command (Chinese text):
python -m edge_tts --voice zh-CN-XiaoxiaoNeural --text "你好，这是一个中文语音测试。声音怎么样？语速是否合适？" --write-media test-direct-chinese.wav
if %errorlevel% neq 0 (
  echo Direct edge-tts test failed. Please check your Python installation and ensure edge-tts is installed correctly.
  echo Try running: pip install edge-tts
  echo.
) else (
  echo Direct edge-tts test successful! Created test-direct-chinese.wav
  echo.
)

echo 2. Testing direct edge-tts with Chinese poem:
python -m edge_tts --voice zh-CN-XiaoxiaoNeural --text "静夜思。床前明月光。疑是地上霜。举头望明月。低头思故乡。" --write-media test-direct-poem.wav
if %errorlevel% neq 0 (
  echo Direct edge-tts poem test failed. Please check your Python installation and ensure edge-tts is installed correctly.
  echo.
) else (
  echo Direct edge-tts poem test successful! Created test-direct-poem.wav
  echo.
)

echo 3. Testing the TTS API endpoint with Chinese text:
curl -X POST http://localhost:5000/api/v1/ai/tts/test-tts ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"你好，这是通过API调用的中文语音测试。声音应该使用了较慢的语速，让语音更清晰。\"}"

echo.
echo 4. Testing the poem recitation via API (check server log output):
node test-poem-tts.js

echo.
echo Test completed. Check the generated audio files. 