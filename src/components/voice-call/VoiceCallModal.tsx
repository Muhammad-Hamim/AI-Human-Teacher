import React, { useEffect, useState, useRef } from "react";
import {
  X,
  Mic,
  MicOff,
  Phone,
  Loader2,
  Volume2,
  VolumeX,
  StopCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useParams } from "react-router";
import useVoiceCall from "@/hooks/useVoiceCall";
import { toast } from "sonner";

// Import the waveform and analyzer components
import AdvancedWaveform from "../Pages/AskAi/voice-chat/AdvancedWaveform";
import AudioAnalyzer from "../Pages/AskAi/voice-chat/AudioAnalyzer";
import SpeechWaveform from "../Pages/AskAi/voice-chat/SpeechWaveform";

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ isOpen, onClose }) => {
  const { chatId } = useParams<{ chatId: string }>();
  const [speechIntensity, setSpeechIntensity] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const responseWordsRef = useRef<string[]>([]);
  const [showPulse, setShowPulse] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [idleTimeoutId, setIdleTimeoutId] = useState<NodeJS.Timeout | null>(
    null
  );
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);

  const {
    isConnecting,
    isConnected,
    startSession,
    endSession,
    toggleMute,
    isMuted,
    transcript,
    aiResponse,
    isSpeaking,
    processingQuery,
    stopSpeaking,
    sendTranscript,
  } = useVoiceCall({ chatId, audioEnabled });

  useEffect(() => {
    // Check if browser supports speech recognition
    const isSpeechRecognitionSupported =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

    // Check if browser supports speech synthesis
    const isSpeechSynthesisSupported =
      typeof window !== "undefined" && "speechSynthesis" in window;

    if (!isSpeechRecognitionSupported || !isSpeechSynthesisSupported) {
      setIsBrowserSupported(false);
      setError(
        "Your browser doesn't support voice features. Please try Chrome, Edge, or Safari."
      );
    }
  }, []);

  // Handle audio analysis
  const handleAudioAnalysis = (intensity: number) => {
    setSpeechIntensity(intensity);

    // Reset the idle timeout each time we detect speech
    if (intensity > 0.1 && !isSpeaking && !processingQuery) {
      resetIdleTimeout();
    }
  };

  // Reset or set the idle timeout
  const resetIdleTimeout = () => {
    if (idleTimeoutId) {
      clearTimeout(idleTimeoutId);
    }

    // If there's non-empty transcript and user stops speaking for 1.5 seconds, send it
    if (transcript.trim() && !hasSentRequest) {
      const timeout = setTimeout(() => {
        if (transcript.trim() && !processingQuery && !isSpeaking) {
          setHasSentRequest(true);
          sendTranscript();
        }
      }, 1500);

      setIdleTimeoutId(timeout);
    }
  };

  // Clear idle timeout when component unmounts
  useEffect(() => {
    return () => {
      if (idleTimeoutId) {
        clearTimeout(idleTimeoutId);
      }
    };
  }, [idleTimeoutId]);

  // Reset hasSentRequest when we get a response
  useEffect(() => {
    if (aiResponse) {
      setHasSentRequest(false);
    }
  }, [aiResponse]);

  // Show pulsing animation when AI is processing
  useEffect(() => {
    setShowPulse(processingQuery);
  }, [processingQuery]);

  // Handle close
  const handleClose = () => {
    endSession();
    onClose();
  };

  // Toggle audio output
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (
      window.speechSynthesis &&
      window.speechSynthesis.speaking &&
      audioEnabled
    ) {
      stopSpeaking();
      toast.info("Voice output disabled");
    } else if (!audioEnabled) {
      toast.info("Voice output enabled");
    }
  };

  // Reset word highlighting when new response arrives
  useEffect(() => {
    if (aiResponse) {
      responseWordsRef.current = aiResponse.split(/\s+/);
    }
  }, [aiResponse]);

  // Word highlighting animation - similar to ChatGPT
  useEffect(() => {
    if (isSpeaking && aiResponse) {
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
      }, 200); // Adjust speed as needed

      return () => clearInterval(interval);
    }
  }, [isSpeaking, aiResponse]);

  // Render highlighted response text - ChatGPT style
  const renderHighlightedResponse = () => {
    if (!aiResponse) return null;

    const words = aiResponse.split(/\s+/);

    return (
      <motion.p
        className="text-white text-base leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {words.map((word: string, index: number) => (
          <React.Fragment key={index}>
            <motion.span
              className={
                index === wordIndex && isSpeaking
                  ? "bg-teal-600/30 text-white rounded px-1 py-0.5"
                  : ""
              }
              animate={
                index === wordIndex && isSpeaking ? { scale: [1, 1.05, 1] } : {}
              }
              transition={{ duration: 0.2 }}
            >
              {word}
            </motion.span>{" "}
          </React.Fragment>
        ))}
      </motion.p>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px] bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white p-0 overflow-hidden rounded-xl">
        <DialogHeader className="bg-white dark:bg-gray-950 p-4 flex flex-row items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <DialogTitle className="text-xl font-bold">
            Voice Conversation
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
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
              className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg">
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
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-6 w-6 rounded-full bg-blue-500 items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            You
                          </span>
                        </div>
                        <p className="text-sm font-medium">You</p>
                      </div>
                      <p className="text-gray-700 dark:text-gray-200">
                        {transcript}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Show waveform when user is speaking */}
              {isConnected && !isMuted && !processingQuery && !isSpeaking && (
                <div className="w-full h-12 mt-2">
                  <SpeechWaveform
                    isActive={!isMuted && isConnected && !isSpeaking}
                    intensity={speechIntensity}
                    color="#3b82f6"
                    backgroundColor="rgba(239, 246, 255, 0.2)"
                  />
                  <AudioAnalyzer
                    isActive={!isMuted && isConnected && !isSpeaking}
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
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-6 w-6 rounded-full bg-teal-500 items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            AI
                          </span>
                        </div>
                        <p className="text-sm font-medium">Assistant</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          {showPulse && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-teal-500/20"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.7, 0, 0.7],
                              }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                          <Loader2 className="h-5 w-5 text-teal-500 animate-spin" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                          Thinking...
                        </p>
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
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 rounded-full bg-teal-500 items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              AI
                            </span>
                          </div>
                          <p className="text-sm font-medium">Assistant</p>
                        </div>

                        {/* Stop speaking button */}
                        {isSpeaking && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                    color="#14b8a6"
                    backgroundColor="rgba(240, 253, 250, 0.2)"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-y-4 mt-4">
            <div className="flex items-center gap-4">
              {!isConnected ? (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-6 transition-all duration-300 hover:shadow-lg"
                  onClick={startSession}
                  disabled={isConnecting || !chatId || !isBrowserSupported}
                >
                  {isConnecting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mic className="h-5 w-5" />
                      <span>Start Voice Chat</span>
                    </div>
                  )}
                </Button>
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className={`rounded-full h-14 w-14 ${
                        isMuted
                          ? "bg-red-500 hover:bg-red-600 border-none text-white"
                          : "bg-blue-500 hover:bg-blue-600 border-none text-white"
                      } transition-all duration-200 shadow-lg`}
                      onClick={toggleMute}
                      disabled={processingQuery}
                    >
                      {isMuted ? (
                        <MicOff className="h-6 w-6" />
                      ) : (
                        <Mic className="h-6 w-6" />
                      )}
                    </Button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="destructive"
                      size="icon"
                      className="rounded-full h-14 w-14 bg-gray-500 hover:bg-gray-600 border-none transition-all duration-200 shadow-lg text-white"
                      onClick={endSession}
                    >
                      <Phone className="h-6 w-6" />
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
            {isConnected &&
              !isMuted &&
              !processingQuery &&
              !isSpeaking &&
              "Listening... (The microphone will automatically detect when you've finished speaking)"}
            {isConnected &&
              isMuted &&
              "Microphone is muted. Click the microphone button to unmute."}
            {processingQuery && "Processing your request..."}
            {isSpeaking &&
              "AI is speaking... You can click the Stop button to interrupt."}
          </div>
    </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceCallModal;
