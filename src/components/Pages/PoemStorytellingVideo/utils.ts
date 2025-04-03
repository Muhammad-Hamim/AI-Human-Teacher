/**
 * Utility functions for the Poem Storytelling Video feature
 */

/**
 * Validate an image file
 * @param file The file to validate
 * @returns An object with valid flag and optional error message
 */
export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Please upload JPEG, PNG, GIF, or WebP images.`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / (1024 * 1024)).toFixed(
        2
      )}MB. Maximum size is 5MB.`,
    };
  }

  return { valid: true };
};

/**
 * Validate an audio file
 * @param file The file to validate
 * @returns An object with valid flag and optional error message
 */
export const validateAudioFile = (
  file: File
): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const validTypes = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp3",
    "audio/mp4",
  ];

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Please upload MP3, WAV, or OGG audio files.`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / (1024 * 1024)).toFixed(
        2
      )}MB. Maximum size is 10MB.`,
    };
  }

  return { valid: true };
};

/**
 * Convert a file to base64
 * @param file The file to convert
 * @returns A promise that resolves to the base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract the base64 data part if needed
      const base64 = result.split(",")[1];
      resolve(result); // Return the full data URL
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Create image previews from files
 * @param files Array of image files
 * @returns Array of object URLs for preview
 */
export const createImagePreviews = (files: File[]): string[] => {
  return files.map((file) => URL.createObjectURL(file));
};

/**
 * Parse poem lines for animation
 * @param poemContent The full poem content
 * @returns Array of lines for animation
 */
export const parsePoemLines = (poemContent: string): string[] => {
  if (!poemContent) return [];
  // Split by line breaks and filter out empty lines
  return poemContent.split("\n").filter((line) => line.trim() !== "");
};

/**
 * Generate timestamps for each line based on audio duration
 * @param lines Array of poem lines
 * @param audioDuration Total audio duration in seconds
 * @returns Array of objects with line text and timestamp
 */
export const generateTimestamps = (
  lines: string[],
  audioDuration: number
): { text: string; time: number }[] => {
  if (lines.length === 0 || !audioDuration) {
    return [];
  }

  // Calculate average time per line
  const timePerLine = audioDuration / lines.length;

  // Create timestamps for each line
  return lines.map((line, index) => ({
    text: line,
    time: index * timePerLine,
  }));
};

/**
 * Clean up resources (object URLs) when no longer needed
 * @param urls Array of object URLs to revoke
 */
export const cleanupResources = (urls: string[]): void => {
  urls.forEach((url) => {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  });
};
