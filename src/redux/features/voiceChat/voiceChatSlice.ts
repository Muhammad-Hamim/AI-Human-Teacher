import { createSlice } from "@reduxjs/toolkit"
import type { RootState } from "@/redux/store"

interface VoiceChatState {
  isOpen: boolean
}

const initialState: VoiceChatState = {
  isOpen: false,
}

export const voiceChatSlice = createSlice({
  name: "voiceChat",
  initialState,
  reducers: {
    openVoiceChat: (state) => {
      state.isOpen = true
    },
    closeVoiceChat: (state) => {
      state.isOpen = false
    },
    toggleVoiceChat: (state) => {
      state.isOpen = !state.isOpen
    },
  },
})

export const { openVoiceChat, closeVoiceChat, toggleVoiceChat } = voiceChatSlice.actions

export const selectVoiceChatOpen = (state: RootState) => state.voiceChat.isOpen

export default voiceChatSlice.reducer

