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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStreamAiResponseMutation } from "@/redux/features/chat/chatApi";
import { useParams } from "react-router";
import { useCreateChatMutation } from "@/redux/features/chatHistory/chatHistoryApi";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import AudioAnalyzer from "./AudioAnalyzer";
import SpeechWaveform from "./SpeechWaveform";

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

// Add custom styles for markdown content
const markdownStyles = {
  // Code blocks
  pre: (props: any) => (
    <pre className="bg-gray-900 p-2 rounded-md overflow-x-auto text-sm my-2">
      {props.children}
    </pre>
  ),
  // Inline code
  code: (props: any) => (
    <code className="bg-gray-900 px-1 py-0.5 rounded text-sm text-teal-400 font-mono">
      {props.children}
    </code>
  ),
  // Headers
  h1: (props: any) => (
    <h1 className="text-xl font-bold my-4">{props.children}</h1>
  ),
  h2: (props: any) => (
    <h2 className="text-lg font-bold my-3">{props.children}</h2>
  ),
  h3: (props: any) => (
    <h3 className="text-md font-bold my-2">{props.children}</h3>
  ),
  // Lists
  ul: (props: any) => <ul className="list-disc pl-6 my-2">{props.children}</ul>,
  ol: (props: any) => (
    <ol className="list-decimal pl-6 my-2">{props.children}</ol>
  ),
  // Links
  a: (props: any) => (
    <a
      href={props.href}
      className="text-blue-400 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {props.children}
    </a>
  ),
  // Block quotes
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-gray-600 pl-4 italic my-2">
      {props.children}
    </blockquote>
  ),
};

// Utility function to remove markdown syntax for cleaner text-to-speech
const stripMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.*?)\*/g, "$1") // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links but keep text
    .replace(/\n>/g, "\n") // Remove blockquote markers
    .replace(/`(.*?)`/g, "$1") // Remove inline code markers
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/#/g, "") // Remove heading markers
    .replace(/\n- /g, "\n") // Remove list markers
    .replace(/\n\d+\. /g, "\n"); // Remove ordered list markers
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
  const [streamAiResponse] = useStreamAiResponseMutation();
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const responseWordsRef = useRef<string[]>([]);
  const [processingQuery, setProcessingQuery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);

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

        if (speechSynthesisRef.current) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, []);

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
      toast.success("Voice chat started");
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
      let fullResponse = "";

      // For preserving markdown newlines and formatting
      let isInCodeBlock = false;

      // Stream AI response - fixes for handling different response formats
      try {
        await streamAiResponse({
          prompt: query,
          chatId: currentChatId as string,
          onChunk: (chunk: any) => {
            // Log the chunk to debug response format
            console.log("AI response chunk:", chunk);

            let contentChunk = "";

            // Handle different response formats
            if (typeof chunk === "string") {
              contentChunk = chunk;
            } else if (chunk?.message?.content) {
              contentChunk = chunk.message.content;
            } else if (chunk?.content) {
              contentChunk = chunk.content;
            } else if (chunk?.choices?.[0]?.delta?.content) {
              // Handle OpenAI-like streaming format
              contentChunk = chunk.choices[0].delta.content;
            } else if (typeof chunk === "object") {
              // Try to extract content from unknown object format
              contentChunk =
                chunk?.text ||
                chunk?.delta?.content ||
                chunk?.response ||
                JSON.stringify(chunk);
            }

            if (contentChunk) {
              // Check for code block delimiters to preserve formatting
              if (contentChunk.includes("```")) {
                isInCodeBlock = !isInCodeBlock;
              }

              // Append to full response
              fullResponse += contentChunk;

              // Update the display with proper formatting
              setAiResponse(fullResponse);
            }
          },
        }).unwrap();

        console.log("Full AI response:", fullResponse);

        // If we didn't get any response content, show an error
        if (!fullResponse.trim()) {
          setAiResponse("I couldn't generate a response. Please try again.");
          toast.error("Received empty response from AI");
        }

        // Speak the response if audio is enabled
        if (audioEnabled && fullResponse.trim()) {
          speakResponse(fullResponse);
        }
      } catch (error) {
        console.error("Error streaming AI response:", error);
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

  // Stop speaking
  const stopSpeaking = () => {
    try {
      if (window.speechSynthesis) {
        // Cancel any pending speech
        window.speechSynthesis.cancel();

        // Add a small delay to make sure the events have time to fire properly
        setTimeout(() => {
          // Reset state
          setIsSpeaking(false);
          setWordIndex(0);
        }, 50);

        // Only show toast if we were actually speaking
        if (window.speechSynthesis.speaking || isSpeaking) {
          toast.info("Stopped speaking");
        }
      }
    } catch (error) {
      console.error("Error stopping speech:", error);
      setIsSpeaking(false); // Make sure to reset state even on error
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (isSpeaking && audioEnabled) {
      stopSpeaking();
      toast.info("Voice output disabled");
    } else if (!audioEnabled) {
      toast.info("Voice output enabled");
    }
  };

  // Speak response using speech synthesis
  const speakResponse = (text: string) => {
    if (!text || !audioEnabled) return;

    try {
      // Make sure speech synthesis is available
      if (!window.speechSynthesis) {
        throw new Error("Speech synthesis not supported in this browser");
      }

      // First stop any ongoing speech
      stopSpeaking();

      // Remove markdown syntax for better speech
      const cleanText = stripMarkdown(text);
      if (!cleanText.trim()) {
        console.warn("Empty text after stripping markdown, nothing to speak");
        return;
      }

      // Split response into words for highlighting
      responseWordsRef.current = text.split(/\s+/);
      setWordIndex(0);

      // Create new utterance
      speechSynthesisRef.current = new SpeechSynthesisUtterance(cleanText);

      // Set properties for more natural voice
      speechSynthesisRef.current.rate = 1.0;
      speechSynthesisRef.current.pitch = 1.0;
      speechSynthesisRef.current.volume = 1.0;

      // Try to use a more natural-sounding voice if available
      const voices = window.speechSynthesis.getVoices();

      // First try to find an optimal voice based on quality and language
      let preferredVoice = voices.find(
        (voice) =>
          (voice.name.includes("Google") ||
            voice.name.includes("Neural") ||
            voice.name.includes("Premium")) &&
          voice.lang.startsWith("zh-CN")
      );

      // Fallback to any English voice if no premium voice is found
      if (!preferredVoice) {
        preferredVoice = voices.find((voice) => voice.lang.startsWith("zh-CN"));
      }

      if (preferredVoice) {
        console.log(`Using voice: ${preferredVoice.name}`);
        speechSynthesisRef.current.voice = preferredVoice;
      } else if (voices.length > 0) {
        // Just use the first available voice if no English voice is found
        console.log(`Fallback to default voice: ${voices[0].name}`);
        speechSynthesisRef.current.voice = voices[0];
      } else {
        console.warn("No voices available for speech synthesis");
      }

      // Chrome has a bug where after about 15 seconds, speech can be cut off
      // This workaround helps prevent it by periodically "pinging" the synthesis
      const preventChromeTimeout = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(preventChromeTimeout);
        }
      }, 10000);

      // Set up event handlers

      // Events to track speaking status
      speechSynthesisRef.current.onstart = () => {
        setIsSpeaking(true);
        console.log("Speech started");
      };

      // Create a single onend handler that handles all cleanup
      speechSynthesisRef.current.onend = () => {
        clearInterval(preventChromeTimeout);
        console.log("Speech completed");
        setIsSpeaking(false);
        setWordIndex(0);
      };

      speechSynthesisRef.current.onpause = () => {
        console.log("Speech paused");
      };

      speechSynthesisRef.current.onresume = () => {
        console.log("Speech resumed");
      };

      speechSynthesisRef.current.onerror = (event: any) => {
        console.error("Speech synthesis error:", event);
        setIsSpeaking(false);
        clearInterval(preventChromeTimeout);

        // Handle interrupted errors specifically
        if (event.error === "interrupted") {
          console.log(
            "Speech was interrupted, this is often expected when stopping speech manually"
          );
          // No need to show an error toast for interruptions as they're usually intentional
        } else {
          // For other errors, show a toast
          toast.error(`Speech synthesis error: ${event.error}`);

          // Attempt to retry speech synthesis once for non-interruption errors
          if (
            (event.error === "network" || event.error === "audio-busy") &&
            audioEnabled
          ) {
            setTimeout(() => {
              console.log("Retrying speech synthesis...");
              if (speechSynthesisRef.current) {
                window.speechSynthesis.speak(speechSynthesisRef.current);
              }
            }, 1000);
          }
        }
      };

      // Use an interval for word timing
      let wordCount = 0;
      const totalWords = responseWordsRef.current.length;

      speechSynthesisRef.current.onboundary = (event) => {
        if (event.name === "word") {
          wordCount++;
          const progress = Math.min(wordCount, totalWords - 1);
          setWordIndex(progress);
        }
      };

      // Start speaking
      window.speechSynthesis.speak(speechSynthesisRef.current);
    } catch (error) {
      console.error("Error with speech synthesis:", error);
      toast.error("Failed to speak response. Please try again later.");
      setIsSpeaking(false);
    }
  };

  // Initialize speech synthesis
  useEffect(() => {
    // Ensure voices are loaded
    if (window.speechSynthesis) {
      try {
        // Get available voices
        let voices = window.speechSynthesis.getVoices();

        // If voices aren't loaded yet, wait for them
        if (voices.length === 0) {
          window.speechSynthesis.addEventListener("voiceschanged", () => {
            voices = window.speechSynthesis.getVoices();
            console.log(`Loaded ${voices.length} voices for speech synthesis`);
          });
        } else {
          console.log(`Loaded ${voices.length} voices for speech synthesis`);
        }

        // Cancel any existing speech synthesis from previous sessions
        window.speechSynthesis.cancel();
      } catch (error) {
        console.error("Error initializing speech synthesis:", error);
        setAudioEnabled(false);
        toast.error("Voice output unavailable. Please try again later.");
      }
    } else {
      console.warn("Speech synthesis not supported in this browser");
      setAudioEnabled(false);
    }

    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (error) {
          console.error("Error cancelling speech on unmount:", error);
        }
      }
    };
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  // Reset word highlighting when new response arrives
  useEffect(() => {
    if (aiResponse) {
      responseWordsRef.current = aiResponse.split(/\s+/);
    }
  }, [aiResponse]);

  // Word highlighting animation - similar to ChatGPT
  useEffect(() => {
    if (isSpeaking && aiResponse && !responseWordsRef.current[wordIndex]) {
      // If word index is invalid, create a fallback animation
      const words = aiResponse.split(/\s+/);
      const interval = setInterval(() => {
        setWordIndex((prev) => {
          const next = prev + 1;
          if (next >= words.length) {
            clearInterval(interval);
            return 0;
          }
          return next;
        });
      }, 220); // Adjust speed as needed

      return () => clearInterval(interval);
    }
  }, [isSpeaking, aiResponse, wordIndex]);

  // Render highlighted response text - ChatGPT style with markdown support
  const renderHighlightedResponse = () => {
    if (!aiResponse) return null;

    // For speech highlighting we still need plain text
    const words = aiResponse.split(/\s+/);

    // Function to render markdown with highlighting
    const renderMarkdownWithHighlighting = () => {
      if (isSpeaking && wordIndex < words.length) {
        // Split content into parts - before current word, current word, and after
        const beforeCurrentWord = words.slice(0, wordIndex).join(" ");
        const currentWord = words[wordIndex];
        const afterCurrentWord = words.slice(wordIndex + 1).join(" ");

        return (
          <>
            {beforeCurrentWord && (
              <ReactMarkdown className="inline" components={markdownStyles}>
                {beforeCurrentWord + " "}
              </ReactMarkdown>
            )}
            {currentWord && (
              <motion.span
                className="bg-teal-600/30 text-white dark:text-white rounded px-1 py-0.5"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.2 }}
              >
                {currentWord}
              </motion.span>
            )}{" "}
            {afterCurrentWord && (
              <ReactMarkdown className="inline" components={markdownStyles}>
                {afterCurrentWord}
              </ReactMarkdown>
            )}
          </>
        );
      } else {
        // Just render markdown normally when not speaking
        return (
          <ReactMarkdown components={markdownStyles}>
            {aiResponse}
          </ReactMarkdown>
        );
      }
    };

    return (
      <motion.div
        className="prose prose-invert prose-sm max-w-none text-gray-200 dark:text-white text-base leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {renderMarkdownWithHighlighting()}
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
      <DialogContent className="sm:max-w-[700px] bg-gray-950 border-gray-800 text-white p-0 overflow-hidden rounded-xl">
        <DialogHeader className="bg-gray-900 p-4 flex flex-row items-center justify-between border-b border-gray-800">
          <DialogTitle className="text-xl font-bold text-white">
            Voice Conversation
          </DialogTitle>
          <div className="flex items-center gap-2">
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

        <div className="flex flex-col p-6 space-y-6 bg-gray-900">
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
          <div className="flex-1 flex flex-col gap-4 min-h-[350px]">
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
            <div className="relative h-auto min-h-32">
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
                    <div className="bg-gray-800 p-4 rounded-xl shadow-md relative">
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
                      {renderHighlightedResponse()}
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

          {/* Controls */}
          <div className="flex justify-center space-y-4 mt-4">
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

          <div className="text-center text-xs text-gray-400 mt-2">
            {isListening &&
              !processingQuery &&
              !isSpeaking &&
              "Speak now... Click the microphone button again when done."}
            {processingQuery && "Processing your request..."}
            {isSpeaking &&
              "AI is speaking... You can click the Stop button to interrupt."}
            {!isListening &&
              !processingQuery &&
              !isSpeaking &&
              "Click the microphone to start speaking."}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherVoiceModal;
