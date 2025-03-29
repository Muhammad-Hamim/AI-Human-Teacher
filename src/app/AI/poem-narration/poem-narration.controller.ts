import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import AppError from "../../errors/AppError";
import { PoemService } from "../../Models/poem/poem.service";
import { AIFactory } from "../aifactory/AIFactory";
import SpeechService from "../services/speech.service";
import path from "path";
import fs from "fs";

const generatePoemNarration = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { poemId } = req.body;

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
      const ai = AIFactory.createCustomAI(
        "deepseek",
        "deepseek/deepseek-r1:free"
      );

      // Format the poem content
      const poemContent = poem.lines.map((line) => line.chinese).join("\n");
      const poemTitle = poem.title;
      const poemAuthor = poem.author;
      const poemDynasty = poem.dynasty;
      const poemExplanation = poem.explanation;
      const poemHistoricalContext = poem.historicalCulturalContext;

      // 3. Create system prompt for storytelling narration
      const systemPrompt = `你是一个专业的古诗朗诵者和故事讲述者。你将为古诗创作朗诵稿，以讲故事的方式表达诗的意境和情感。
遵循以下规则：
1. 使用中文创作朗诵稿
2. 融入诗歌的历史背景和文化背景
3. 以讲故事的方式展开，而不仅仅是朗读
4. 使用生动、优美的语言
5. 适当解释诗歌的含义，但保持流畅自然
6. 字数控制在300-500字之间
7. 口语化的表达，适合朗诵
8. 文章结构：简短介绍 -> 诗歌朗诵 -> 诗意解析 -> 故事化表达 -> 简短结尾
9. 确保生成内容完全符合中国传统文化
10. 注意节奏感和抑扬顿挫

不要在回答中说明你的思考过程，直接提供朗诵稿。`;

      // 4. Generate storytelling narration
      const messages = [
        {
          role: "system" as const,
          content: systemPrompt,
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
      const narrativeText = await ai.generateCompletion(messages, {
        temperature: 0.7,
        maxTokens: 1000, // Limit token count to avoid too long text
      });

      // Limit the text length for TTS to avoid errors (max 1000 characters)
      const limitedText =
        narrativeText.length > 1000
          ? narrativeText.substring(0, 1000) + "..."
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
          rate: "-20%", // Slightly slower but not too slow
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
