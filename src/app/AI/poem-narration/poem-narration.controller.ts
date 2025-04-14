import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { PoemService } from "../../Models/poem/poem.service";
import { AIFactory } from "../aifactory/AIFactory";
import SpeechService from "../services/speech.service";
const systemPrompt = (language: string): string => {
  return `You are a professional poetry reciter and storyteller. Your task is to create a recitation script for classical Chinese poems, expressing the artistic conception and emotions of the poem in a storytelling manner.
Follow these rules:
1. Create the recitation script for a Chinese audience (the output should be in ${language}).
2. Incorporate the historical and cultural background of the poem
3. Develop it as a story, not just a simple reading
4. Use vivid and beautiful language
5. Use simple ${language === 'zh-CN' ? 'Chinese' : 'English'} sentences or words in explanation.
6. Use a storytelling tone, not a formal one
7. Explain the meaning of the poem appropriately while maintaining fluency
8. Keep the word count between 300-500 words
9. Use conversational expressions suitable for recitation
10. Structure: brief introduction -> poem recitation -> interpretation -> storytelling expression -> brief conclusion
11. Ensure the content fully conforms to traditional Chinese culture
12. Pay attention to rhythm and tonal variations

Do not explain your thought process in your response, directly provide the recitation script.`;
};
const generatePoemNarration = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { poemId } = req.body;
      const { language } = req.query;
      console.log('"Generating poem narration...");',language)
      if (!poemId) {
        res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "Poem ID is required",
        });
        return;
      }

      // 1. Query the poem from database
      const poem = await PoemService.getPoemById(poemId);

      if (!poem) {
        res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "Poem not found",
        });
        return;
      }

      // 2. Create AI instance for narration generation
      const ai = AIFactory.createAI();

      // Format the poem content
      const poemContent = poem.lines.map((line) => line.chinese).join("\n");
      const poemTitle = poem.title;
      const poemAuthor = poem.author;
      const poemDynasty = poem.dynasty;
      const poemExplanation = poem.explanation;
      const poemHistoricalContext = poem.historicalCulturalContext;

      // 3. Create system prompt for storytelling narration

      // 4. Generate storytelling narration
      const messages = [
        {
          role: "system" as const,
          content: systemPrompt(language as "zh-CN" | "en-US"),
        },
        {
          role: "user" as const,
          content: `请为以下古诗创作一段故事化的朗诵稿：
          
标题：${poemTitle}
朝代：${poemDynasty}
作者：${poemAuthor}
原文：
${poemContent}

诗歌解释：
${poemExplanation}

历史文化背景：
${poemHistoricalContext}`,
        },
      ];

      // Generate the narration
      const narrativeText = await ai.generateCompletion(
        messages,
        {
          temperature: 0.7,
          maxTokens: 2000, // Limit token count to avoid too long text
        }
      );

      // Limit the text length for TTS to avoid errors (max 1000 characters)
      const limitedText =
        narrativeText.length > 2000
          ? narrativeText.substring(0, 2000) + "..."
          : narrativeText;

      // 5. Format the narrative as SSML for better speech
      const outputFileName = `poem-narration-${poemId}-${Date.now()}.wav`;
      const serverBaseUrl = SpeechService.getServerBaseUrl();

      console.log("🎙️ Generating TTS for poem narration...");

      try {
        const { audioUrl, audioData } = await SpeechService.speak({
          text: limitedText,
          voiceId: "zh-CN-YunxiNeural", // Try a different voice that's better for storytelling
          outputFileName,
          baseUrl: serverBaseUrl,
          rate: "-30%", // Slightly slower but not too slow
        });

        // Return success with the narration text and audio
        res.status(httpStatus.OK).json({
          success: true,
          message: "Poem narration generated successfully",
          data: {
            poem: {
              id: poem._id,
              title: poem.title,
              author: poem.author,
              dynasty: poem.dynasty,
            },
            narration: {
              text: narrativeText,
              audio: {
                url: audioUrl,
                base64: audioData,
                contentType: "audio/wav",
              },
            },
          },
        });
      } catch (error) {
        console.error("Error generating TTS:", error);
        // If TTS fails, still return the narrative text
        res.status(httpStatus.OK).json({
          success: true,
          message:
            "Poem narration generated successfully (audio generation failed)",
          data: {
            poem: {
              id: poem._id,
              title: poem.title,
              author: poem.author,
              dynasty: poem.dynasty,
            },
            narration: {
              text: narrativeText,
              error:
                "Audio generation failed. Please try again with a shorter text.",
            },
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export const PoemNarrationController = {
  generatePoemNarration,
};
