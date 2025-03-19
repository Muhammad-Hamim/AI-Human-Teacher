/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Mic, Search, Plus, BrainCircuit, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { addMessage } from "@/redux/features/chat/chatSlice";
import ChatMessages from "./Conversation/ChatMessages";
import { useNavigate, useParams } from "react-router";
import { useAppDispatch } from "@/redux/hooks";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
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

type FormInputs = {
  message: string;
};

const AskAi = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [isListening, setIsListening] = useState(false);
  const [rows, setRows] = useState(1);
  const [isThinking, setIsThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref to scroll to bottom
  const dispatch = useAppDispatch();
  const [createChat] = useCreateChatMutation();
  const [requestAiResponse] = useRequestAiResponseMutation();
  const { refetch: refetchMessages } = useGetMessagesQuery(
    chatId || ""
  );
  const { refetch: refetchChatHistory } = useGetChatHistoryQuery(FUserId);
  
  const { register, handleSubmit, reset, watch, setValue } =
    useForm<FormInputs>({
      defaultValues: {
        message: "",
      },
    });
  const messageValue = watch("message", "");
  const navigate = useNavigate();

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
  // Scroll to bottom when isThinking changes
  useEffect(() => {
    if (isThinking && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isThinking]);
  const onSubmit = async (data: FormInputs) => {
    if (data.message && data.message.trim()) {
      const messageContent = data.message.trim();
      let currentChatId = chatId;

      setIsThinking(true);
      try {
        if (!currentChatId) {
          const response = await createChat(messageContent);
          if (response.data) {
            currentChatId = response.data.data._id;
            navigate(`/${currentChatId}`);
            await refetchChatHistory();
          }
        }
        if (currentChatId) {
          await requestAiResponse({
            prompt: data.message,
            chatId: currentChatId,
          }).unwrap();
          refetchMessages();
        }
        reset({ message: "" });
        setRows(1);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      } catch (error: any) {
        console.error("Error requesting AI response:", error);
        let errorMessage = "An error occurred while generating the response.";
        if (error.data?.message?.includes("DeepSeek API Error")) {
          errorMessage =
            "The AI service is currently experiencing issues. Please try again later.";
        }
        dispatch(
          addMessage({
            chatId: currentChatId as string,
            role: "assistant",
            content: errorMessage,
          })
        );
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

  const startListening = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setValue("message", transcript);
        setTimeout(() => {
          if (transcript.trim()) handleSubmit(onSubmit)();
        }, 500);
      };
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      console.error("Speech recognition not supported");
    }
  };

  return (
    <main className="flex overflow-hidden flex-col h-[calc(100vh-100px)] w-[70%] mx-auto bg-gray-900 rounded-xl border border-gray-800">
      <div className="flex-1 overflow-y-auto message-scrollbar p-6 pb-4 bg-gray-900">
        <ChatMessages />
        {isThinking && (
          <div className="flex justify-center my-4">
            <div className="flex gap-1 items-center bg-gray-800/50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-300"></div>
              <span className="text-xs text-indigo-300 ml-2">Thinking...</span>
            </div>
          </div>
        )}
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
                    variant={isListening ? "default" : "ghost"}
                    size="icon"
                    className={`h-8 w-8 rounded-full transition-all duration-200 ${
                      isListening
                        ? "bg-red-500 hover:bg-red-600 animate-pulse"
                        : "hover:bg-gray-700 text-gray-300"
                    }`}
                    onClick={startListening}
                    disabled={isThinking}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice input</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="text-xs text-gray-400 text-center mt-2">
            AI Human Teacher may produce inaccurate information about people,
            places, or facts.
          </div>
        </form>
      </Card>
    </main>
  );
};

export default AskAi;
