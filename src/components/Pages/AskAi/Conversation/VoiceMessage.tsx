import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { useParams } from "react-router";
import { TMessage } from "@/types/messages/TMessages";
import { useGetMessagesQuery } from "@/redux/features/chat/chatApi";

const VoiceMessage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { data: messages = { data: [] }, isLoading } = useGetMessagesQuery(
    chatId as string
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef(0);

  // Text-to-speech for new AI messages
  useEffect(() => {
    // Check if we have messages and if a new message has been added
    if (
      messages.data.length > 0 &&
      messages.data.length > previousMessagesLengthRef.current
    ) {
      const latestMessage = messages.data[messages.data.length - 1];

      // Only read if it's an AI message
      if (latestMessage.isAIResponse && latestMessage.message.content) {
        // Use speech synthesis
        const utterance = new SpeechSynthesisUtterance(
          latestMessage.message.content
        );

        // Try to find a Chinese male voice
        const voices = window.speechSynthesis.getVoices();
        const chineseVoice = voices.find(
          (voice) =>
            (voice.lang.includes("zh") || voice.lang.includes("cmn")) &&
            voice.name.toLowerCase().includes("male")
        );

        if (chineseVoice) {
          utterance.voice = chineseVoice;
        } else {
          // Fallback to any Chinese voice
          const anyChineseVoice = voices.find(
            (voice) => voice.lang.includes("zh") || voice.lang.includes("cmn")
          );
          if (anyChineseVoice) {
            utterance.voice = anyChineseVoice;
          }
        }

        // Adjust speech parameters
        utterance.rate = 0.5;
        utterance.pitch = 1.0;

        // Speak the text
        window.speechSynthesis.speak(utterance);
      }

      // Update the previous length
      previousMessagesLengthRef.current = messages.data.length;
    }
  }, [messages.data.length, messages.data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Force voice list initialization
  useEffect(() => {
    // Ensure voices are loaded
    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // If voices aren't loaded yet, wait for them
        window.speechSynthesis.addEventListener("voiceschanged", () => {
          window.speechSynthesis.getVoices();
        });
      }
    }
  }, []);

  if (messages.data.length === 0 || !chatId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h1 className="text-2xl font-bold mb-2">AI Human Teacher</h1>
        <p className="text-muted-foreground max-w-md">
          Ask anything about your lessons, get help with homework, or practice
          language skills including Chinese.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <p>Loading....</p>;
  }

  return (
    <div className="space-y-6 pb-4">
      {messages.data.map((message: TMessage, index: number) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex ${
            message.user.senderType === "user" || !message.isAIResponse
              ? "justify-end"
              : "justify-start"
          }`}
        >
          <div
            className={`flex ${
              message.user.senderId === "user" ? "flex-row-reverse" : "flex-row"
            } max-w-[85%] gap-3`}
          >
            <div className="flex-shrink-0 mt-1">
              <Avatar
                className={`h-8 w-8 ${
                  message.user.senderType === "user" || !message.isAIResponse
                    ? "bg-primary"
                    : "bg-secondary"
                }`}
              >
                <span className="text-xs">
                  {message.user.senderType === "user" || !message.isAIResponse
                    ? "U"
                    : "AI"}
                </span>
              </Avatar>
            </div>

            <div
              className={`p-4 rounded-2xl ${
                message.user.senderType === "user" || !message.isAIResponse
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-secondary text-secondary-foreground rounded-tl-none"
              }`}
            >
              <div className="whitespace-pre-wrap">
                {message.message.content}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default VoiceMessage;
