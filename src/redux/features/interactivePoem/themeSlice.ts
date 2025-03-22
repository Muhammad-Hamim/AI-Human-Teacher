import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface ThemeState {
  mode: "light" | "dark"
  fontSize: "small" | "medium" | "large"
  highContrast: boolean
}

// Changed default mode to dark
const initialState: ThemeState = {
  mode: "dark",
  fontSize: "medium",
  highContrast: false,
}

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<"light" | "dark">) => {
      state.mode = action.payload
    },
    toggleThemeMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light"
    },
    setFontSize: (state, action: PayloadAction<"small" | "medium" | "large">) => {
      state.fontSize = action.payload
    },
    toggleHighContrast: (state) => {
      state.highContrast = !state.highContrast
    },
  },
})

export const { setThemeMode, toggleThemeMode, setFontSize, toggleHighContrast } = themeSlice.actions

export default themeSlice.reducer

