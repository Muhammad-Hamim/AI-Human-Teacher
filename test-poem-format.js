const fetch = require('node-fetch');

// Sample Chinese poem - 静夜思 by Li Bai
const poem = `静夜思
床前明月光，
疑是地上霜。
举头望明月，
低头思故乡。`;

console.log('='.repeat(40));
console.log('TESTING CHINESE POEM FORMATTING');
console.log('='.repeat(40));
console.log('Original poem:');
console.log(poem);

// Split into lines
const lines = poem.split('\n').filter(line => line.trim() !== '');

// Detect poem features
const hasLineBreaks = poem.includes('\n');
const hasChinesePunctuation = poem.includes('，') || poem.includes('。') || poem.includes('、');
const hasShortLines = poem.split('\n').some(line => line.trim().length > 0 && line.trim().length <= 15);
const hasChineseCharacters = /[\u4e00-\u9fa5]/.test(poem);
const hasBalancedLineLength = (() => {
  const lines = poem.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return false;
  
  // Check if lines have similar length (typical for many Chinese poems)
  const lengths = lines.map(l => l.length);
  const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const allSimilar = lengths.every(len => Math.abs(len - avgLength) <= 3);
  return allSimilar;
})();

console.log('\nPoem features:');
console.log('- Has line breaks:', hasLineBreaks);
console.log('- Has Chinese punctuation:', hasChinesePunctuation);
console.log('- Has short lines:', hasShortLines);
console.log('- Has Chinese characters:', hasChineseCharacters);
console.log('- Has balanced line length:', hasBalancedLineLength);

// Format the poem with appropriate pauses
console.log('\nFormatting poem with pauses:');
let formattedPoem = '';

// Process each line with appropriate pauses
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // First line might be title
  if (i === 0 && line.length < 15 && !line.includes('，') && lines.length > 1) {
    // Likely a title - add stronger pause after it
    formattedPoem += line + '。';
    console.log(`[Title] "${line}" -> "${line}。"`);
  } else {
    // Regular line - ensure it ends with punctuation for proper pacing
    let formattedLine = line;
    if (!line.match(/[，。？！、]/)) {
      formattedLine += '。';
    }
    formattedPoem += formattedLine;
    console.log(`[Line ${i+1}] "${line}" -> "${formattedLine}"`);
  }
  
  // Add a pause between lines if not the last line
  if (i < lines.length - 1) {
    formattedPoem += '。';
    console.log(`[Added pause after line ${i+1}]`);
  }
}

console.log('\nFinal formatted poem:');
console.log(formattedPoem);
console.log('\nNow sending to TTS API...');

async function testPoemTTS() {
  try {
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

testPoemTTS(); 