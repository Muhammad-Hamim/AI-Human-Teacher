const fetch = require('node-fetch');

async function testTTS() {
  try {
    const response = await fetch('http://localhost:5000/api/v1/ai/tts/test-tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: '你好，这是一个测试。使用中文语音和慢速语速。',
        voiceId: 'zh-CN-XiaoxiaoNeural'
      })
    });
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing TTS API:', error);
  }
}

testTTS(); 