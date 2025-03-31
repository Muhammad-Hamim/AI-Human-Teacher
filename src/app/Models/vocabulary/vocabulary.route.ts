import { Router } from "express";
import { VocabularyController } from "./vocabulary.controller";

const router = Router();

// Get all vocabulary
router.get("/", VocabularyController.getAllVocabulary);

// Get vocabulary by word
router.get("/word/:word", VocabularyController.getVocabularyByWord);

// Get vocabulary for a poem
router.get("/poem/:poemId", VocabularyController.getPoemVocabulary);

export const VocabularyRouter = router;
