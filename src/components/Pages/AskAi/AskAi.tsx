/* eslint-disable @typescript-eslint/no-explicit-any */

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Mic, Search, Plus, BrainCircuit, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { addMessage } from "@/redux/features/chat/chatSlice";
import ChatMessages from "./chatMessages";
import { useNavigate, useParams } from "react-router";
import { useAppDispatch } from "@/redux/hooks";
import { addChatHistory } from "@/redux/features/chatHistory/chatHistorySlice";

type FormInputs = {
  message: string;
};
const AskAi = () => {
  const { chatId } = useParams<{ chatId: string }>(); // grab chat id from the route – it'll be undefined initially

  const [isListening, setIsListening] = useState(false);
  const [rows, setRows] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dispatch = useAppDispatch();
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
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = "auto";

      const newRows = Math.min(
        5,
        Math.max(1, Math.ceil(textareaRef.current.scrollHeight / 24))
      );
      setRows(newRows);

      // Set the height based on scrollHeight
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageValue]);

  const onSubmit = (data: FormInputs) => {
    if (data.message && data.message.trim()) {
      const messageContent = data.message.trim();
      let newChatId = "";
      // If there is no chat ID (i.e. first message), generate one and navigate to that route.
      if (!chatId) {
        newChatId = crypto.randomUUID();
        // First dispatch the chat history action
        dispatch(
          addChatHistory({
            id: newChatId,
            userId: "ai-1234",
            user: "new ai",
            title: messageContent,
            lastMessage: messageContent,
            lastMessageAt: new Date(),
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
      } else {
        // Otherwise, we're already in a chat so use the existing chat ID
        newChatId = chatId;
      }

      // Then dispatch the message action
      dispatch(
        addMessage({
          chatId: newChatId,
          role: "user",
          content: messageContent,
          timestamp: new Date(),
        })
      );

      // Finally, navigate to the new chat route (only if it's a new chat)
      if (!chatId) {
        navigate(`/${newChatId}`);
      }

      reset({ message: "" });
      setRows(1);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  //create a new chat
  const handleNewChat = () => {
    navigate("/");
  };

  const startListening = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Support for Chinese language (uncomment if needed)
      // recognition.lang = "zh-CN"; // Set to Chinese (Simplified)
      recognition.lang = "en-US"; // Set to English

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice input:", transcript);
        setValue("message", transcript);
        setTimeout(() => {
          if (transcript.trim()) {
            handleSubmit(onSubmit)();
          }
        }, 500);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      console.error("Speech recognition not supported");
    }
  };

  return (
    <main className="flex flex-col h-[calc(100vh-100px)] w-[70%] mx-auto bg-background">
      <div className="flex-1 overflow-y-auto message-scrollbar p-4 pb-0">
        <ChatMessages />
      </div>
      <Card className="border-t mx-4 my-4 p-2">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="relative">
            {/* maybe we need to change text area, for using text area we are not getting the input here  */}
            <Textarea
              {...register("message")}
              placeholder="Ask anything..."
              className="resize-none pr-10 py-3 min-h-[48px] max-h-[200px] rounded-lg focus-visible:ring-1"
              rows={rows}
              onKeyDown={handleKeyDown}
              ref={(e) => {
                register("message").ref(e); // Attach react-hook-form's ref
                textareaRef.current = e; // Attach your custom ref
              }}
            />

            <Button
              type="submit"
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between mt-2 px-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                className="h-8 w-8 rounded-full"
              >
                <Plus className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <BrainCircuit className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant={isListening ? "default" : "ghost"}
                size="icon"
                className={`h-8 w-8 rounded-full ${
                  isListening ? "bg-red-500 hover:bg-red-600" : ""
                }`}
                onClick={startListening}
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center mt-2">
            AI Human Teacher may produce inaccurate information about people,
            places, or facts.
          </div>
        </form>
      </Card>
    </main>
  );
};

export default AskAi;
