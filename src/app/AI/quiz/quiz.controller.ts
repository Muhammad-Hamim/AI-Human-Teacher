import { Request, Response, NextFunction } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { QuizService } from "./quiz.service";

/**
 * Generate a quiz based on a poem with specified parameters
 */
const generateQuiz = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { poemId } = req.params;
    const {
      language = "zh-CN",
      knowledgeLevel = "intermediate",
      numQuestions = 5,
    } = req.query;

    // Convert numQuestions to a number
    const questionCount =
      typeof numQuestions === "string"
        ? parseInt(numQuestions, 10)
        : numQuestions;

    const quiz = await QuizService.generateQuiz({
      poemId,
      language: language as string,
      knowledgeLevel: knowledgeLevel as string,
      numQuestions: questionCount as number,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Quiz generated successfully",
      data: {
        quiz,
      },
    });
  }
);

export const QuizController = {
  generateQuiz,
};

export default QuizController;
