import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { useParams } from "react-router";
import { useAppSelector } from "@/redux/hooks";

const ChatMessages = () => {
  const messages = useAppSelector((state) => state.chat.messages);
  const { chatId } = useParams<{ chatId: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Memoize filtered messages based on chatId and messages
  const filteredMessages = useMemo(() => {
    return chatId ? messages.filter((message) => message.chatId === chatId) : [];
  }, [chatId, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages]);

  if (filteredMessages.length === 0) {
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

  return (
    <div className="space-y-6 pb-4">
      {filteredMessages.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`flex ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            } max-w-[85%] gap-3`}
          >
            <div className="flex-shrink-0 mt-1">
              <Avatar
                className={`h-8 w-8 ${
                  message.role === "user" ? "bg-primary" : "bg-secondary"
                }`}
              >
                <span className="text-xs">
                  {message.role === "user" ? "U" : "AI"}
                </span>
              </Avatar>
            </div>

            <div
              className={`p-4 rounded-2xl ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-secondary text-secondary-foreground rounded-tl-none"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;