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
  rate: string = "-20%" // Must include + or - sign
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
        reject(
          new Error(`TTS process exited with code ${code}: ${stdErrOutput}`)
        );
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

// Check if audio resources already exist for a poem
const checkAudioExists = async (poemId: string): Promise<boolean> => {
  try {
    // Search for assets with the poem ID prefix
    const result = await cloudinary.search
      .expression(`folder:poem_audio AND public_id:${poemId}_full*`)
      .execute();

    return result.total_count > 0;
  } catch (error) {
    console.error("Error checking Cloudinary resources:", error);
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

    // 1. Generate full poem audio
    const fullPoemText =
      poem.lines.map((line) => line.chinese).join("，\n") + "。";
    const fullPoemPath = path.join(tmpDir, "full.wav");

    // Generate full poem audio with slower rate for better recitation
    const fullDuration = await generateAudio(
      fullPoemText,
      fullPoemPath,
      "zh-CN-XiaoxiaoNeural",
      "-40%" // Slower for full poem reading
    );

    // Upload full poem audio
    const fullPoemPublicId = `poem_${poemId}_full`;
    const fullPoemUpload = await uploadToCloudinary(
      fullPoemPath,
      fullPoemPublicId
    );

    // 2. Generate line-by-line audio
    const lineReadings: TLineReading[] = [];

    for (let i = 0; i < poem.lines.length; i++) {
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
    }

    // 3. Generate word-by-word audio
    const wordPronunciations: TWordPronunciation[] = [];
    const processedWords = new Set<string>(); // Track processed words to avoid duplicates

    for (const line of poem.lines) {
      // Extract individual Chinese characters
      const characters = line.chinese.split("");
      const pinyinParts = line.pinyin.split(" ");

      // Map pinyin to characters (simplified approach)
      // Note: This is a simplification. For production use, you would need a more accurate mapping
      for (let i = 0; i < characters.length && i < pinyinParts.length; i++) {
        const word = characters[i];

        // Skip if already processed
        if (processedWords.has(word)) continue;
        processedWords.add(word);

        const pinyin = pinyinParts[i] || "";
        const wordPath = path.join(tmpDir, `word_${getSafeFileName(word)}.wav`);

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
      }
    }

    // Clean up temporary files
    await fs.remove(tmpDir);

    // Return all audio resources
    return {
      fullReading: {
        url: fullPoemUpload.url,
        contentType: "audio/wav",
        duration: fullPoemUpload.duration || fullDuration,
      },
      lineReadings,
      wordPronunciations,
    };
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
  generatePoemAudio,
};
