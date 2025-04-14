import { AIFactory } from "../aifactory/AIFactory";
import AppError from "../../errors/AppError";
import { Poem } from "../../Models/poem/poem.model";
import { TPoem } from "../../Models/poem/poem.interface";

interface QuizGenerationParams {
  poemId: string;
  language: string;
  knowledgeLevel: string;
  numQuestions: number;
}

interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "fill-blank" | "essay";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  sampleAnswer?: string;
}

interface QuizResponse {
  difficulty: string;
  questions: QuizQuestion[];
  adaptiveRecommendation?: string;
}

/**
 * Generate a simple random ID
 */
const generateQuestionId = (): string => {
  return "quiz-" + Math.random().toString(36).substring(2, 10);
};

/**
 * Generate a knowledge assessment quiz based on a poem
 */
const generateQuiz = async ({
  poemId,
  language = "zh-CN",
  knowledgeLevel = "intermediate",
  numQuestions = 5,
}: QuizGenerationParams): Promise<QuizResponse> => {
  try {
    // Validate and limit the number of questions
    const limitedNumQuestions = Math.min(Math.max(1, numQuestions), 15);

    // Get the poem data from the database
    const poem = await Poem.findById(poemId);
    if (!poem) {
      throw new AppError(404, "Poem not found");
    }

    // Extract poem content
    const poemContent = poem.lines.map((line: any) => line.chinese).join("\n");
    const poemTranslation = poem.lines
      .map((line: any) => line.translation)
      .join("\n");

    // Create system prompt for quiz generation
    const systemPrompt = `You are an AI language teacher specializing in ${language === "zh-CN" ? "Chinese" : "English"} language education.
Your task is to create a knowledge assessment quiz based on this poem:

Title: ${poem.title}
Author: ${poem.author}
Dynasty: ${poem.dynasty || "Unknown"}
Content: ${poemContent}
Translation: ${poemTranslation}

Generate ${limitedNumQuestions} questions to assess the student's understanding at a ${knowledgeLevel} level.
The quiz should include a mix of:
1. Multiple-choice questions about vocabulary, cultural context, or meaning of the poem
2. Fill-in-the-blank questions to test knowledge of specific words or phrases
3. For advanced level, include 1-2 essay questions for deeper analysis

Format your response as a valid JSON object with the following structure:
{
  "difficulty": "${knowledgeLevel}",
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation of why this is the correct answer"
    },
    {
      "type": "fill-blank",
      "question": "Fill in the blank: _____ is the capital of China",
      "correctAnswer": "Beijing",
      "explanation": "Beijing is the capital of the People's Republic of China"
    },
    {
      "type": "essay",
      "question": "Essay question prompt",
      "sampleAnswer": "Sample model answer for grading reference"
    }
  ],
  "adaptiveRecommendation": "2-3 sentences recommending what to study next based on this quiz content"
}

IMPORTANT: Return ONLY the JSON object without any markdown formatting, code blocks, or additional text. The response should be a valid JSON string that can be directly parsed.

The quiz should be in ${language === "zh-CN" ? "Chinese" : "English"} language.
For ${knowledgeLevel} level, focus on ${getKnowledgeLevelGuidance(knowledgeLevel)}.
Ensure all multiple-choice questions have exactly 4 options.`;

    // Create user message
    const userMessage = `Generate a ${knowledgeLevel} level quiz with ${limitedNumQuestions} questions about this poem in ${language === "zh-CN" ? "Chinese" : "English"} language.`;

    try {
      // Create AI instance
      const AI = AIFactory.createAI();

      // Call the AI with system prompt and user message
      const response = await AI.getCompletion({
        systemPrompt,
        userPrompt: userMessage,
      });

      // Validate and process the quiz data - let processQuizData handle the parsing
      return processQuizData(response);
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      throw new AppError(500, `Failed to generate quiz: ${error.message}`);
    }
  } catch (error: any) {
    console.error("Error in generateQuiz:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, `Quiz generation failed: ${error.message}`);
  }
};

/**
 * Process and validate quiz data from AI response
 */
const processQuizData = (quizData: any): QuizResponse => {
  try {
    // If the response is a string (which happens when the AI returns markdown), try to extract the JSON
    if (typeof quizData === "string") {
      // Check if response contains markdown code blocks
      const jsonMatch = quizData.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        // Extract JSON from markdown code block
        quizData = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing the entire string as JSON
        quizData = JSON.parse(quizData);
      }
    }

    if (
      !quizData ||
      !Array.isArray(quizData.questions) ||
      quizData.questions.length === 0
    ) {
      throw new AppError(500, "Invalid quiz data format from AI");
    }

    // Ensure each question has a unique ID
    const questions = quizData.questions.map((q: any) => ({
      ...q,
      id: generateQuestionId(),
    }));

    return {
      difficulty: quizData.difficulty || "intermediate",
      questions,
      adaptiveRecommendation: quizData.adaptiveRecommendation,
    };
  } catch (error: any) {
    console.error("Error processing quiz data:", error);
    throw new AppError(500, `Failed to process quiz data: ${error.message}`);
  }
};

/**
 * Get guidance text based on knowledge level
 */
const getKnowledgeLevelGuidance = (level: string): string => {
  switch (level) {
    case "beginner":
      return "basic vocabulary, simple grammar patterns, and literal understanding of the poem";
    case "intermediate":
      return "figurative language, cultural context, and moderate analysis of themes";
    case "advanced":
      return "deep literary analysis, historical context, complex language features, and comparative elements";
    default:
      return "understanding appropriate for their level";
  }
};

export const QuizService = {
  generateQuiz,
};

export default QuizService;
