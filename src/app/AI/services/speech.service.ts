import { spawn } from "child_process";
import path from "path";
import fs from "fs-extra";
import { promisify } from "util";
import { exec } from "child_process";

// Interface for TTS voice
interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: string;
}

// Interface for speak options
interface SpeakOptions {
  text: string;
  voiceId: string;
  outputFileName: string;
  baseUrl?: string;
  rate?: string;
}

// Initialize variables
let serverBaseUrl = "";
let availableVoices: TTSVoice[] = [];

// Default Chinese voice
const DEFAULT_VOICE_ID = "zh-CN-XiaoxiaoNeural";//"zh-CN-XiaoyanNeural" if need to change to english use "en-US-JennyNeural"
const DEFAULT_RATE = "-20%"; // Slower rate for better understanding

/**
 * Convert markdown text to SSML for better human-like expressions
 * @param text Input markdown text
 * @returns SSML formatted text
 */
const convertToSSML = (text: string): string => {
  // Escape special XML characters first
  text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  // Make a simple SSML document
  let ssml =
    '<?xml version="1.0"?><speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">';

  // Add the text content with enhanced prosody for poems
  ssml += text + "</speak>";
  return ssml;
};

/**
 * Format text as poem with SSML tags for better recitation
 * @param text Input poem text
 * @returns SSML formatted poem
 */
const formatPoemSSML = (text: string): string => {
  // Escape special XML characters first
  text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  // Detect if this is likely a Chinese poem (contains line breaks and typical poem patterns)
  const isPoemLikely = text.includes("\n") && 
    (text.includes("，") || text.includes("。") || text.includes("、"));

  if (!isPoemLikely) {
    return convertToSSML(text);
  }

  // Split into lines
  const lines = text.split("\n").filter(line => line.trim() !== "");

  // Create SSML document
  let ssml = '<?xml version="1.0"?><speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">';
  
  // Add title with emphasis if it exists (likely the first line)
  if (lines.length > 0 && lines[0].length < 20 && !lines[0].includes("，")) {
    ssml += `<prosody rate="slow" pitch="high"><emphasis level="strong">${lines[0]}</emphasis></prosody>`;
    ssml += '<break strength="strong"/>';
    lines.shift(); // Remove the title line
  }
  
  // Process each line of the poem with appropriate pauses and prosody
  for (const line of lines) {
    // Add pause after punctuation
    const enhancedLine = line
      .replace(/([，。！？、])/g, '$1<break strength="medium"/>');
    
    // Add the line with adjusted prosody for poetic rhythm
    ssml += `<prosody rate="slow" pitch="medium">${enhancedLine}</prosody>`;
    ssml += '<break strength="strong"/>';
  }
  
  ssml += "</speak>";
  return ssml;
};

/**
 * Load available TTS voices
 */
const loadVoices = async (): Promise<TTSVoice[]> => {
  try {
    // If we already have voices loaded, return them
    if (availableVoices.length > 0) {
      return availableVoices;
    }

    // Use edge-tts to get available voices
    const execPromise = promisify(exec);
    // Use direct Python command instead of npx
    const { stdout } = await execPromise("python -m edge_tts --list-voices");

    // Parse the output to get voices
    const voices: TTSVoice[] = [];
    const lines = stdout.split("\n").filter((line) => line.trim() !== "");

    for (const line of lines) {
      // Parse voice data
      const parts = line.split("\t").map((part) => part.trim());
      if (parts.length >= 3) {
        const [name, locale, gender] = parts;
        voices.push({
          id: name,
          name: `${name.replace("Neural", "")} (${gender})`,
          language: locale,
          gender: gender,
        });
      }
    }

    // Store the voices
    availableVoices = voices;
    console.log(`Loaded ${voices.length} TTS voices`);
    return voices;
  } catch (error) {
    console.error("Error loading TTS voices:", error);
    // Return some default voices if there's an error
    return [
      {
        id: "en-US-JennyNeural",
        name: "Jenny (Female)",
        language: "en-US",
        gender: "Female",
      },
      {
        id: "en-US-GuyNeural",
        name: "Guy (Male)",
        language: "en-US",
        gender: "Male",
      },
    ];
  }
};

/**
 * Get available TTS voices
 */
const getVoices = async (): Promise<TTSVoice[]> => {
  return availableVoices.length > 0 ? availableVoices : await loadVoices();
};

/**
 * Set server base URL for audio file references
 * @param url Server base URL
 */
const setServerBaseUrl = (url: string): void => {
  serverBaseUrl = url;
  console.log(`Server base URL set to: ${serverBaseUrl}`);
};

/**
 * Get server base URL
 * @returns Server base URL
 */
const getServerBaseUrl = (): string => {
  return serverBaseUrl;
};

/**
 * Generate speech audio from text using Edge TTS
 * @param options Speak options
 * @returns Object containing the audio path and audio data
 */
const speak = async (
  options: SpeakOptions
): Promise<{ audioUrl: string; audioData: string | null }> => {
  const { text, voiceId = DEFAULT_VOICE_ID, outputFileName, rate = DEFAULT_RATE } = options;

  // Create output path
  const outputDir = path.join(process.cwd(), "dist");
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, outputFileName);

  // Strip markdown formatting to get plain text
  let plainText = text
    .replace(/#+\s+(.*)/g, "$1") // Headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
    .replace(/\*(.*?)\*/g, "$1") // Italic
    .replace(/`{3}[\s\S]*?`{3}/g, "") // Code blocks
    .replace(/`(.*?)`/g, "$1") // Inline code
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1"); // Links
  
  // Check for poem patterns in the text
  const hasLineBreaks = plainText.includes("\n");
  const hasChinesePunctuation = plainText.includes("，") || plainText.includes("。") || plainText.includes("、");
  const hasShortLines = plainText.split("\n").some(line => line.trim().length > 0 && line.trim().length <= 15);
  const hasChineseCharacters = /[\u4e00-\u9fa5]/.test(plainText);
  const hasBalancedLineLength = (() => {
    const lines = plainText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return false;
    
    // Check if lines have similar length (typical for many Chinese poems)
    const lengths = lines.map(l => l.length);
    const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    const allSimilar = lengths.every(len => Math.abs(len - avgLength) <= 3);
    return allSimilar;
  })();
  
  // Combine these signals to determine if this is likely a poem
  const isPoem = hasChineseCharacters && hasLineBreaks && 
    (hasChinesePunctuation || hasShortLines || hasBalancedLineLength);
  
  if (isPoem) {
    console.log("📜 Detected Chinese poem format:");
    console.log("- Has line breaks:", hasLineBreaks);
    console.log("- Has Chinese punctuation:", hasChinesePunctuation);
    console.log("- Has short lines:", hasShortLines);
    console.log("- Has balanced line length:", hasBalancedLineLength);
    console.log("- Sample of poem:", plainText.slice(0, 50) + (plainText.length > 50 ? "..." : ""));
  }

  // Generate the audio file
  return new Promise((resolve, reject) => {
    try {
      // Format the rate parameter correctly
      const rateArg = `--rate=${rate}`;

      let ttsProcess;
      
      // If this is a poem, we'll apply special formatting to improve recitation
      if (isPoem) {
        console.log("📝 Applying special poem formatting");
        
        // Format the poem with appropriate pauses
        // Add pauses between lines and at punctuation
        const lines = plainText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
        let formattedPoem = "";
        
        // Process each line with appropriate pauses
        for (let i = 0; i < lines.length; i++) {
          let line = lines[i];
          
          // First line might be title
          if (i === 0 && line.length < 15 && !line.includes("，") && lines.length > 1) {
            // Likely a title - add stronger pause after it
            formattedPoem += line + "。";
          } else {
            // Regular line - ensure it ends with punctuation for proper pacing
            if (!line.match(/[，。？！、]/)) {
              line += "。";
            }
            formattedPoem += line;
          }
          
          // Add a pause between lines if not the last line
          if (i < lines.length - 1) {
            formattedPoem += "。";
          }
        }
        
        console.log("🎙️ Formatted poem for TTS:", formattedPoem);
        
        // Use Python edge-tts with formatted poem text
        ttsProcess = spawn("python", [
          "-m",
          "edge_tts",
          "--voice",
          voiceId,
          "--text",
          formattedPoem,
          "--write-media",
          outputPath,
          rateArg
        ]);
      } else {
        // For regular text, just use normal TTS
        console.log("🔤 Processing regular text (not a poem)");
        ttsProcess = spawn("python", [
          "-m",
          "edge_tts",
          "--voice",
          voiceId,
          "--text",
          plainText,
          "--write-media",
          outputPath,
          rateArg
        ]);
      }

      ttsProcess.stdout.on("data", (data) => {
        console.log(`TTS stdout: ${data}`);
      });

      ttsProcess.stderr.on("data", (data) => {
        console.error(`TTS stderr: ${data}`);
      });

      ttsProcess.on("close", async (code) => {
        if (code === 0) {
          // Format the path for the client
          const audioUrl = `/dist/${outputFileName}`;
          console.log(`✅ TTS generation successful: ${audioUrl}`);

          // Read the audio file as base64
          let audioData = null;
          try {
            const fileBuffer = await fs.readFile(outputPath);
            audioData = fileBuffer.toString("base64");
          } catch (error) {
            console.error("Error reading audio file:", error);
          }

          resolve({ audioUrl, audioData });
        } else {
          console.error(`❌ TTS generation failed with exit code ${code}`);
          reject(new Error(`TTS process exited with code ${code}`));
        }
      });
    } catch (error) {
      console.error("Error generating speech:", error);
      reject(error);
    }
  });
};

/**
 * Get the size of an audio file
 * @param audioPath Path to the audio file
 * @returns File size in bytes
 */
const getAudioFileSize = async (audioPath: string): Promise<number> => {
  try {
    // Strip the leading slash from the URL path
    const localPath = audioPath.startsWith("/")
      ? path.join(process.cwd(), audioPath.substring(1))
      : path.join(process.cwd(), audioPath);

    // Make sure the file exists
    if (!(await fs.pathExists(localPath))) {
      console.error(`Audio file not found at path: ${localPath}`);
      return 0;
    }

    // Get file stats
    const stats = await fs.stat(localPath);
    return stats.size;
  } catch (error) {
    console.error("Error getting audio file size:", error);
    return 0;
  }
};

/**
 * Get audio file as base64 data
 * @param audioPath Path to the audio file
 * @returns Base64 encoded audio data
 */
const getAudioAsBase64 = async (audioPath: string): Promise<string | null> => {
  try {
    // Strip the leading slash from the URL path
    const localPath = audioPath.startsWith("/")
      ? path.join(process.cwd(), audioPath.substring(1))
      : path.join(process.cwd(), audioPath);

    // Make sure the file exists
    if (!(await fs.pathExists(localPath))) {
      console.error(`Audio file not found at path: ${localPath}`);
      return null;
    }

    // Read file and encode as base64
    const fileBuffer = await fs.readFile(localPath);
    return fileBuffer.toString("base64");
  } catch (error) {
    console.error("Error getting audio as base64:", error);
    return null;
  }
};

/**
 * Read audio file and return as Buffer
 * @param audioPath Path to the audio file
 * @returns Buffer containing the audio data
 */
const readAudioFile = async (audioPath: string): Promise<Buffer> => {
  try {
    // Strip the leading slash from the URL path
    const localPath = audioPath.startsWith("/")
      ? path.join(process.cwd(), audioPath.substring(1))
      : path.join(process.cwd(), audioPath);

    // Read file and return buffer
    return await fs.readFile(localPath);
  } catch (error) {
    console.error("Error reading audio file:", error);
    throw error;
  }
};

/**
 * Delete audio file
 * @param audioPath Path to the audio file
 */
const deleteAudioFile = async (audioPath: string): Promise<void> => {
  try {
    // Strip the leading slash from the URL path
    const localPath = audioPath.startsWith("/")
      ? path.join(process.cwd(), audioPath.substring(1))
      : path.join(process.cwd(), audioPath);

    // Delete the file
    await fs.remove(localPath);
  } catch (error) {
    console.error("Error deleting audio file:", error);
    throw error;
  }
};

const SpeechService = {
  loadVoices,
  getVoices,
  setServerBaseUrl,
  getServerBaseUrl,
  speak,
  getAudioFileSize,
  getAudioAsBase64,
  convertToSSML,
  formatPoemSSML,
  readAudioFile,
  deleteAudioFile,
};

export default SpeechService;
