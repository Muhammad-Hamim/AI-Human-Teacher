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
}

// Initialize variables
let serverBaseUrl = "";
let availableVoices: TTSVoice[] = [];

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
    '<?xml version="1.0"?><speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">';

  // Add the text content
  ssml += text + "</speak>";
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
  const { text, voiceId, outputFileName } = options;

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

  // Generate the audio file
  return new Promise((resolve, reject) => {
    try {
      // Use Python edge-tts with plain text
      const ttsProcess = spawn("python", [
        "-m",
        "edge_tts",
        "--voice",
        voiceId,
        "--text",
        plainText,
        "--write-media",
        outputPath,
      ]);

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
  readAudioFile,
  deleteAudioFile,
};

export default SpeechService;
