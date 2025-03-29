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
const DEFAULT_VOICE_ID = "zh-CN-XiaoxiaoNeural"; //"zh-CN-XiaoyanNeural" if need to change to english use "en-US-JennyNeural"
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
  const isPoemLikely =
    text.includes("\n") &&
    (text.includes("，") || text.includes("。") || text.includes("、"));

  if (!isPoemLikely) {
    return convertToSSML(text);
  }

  // Split into lines
  const lines = text.split("\n").filter((line) => line.trim() !== "");

  // Create SSML document
  let ssml =
    '<?xml version="1.0"?><speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">';

  // Add title with emphasis if it exists (likely the first line)
  if (lines.length > 0 && lines[0].length < 20 && !lines[0].includes("，")) {
    ssml += `<prosody rate="slow" pitch="high"><emphasis level="strong">${lines[0]}</emphasis></prosody>`;
    ssml += '<break strength="strong"/>';
    lines.shift(); // Remove the title line
  }

  // Process each line of the poem with appropriate pauses and prosody
  for (const line of lines) {
    // Add pause after punctuation
    const enhancedLine = line.replace(
      /([，。！？、])/g,
      '$1<break strength="medium"/>'
    );

    // Add the line with adjusted prosody for poetic rhythm
    ssml += `<prosody rate="slow" pitch="medium">${enhancedLine}</prosody>`;
    ssml += '<break strength="strong"/>';
  }

  ssml += "</speak>";
  return ssml;
};

/**
 * Format text as storytelling narration with SSML tags for better expression
 * @param text Input storytelling narration text
 * @returns SSML formatted storytelling narration
 */
const formatStorytellingSSML = (text: string): string => {
  // Escape special XML characters first
  text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  // Split into paragraphs
  const paragraphs = text.split("\n").filter((para) => para.trim() !== "");

  // Create SSML document
  let ssml =
    '<?xml version="1.0"?><speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">';

  // Process each paragraph with appropriate pauses and prosody
  for (const paragraph of paragraphs) {
    // Check if this paragraph might be a poem verse (usually shorter and contains Chinese punctuation)
    const isPoemVerse =
      paragraph.length < 50 &&
      (paragraph.includes("，") ||
        paragraph.includes("。") ||
        paragraph.includes("、"));

    if (isPoemVerse) {
      // Add poem verse with special treatment
      const enhancedPara = paragraph.replace(
        /([，。！？、])/g,
        '$1<break strength="medium"/>'
      );

      ssml += `<prosody rate="slow" pitch="medium">${enhancedPara}</prosody>`;
      ssml += '<break strength="strong"/>';
    } else {
      // Regular narrative paragraph with sentence pauses
      const enhancedPara = paragraph.replace(
        /([。！？])/g,
        '$1<break strength="medium"/>'
      );

      // Add paragraph with storytelling prosody
      ssml += `<prosody rate="medium" pitch="medium">${enhancedPara}</prosody>`;
      ssml += '<break strength="medium"/>';
    }
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
 * Convert SSML to plain text by removing all XML tags
 * @param ssml SSML text
 * @returns Plain text without XML tags
 */
const ssmlToPlainText = (ssml: string): string => {
  // Remove XML declaration and root tag
  let plainText = ssml
    .replace(/<\?xml.*?\?>/, "")
    .replace(/<speak.*?>/, "")
    .replace(/<\/speak>/, "");

  // Remove other SSML tags but keep their content
  plainText = plainText.replace(/<[^>]*>/g, "");

  // Decode XML entities
  plainText = plainText
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  return plainText;
};

/**
 * Generate speech audio from text using Edge TTS
 * @param options Speak options
 * @returns Object containing the audio path and audio data
 */
const speak = async (
  options: SpeakOptions
): Promise<{ audioUrl: string; audioData: string | null }> => {
  const {
    text,
    voiceId = DEFAULT_VOICE_ID,
    outputFileName,
    rate = DEFAULT_RATE,
  } = options;

  // Create output path
  const outputDir = path.join(process.cwd(), "dist");
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, outputFileName);

  // Preprocess text to be safe for TTS
  // 1. Remove special characters that might cause issues
  // 2. Ensure reasonable length (max 1000 chars)
  // 3. Make sure text has proper sentence endings
  let plainText = text
    .replace(/#+\s+(.*)/g, "$1") // Headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
    .replace(/\*(.*?)\*/g, "$1") // Italic
    .replace(/`{3}[\s\S]*?`{3}/g, "") // Code blocks
    .replace(/`(.*?)`/g, "$1") // Inline code
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1"); // Links

  // Limit text length to maximum 1000 characters to avoid TTS issues
  if (plainText.length > 1000) {
    console.log(
      `Text too long (${plainText.length} chars), truncating to 1000 chars`
    );
    plainText = plainText.substring(0, 1000) + "...";
  }

  // Ensure text ends with proper punctuation
  if (!plainText.match(/[。？！.,?!]$/)) {
    plainText = plainText + "。";
  }

  // Check for poem patterns in the text
  const hasLineBreaks = plainText.includes("\n");
  const hasChinesePunctuation =
    plainText.includes("，") ||
    plainText.includes("。") ||
    plainText.includes("、");
  const hasShortLines = plainText
    .split("\n")
    .some((line) => line.trim().length > 0 && line.trim().length <= 15);
  const hasChineseCharacters = /[\u4e00-\u9fa5]/.test(plainText);

  // Simplify the detection logic to reduce potential issues
  const isPoem = hasChineseCharacters && hasLineBreaks && hasChinesePunctuation;
  const isNarrative = hasChineseCharacters && plainText.length > 200;

  let textToSpeak = plainText;
  // For longer texts, break into manageable chunks with punctuation
  if (textToSpeak.length > 300) {
    textToSpeak = textToSpeak.replace(/([。！？])/g, "$1\n");
  }

  // Generate the audio file
  return new Promise((resolve, reject) => {
    try {
      // Format the rate parameter correctly
      const rateArg = `--rate=${rate}`;

      // Use simple text-to-speech - don't use SSML or complex formatting
      console.log(
        `🔊 Generating TTS with text (${textToSpeak.length} chars): ${outputPath}`
      );
      const ttsProcess = spawn("python", [
        "-m",
        "edge_tts",
        "--text",
        textToSpeak,
        "--voice",
        voiceId,
        rateArg,
        "--write-media",
        outputPath,
      ]);

      let stdErrOutput = "";

      ttsProcess.stdout.on("data", (data) => {
        console.log(`TTS stdout: ${data}`);
      });

      ttsProcess.stderr.on("data", (data) => {
        stdErrOutput += data.toString();
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

          // Try a fallback with simpler text if failed
          if (stdErrOutput.includes("NoAudioReceived")) {
            console.log("Attempting fallback with simpler text...");

            // Create a simple text version - just plain characters, no formatting
            const fallbackText = "这是一首古诗的朗诵。";

            const fallbackProcess = spawn("python", [
              "-m",
              "edge_tts",
              "--text",
              fallbackText,
              "--voice",
              voiceId,
              "--write-media",
              outputPath,
            ]);

            fallbackProcess.on("close", async (fallbackCode) => {
              if (fallbackCode === 0) {
                const audioUrl = `/dist/${outputFileName}`;
                console.log(
                  `✅ Fallback TTS generation successful: ${audioUrl}`
                );

                try {
                  const fileBuffer = await fs.readFile(outputPath);
                  const audioData = fileBuffer.toString("base64");
                  resolve({ audioUrl, audioData });
                } catch (error) {
                  reject(
                    new Error(
                      `Failed to read fallback audio file: ${error instanceof Error ? error.message : String(error)}`
                    )
                  );
                }
              } else {
                reject(
                  new Error(
                    `Both TTS attempts failed with exit codes ${code} and ${fallbackCode}`
                  )
                );
              }
            });
          } else {
            reject(
              new Error(`TTS process exited with code ${code}: ${stdErrOutput}`)
            );
          }
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

export default {
  speak,
  getVoices,
  loadVoices,
  setServerBaseUrl,
  getServerBaseUrl,
  getAudioFileSize,
  getAudioAsBase64,
  convertToSSML,
  formatPoemSSML,
  formatStorytellingSSML,
  ssmlToPlainText,
  readAudioFile,
  deleteAudioFile,
};
