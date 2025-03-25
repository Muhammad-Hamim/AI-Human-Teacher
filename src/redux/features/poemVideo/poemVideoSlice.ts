import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AnimationStyle {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
}

export interface AnimationTiming {
  duration: number;
  delay: number;
  staggering: number;
}

export interface PoemVideoState {
  poem: {
    title: string;
    content: string;
    isUploaded: boolean;
  };
  images: {
    serializedFiles: {
      name: string;
      type: string;
      size: number;
      lastModified: number;
    }[];
    previews: string[];
  };
  audio: {
    serializedFile: {
      name: string;
      type: string;
      size: number;
      lastModified: number;
    } | null;
    base64: string;
    isUploaded: boolean;
  };
  animation: {
    selectedStyle: string;
    timing: AnimationTiming;
    availableStyles: AnimationStyle[];
  };
  processing: {
    isGenerating: boolean;
    progress: number;
    error: string | null;
  };
  output: {
    videoUrl: string;
    generatedAt: string | null;
  };
}

const initialState: PoemVideoState = {
  poem: {
    title: "",
    content: "",
    isUploaded: false,
  },
  images: {
    serializedFiles: [],
    previews: [],
  },
  audio: {
    serializedFile: null,
    base64: "",
    isUploaded: false,
  },
  animation: {
    selectedStyle: "fade",
    timing: {
      duration: 2000,
      delay: 500,
      staggering: 300,
    },
    availableStyles: [
      {
        id: "fade",
        name: "Fade In",
        description: "Simple fade in animation for text and images",
        previewUrl: "/animations/fade.gif",
      },
      {
        id: "slide",
        name: "Slide In",
        description: "Elements slide in from the sides",
        previewUrl: "/animations/slide.gif",
      },
      {
        id: "zoom",
        name: "Zoom In",
        description: "Elements start small and zoom into view",
        previewUrl: "/animations/zoom.gif",
      },
      {
        id: "typewriter",
        name: "Typewriter",
        description: "Text appears as if being typed in real-time",
        previewUrl: "/animations/typewriter.gif",
      },
      {
        id: "stagger",
        name: "Staggered Reveal",
        description: "Elements appear one after another in sequence",
        previewUrl: "/animations/stagger.gif",
      },
    ],
  },
  processing: {
    isGenerating: false,
    progress: 0,
    error: null,
  },
  output: {
    videoUrl: "",
    generatedAt: null,
  },
};

export const poemVideoSlice = createSlice({
  name: "poemVideo",
  initialState,
  reducers: {
    setPoemTitle: (state, action: PayloadAction<string>) => {
      state.poem.title = action.payload;
    },
    setPoemContent: (state, action: PayloadAction<string>) => {
      state.poem.content = action.payload;
      state.poem.isUploaded = true;
    },
    addImages: (
      state,
      action: PayloadAction<{
        serializedFiles: {
          name: string;
          type: string;
          size: number;
          lastModified: number;
        }[];
        previews: string[];
      }>
    ) => {
      state.images.serializedFiles = [
        ...state.images.serializedFiles,
        ...action.payload.serializedFiles,
      ];
      state.images.previews = [
        ...state.images.previews,
        ...action.payload.previews,
      ];
    },
    removeImage: (state, action: PayloadAction<number>) => {
      state.images.serializedFiles = state.images.serializedFiles.filter(
        (_, i) => i !== action.payload
      );
      state.images.previews = state.images.previews.filter(
        (_, i) => i !== action.payload
      );
    },
    setAudioFile: (
      state,
      action: PayloadAction<{
        serializedFile: {
          name: string;
          type: string;
          size: number;
          lastModified: number;
        };
        base64: string;
      }>
    ) => {
      state.audio.serializedFile = action.payload.serializedFile;
      state.audio.base64 = action.payload.base64;
      state.audio.isUploaded = true;
    },
    removeAudio: (state) => {
      state.audio.serializedFile = null;
      state.audio.base64 = "";
      state.audio.isUploaded = false;
    },
    setAnimationStyle: (state, action: PayloadAction<string>) => {
      state.animation.selectedStyle = action.payload;
    },
    setAnimationTiming: (
      state,
      action: PayloadAction<Partial<AnimationTiming>>
    ) => {
      state.animation.timing = { ...state.animation.timing, ...action.payload };
    },
    startGeneration: (state) => {
      state.processing.isGenerating = true;
      state.processing.progress = 0;
      state.processing.error = null;
    },
    updateProgress: (state, action: PayloadAction<number>) => {
      state.processing.progress = action.payload;
    },
    generationComplete: (state, action: PayloadAction<string>) => {
      state.processing.isGenerating = false;
      state.processing.progress = 100;
      state.output.videoUrl = action.payload;
      state.output.generatedAt = new Date().toISOString();
    },
    generationFailed: (state, action: PayloadAction<string>) => {
      state.processing.isGenerating = false;
      state.processing.error = action.payload;
    },
    resetState: () => initialState,
  },
});

export const {
  setPoemTitle,
  setPoemContent,
  addImages,
  removeImage,
  setAudioFile,
  removeAudio,
  setAnimationStyle,
  setAnimationTiming,
  startGeneration,
  updateProgress,
  generationComplete,
  generationFailed,
  resetState,
} = poemVideoSlice.actions;

export default poemVideoSlice.reducer;
