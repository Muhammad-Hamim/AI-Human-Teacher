/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  StopCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRequestAiResponseMutation } from "@/redux/features/chat/chatApi";
import { useParams } from "react-router";
import { useCreateChatMutation } from "@/redux/features/chatHistory/chatHistoryApi";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import AudioAnalyzer from "./AudioAnalyzer";
import SpeechWaveform from "./SpeechWaveform";
import TeacherAnimation from "./TeacherAnimation";
import rehypeRaw from "rehype-raw";
import ToggleLanguage from "@/components/common/ToggleLanguage";

// Type declarations for browser APIs
declare global {
  interface Window {
    // @ts-expect-error: This is necessary to work with Web Speech API
    SpeechRecognition: any;
    // @ts-expect-error: This is necessary to work with Web Speech API
    webkitSpeechRecognition: any;
    AudioContext: any;
    webkitAudioContext: any;
  }
}

interface TeacherVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Available language options
type Language = "zh-CN" | "en-US";

// Add custom styles for markdown content
const markdownComponents = {
  // Code blocks
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-gray-900 p-2 rounded-md overflow-x-auto text-sm my-2">
      {children}
    </pre>
  ),
  // Inline code
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-gray-900 px-1 py-0.5 rounded text-sm text-teal-400 font-mono">
      {children}
    </code>
  ),
  // Headers
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-xl font-bold my-4">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-lg font-bold my-3">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-md font-bold my-2">{children}</h3>
  ),
  // Lists
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc pl-6 my-2">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal pl-6 my-2">{children}</ol>
  ),
  // Links
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a
      href={href}
      className="text-blue-400 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  // Block quotes
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-gray-600 pl-4 italic my-2">
      {children}
    </blockquote>
  ),
};

const TeacherVoiceModal = ({ isOpen, onClose }: TeacherVoiceModalProps) => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speechIntensity, setSpeechIntensity] = useState(0);
  const [createChat] = useCreateChatMutation();
  const [requestAiResponse] = useRequestAiResponseMutation();
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [processingQuery, setProcessingQuery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  // Add language state - default to Chinese
  const [language, setLanguage] = useState<Language>("zh-CN");

  // Check browser compatibility
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check browser support
      const isSpeechRecognitionSupported =
        "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
      const isSpeechSynthesisSupported = "speechSynthesis" in window;

      if (!isSpeechRecognitionSupported || !isSpeechSynthesisSupported) {
        setIsBrowserSupported(false);
        setError(
          "Your browser doesn't support the Speech Recognition API. Please try using Chrome, Edge, or Safari."
        );
        return;
      }

      // Setup speech recognition
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      // Set initial language
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        setTranscript(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event);
        if (event.error === "not-allowed") {
          setError("Microphone access denied. Please allow microphone access.");
        }
        setIsListening(false);
      };

      return () => {
        // Cleanup
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // Ignore errors when stopping
          }
        }

        if (audioRef.current) {
          audioRef.current.pause();
        }
      };
    }
  }, []);

  // Update recognition language when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
      console.log(`Speech recognition language set to: ${language}`);
    }
     // Stop listening if active

      stopListening();

  }, [language]);

  // Handle audio analysis
  const handleAudioAnalysis = (intensity: number) => {
    setSpeechIntensity(intensity);
  };

  // Toggle listening and handle query sending
  const toggleListening = () => {
    if (isListening) {
      stopListening();
      // If there's a transcript, send it when stopping
      if (transcript.trim()) {
        handleSendQuery(transcript);
      }
    } else {
      startListening();
    }
  };

  // Start listening
  const startListening = () => {
    try {
      setIsListening(true);
      setTranscript(""); // Clear previous transcript
      recognitionRef.current?.start();
      toast.success(
        `Voice chat started (${language === "zh-CN" ? "Chinese" : "English"})`
      );
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      toast.error("Error starting voice chat");
    }
  };

  // Stop listening
  const stopListening = () => {
    try {
      setIsListening(false);
      recognitionRef.current?.stop();
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
    }
  };

  // Send query to AI
  const handleSendQuery = async (query: string) => {
    if (!query.trim()) return;

    try {
      setProcessingQuery(true);
      let currentChatId = chatId;

      // If we don't have a chat ID, create a new chat
      if (!currentChatId) {
        try {
          const response = await createChat(query).unwrap();
          if (response && response.data && response.data._id) {
            currentChatId = response.data._id;
            // Navigate to the new chat
            navigate(`/ask/${currentChatId}`);
          } else {
            throw new Error("Failed to get chat ID from response");
          }
        } catch (error) {
          console.error("Error creating new chat:", error);
          toast.error("Failed to create a new chat");
          setProcessingQuery(false);
          return;
        }
      }

      // Clear previous responses
      setAiResponse("");

      try {
        // Add language context to the prompt
        const contextualPrompt =
          language === "zh-CN" ? `${query}` : ` ${query}`;

        // Use requestAiResponse instead of streamAiResponse
        const response = await requestAiResponse({
          prompt: contextualPrompt,
          chatId: currentChatId as string,
          language,
        }).unwrap();

        console.log("AI response:", response);

        // The API returns a nested structure with data property
        const aiData = response as unknown as {
          data: {
            message: { content: string };
            audio?: {
              url: string;
              data?: string;
              contentType?: string;
              voiceId?: string;
            };
          };
        };

        if (aiData.data?.message?.content) {
          // Set the AI response text
          setAiResponse(aiData.data.message.content);

          // Check and log audio availability
          if (aiData.data.audio) {
            console.log("Audio response available:", {
              hasUrl: !!aiData.data.audio.url,
              hasData: !!aiData.data.audio.data,
              contentType: aiData.data.audio.contentType,
              voiceId: aiData.data.audio.voiceId,
            });

            // Play audio if enabled
            if (audioEnabled) {
              playResponseAudio(aiData.data.audio);
            }
          } else {
            console.warn("No audio data in the response");
          }
        } else {
          setAiResponse("I couldn't generate a response. Please try again.");
          toast.error("Received empty response from AI");
        }
      } catch (error) {
        console.error("Error getting AI response:", error);
        toast.error("Failed to get AI response");
        setAiResponse(
          "Sorry, I encountered an error while processing your request. Please try again."
        );
      }
    } finally {
      setProcessingQuery(false);
      setTranscript(""); // Clear transcript after sending
    }
  };

  // Play audio from the backend
  const playResponseAudio = (audio: {
    url: string;
    data?: string;
    contentType?: string;
  }) => {
    if (!audioEnabled) return;

    try {
      // Stop any currently playing audio
      stopAudio();

      // Set speaking state to true
      setIsSpeaking(true);

      // Create audio source - prioritize base64 data over URL
      let audioSource = "";

      if (audio.data) {
        // Use base64 data when available (preferred method)
        console.log("Using base64 audio data");

        // Clean the base64 string if needed (remove any line breaks or unwanted characters)
        const cleanedBase64 = audio.data.replace(/[\r\n\s]/g, "");

        // Verify that it's a valid base64 string
        try {
          // Check if it's valid base64 by attempting to decode a small sample
          atob(cleanedBase64.substring(0, 20));
          audioSource = `data:${
            audio.contentType || "audio/wav"
          };base64,${cleanedBase64}`;
        } catch (e) {
          console.error("Invalid base64 data:", e);
          toast.error("Audio data format error");
          throw new Error("Invalid base64 data");
        }
      } else if (audio.url) {
        // Fallback to URL only if data is not available
        console.log("Falling back to audio URL");
        audioSource = audio.url.startsWith("http")
          ? audio.url
          : `${import.meta.env.VITE_APP_SERVER_URL}${audio.url}`;
      } else {
        throw new Error("No audio data or URL provided");
      }

      // Create audio element
      audioRef.current = new Audio(audioSource);

      // Set up event handlers
      audioRef.current.onplay = () => {
        console.log("Audio started playing");
        setIsSpeaking(true);
      };

      audioRef.current.onended = () => {
        console.log("Audio playback completed");
        setIsSpeaking(false);
      };

      audioRef.current.onerror = (event: any) => {
        console.error("Audio playback error:", event);
        toast.error("Failed to play audio response");
        setIsSpeaking(false);
      };

      // Start playing
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
        toast.error("Failed to play audio response");
        setIsSpeaking(false);
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      toast.error("Failed to play audio response");
      setIsSpeaking(false);
    }
  };

  // Stop audio playback
  const stopAudio = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("Error stopping audio:", error);
      setIsSpeaking(false);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (isSpeaking && audioEnabled) {
      stopAudio();
      toast.info("Voice output disabled");
    } else if (!audioEnabled) {
      toast.info("Voice output enabled");
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopAudio();
    };
  }, []);

  // Replace the speakResponse function with stopSpeaking
  const stopSpeaking = () => {
    stopAudio();
  };

  // Initialize speech synthesis (removed: no longer using browser speech synthesis)
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopListening();
      stopAudio();
    };
  }, []);

  // Render highlighted response text - without word highlighting since we're using server audio
  const renderHighlightedResponse = () => {
    if (!aiResponse) return null;

    return (
      <motion.div
        className="prose prose-invert prose-sm max-w-none text-gray-200 dark:text-white text-base leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ReactMarkdown
          components={markdownComponents}
          rehypePlugins={[rehypeRaw]}
        >
          {aiResponse}
        </ReactMarkdown>
      </motion.div>
    );
  };

  const handleClose = () => {
    stopListening();
    stopSpeaking();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] bg-gray-950 border-gray-800 text-white p-0 overflow-hidden rounded-xl flex flex-col">
        <DialogHeader className="bg-gray-900 p-4 flex flex-row items-center justify-between border-b border-gray-800 flex-shrink-0">
          <div>
            <DialogTitle className="text-xl font-bold text-white">
              Voice Conversation
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Speak your query and get AI responses with voice playback
            </DialogDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <ToggleLanguage language={language} setLanguage={setLanguage} />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className="h-8 w-8 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
              title={audioEnabled ? "Mute AI voice" : "Unmute AI voice"}
            >
              {audioEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable conversation area */}
        <div className="flex flex-col bg-gray-900 overflow-y-auto flex-grow">
          <div className="p-6 space-y-6 flex flex-col">
            {/* Add teacher animation */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <TeacherAnimation isSpeaking={isSpeaking} />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-300 shadow-md border border-gray-700 whitespace-nowrap">
                  {isSpeaking
                    ? "AI Teacher is speaking..."
                    : isListening
                    ? `Listening to you (${
                        language === "zh-CN" ? "Chinese" : "English"
                      })...`
                    : "Ready"}
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-lg">
                <p className="text-sm font-medium">{error}</p>
                <p className="text-xs mt-1 opacity-80">
                  For the best voice experience, please use a supported browser
                  like Chrome, Edge, or Safari.
                </p>
              </div>
            )}

            {/* Conversation area with transcript and AI response */}
            <div className="flex-1 flex flex-col gap-4 min-h-[300px]">
              {/* User's speech area */}
              <div className="relative h-auto min-h-24">
                <AnimatePresence>
                  {transcript && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full mb-4"
                    >
                      <div className="bg-gray-800 p-4 rounded-xl shadow-md">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-6 w-6 rounded-full bg-blue-500 items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              You
                            </span>
                          </div>
                          <p className="text-sm font-medium text-white">You</p>
                          <span className="text-xs text-gray-400">
                            ({language === "zh-CN" ? "Chinese" : "English"})
                          </span>
                        </div>
                        <p className="text-gray-200">{transcript}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Show waveform when user is speaking */}
                {isListening && !processingQuery && !isSpeaking && (
                  <div className="w-full h-12 mt-2">
                    <SpeechWaveform
                      isActive={isListening && !processingQuery && !isSpeaking}
                      intensity={speechIntensity}
                      color="#3b82f6"
                      backgroundColor="rgba(30, 41, 59, 0.5)"
                      mode="user"
                    />
                    <AudioAnalyzer
                      isActive={isListening && !processingQuery && !isSpeaking}
                      onAnalysis={handleAudioAnalysis}
                    />
                  </div>
                )}
              </div>

              {/* AI's response area */}
              <div className="relative h-auto">
                <AnimatePresence>
                  {/* Processing indicator (ChatGPT style) */}
                  {processingQuery && !aiResponse && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full mb-4"
                    >
                      <div className="bg-gray-800 p-4 rounded-xl shadow-md">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-6 w-6 rounded-full bg-teal-500 items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              AI
                            </span>
                          </div>
                          <p className="text-sm font-medium text-white">
                            Assistant
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 text-teal-500 animate-spin" />
                          <p className="text-gray-400">Thinking...</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* AI response */}
                  {aiResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full mb-4"
                    >
                      <div className="bg-gray-800 h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent p-4 rounded-xl shadow-md relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 rounded-full bg-teal-500 items-center justify-center">
                              <span className="text-xs text-white font-medium">
                                AI
                              </span>
                            </div>
                            <p className="text-sm font-medium text-white">
                              Assistant
                            </p>
                          </div>

                          {/* Stop speaking button */}
                          {isSpeaking && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs flex items-center gap-1 text-gray-400 hover:text-white"
                              onClick={stopSpeaking}
                            >
                              <StopCircle className="h-3 w-3" />
                              <span>Stop speaking</span>
                            </Button>
                          )}
                        </div>
                        <div className="max-h-[50vh] ">
                          {renderHighlightedResponse()}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI waveform (ChatGPT style) */}
                {isSpeaking && (
                  <div className="w-full h-12 mt-2">
                    <SpeechWaveform
                      isActive={isSpeaking}
                      intensity={0.5}
                      color="#10b981"
                      backgroundColor="rgba(17, 24, 39, 0.5)"
                      mode="ai"
                    />
                  </div>
                )}

                {/* Loading indicator */}
                {processingQuery && !aiResponse && (
                  <div className="w-full h-12 mt-2">
                    <SpeechWaveform
                      isActive={true}
                      intensity={0.5}
                      color="#8b5cf6"
                      backgroundColor="rgba(17, 24, 39, 0.5)"
                      mode="loading"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed controls section at bottom */}
        <div className="bg-gray-900 p-6 pt-2 border-t border-gray-800 flex-shrink-0">
          {/* Controls */}
          <div className="flex justify-center">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={isListening ? "destructive" : "default"}
                  size="icon"
                  className={`rounded-full h-14 w-14 ${
                    isListening
                      ? "bg-red-600 hover:bg-red-700 border-none text-white"
                      : "bg-blue-600 hover:bg-blue-700 border-none text-white"
                  } transition-all duration-200 shadow-lg`}
                  onClick={toggleListening}
                  disabled={
                    processingQuery || !isBrowserSupported || isSpeaking
                  }
                >
                  {isListening ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
              </motion.div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 mt-4">
            {isListening &&
              !processingQuery &&
              !isSpeaking &&
              `Speak in ${
                language === "zh-CN" ? "Chinese" : "English"
              }... Click the microphone button again when done.`}
            {processingQuery && "Processing your request..."}
            {isSpeaking &&
              "AI is speaking... You can click the Stop button to interrupt."}
            {!isListening &&
              !processingQuery &&
              !isSpeaking &&
              `Click the microphone to start speaking in ${
                language === "zh-CN" ? "Chinese" : "English"
              }.`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherVoiceModal;
