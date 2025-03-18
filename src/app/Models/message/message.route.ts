import { Router } from "express";
import { MessageController } from "./message.controller";
import validateRequest from "../../middlewares/validateRequest";
import { MessageValidation } from "./message.validation";
import auth from "../../middlewares/auth";

const router = Router();

// Create a new message
router.post(
  "/",
  validateRequest(MessageValidation.createMessageValidationSchema),
  MessageController.createMessage
);

// Get all messages for a chat
router.get("/chat/:chatId", MessageController.getMessagesForChat);

// Get a message by ID
router.get("/:id", MessageController.getMessageById);

// Update a message
router.patch(
  "/:id",
  
  validateRequest(MessageValidation.updateMessageValidationSchema),
  MessageController.updateMessage
);

// Delete a message
router.delete("/:id", auth(), MessageController.deleteMessage);

export const MessageRouter = router; 