import { Vocabulary } from "./vocabulary.model";
import { TVocabulary } from "./vocabulary.interface";
import { TPoem } from "../poem/poem.interface";
import { PoemService } from "../poem/poem.service";
import { AIFactory } from "../../AI/aifactory/AIFactory";
import { pinyin } from "pinyin-pro";

// Get all vocabulary
const getAllVocabulary = async (): Promise<TVocabulary[]> => {
  const result = await Vocabulary.find();
  return result;
};

// Get vocabulary by word
const getVocabularyByWord = async (
  word: string
): Promise<TVocabulary | null> => {
  const result = await Vocabulary.findOne({ word });
  return result;
};

// Get vocabulary by poem ID
const getVocabularyByPoemId = async (
  poemId: string
): Promise<TVocabulary[]> => {
  // Find vocabulary that includes this poem ID
  const result = await Vocabulary.find({ poemIds: poemId });
  return result;
};

// Extract unique Chinese characters from a poem
const extractVocabularyWords = (poem: TPoem): string[] => {
  // Extract all Chinese characters from poem lines
  const allText = poem.lines.map((line) => line.chinese).join("");

  // Split into individual characters and remove duplicates
  const uniqueChars = [...new Set(allText.split(""))];

  // Filter out non-Chinese characters, punctuation, etc.
  const chineseCharsRegex = /[\u4e00-\u9fa5]/;
  const chineseChars = uniqueChars.filter(
    (char) =>
      chineseCharsRegex.test(char) &&
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

  return chineseChars;
};

// Generate vocabulary explanation using AI
const generateVocabularyExplanation = async (
  word: string
): Promise<TVocabulary> => {
  try {
    const ai = AIFactory.createAI();

    const systemPrompt = `
You are an expert Chinese language teacher specializing in vocabulary explanations. 
Your task is to provide comprehensive explanations for Chinese characters/words, particularly those found in classical Chinese poetry.

For the given character or word, provide:
1. The pinyin romanization with tone marks
2. HSK level (estimate if not standard, e.g. HSK3, HSK4, HSK5+)
3. Multiple meanings with parts of speech if applicable
4. Example sentences showing usage (ideally from classical poetry if appropriate)
5. Translations of examples
6. Pinyin for each example

Follow this strict output format WITHOUT using markdown code blocks or any other formatting:
{
  "word": "汉字",
  "pinyin": "hàn zì",
  "level": "HSK level (e.g., HSK3)",
  "translation": [
    {
      "meaning": "meaning 1",
      "partOfSpeech": "noun/verb/adj/etc"
    },
    {
      "meaning": "meaning 2",
      "partOfSpeech": "noun/verb/adj/etc"
    }
  ],
  "example": [
    {
      "sentence": "Example sentence 1 in Chinese",
      "translation": "English translation of example 1",
      "pinyin": "Pinyin for example 1"
    },
    {
      "sentence": "Example sentence 2 in Chinese",
      "translation": "English translation of example 2",
      "pinyin": "Pinyin for example 2"
    }
  ],
  "version": "1.0"
}

IMPORTANT: Return ONLY valid JSON. No markdown formatting, no code blocks, no additional text, just the JSON object.
`;

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      {
        role: "user" as const,
        content: `Generate a comprehensive explanation for the Chinese character/word: "${word}"`,
      },
    ];

    // Generate the explanation
    const response = await ai.generateCompletion(messages, {
      temperature: 0.5,
      maxTokens: 1200,
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

    console.log("Processing AI response for word:", word);

    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", response);
      console.error("Cleaned response:", cleanedResponse);
      throw new Error(`Failed to parse AI response for word "${word}"`);
    }

    // Validate the response has all required fields
    if (
      !parsedResponse.word ||
      !parsedResponse.pinyin ||
      !parsedResponse.translation ||
      !Array.isArray(parsedResponse.translation) ||
      !parsedResponse.example ||
      !Array.isArray(parsedResponse.example)
    ) {
      throw new Error(
        `AI response for word "${word}" is missing required fields`
      );
    }

    // Ensure word field matches input word
    if (parsedResponse.word !== word) {
      parsedResponse.word = word;
    }

    // Ensure version field exists
    if (!parsedResponse.version) {
      parsedResponse.version = "1.0";
    }

    // Get our own pinyin as a backup and validation
    const backupPinyin = getPinyinForWord(word);

    // Format as TVocabulary
    const vocabularyEntry: TVocabulary = {
      word: parsedResponse.word,
      // Use the AI-generated pinyin if it seems valid, otherwise use our backup
      pinyin: parsedResponse.pinyin?.trim()
        ? parsedResponse.pinyin
        : backupPinyin,
      level: parsedResponse.level || "HSK4", // Default to HSK4 if not provided
      translation: parsedResponse.translation.map((t: any) => ({
        meaning: t.meaning || "Unknown meaning",
        partOfSpeech: t.partOfSpeech || "noun",
      })),
      example: parsedResponse.example.map((e: any) => ({
        sentence: e.sentence || `Example with "${word}"`,
        translation: e.translation || "Translation not available",
        pinyin:
          e.pinyin ||
          `${getPinyinForWord(e.sentence || `这个"${word}"字很常用。`)}`,
      })),
      poemIds: [], // Will be set by the calling function
      version: parsedResponse.version,
    };

    return vocabularyEntry;
  } catch (error) {
    console.error(
      `Error generating vocabulary explanation for word "${word}":`,
      error
    );
    throw error;
  }
};

// Function to get pinyin using pinyin-pro package
const getPinyinForWord = (word: string): string => {
  try {
    // Get pinyin with tone marks
    return pinyin(word, { toneType: "symbol", type: "array" }).join(" ");
  } catch (error) {
    console.error(`Error generating pinyin for word "${word}":`, error);
    return getDefaultPinyin(word);
  }
};

// Function to get default pinyin for common characters
const getDefaultPinyin = (word: string): string => {
  const commonPinyin: Record<string, string> = {
    人: "rén",
    山: "shān",
    水: "shuǐ",
    天: "tiān",
    地: "dì",
    日: "rì",
    风: "fēng",
    云: "yún",
    花: "huā",
    鸟: "niǎo",
    树: "shù",
    草: "cǎo",
    木: "mù",
    火: "huǒ",
    土: "tǔ",
    金: "jīn",
    玉: "yù",
    石: "shí",
    心: "xīn",
    手: "shǒu",
    口: "kǒu",
    目: "mù",
    耳: "ěr",
    鼻: "bí",
    头: "tóu",
    足: "zú",
    白: "bái",
    黑: "hēi",
    红: "hóng",
    绿: "lǜ",
    蓝: "lán",
    黄: "huáng",
    大: "dà",
    小: "xiǎo",
    长: "cháng",
    短: "duǎn",
    高: "gāo",
    低: "dī",
    中: "zhōng",
    外: "wài",
    内: "nèi",
    前: "qián",
    后: "hòu",
    左: "zuǒ",
    右: "yòu",
    上: "shàng",
    下: "xià",
    东: "dōng",
    南: "nán",
    西: "xī",
    北: "běi",
    春: "chūn",
    夏: "xià",
    秋: "qiū",
    冬: "dōng",
    年: "nián",
    月: "yuè",
    时: "shí",
    分: "fēn",
    秒: "miǎo",
    一: "yī",
    二: "èr",
    三: "sān",
    四: "sì",
    五: "wǔ",
    六: "liù",
    七: "qī",
    八: "bā",
    九: "jiǔ",
    十: "shí",
    百: "bǎi",
    千: "qiān",
    万: "wàn",
    亿: "yì",
    情: "qíng",
    爱: "ài",
    恨: "hèn",
    喜: "xǐ",
    怒: "nù",
    哀: "āi",
    乐: "lè",
    思: "sī",
    想: "xiǎng",
    言: "yán",
    语: "yǔ",
    文: "wén",
    字: "zì",
    诗: "shī",
    歌: "gē",
    酒: "jiǔ",
    茶: "chá",
    米: "mǐ",
    面: "miàn",
    菜: "cài",
    肉: "ròu",
    鱼: "yú",
    家: "jiā",
    国: "guó",
    城: "chéng",
    乡: "xiāng",
    路: "lù",
    桥: "qiáo",
    门: "mén",
    窗: "chuāng",
    房: "fáng",
    屋: "wū",
    故: "gù",
    江: "jiāng",
    // add more as needed
  };

  return commonPinyin[word] || `${word} (pinyin unknown)`;
};

// Process vocabulary for a poem
const processVocabularyForPoem = async (
  poemId: string
): Promise<TVocabulary[]> => {
  try {
    // 1. Get the poem
    const poem = await PoemService.getPoemById(poemId);
    if (!poem) {
      throw new Error(`Poem with ID ${poemId} not found`);
    }

    // 2. Extract unique vocabulary words
    const vocabularyWords = extractVocabularyWords(poem);

    // 3. Check which words already exist in database
    const existingVocabularyMap = new Map<string, TVocabulary>();
    const wordsToGenerate: string[] = [];

    for (const word of vocabularyWords) {
      const existingWord = await getVocabularyByWord(word);

      if (existingWord) {
        // Word exists, add to map and update poemIds if needed
        existingVocabularyMap.set(word, existingWord);

        // Add current poem ID to poemIds if not already present
        if (!existingWord.poemIds.includes(poemId)) {
          existingWord.poemIds.push(poemId);
          await Vocabulary.findByIdAndUpdate(
            existingWord._id,
            { poemIds: existingWord.poemIds },
            { new: true }
          );
        }
      } else {
        // Word doesn't exist, add to list to generate
        wordsToGenerate.push(word);
      }
    }

    // 4. Generate explanations for new words
    const generatedVocabulary: TVocabulary[] = [];

    for (const word of wordsToGenerate) {
      console.log(`Generating explanation for word: ${word}`);

      try {
        // Check if we have local data for common character
        const localExplanation = getLocalVocabularyExplanation(word);
        if (localExplanation) {
          // Use local data if available
          localExplanation.poemIds = [poemId];
          const saved = await Vocabulary.create(localExplanation);
          generatedVocabulary.push(saved);
          console.log(`Used local data for word: ${word}`);
        } else {
          // Try to use AI to generate explanation
          try {
            // Generate explanation
            const explanation = await generateVocabularyExplanation(word);

            // Add current poem ID
            explanation.poemIds = [poemId];

            // Save to database
            const saved = await Vocabulary.create(explanation);
            generatedVocabulary.push(saved);
          } catch (aiError) {
            console.error(`AI error for word ${word}:`, aiError);

            // Use fallback explanation
            const fallbackExplanation = createFallbackExplanation(word, poemId);
            const saved = await Vocabulary.create(fallbackExplanation);
            generatedVocabulary.push(saved);
          }
        }

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error generating explanation for word ${word}:`, error);
      }
    }

    // 5. Combine existing and newly generated vocabulary
    const allVocabulary = [
      ...Array.from(existingVocabularyMap.values()),
      ...generatedVocabulary,
    ];

    return allVocabulary;
  } catch (error) {
    console.error("Error processing vocabulary for poem:", error);
    throw error;
  }
};

// Create a fallback explanation for a word
const createFallbackExplanation = (
  word: string,
  poemId: string
): TVocabulary => {
  return {
    word,
    pinyin: getPinyinForWord(word),
    level: "HSK4",
    translation: [{ meaning: `Character ${word}`, partOfSpeech: "noun" }],
    example: [
      {
        sentence: `这个"${word}"字很常用。`,
        translation: `This character "${word}" is commonly used.`,
        pinyin: `zhè gè "${word}" zì hěn cháng yòng.`,
      },
    ],
    poemIds: [poemId],
    version: "1.0",
  };
};

// Get local vocabulary explanation for common characters
const getLocalVocabularyExplanation = (word: string): TVocabulary | null => {
  const localData: Record<string, Omit<TVocabulary, "poemIds">> = {
    故: {
      word: "故",
      pinyin: "gù",
      level: "HSK4",
      translation: [
        { meaning: "old; ancient", partOfSpeech: "adjective" },
        { meaning: "reason; cause", partOfSpeech: "noun" },
      ],
      example: [
        {
          sentence: "故人西辞黄鹤楼。",
          translation: "My old friend bids farewell at the Yellow Crane Tower.",
          pinyin: "Gù rén xī cí huáng hè lóu.",
        },
        {
          sentence: "不知何故他没来。",
          translation: "I don't know why he didn't come.",
          pinyin: "Bù zhī hé gù tā méi lái.",
        },
      ],
      version: "1.0",
    },
    人: {
      word: "人",
      pinyin: "rén",
      level: "HSK1",
      translation: [
        { meaning: "person; people", partOfSpeech: "noun" },
        { meaning: "human being", partOfSpeech: "noun" },
      ],
      example: [
        {
          sentence: "这个人很友好。",
          translation: "This person is very friendly.",
          pinyin: "Zhè gè rén hěn yǒu hào.",
        },
        {
          sentence: "中国人喜欢吃饺子。",
          translation: "Chinese people like to eat dumplings.",
          pinyin: "Zhōng guó rén xǐ huān chī jiǎo zi.",
        },
      ],
      version: "1.0",
    },
    西: {
      word: "西",
      pinyin: "xī",
      level: "HSK1",
      translation: [
        { meaning: "west", partOfSpeech: "noun" },
        { meaning: "western", partOfSpeech: "adjective" },
      ],
      example: [
        {
          sentence: "太阳从西边落下。",
          translation: "The sun sets in the west.",
          pinyin: "Tài yáng cóng xī biān luò xià.",
        },
        {
          sentence: "我住在城市的西部。",
          translation: "I live in the western part of the city.",
          pinyin: "Wǒ zhù zài chéng shì de xī bù.",
        },
      ],
      version: "1.0",
    },
    长: {
      word: "长",
      pinyin: "cháng",
      level: "HSK1",
      translation: [
        { meaning: "long", partOfSpeech: "adjective" },
        { meaning: "to grow", partOfSpeech: "verb" },
      ],
      example: [
        {
          sentence: "长江天际流。",
          translation: "The Yangtze River flows to the horizon.",
          pinyin: "Cháng jiāng tiān jì liú.",
        },
        {
          sentence: "他的头发很长。",
          translation: "His hair is very long.",
          pinyin: "Tā de tóu fǎ hěn cháng.",
        },
      ],
      version: "1.0",
    },
    江: {
      word: "江",
      pinyin: "jiāng",
      level: "HSK3",
      translation: [{ meaning: "river", partOfSpeech: "noun" }],
      example: [
        {
          sentence: "长江是中国最长的河。",
          translation: "The Yangtze River is the longest river in China.",
          pinyin: "Cháng jiāng shì zhōng guó zuì cháng de hé.",
        },
        {
          sentence: "我们在江边散步。",
          translation: "We took a walk by the river.",
          pinyin: "Wǒ men zài jiāng biān sàn bù.",
        },
      ],
      version: "1.0",
    },
  };

  return word in localData ? { ...localData[word], poemIds: [] } : null;
};

export const VocabularyService = {
  getAllVocabulary,
  getVocabularyByWord,
  getVocabularyByPoemId,
  extractVocabularyWords,
  generateVocabularyExplanation,
  processVocabularyForPoem,
};
