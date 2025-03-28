const fetch = require('node-fetch');

// Sample Chinese poem - 静夜思 by Li Bai
const poem = `静夜思
床前明月光，
疑是地上霜。
举头望明月，
低头思故乡。`;

async function testPoemRecitation() {
  try {
    console.log('Testing poem recitation with SSML formatting:');
    console.log('Poem text:');
    console.log(poem);
    console.log('\nSending to TTS API...');

    const response = await fetch('http://localhost:5000/api/v1/ai/tts/test-tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: poem,
        voiceId: 'zh-CN-XiaoxiaoNeural'
      })
    });
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    console.log('\nA WAV file should have been generated in the dist directory.');
    console.log('Check that the recitation has appropriate pauses and rhythm for a poem.');
  } catch (error) {
    console.error('Error testing poem TTS API:', error);
  }
}

testPoemRecitation(); 