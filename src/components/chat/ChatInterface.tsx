import React, { useState } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceCallModal from "../voice-call/VoiceCallModal";

interface ChatInterfaceProps {
  // Add your props here
}

const ChatInterface: React.FC<ChatInterfaceProps> = (props) => {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const handleOpenVoiceModal = () => {
    setIsVoiceModalOpen(true);
  };

  const handleCloseVoiceModal = () => {
    setIsVoiceModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat interface content */}
      <div className="flex-1">{/* Your chat messages and content here */}</div>

      {/* Chat input area */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={handleOpenVoiceModal}
            title="Start voice conversation"
          >
            <Mic className="h-5 w-5" />
          </Button>

          {/* Other chat input elements */}
          <div className="flex-1">{/* Text input, send button, etc. */}</div>
        </div>
      </div>

      {/* Voice call modal */}
      <VoiceCallModal
        isOpen={isVoiceModalOpen}
        onClose={handleCloseVoiceModal}
      />
    </div>
  );
};

export default ChatInterface;
