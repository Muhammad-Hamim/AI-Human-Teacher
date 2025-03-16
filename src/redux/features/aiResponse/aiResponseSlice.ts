import { createSlice } from "@reduxjs/toolkit";

type TInitialState = {
  id: string;
  userId: string;
  user: string;
  chatId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

const initialState: TInitialState = {
  id: "",
  userId: "",
  user: "",
  chatId: "",
  content: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const aiResponseSlice = createSlice({
  name: "aiResponse",
  initialState,
  reducers: {},
});
export default aiResponseSlice.reducer;
