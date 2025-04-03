import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Search, Plus, BrainCircuit, Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  useCreateChatMutation,
  useGetChatHistoryQuery,
} from "@/redux/features/chatHistory/chatHistoryApi";
import {
  useGetMessagesQuery,
  useRequestAiResponseMutation,
} from "@/redux/features/chat/chatApi";
import { FUserId } from "@/types/chat/TChatHistory";
import TeacherVoiceModal from "./voice-chat/TeacherVoiceModal";
import ThinkingAnimation from "./Conversation/ThinkingAnimation";
import ChatMessage from "./Conversation/ChatMessage";
import { motion } from "framer-motion";

type FormInputs = {
  message: string;
};

const AskAi = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [rows, setRows] = useState(1);
  const [isThinking, setIsThinking] = useState(false);
  const [requestAiResponse] = useRequestAiResponseMutation();
  const [streamedContent, setStreamedContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [createChat] = useCreateChatMutation();
  const { refetch: refetchMessages } = useGetMessagesQuery(chatId || "", {
    skip: !chatId,
  });
  const { refetch: refetchChatHistory } = useGetChatHistoryQuery(FUserId);
  const navigate = useNavigate();
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm<FormInputs>({
    defaultValues: {
      message: "",
    },
  });
  const messageValue = watch("message", "");

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newRows = Math.min(
        5,
        Math.max(1, Math.ceil(textareaRef.current.scrollHeight / 24))
      );
      setRows(newRows);
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageValue]);

  // Scroll to bottom when isThinking changes or new content arrives
  useEffect(() => {
    if ((isThinking || streamedContent) && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isThinking, streamedContent]);

  const onSubmit = async (data: FormInputs) => {
    if (data.message && data.message.trim()) {
      const messageContent = data.message.trim();
      let currentChatId = chatId;

      setIsThinking(true);
      setStreamedContent("");

      try {
        if (!currentChatId) {
          // Create a new chat first and get the chat ID
          const response = await createChat(messageContent);
          if (response.data) {
            currentChatId = response.data.data._id;

            // Navigate to the new chat page
            navigate(`/ask/${currentChatId}`);

            // Wait for refetch of chat history
            await refetchChatHistory();
          }
        }

        if (currentChatId) {
          // Handle chunks as they come in
          try {
            const response = await requestAiResponse({
              prompt: messageContent,
              chatId: currentChatId,
            });
            console.log(response);

            // Only refetch messages if we have a valid chatId
            if (currentChatId) {
              await refetchMessages();
            }
          } catch (apiError) {
            console.error("API Error:", apiError);
          }
        }

        reset({ message: "" });
        setRows(1);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      } catch (error: unknown) {
        console.error("Error streaming AI response:", error);
      } finally {
        setIsThinking(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const handleNewChat = () => {
    navigate("/");
  };

  const openVoiceModal = () => {
    setIsVoiceModalOpen(true);
  };

  const closeVoiceModal = () => {
    setIsVoiceModalOpen(false);
  };

  return (
    <TooltipProvider>
      <motion.main
        className="flex overflow-hidden flex-col h-[calc(100vh-100px)] w-[70%] mx-auto bg-gray-900 rounded-xl border border-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex-1 overflow-y-auto message-scrollbar p-6 pb-4 bg-gray-900">
          <ChatMessage />
          {isThinking && <ThinkingAnimation />}
          <div ref={messagesEndRef} /> {/* Empty div to scroll to */}
        </div>

        <Card className="border border-gray-800 mx-6 my-4 p-3 bg-gray-800/70 backdrop-blur-sm shadow-lg rounded-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <div className="relative">
              <Textarea
                {...register("message")}
                placeholder="Ask anything..."
                className="resize-none pr-10 py-3 min-h-[96px] max-h-[288px] bg-gray-800 border-gray-700 rounded-lg focus-visible:ring-1 focus-visible:ring-indigo-500 placeholder:text-gray-400"
                rows={rows}
                onKeyDown={handleKeyDown}
                ref={(e) => {
                  register("message").ref(e);
                  textareaRef.current = e;
                }}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 bottom-2 h-9 w-9 rounded-full bg-indigo-500 hover:bg-indigo-600 shadow-md transition-all duration-200 hover:scale-105"
                disabled={isThinking}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between mt-3 px-1">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleNewChat}
                      className="h-8 w-8 rounded-full hover:bg-gray-700 text-gray-300"
                      disabled={isThinking}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New chat</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-gray-700 text-gray-300"
                      disabled={isThinking}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Search conversations</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-gray-700 text-gray-300"
                      disabled={isThinking}
                    >
                      <BrainCircuit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Advanced thinking</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-gray-700 text-gray-300"
                      disabled={isThinking}
                      onClick={openVoiceModal}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Voice conversation</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </form>
        </Card>
      </motion.main>

      {/* Teacher Voice Modal */}
      <TeacherVoiceModal isOpen={isVoiceModalOpen} onClose={closeVoiceModal} />
    </TooltipProvider>
  );
};

export default AskAi;
