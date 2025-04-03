import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

// Mock functions for voice call API (to be replaced with actual implementation)
const startVoiceSession = async (userId: string, chatId: string) => {
  console.log(`Starting voice session for user ${userId} in chat ${chatId}`);
  return Promise.resolve();
};

const endVoiceSession = async (userId: string, chatId: string) => {
  console.log(`Ending voice session for user ${userId} in chat ${chatId}`);
  return Promise.resolve();
};

const sendVoiceTranscript = async (
  transcript: string,
  userId?: string,
  chatId?: string
) => {
  console.log(`Sending voice transcript: ${transcript}`);
  console.log(`For user ${userId} in chat ${chatId}`);

  // Mock AI response
  const responses = [
    "I understand what you're saying. Let me help you with that.",
    "That's an interesting question. Here's what I think about it.",
    "I've analyzed your request and have some information for you.",
    "Based on what you've told me, I'd recommend the following approach.",
    "Thank you for sharing that with me. Here's my perspective on the matter.",
  ];

  // Simulate a delay for processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return responses[Math.floor(Math.random() * responses.length)];
};

// Mock RootState for auth
interface User {
  _id: string;
  name: string;
}

interface AuthState {
  user: User | null;
}

interface RootState {
  auth: AuthState;
}

interface UseVoiceCallOptions {
  chatId?: string;
  audioEnabled?: boolean;
}

const useVoiceCall = ({
  chatId,
  audioEnabled = true,
}: UseVoiceCallOptions = {}) => {
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [processingQuery, setProcessingQuery] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState<string>("");

  // Mock user data
  const user: User = { _id: "user123", name: "Demo User" };
  const userId = user._id;

  // Speech recognition
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (
      (typeof window !== "undefined" && "SpeechRecognition" in window) ||
      "webkitSpeechRecognition" in window
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US"; // Set language to English

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");

        setTranscript(transcript);
        setActiveTranscript(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        toast.error(`Speech recognition error: ${event.error}`);
      };
    } else {
      toast.error("Speech recognition is not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Handle voice session start
  const startSession = async () => {
    if (!chatId || !userId) {
      toast.error("Chat ID or User ID is missing");
      return;
    }

    setIsConnecting(true);

    try {
      await startVoiceSession(userId, chatId);
      setIsConnecting(false);
      setIsConnected(true);
      setIsVoiceCallOpen(true);

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      toast.success("Voice chat started");
    } catch (error) {
      setIsConnecting(false);
      console.error("Failed to start voice session", error);
      toast.error("Failed to connect voice chat");
    }
  };

  // Handle voice session end
  const endSession = async () => {
    if (!chatId || !userId) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      stopSpeaking();

      await endVoiceSession(userId, chatId);
      setIsConnected(false);
      setIsVoiceCallOpen(false);
      setTranscript("");
      setActiveTranscript("");
      setAiResponse("");
      setIsSpeaking(false);
      setProcessingQuery(false);

      toast.success("Voice chat ended");
    } catch (error) {
      console.error("Failed to end voice session", error);
      toast.error("Error ending voice chat");
    }
  };

  // Manually send the current transcript to AI
  const sendTranscript = async () => {
    if (!activeTranscript.trim() || !isConnected || processingQuery) return;

    try {
      setProcessingQuery(true);
      const finalTranscript = activeTranscript;
      setActiveTranscript(""); // Clear the active transcript
      
      // Send transcript to API
      const response = await sendVoiceTranscript(
        finalTranscript,
        userId,
        chatId
      );

      if (response) {
        setAiResponse(response);
        if (audioEnabled) {
          speakResponse(response);
        }
      }
    } catch (error) {
      console.error("Error sending voice transcript", error);
      toast.error("Failed to process voice input");
    } finally {
      setProcessingQuery(false);
      setTranscript(""); // Clear the displayed transcript
    }
  };

  // Stop the AI from speaking
  const stopSpeaking = () => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // React to changes in audioEnabled state
  useEffect(() => {
    if (!audioEnabled && isSpeaking) {
      // If audio is disabled and AI is speaking, stop the speech
      stopSpeaking();
    } else if (audioEnabled && aiResponse && !isSpeaking && !processingQuery) {
      // If audio is enabled and there's a response but not speaking, start speaking
      speakResponse(aiResponse);
    }
  }, [audioEnabled, aiResponse, isSpeaking, processingQuery]);

  // Speak AI response using speech synthesis
  const speakResponse = (text: string) => {
    if (!text || typeof window === "undefined" || !audioEnabled) return;

    try {
      stopSpeaking();

      speechSynthesisRef.current = new SpeechSynthesisUtterance(text);

      // Set properties for more natural voice
      speechSynthesisRef.current.rate = 1.0;
      speechSynthesisRef.current.pitch = 1.0;

      // Try to use a more natural-sounding voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.name.includes("Google") || voice.name.includes("Neural")
      );

      if (preferredVoice) {
        speechSynthesisRef.current.voice = preferredVoice;
      }

      // Events to track speaking status
      speechSynthesisRef.current.onstart = () => {
        setIsSpeaking(true);
      };

      speechSynthesisRef.current.onend = () => {
        setIsSpeaking(false);
      };

      speechSynthesisRef.current.onerror = (event) => {
        console.error("Speech synthesis error", event);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(speechSynthesisRef.current);
    } catch (error) {
      console.error("Error with speech synthesis", error);
      toast.error("Failed to speak response");
    }
  };

  // Toggle microphone mute
  const toggleMute = () => {
    setIsMuted((prev) => {
      const newMuteState = !prev;

      if (recognitionRef.current) {
        if (newMuteState) {
          recognitionRef.current.stop();
          toast.info("Microphone muted");
        } else {
          recognitionRef.current.start();
          toast.info("Microphone active");
        }
      }

      return newMuteState;
    });
  };

  // Open/close the voice call modal
  const openVoiceCall = () => setIsVoiceCallOpen(true);
  const closeVoiceCall = () => {
    endSession();
    setIsVoiceCallOpen(false);
  };

  return {
    isVoiceCallOpen,
    openVoiceCall,
    closeVoiceCall,
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
  };
};

export default useVoiceCall;
