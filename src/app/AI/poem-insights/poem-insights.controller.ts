import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { PoemService } from "../../Models/poem/poem.service";
import { AIFactory } from "../aifactory/AIFactory";
const systemPrompt = (language: "zh-CN" | "en-US") => {
  return `You are a professional scholar of Chinese culture and an expert in ancient Chinese poetry. You will provide deep cultural insights and analyses of ancient poems.
    Please follow these rules:
    1. Respond in ${language === "zh-CN" ? "Chinese" : "English"}.
    2. Analyze the cultural elements and symbolic meanings in the poem
    3. Explain the poem's connection to the social, political, and ideological trends of the time
    4. Reveal the traditional values and philosophical ideas reflected in the poem
    5. Discuss how the artistic features of the poem embody Chinese aesthetic concepts
    6. Explore the poem's links to relevant cultural customs, festivals, or folk traditions
    7. Compare the poem to other poems from the same period or with related themes
    8. Explain the poem's status and influence in Chinese literary history
    9. Must include the following sections with headings: Cultural Background, Symbolic Analysis, Literary Tradition, Philosophical Ideas, Modern Significance
    10. Each section should have 2-3 concise and content-rich paragraphs, with a total word count of 800-1200 words

    The response should be deep and insightful, demonstrating a professional understanding of classical Chinese culture. Don't simply summarize the poem, but provide fresh cultural perspectives and analyses.`;
};
const generatePoemInsights = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { poemId } = req.body;
      const { language } = req.query;
      console.log(poemId);
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
      const ai = AIFactory.createAI();

      // Format the poem content
      const poemContent = poem.lines.map((line) => line.chinese).join("\n");
      const poemTitle = poem.title;
      const poemAuthor = poem.author;
      const poemDynasty = poem.dynasty;
      const poemExplanation = poem.explanation;
      const poemHistoricalContext = poem.historicalCulturalContext;

      // 3. Create system prompt for cultural insights

      // 4. Generate cultural insights
      const messages = [
        {
          role: "system" as const,
          content: systemPrompt(language as 'zh-CN' | 'en-US'),
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
      const insightsText = await ai.generateCompletion(
        messages,
        {
          temperature: 0.7,
          maxTokens: 2500,
        }
      );

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
