import { Router } from "express";
import { UserController } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidation } from "./user.validation";

const router = Router();

// Get all users
router.get("/", UserController.getAllUsers);

// Get a single user
router.get("/:id", UserController.getUserById);

// Create a new user
router.post(
  "/",
  validateRequest(UserValidation.createUserValidationSchema),
  UserController.createUser
);

// Update a user
router.put(
  "/:id",
  validateRequest(UserValidation.updateUserValidationSchema),
  UserController.updateUser
);

// Delete a user
router.delete("/:id", UserController.deleteUser);

export const UserRouter = router;
