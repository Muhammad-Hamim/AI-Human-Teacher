import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface QuizResult {
  quizType: string
  score: number
  totalQuestions: number
  timestamp: number
}

interface PronunciationResult {
  text: string
  accuracy: number
  timestamp: number
}

interface WritingPractice {
  character: string
  attempts: number
  lastPracticed: number
}

interface UserProgressState {
  quizResults: QuizResult[]
  pronunciationResults: PronunciationResult[]
  writingPractice: WritingPractice[]
  completedLessons: string[]
  skillLevels: {
    reading: number
    writing: number
    speaking: number
    comprehension: number
  }
}

const initialState: UserProgressState = {
  quizResults: [],
  pronunciationResults: [],
  writingPractice: [],
  completedLessons: [],
  skillLevels: {
    reading: 1,
    writing: 1,
    speaking: 1,
    comprehension: 1,
  },
}

const userProgressSlice = createSlice({
  name: "userProgress",
  initialState,
  reducers: {
    addQuizResult: (state, action: PayloadAction<QuizResult>) => {
      state.quizResults.push(action.payload)

      // Update skill level based on quiz performance
      const { score, totalQuestions } = action.payload
      const percentage = (score / totalQuestions) * 100

      if (percentage >= 80) {
        state.skillLevels.comprehension = Math.min(10, state.skillLevels.comprehension + 0.5)
        state.skillLevels.reading = Math.min(10, state.skillLevels.reading + 0.3)
      }
    },

    addPronunciationResult: (state, action: PayloadAction<PronunciationResult>) => {
      state.pronunciationResults.push(action.payload)

      // Update speaking skill level based on pronunciation accuracy
      const { accuracy } = action.payload
      if (accuracy >= 80) {
        state.skillLevels.speaking = Math.min(10, state.skillLevels.speaking + 0.5)
      }
    },

    addWritingPractice: (state, action: PayloadAction<{ character: string }>) => {
      const { character } = action.payload
      const existingPractice = state.writingPractice.find((p) => p.character === character)

      if (existingPractice) {
        existingPractice.attempts += 1
        existingPractice.lastPracticed = Date.now()
      } else {
        state.writingPractice.push({
          character,
          attempts: 1,
          lastPracticed: Date.now(),
        })
      }

      // Update writing skill level based on practice frequency
      if (state.writingPractice.length > 5) {
        state.skillLevels.writing = Math.min(10, state.skillLevels.writing + 0.2)
      }
    },

    completeLesson: (state, action: PayloadAction<string>) => {
      if (!state.completedLessons.includes(action.payload)) {
        state.completedLessons.push(action.payload)
      }
    },
  },
})

export const { addQuizResult, addPronunciationResult, addWritingPractice, completeLesson } = userProgressSlice.actions

export default userProgressSlice.reducer

