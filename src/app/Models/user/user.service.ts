import { TUser } from "./user.interface";
import { User } from "./user.model";

// Create a new user
const createUser = async (userData: TUser): Promise<TUser> => {
  const result = await User.create(userData);
  return result;
};

// Get all users
const getAllUsers = async (): Promise<TUser[]> => {
  const result = await User.find({ isDeleted: { $ne: true } });
  return result;
};

// Get a single user by ID
const getUserById = async (id: string): Promise<TUser | null> => {
  const result = await User.findOne({ _id: id, isDeleted: { $ne: true } });
  return result;
};

// Update a user
const updateUser = async (
  id: string,
  userData: Partial<TUser>
): Promise<TUser | null> => {
  const result = await User.findByIdAndUpdate(id, userData, {
    new: true,
    runValidators: true,
  });
  return result;
};

// Delete a user (soft delete)
const deleteUser = async (id: string): Promise<TUser | null> => {
  const result = await User.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  return result;
};

export const UserService = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
