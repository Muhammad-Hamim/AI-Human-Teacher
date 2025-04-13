import AppError from "../../../app/errors/AppError";
import AIFactory from "../../AI/aifactory/AIFactory";
import { PoemService } from "../../Models/poem/poem.service";
import { Logger } from "../../../utils/logger";

interface EmotionalJourney {
  name: string;
  lines: string;
  intensity: number;
  color: string;
  explanation: string;
}

interface EmotionalTheme {
  name: string;
  intensity: string;
  color: string;
}

interface LiteraryDevice {
  name: string;
  description: string;
  color: string;
}

interface AIAnalysisResponse {
  aiPoweredAnalysis: {
    emotionalTone: string;
    literaryTechniques: string;
    modernRelevance: string;
    emotionalJourney: EmotionalJourney[];
    emotionalThemes: EmotionalTheme[];
    literaryDevices: LiteraryDevice[];
    structure: {
      form: string;
      characteristics: string[];
    };
    contemporaryParallels: string[];
    historicalComparisons: Array<{
      aspect: string;
      then: string;
      now: string;
    }>;
    modernInterpretations: Array<{
      quote: string;
      attribution: string;
      color: string;
    }>;
  };
}

function cleanAIResponse(response: string): string {
  // Remove markdown code blocks
  let cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "");

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();

  // Ensure we have valid JSON by checking for opening brace
  if (!cleaned.startsWith("{")) {
    const jsonStart = cleaned.indexOf("{");
    if (jsonStart !== -1) {
      cleaned = cleaned.slice(jsonStart);
    }
  }

  // Remove any trailing text after the last closing brace
  const lastBrace = cleaned.lastIndexOf("}");
  if (lastBrace !== -1) {
    cleaned = cleaned.slice(0, lastBrace + 1);
  }

  return cleaned;
}

export const analyzePoem = async (
  poemId: string,
  language: string
): Promise<AIAnalysisResponse> => {
  try {
    const poem = await PoemService.getPoemById(poemId);

    if (!poem) {
      throw new AppError(404, "Poem not found");
    }

    const ai = AIFactory.createAI();

    const systemPrompt = `You are a literary expert tasked with analyzing this Chinese poem.
    Respond ONLY with a JSON object in the following structure, without any additional text or markdown:
    {
  "aiPoweredAnalysis": {
    "emotionalTone":"The poem conveys a deep sense of nostalgia and longing through the interplay of moonlight and reflection. The emotional progression moves from quiet observation to profound homesickness.",
    "literaryTechniques": "Li Bai masterfully employs imagery, metaphor, and contrasting perspectives to create a profound emotional impact with remarkable economy of language.",
    "modernRelevance":"The themes of separation and longing resonate strongly in our modern world of global mobility and digital connection.",
    "rhythmPattern": {
      "structure": "五言绝句",
      "lines": [
        {
          "text": "床前明月光",
          "tones": ["平", "平", "平", "仄", "平"],
          "annotation": "First line establishes the scene with a balanced tonal pattern"
        },
        {
          "text": "疑是地上霜",
          "tones": ["平", "仄", "仄", "平", "平"],
          "annotation": "Second line uses contrasting tones to create tension"
        },
        {
          "text": "疑是地上霜",
          "tones": ["平", "仄", "仄", "平", "平"],
          "annotation": "Second line uses contrasting tones to create tension"
        },
        {
          "text": "举头望明月",
          "tones": ["仄", "平", "仄", "平", "仄"],
          "annotation": "Third line shifts the rhythm to mirror the upward gaze"
        },
        {
          "text": "低头思故乡",
          "tones": ["平", "平", "平", "仄", "平"],
          "annotation": "Final line returns to a balanced pattern for closure"
        }
      ],
      "rules": 
       [
          "Each line contains exactly five characters",
          "Tonal pattern alternates between level (平) and oblique (仄) tones",
          "Key positions (end of lines) typically use level tones for stability"
        ]
    },
    "emotionalJourney": [
      {
        "name": "Observation",
        "lines": "1-2",
        "intensity": 40,
        "color": "#4A90E2",
        "explanation": "The poem opens with quiet, contemplative observation of natural phenomena"
      },
      {
        "name": "Connection",        
        "lines": "3",
        "intensity": 70,
        "color": "#9B51E0",
        "explanation": "The act of looking up at the moon creates a bridge between the poet and home"
      },
      {
        "name": "Longing",
        "lines": "4",
        "intensity": 90,
        "color": "#E24A4A",
        "explanation": "The poem culminates in an expression of profound homesickness"
      },
      {
        "name": "Connection",        
        "lines": "3",
        "intensity": 70,
        "color": "#9B51E0",
        "explanation": "The act of looking up at the moon creates a bridge between the poet and home"
      },
      {
        "name": "Observation",
        "lines": "1-2",
        "intensity": 40,
        "color": "#4A90E2",
        "explanation": "The poem opens with quiet, contemplative observation of natural phenomena"
      }
    ],
    "literaryDevices": [
      {
        "name": "Visual Metaphor",
        "description": "Moonlight is compared to frost, creating a visual parallel between celestial and terrestrial elements",
        "color": "#F5A623",
        "lines": ["疑是地上霜"]
      },
      {
        "name": "Spatial Contrast",
        "description": "Juxtaposition of upward and downward gazes creates emotional depth",
        "color": "#4A90E2",
        "lines": ["举头望明月", "低头思故乡"]
      },
      {
        "name": "Imagery",
        "description": "Vivid descriptions evoke sensory experiences",
        "color": "#F8E71C",
        "lines": ["床前明月光", "疑是地上霜"]
      },
      {
        "name": "Visual Metaphor",
        "description": "Moonlight is compared to frost, creating a visual parallel between celestial and terrestrial elements",
        "color": "#F5A623",
        "lines": ["疑是地上霜"]
      },
      {
        "name": "Spatial Contrast",
        "description": "Juxtaposition of upward and downward gazes creates emotional depth",
        "color": "#4A90E2",
        "lines": ["举头望明月", "低头思乡"]
      }
    ],
    "structure": {
      "form": "Five-character quatrain (Wuyan Jueju)",

    
      "characteristics": [
        "Compact four-line structure with precise rhythm",
        "Traditional tonal pattern following Tang dynasty rules",
        "Symmetrical composition with parallel imagery"
      ]
    },
    "historicalComparisons": [
      {
        "aspect": "Communication Methods",
        "then": "Letters and physical messages",
        "now": "Instant digital messaging"
      },
      {
        "aspect": "Travel Capabilities",
        "then": "Limited by physical constraints",
        "now": "Global mobility and accessibility"
      }
    ],
    "culturalSignificance": 
      "The moon serves as a universal symbol connecting separated loved ones, particularly resonant in Chinese culture where the Moon Festival celebrates family reunion."
  }
}

    Use ${language} language for all text content. Use simple sentences but analysis should be in detail and insightful.
    Response must be valid JSON. Do not include any markdown, text, or explanations outside the JSON structure.`;

    const userPrompt = `Analyze this classical Chinese poem:

Title: ${poem.title}
Author: ${poem.author}
Dynasty: ${poem.dynasty}

Original Text:
${poem.lines.map((line, idx) => `${idx + 1}. ${line.chinese}`).join("\n")}

Translation:
${poem.lines.map((line, idx) => `${idx + 1}. ${line.translation}`).join("\n")}

Historical Context:
${poem.historicalCulturalContext}

Cultural Background:
${poem.explanation}

${
  poem.imageryAndSymbolism
    ? `Imagery and Symbolism:
  ${Object.entries(poem.imageryAndSymbolism)
    .map(
      ([symbol, details]) =>
        `${symbol}:
    - Description: ${details.description}
    - Cultural Significance: ${details.culturalSignificance.join(", ")}
    - Keywords: ${details.keywords.join(", ")}`
    )
    .join("\n\n")}`
    : ""
}`;

    try {
      const analysisResponse = await ai.generateCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: 0.7,
          maxTokens: 4000,
        }
      );

      // Clean the response before parsing
      const cleanedResponse = cleanAIResponse(analysisResponse);
      Logger.debug("Cleaned AI Response:", cleanedResponse);

      try {
        const analysis = JSON.parse(cleanedResponse);

        if (!analysis.aiPoweredAnalysis) {
          Logger.error("Invalid AI response structure:", analysis);
          throw new Error(
            "Invalid response format - missing aiPoweredAnalysis"
          );
        }

        return analysis;
      } catch (parseError) {
        Logger.error(
          "Failed to parse AI response:",
          parseError,
          "\nResponse:",
          cleanedResponse
        );
        throw new AppError(500, "Failed to parse AI analysis response");
      }
    } catch (aiError) {
      Logger.error("AI Analysis error:", String(aiError));
      throw new AppError(500, "Failed to generate poem analysis");
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    Logger.error("Unexpected error during poem analysis:", String(error));
    throw new AppError(500, "Failed to analyze poem");
  }
};
