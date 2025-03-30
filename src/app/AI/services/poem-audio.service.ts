import fs from "fs-extra";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { spawn } from "child_process";
import { createHash } from "crypto";
import {
  TPoem,
  TLine,
  TPoemAudioResources,
  TAudioResource,
  TLineReading,
  TWordPronunciation,
} from "../../Models/poem/poem.interface";
import config from "../../config";
import { Poem } from "../../Models/poem/poem.model";

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_COULD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

// Generate a safe filename from Chinese characters
const getSafeFileName = (text: string, prefix: string = ""): string => {
  // Replace Chinese characters with pinyin or use a hash
  const hash = createHash("md5").update(text).digest("hex").substring(0, 8);
  return `${prefix}_${hash}`;
};

// Characters that often cause Edge TTS errors and should be skipped
const wordCharactersToSkip = new Set(["插", "蠟", "鑰", "鵲"]);

/**
 * Generate TTS audio for Chinese text
 * @param text The Chinese text to process
 * @param outputPath Output file path
 * @param voiceId Voice ID to use
 * @param rate Speech rate (must include + or - sign)
 * @returns Estimated duration in seconds
 */
const generateAudio = async (
  text: string,
  outputPath: string,
  voiceId: string = "zh-CN-XiaoxiaoNeural", // Female voice good for poetry
  rate: string = "-20%", // Must include + or - sign
  retryCount: number = 0
): Promise<number> => {
  return new Promise((resolve, reject) => {
    // Create directory if it doesn't exist
    fs.ensureDirSync(path.dirname(outputPath));

    // Format the rate parameter - ensure it has a sign
    if (rate === "0%") {
      rate = "+0%"; // Edge TTS requires a sign
    }
    const rateArg = `--rate=${rate}`;

    // Generate audio file with pure Chinese text
    console.log(
      `🔊 Generating TTS for text: ${text.substring(0, 20)}${text.length > 20 ? "..." : ""}`
    );
    const ttsProcess = spawn("python", [
      "-m",
      "edge_tts",
      "--text",
      text,
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
        try {
          // Get file stats for duration estimation
          const stats = fs.statSync(outputPath);
          const fileSizeInBytes = stats.size;
          // Rough estimate: ~16KB per second for WAV files
          const estimatedDuration = fileSizeInBytes / 16000;
          resolve(estimatedDuration);
        } catch (error) {
          console.error("Error getting file stats:", error);
          resolve(0); // Default duration if estimation fails
        }
      } else {
        // Check if this is a 503 error or network error (common with Edge TTS)
        const is503Error =
          stdErrOutput.includes("503") ||
          stdErrOutput.includes("Invalid response status") ||
          stdErrOutput.includes("WSServerHandshakeError") ||
          stdErrOutput.includes("service unavailable");

        // Retry up to 3 times for these specific errors
        if (is503Error && retryCount < 3) {
          // Exponential backoff: wait longer for each retry attempt
          const delayMs = 2000 * Math.pow(2, retryCount); // 2s, 4s, 8s
          console.log(
            `⚠️ Edge TTS service unavailable (attempt ${retryCount + 1}), retrying in ${delayMs / 1000} seconds...`
          );

          // Wait with increasing delay before retrying
          setTimeout(async () => {
            try {
              // Try with a different voice if this is not the first retry
              const alternateVoices = [
                "zh-CN-XiaoxiaoNeural",
                "zh-CN-YunxiNeural",
                "zh-CN-YunyangNeural",
                "zh-CN-XiaoyiNeural",
              ];

              // Select a different voice for each retry
              const voiceIndex = retryCount % alternateVoices.length;
              const alternateVoice = alternateVoices[voiceIndex];

              console.log(`Retrying with voice: ${alternateVoice}`);
              const duration = await generateAudio(
                text,
                outputPath,
                alternateVoice,
                rate,
                retryCount + 1
              );
              resolve(duration);
            } catch (retryError) {
              reject(retryError);
            }
          }, delayMs);
        } else {
          if (is503Error) {
            console.warn(
              `Service unavailable for text: "${text}", skipping after ${retryCount} retries`
            );
            // For 503 errors after retries, return 0 duration instead of failing
            resolve(0);
          } else {
            reject(
              new Error(`TTS process exited with code ${code}: ${stdErrOutput}`)
            );
          }
        }
      }
    });
  });
};

// Upload audio file to Cloudinary
const uploadToCloudinary = async (
  filePath: string,
  publicId: string
): Promise<{ url: string; duration: number }> => {
  try {
    console.log(`Uploading ${filePath} to Cloudinary with ID: ${publicId}`);

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      public_id: publicId,
      folder: "poem_audio",
    });

    return {
      url: result.secure_url,
      duration: result.duration || 0,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

// Check if audio resources already exist for a poem in the database
const checkAudioExists = async (
  poemId: string
): Promise<TPoemAudioResources | null> => {
  try {
    // Check if the poem exists in the database with audioResources
    const poem = await Poem.findById(poemId);

    if (poem && poem.audioResources) {
      console.log(`Found audio resources in database for poem ${poemId}`);
      return poem.audioResources;
    }

    return null;
  } catch (error) {
    console.error("Error checking audio resources in database:", error);
    return null;
  }
};

// Save audio resources to the poem document in the database
const saveAudioResourcesToDatabase = async (
  poemId: string,
  audioResources: TPoemAudioResources
): Promise<boolean> => {
  try {
    // Update the poem document with the audio resources using findByIdAndUpdate
    const result = await Poem.findByIdAndUpdate(
      poemId,
      { audioResources }, // Update the entire audioResources field
      { new: true }
    );

    if (!result) {
      console.error(`No poem found with ID ${poemId}`);
      return false;
    }

    console.log(`Audio resources saved to database for poem ${poemId}`);
    return true;
  } catch (error) {
    console.error("Error saving audio resources to database:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
};

// Generate and upload all audio resources for a poem
const generatePoemAudio = async (poem: TPoem): Promise<TPoemAudioResources> => {
  const poemId = poem._id?.toString() || "";
  const tmpDir = path.join(process.cwd(), "tmp", "poem_audio", poemId);

  try {
    // Create temporary directory
    await fs.ensureDir(tmpDir);

    // Check if audio already exists in the database
    const existingAudioResources = await checkAudioExists(poemId);
    if (existingAudioResources) {
      console.log(
        `🎵 Using existing audio resources from database for poem ${poemId}`
      );
      return existingAudioResources;
    }

    // If we get here, the audio doesn't exist, so we'll generate it

    // 1. Generate full poem audio - include title and author information
    const titleAndAuthor = `${poem.title}，${poem.dynasty}${poem.author}。`;
    const poemContent =
      poem.lines.map((line) => line.chinese).join("，\n") + "。";

    // Add a pause between title/author and poem content
    const fullPoemText = `${titleAndAuthor}\n\n${poemContent}`;
    const fullPoemPath = path.join(tmpDir, "full.wav");

    let fullDuration = 0;
    let fullPoemUpload = { url: "", duration: 0 };

    try {
      // Generate full poem audio with slower rate for better recitation
      fullDuration = await generateAudio(
        fullPoemText,
        fullPoemPath,
        "zh-CN-XiaoxiaoNeural",
        "-40%" // Slower for full poem reading
      );

      // Upload full poem audio
      const fullPoemPublicId = `poem_${poemId}_full`;
      fullPoemUpload = await uploadToCloudinary(fullPoemPath, fullPoemPublicId);
    } catch (fullPoemError) {
      console.error("Error generating full poem audio:", fullPoemError);
      // Continue with lines and words even if full poem fails
    }

    // 2. Generate line-by-line audio
    const lineReadings: TLineReading[] = [];

    for (let i = 0; i < poem.lines.length; i++) {
      try {
        const line = poem.lines[i];
        const lineText = line.chinese;
        const linePath = path.join(tmpDir, `line_${i + 1}.wav`);

        // Generate line audio with moderate slowdown
        const lineDuration = await generateAudio(
          lineText,
          linePath,
          "zh-CN-XiaoxiaoNeural",
          "-40%" // Moderate slowdown for individual lines
        );

        // Upload line audio
        const linePublicId = `poem_${poemId}_line_${i + 1}`;
        const lineUpload = await uploadToCloudinary(linePath, linePublicId);

        // Add to line readings
        lineReadings.push({
          lineId: i + 1,
          text: lineText,
          pinyin: line.pinyin,
          url: lineUpload.url,
          contentType: "audio/wav",
          duration: lineUpload.duration || lineDuration,
        });
      } catch (lineError) {
        console.error(`Error generating audio for line ${i + 1}:`, lineError);
        // Continue with other lines
      }
    }

    // 3. Generate word-by-word audio
    const wordPronunciations: TWordPronunciation[] = [];
    const processedWords = new Set<string>(); // Track processed words to avoid duplicates

    for (const line of poem.lines) {
      // Extract individual Chinese characters
      const characters = line.chinese.split("");
      const pinyinParts = line.pinyin.split(" ");

      // Map pinyin to characters (simplified approach)
      for (let i = 0; i < characters.length && i < pinyinParts.length; i++) {
        try {
          const word = characters[i];

          // Skip if already processed or in skip list
          if (processedWords.has(word) || wordCharactersToSkip.has(word))
            continue;
          processedWords.add(word);

          const pinyin = pinyinParts[i] || "";
          const wordPath = path.join(
            tmpDir,
            `word_${getSafeFileName(word)}.wav`
          );

          // Generate word audio at normal speed
          const wordDuration = await generateAudio(
            word,
            wordPath,
            "zh-CN-XiaoxiaoNeural", // Female voice for individual characters
            "-25%" // Slight slowdown for clarity
          );

          // Upload word audio
          const wordPublicId = `poem_word_${getSafeFileName(word)}`;
          const wordUpload = await uploadToCloudinary(wordPath, wordPublicId);

          // Add to word pronunciations
          wordPronunciations.push({
            word,
            pinyin,
            url: wordUpload.url,
            contentType: "audio/wav",
            duration: wordUpload.duration || wordDuration,
          });

          // Add a small delay between words to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (wordError) {
          console.error(
            `Error generating audio for word ${characters[i]}:`,
            wordError
          );
          // Continue with other words
        }
      }
    }

    // Clean up temporary files
    await fs.remove(tmpDir);

    // Make sure we have at least some content
    if (!fullPoemUpload.url && lineReadings.length === 0) {
      throw new Error("Failed to generate any audio for the poem");
    }

    // Create audio resources object
    const generatedAudioResources = {
      fullReading: {
        url:
          fullPoemUpload.url ||
          (lineReadings.length > 0 ? lineReadings[0].url : ""),
        contentType: "audio/wav",
        duration: fullPoemUpload.duration || fullDuration || 5,
      },
      lineReadings,
      wordPronunciations,
    };

    // Save to database - only if we have some content
    if (fullPoemUpload.url || lineReadings.length > 0) {
      await saveAudioResourcesToDatabase(poemId, generatedAudioResources);
    }

    // Return all audio resources
    return generatedAudioResources;
  } catch (error) {
    console.error("Error generating poem audio:", error);

    // Clean up on error
    try {
      await fs.remove(tmpDir);
    } catch (cleanupError) {
      console.error("Error cleaning up temporary files:", cleanupError);
    }

    throw error;
  }
};

export const PoemAudioService = {
  checkAudioExists,
  saveAudioResourcesToDatabase,
  generatePoemAudio,
};
