/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { useParams } from "react-router";
import { TMessage } from "@/types/messages/TMessages";
import { useGetMessagesQuery } from "@/redux/features/chat/chatApi";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";

interface ChatMessageProps {
  streamingMessageId?: string | null;
  streamedContent?: string;
}

const ChatMessage = ({
  streamingMessageId,
  streamedContent = "",
}: ChatMessageProps) => {
  const { chatId } = useParams<{ chatId: string }>();
  const { data: messages = { data: [] }, isLoading } = useGetMessagesQuery(
    chatId as string
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedContent]);

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

  if (messages.data.length === 0 && !streamingMessageId && !chatId) {
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

  if (isLoading && !streamingMessageId) {
    return [...Array(10)].map((_, i) => (
      <div
        key={i}
        className={`flex ${
          i % 2 === 0 ? "justify-end h-16" : "justify-start h-5"
        } bg-gray-800/50  rounded-lg animate-pulse mb-5`}
      />
    ));
  }

  // Create a streaming message to display if we have streaming content
  const streamingMessage = streamingMessageId
    ? {
        _id: streamingMessageId,
        user: {
          senderType: "assistant",
          senderId: null,
        },
        message: {
          content: streamedContent,
          contentType: "text",
        },
        isAIResponse: true,
        chatId: chatId || "",
        userId: "",
        isDeleted: false,
        isStreaming: true,
      }
    : null;

  // Combine database messages with streaming message if it exists
  const displayMessages = [...messages.data];

  // Filter out the streaming message from the database if we're actively streaming
  // (to avoid duplicate messages)
  const filteredMessages = streamingMessageId
    ? displayMessages.filter((msg) => msg._id !== streamingMessageId)
    : displayMessages;

  // Add the current streaming message to the display list if it exists
  if (streamingMessage) {
    filteredMessages.push(streamingMessage);
  }

  // Function to render message content with markdown support
  const renderMessageContent = (
    content: string,
    isAI: boolean,
    isStreaming: boolean
  ) => {
    // If it's user message or empty, just render plain text
    if (!isAI || !content.trim()) {
      return (
        <div className="whitespace-pre-wrap">
          {content}
          {isStreaming && <span className="animate-pulse">▋</span>}
        </div>
      );
    }

    // For AI messages, render with markdown with special handling for streaming
    if (isStreaming) {
      // For streaming content we need special handling to avoid rendering issues
      // with incomplete markdown
      return (
        <div className="prose prose-invert prose-sm max-w-none">
          <MarkdownRenderer content={content} />
          <span className="animate-pulse">▋</span>
        </div>
      );
    }

    // For completed AI messages, render with markdown normally
    return <MarkdownRenderer content={content} />;
  };

  return (
    <>
      {chatId ? (
        <div className="space-y-6 pb-4">
          {filteredMessages.map((message: TMessage, index: number) => (
            <motion.div
              key={message._id || index}
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
                  message.user.senderId === "user"
                    ? "flex-row-reverse"
                    : "flex-row"
                } max-w-[85%] gap-3`}
              >
                <div className="flex-shrink-0 mt-1">
                  <Avatar
                    className={`h-8 w-8 ${
                      message.user.senderType === "user" ||
                      !message.isAIResponse
                        ? "bg-primary"
                        : "bg-secondary"
                    }`}
                  >
                    <span className="text-xs">
                      {message.user.senderType === "user" ||
                      !message.isAIResponse
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
                  } ${message.isStreaming ? "stream-message-animation" : ""}`}
                >
                  {renderMessageContent(
                    message.message.content,
                    message.user.senderType === "assistant" &&
                      message.isAIResponse,
                    !!message.isStreaming
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <h1 className="text-2xl font-bold mb-2">AI Human Teacher</h1>
          <p className="text-muted-foreground max-w-md">
            Ask anything about your lessons, get help with homework, or practice
            language skills including Chinese.
          </p>
        </div>
      )}
    </>
  );
};

export default ChatMessage;
