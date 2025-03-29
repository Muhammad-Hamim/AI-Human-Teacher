import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import AppError from "../../errors/AppError";
import { PoemService } from "../../Models/poem/poem.service";
import { AIFactory } from "../aifactory/AIFactory";

const generatePoemInsights = catchAsync(
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

      // 2. Create AI instance for cultural insights generation
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

      // 3. Create system prompt for cultural insights
      const systemPrompt = `你是一位专业的中国文化学者和古诗专家。你将提供关于古诗的深度文化洞察和分析。
请遵循以下规则:
1. 用中文回答
2. 分析诗歌中蕴含的文化元素和象征意义
3. 解释诗歌与当时社会、政治、思想潮流的关联
4. 揭示诗歌中反映的传统价值观和哲学思想
5. 分析诗歌的艺术特色如何体现中国美学观念
6. 探讨诗歌与相关文化习俗、节日或民间传统的联系
7. 比较该诗与同时期或相关主题诗歌的异同
8. 解释诗歌在中国文学史上的地位和影响
9. 必须包含以下几个部分，并用标题分隔：文化背景、象征分析、文学传统、哲学思想、现代意义
10. 每个部分应该有2-3段简明且内容丰富的分析，总字数控制在800-1200字之间

回答应该有深度且富有洞察力，展现对中国古典文化的专业理解。不要简单复述诗歌内容，而要提供新颖的文化视角和分析。`;

      // 4. Generate cultural insights
      const messages = [
        {
          role: "system" as const,
          content: systemPrompt,
        },
        {
          role: "user" as const,
          content: `请为以下古诗提供深度文化洞察分析：
          
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

      // Generate the cultural insights
      const insightsText = await ai.generateCompletion(messages, {
        temperature: 0.7,
        maxTokens: 1500,
      });

      // 5. Return the generated insights
      res.status(httpStatus.OK).json({
        success: true,
        message: "Poem cultural insights generated successfully",
        data: {
          poem: {
            id: poem._id,
            title: poem.title,
            author: poem.author,
            dynasty: poem.dynasty,
          },
          culturalInsights: {
            text: insightsText,
            generatedAt: new Date(),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export const PoemInsightsController = {
  generatePoemInsights,
};
