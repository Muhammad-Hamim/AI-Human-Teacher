import { Router } from "express";
import { ChatController } from "./chat.controller";
import validateRequest from "../../middlewares/validateRequest";
import { ChatValidation } from "./chat.validation";

const router = Router();

// Create a new chat
router.post(
  "/",

  validateRequest(ChatValidation.createChatValidationSchema),
  ChatController.createChat
);

// Get all chats for a user
router.get("/user/:userId", ChatController.getChatsForUser);

// Get a chat by ID
router.get("/:id", ChatController.getChatById);

// Update a chat
router.patch(
  "/:id",

  validateRequest(ChatValidation.updateChatValidationSchema),
  ChatController.updateChat
);

// Delete a chat
router.delete("/:id", ChatController.deleteChat);

export const ChatRouter = router;
