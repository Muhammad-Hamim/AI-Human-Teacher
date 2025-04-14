import { TImagerySymbolism, TPoem } from "./poem.interface";
import { Poem } from "./poem.model";
import { AIFactory } from "../../AI/aifactory/AIFactory";

const systemPrompt = (language: "zh-CN" | "en-US") => {
  if (language === "zh-CN") {
    return `
你是一位中国文学和诗歌分析专家。你的任务是识别和解释古典中国诗歌中的意象和象征。

对于给定的诗歌，请识别3-5个关键意象元素或象征，并按以下JSON格式提供详细分析：

{
  "imageryAndSymbolism": {
    "element_name": {
      "description": "该意象或象征在诗歌上下文中含义的详细解释",
      "keywords": ["诗中与此元素相关的", "汉字或词语"],
      "culturalSignificance": [
        "文化意义点1",
        "文化意义点2",
        "文化意义点3",
        "文化意义点4"
      ],
      "icon": "建议的图标名称"
    },
    // 根据需要添加更多元素
  }
}

要求：
1. 识别诗歌中3-5个重要的意象元素或象征
2. "element_name"应该使用中文（例如："明月", "高山", "流水"等）
3. "description"应该解释该元素在这首特定诗歌中的含义和重要性（用中文描述）
4. "keywords"数组应该包含诗中与该元素相关的实际汉字
5. "culturalSignificance"应列出这个象征在中国文学传统中的3-4个更广泛的文化含义（用中文描述）
6. "icon"应该建议一个代表该元素的简单图标名称（使用英文，如："Moon", "Mountain", "Water", "Home", "Journey"等）
use simple chinese words/sentences and grammar

你的分析应该有深度、文化准确性，并且专注于这首诗歌中的特定意象，而不是泛泛而谈。

重要提示：仅返回有效的JSON，不要包含任何其他文本、Markdown格式或代码块。
    `;
  } else {
    return `
You are an expert in Chinese literature and poetry analysis. Your task is to identify and interpret imagery and symbolism in classical Chinese poetry.

For a given poem, identify 3-5 key imagery elements or symbols and provide a detailed analysis in the following JSON format:

{
  "imageryAndSymbolism": {
    "element_name": {
      "description": "A detailed explanation of the meaning of this imagery or symbol in the context of the poem",
      "keywords": ["Actual", "Chinese characters or words", "related to this element"],
      "culturalSignificance": [
        "Cultural significance point 1",
        "Cultural significance point 2",
        "Cultural significance point 3",
        "Cultural significance point 4"
      ],
      "icon": "Suggested icon name"
    },
    // Add more elements as needed
  }
}

Requirements:
1. Identify 3-5 key imagery elements or symbols in the poem
2. "element_name" should use Chinese (e.g., "明月", "高山", "流水", etc.)
3. "description" should explain the significance and meaning of the element in this specific poem (in English)
4. The "keywords" array should include actual Chinese characters related to this element in the poem
5. "culturalSignificance" should list 3-4 broader cultural meanings of the symbol in the Chinese literary tradition (in English)
6. "icon" should suggest a simple icon name that represents the element (in English, e.g., "Moon", "Mountain", "Water", "Home", "Journey")

Your analysis should be in-depth, culturally accurate, and focused on the specific imagery in this poem, not general symbolism.
use simple english words/sentences and grammar

Important note: Only return valid JSON, and do not include any additional text, Markdown, or code blocks.
    `;
  }
};

// Generate imagery and symbolism for a poem
const generateImagerySymbolism = async (
  poemId: string,
  language: "zh-CN" | "en-US"
): Promise<{ imageryAndSymbolism: TImagerySymbolism; poem: TPoem }> => {
  try {
    // 1. Get the poem
    const poem = await Poem.findById(poemId);
    if (!poem) {
      throw new Error(`Poem with ID ${poemId} not found`);
    }

    // 2. Generate imagery and symbolism using AI
    const imagerySymbolism = await generateImagerySymbolismWithAI(
      poem,
      language
    );

    // 3. Return the imagery and symbolism along with the poem
    return {
      imageryAndSymbolism: imagerySymbolism,
      poem: poem,
    };
  } catch (error) {
    console.error("Error generating imagery and symbolism:", error);
    throw error;
  }
};

// Get imagery and symbolism for a poem
const getImagerySymbolism = async (
  poemId: string,
  language: "zh-CN" | "en-US"
): Promise<{ imageryAndSymbolism: TImagerySymbolism; poem: TPoem }> => {
  // Always generate fresh content without saving to DB
  return await generateImagerySymbolism(poemId, language);
};

// Helper function to generate imagery and symbolism using AI
const generateImagerySymbolismWithAI = async (
  poem: TPoem,
  language: "zh-CN" | "en-US"
): Promise<TImagerySymbolism> => {
  try {
    const ai = AIFactory.createAI();

    // Create combined poem text for context
    const poemText = poem.lines.map((line) => line.chinese).join("\n");
    const poemTranslation = poem.lines
      .map((line) => line.translation)
      .join("\n");

    const userPrompt = `
Analyze the imagery and symbolism in this Chinese poem:

Title: ${poem.title}
Author: ${poem.author} (${poem.dynasty})

Original Chinese:
${poemText}

English Translation:
${poemTranslation}

Poem Explanation:
${poem.explanation}

Historical/Cultural Context:
${poem.historicalCulturalContext}
`;

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt(language),
      },
      {
        role: "user" as const,
        content: userPrompt,
      },
    ];

    // Generate the imagery and symbolism analysis
    const response = await ai.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Process the AI response to ensure valid JSON
    let cleanedResponse = response;

    // Remove markdown code block formatting if present
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      cleanedResponse = codeBlockMatch[1];
    }

    // Remove any additional text before or after the JSON
    const jsonMatch = cleanedResponse.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      cleanedResponse = jsonMatch[1];
    }

    console.log("Processing AI response for imagery and symbolism");

    // Parse the response
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", response);
      console.error("Cleaned response:", cleanedResponse);
      throw new Error(`Failed to parse AI response for imagery and symbolism`);
    }

    // Extract imagery and symbolism
    if (!parsedResponse.imageryAndSymbolism) {
      throw new Error("AI response missing imageryAndSymbolism field");
    }

    return parsedResponse.imageryAndSymbolism as TImagerySymbolism;
  } catch (error) {
    console.error("Error generating imagery and symbolism with AI:", error);

    // Return a basic fallback if AI generation fails
    return createFallbackImagerySymbolism(poem);
  }
};

// Create a fallback imagery and symbolism if AI generation fails
const createFallbackImagerySymbolism = (poem: TPoem): TImagerySymbolism => {
  // Extract some Chinese characters from the poem to use as keywords
  const allChineseText = poem.lines.map((line) => line.chinese).join("");
  const characters = Array.from(allChineseText).filter(
    (char) =>
      /[\u4e00-\u9fa5]/.test(char) &&
      ![
        ",",
        "。",
        "，",
        "!",
        "？",
        "、",
        "：",
        "；",
        '"',
        '"',
        "'",
        "'",
        "（",
        "）",
      ].includes(char)
  );

  // Get unique characters
  const uniqueCharacters = [...new Set(characters)];

  // Create a basic fallback with one generic element
  return {
    自然意象: {
      description: `《${poem.title}》中的自然意象是诗人${poem.author}表达情感的重要手段。这些意象展现了中国古典诗歌中人与自然的和谐关系，并通过自然现象来映射人类的情感和哲学思考。`,
      keywords: uniqueCharacters.slice(0, 5),
      culturalSignificance: [
        "自然意象在中国古典诗歌中常用来表达诗人的内心情感",
        "自然与人的和谐统一是中国传统美学的重要组成部分",
        "自然意象常具有象征性，反映了中国传统哲学思想",
        "通过自然景物描写来寄托情感是中国诗歌的传统表现手法",
      ],
      icon: "Mountain",
    },
  };
};

export const ImagerySymbolismService = {
  generateImagerySymbolism,
  getImagerySymbolism,
};
