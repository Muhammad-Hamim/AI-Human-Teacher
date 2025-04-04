import { TPoem } from "./poem.interface";
import { Poem } from "./poem.model";
import { AIFactory } from "../../AI/aifactory/AIFactory";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

// Base output directory for poem images
const IMAGE_OUTPUT_DIR = path.join(__dirname, "../../../../dist/images/poems");

// Ensure the output directory exists
if (!fs.existsSync(IMAGE_OUTPUT_DIR)) {
  fs.mkdirSync(IMAGE_OUTPUT_DIR, { recursive: true });
}

// Generate a Stable Diffusion prompt for a poem using AI
const generatePoemImagePrompt = async (poem: TPoem): Promise<string> => {
  try {
    const ai = AIFactory.createAI()

    // Create combined poem text for context
    const poemText = poem.lines.map((line) => line.chinese).join("\n");
    const poemTranslation = poem.lines
      .map((line) => line.translation)
      .join("\n");

    const systemPrompt = `
You are an expert in Chinese classical poetry and art. Your task is to create a concise prompt for Stable Diffusion AI to generate a beautiful image representing a Chinese poem.

Follow these guidelines:
1. The prompt should be VERY SHORT (25-30 words MAXIMUM) to avoid token limits
2. Focus on just 1-2 key visual elements and mood
3. Reference traditional Chinese painting style appropriate to the poem's dynasty
4. Be extremely concise but descriptive

DO NOT include quotes, backticks, or any other formatting. Return ONLY the prompt text.
`;

    const userPrompt = `
Create a VERY BRIEF Stable Diffusion prompt for an image representing this Chinese poem:

Title: ${poem.title}
Author: ${poem.author} (${poem.dynasty})

English Translation:
${poemTranslation}
`;

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      {
        role: "user" as const,
        content: userPrompt,
      },
    ];

    // Generate the prompt
    const response = await ai.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 150,
    });

    // Clean up the response
    let cleanedPrompt = response
      .trim()
      .replace(/^["'`]+|["'`]+$/g, "") // Remove quotes/backticks at start/end
      .replace(/\\n/g, " ") // Replace escaped newlines
      .replace(/\s+/g, " "); // Normalize whitespace

    // Ensure the prompt isn't too long (even shorter limit to be safe)
    if (cleanedPrompt.length > 200) {
      console.log("AI prompt too long, truncating to 200 characters");
      cleanedPrompt = cleanedPrompt.substring(0, 200);
    }

    console.log("AI-generated Stable Diffusion prompt:", cleanedPrompt);

    return cleanedPrompt;
  } catch (error) {
    console.error("Error generating poem image prompt:", error);

    // Fall back to rule-based generation if AI fails
    return generateFallbackPrompt(poem);
  }
};

// Generate a fallback prompt using rule-based approach
const generateFallbackPrompt = (poem: TPoem): string => {
  // Extract key imagery from the poem
  const extractKeywords = (text: string): string[] => {
    // Extended list of nature and cultural elements in Chinese poetry
    const poeticElements = [
      "mountain",
      "river",
      "moon",
      "sun",
      "flower",
      "tree",
      "wind",
      "rain",
      "cloud",
      "snow",
      "sea",
      "lake",
      "forest",
      "bird",
      "autumn",
      "spring",
      "winter",
      "summer",
      "dawn",
      "dusk",
      "night",
      "day",
      "sky",
      "earth",
      "pavilion",
      "temple",
      "pagoda",
      "bridge",
      "path",
      "boat",
      "bamboo",
      "pine",
      "willow",
      "crane",
      "dragon",
      "phoenix",
      "mist",
      "fog",
      "jade",
      "pearl",
      "silk",
      "wine",
      "tea",
      "flute",
      "zither",
      "scroll",
      "brush",
      "landscape",
      "horizon",
      "valley",
      "peak",
      "cliff",
      "waterfall",
      "stream",
      "garden",
      "plum",
      "lotus",
      "peach",
    ];

    const words = text.toLowerCase().split(/\s+/);
    return words.filter(
      (word) =>
        poeticElements.includes(word) ||
        poeticElements.some((element) => word.includes(element))
    );
  };

  const poemTranslation = poem.lines.map((line) => line.translation).join("\n");
  const keywords = extractKeywords(poemTranslation);
  const uniqueKeywords = [...new Set(keywords)];

  // Get dynasty for style
  let artisticStyle = "";
  if (poem.dynasty.toLowerCase().includes("tang")) {
    artisticStyle =
      "in the grand style of Tang Dynasty landscape paintings, with bold brushstrokes and dramatic compositions";
  } else if (poem.dynasty.toLowerCase().includes("song")) {
    artisticStyle =
      "in the refined style of Song Dynasty ink wash paintings, with delicate details and atmospheric perspective";
  } else if (poem.dynasty.toLowerCase().includes("ming")) {
    artisticStyle =
      "in the vibrant style of Ming Dynasty scroll paintings, with rich colors and intricate details";
  } else if (poem.dynasty.toLowerCase().includes("qing")) {
    artisticStyle =
      "in the elegant style of Qing Dynasty court paintings, with meticulous brushwork and refined compositions";
  } else {
    artisticStyle =
      "in the style of traditional Chinese ink wash paintings, with flowing brushwork and classical composition";
  }

  // Construct a base prompt
  let prompt = `A beautiful Chinese landscape painting inspired by the poem "${poem.title}" by ${poem.author}`;

  // Add imagery elements if found
  if (uniqueKeywords.length > 0) {
    prompt += `, featuring ${uniqueKeywords.slice(0, 5).join(", ")}`;
  }

  // Add artistic style
  prompt += `, ${artisticStyle}. Highly detailed with masterful brushwork, subtle ink washes, and harmonious composition.`;

  return prompt;
};

// Generate an image for a poem using Stable Diffusion with spawn
const generatePoemImage = async (
  poemId: string
): Promise<{ imageBase64: string; prompt: string; poem: TPoem }> => {
  try {
    // 1. Get the poem
    const poem = await Poem.findById(poemId);
    if (!poem) {
      throw new Error(`Poem with ID ${poemId} not found`);
    }

    // 2. Generate a prompt for the image
    let prompt = await generatePoemImagePrompt(poem);

    // Ensure we have a valid prompt
    if (!prompt || prompt.trim() === "") {
      console.warn("Empty prompt generated, using fallback");
      prompt = generateFallbackPrompt(poem);
    }

    console.log("Using prompt:", prompt);

    // 3. Run the Stable Diffusion script with base64 output using spawn
    const pythonScript = path.join(
      __dirname,
      "../../../../stable_diffusion_script.py"
    );

    // Create a proper command string for shell execution
    const command = `python "${pythonScript}" --prompt "${prompt.replace(/"/g, '\\"')}" --width 384 --height 384 --return_base64 --guidance_scale 7.0`;

    console.log("Executing Stable Diffusion command with spawn");

    return new Promise((resolve, reject) => {
      let stdoutData = "";
      let stderrData = "";

      // Start the Python process with shell option for Windows compatibility
      const pythonProcess = spawn(command, [], {
        shell: true,
      });

      // Collect stdout
      pythonProcess.stdout.on("data", (data) => {
        const chunk = data.toString();
        stdoutData += chunk;
        // Log progress indicators but avoid excessive logging
        if (
          chunk.includes("downloading") ||
          chunk.includes("Starting image") ||
          chunk.includes("completed")
        ) {
          console.log(`SD Progress: ${chunk.trim()}`);
        }
      });

      // Collect stderr
      pythonProcess.stderr.on("data", (data) => {
        const chunk = data.toString();
        stderrData += chunk;
        // Only log non-trivial stderr messages
        if (!chunk.includes("symlinks") && !chunk.includes("Warning")) {
          console.warn(`SD Warning: ${chunk.trim()}`);
        }
      });

      // Set a longer timeout (3 minutes)
      const timeoutId = setTimeout(() => {
        console.error("Stable Diffusion process timed out, killing");
        pythonProcess.kill("SIGKILL");
        reject(new Error("Stable Diffusion process timed out"));
      }, 180000); // 3 minute timeout

      // Handle process completion
      pythonProcess.on("close", (code) => {
        clearTimeout(timeoutId);

        if (code !== 0) {
          console.error(`Python process exited with code ${code}`);
          console.error("STDERR:", stderrData);
          reject(new Error(`Stable Diffusion failed with code ${code}`));
          return;
        }

        // Extract the base64 image from stdout
        const base64Pattern = /BASE64_IMAGE_START:([.\s\S]*?):BASE64_IMAGE_END/;
        const base64Match = stdoutData.match(base64Pattern);

        if (!base64Match || !base64Match[1]) {
          console.error("Full stdout:", stdoutData);
          reject(new Error("Failed to extract base64 image"));
          return;
        }

        const imageBase64 = base64Match[1];
        console.log(`Generated base64 image of length: ${imageBase64.length}`);

        resolve({
          imageBase64,
          prompt,
          poem,
        });
      });

      // Handle process errors
      pythonProcess.on("error", (err) => {
        clearTimeout(timeoutId);
        console.error("Failed to start Python process:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error generating poem image:", error);
    throw error;
  }
};

export const PoemImageService = {
  generatePoemImage,
  generatePoemImagePrompt,
};
