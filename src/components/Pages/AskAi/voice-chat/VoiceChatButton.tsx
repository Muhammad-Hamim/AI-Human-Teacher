import React, { useState } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import TeacherVoiceModal from "./TeacherVoiceModal";
import { toast } from "sonner";

interface VoiceChatButtonProps {
  className?: string;
}

/**
 * A button that opens the voice chat modal when clicked.
 * This serves as the entry point to the voice chat feature.
 */
const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({
  className = "",
}) => {
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);

  const openVoiceChat = () => {
    // Check basic browser compatibility before opening
    if (typeof window !== "undefined") {
      const isSpeechRecognitionSupported =
        "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
      const isSpeechSynthesisSupported = "speechSynthesis" in window;

      if (!isSpeechRecognitionSupported || !isSpeechSynthesisSupported) {
        toast.error(
          "Your browser doesn't support voice features. Please try Chrome, Edge, or Safari."
        );
        return;
      }
    }

    setIsVoiceChatOpen(true);
  };

  const closeVoiceChat = () => {
    setIsVoiceChatOpen(false);
  };

  return (
    <>
      <motion.div 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full flex items-center justify-center border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${className}`}
          onClick={openVoiceChat}
          title="Start voice chat"
        >
          <Mic className="h-4 w-4" />
        </Button>
        <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-blue-500"></span>
      </motion.div>

      {/* Voice chat modal */}
      <TeacherVoiceModal isOpen={isVoiceChatOpen} onClose={closeVoiceChat} />
    </>
  );
};

export default VoiceChatButton;
