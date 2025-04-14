import express from "express";
import { QuizController } from "./quiz.controller";

const router = express.Router();

/**
 * @route GET /api/v1/ai/quiz/:poemId
 * @desc Generate a quiz based on a poem
 * @access Private
 * @query language - Response language (zh-CN or en-US)
 * @query knowledgeLevel - User knowledge level (beginner, intermediate, advanced)
 * @query numQuestions - Number of questions to generate (1-15)
 */
router.get("/:poemId", QuizController.generateQuiz);

export const QuizRoutes = router;
export default router;
