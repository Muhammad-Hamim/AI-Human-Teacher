import { Router } from "express";
import { PoemController } from "./poem.controller";
import validateRequest from "../../middlewares/validateRequest";
import { PoemValidation } from "./poem.validation";

const router = Router();

// Get all poems
router.get("/", PoemController.getAllPoems);

// Get a single poem
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
