import { Router } from "express";
import { PoemController } from "./poem.controller";
import validateRequest from "../../middlewares/validateRequest";
import { PoemValidation } from "./poem.validation";
import { ImagerySymbolismController } from "./imagery-symbolism.controller";
import { PoemImageController } from "./poem-image.controller";

const router = Router();

// Get all poems
router.get("/", PoemController.getAllPoems);

// Imagery and Symbolism route - always generates fresh content
router.get(
  "/imagery-symbolism/:poemId",
  ImagerySymbolismController.getImagerySymbolism
);

// Poem Image generation route
router.get("/image/:poemId", PoemImageController.generatePoemImage);

// Get poem by ID - keep this after more specific routes
router.get("/:id", PoemController.getPoemById);

// Create a new poem
router.post(
  "/",
  validateRequest(PoemValidation.createPoemValidationSchema),
  PoemController.createPoem
);

// Update a poem
router.put(
  "/:id",
  validateRequest(PoemValidation.updatePoemValidationSchema),
  PoemController.updatePoem
);

// Delete a poem
router.delete("/:id", PoemController.deletePoem);

export const PoemRouter = router;
