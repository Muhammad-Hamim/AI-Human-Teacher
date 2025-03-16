/* eslint-disable @typescript-eslint/no-explicit-any */

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Mic, Search, Plus, BrainCircuit, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { RootState } from "@/redux/store";
import { addMessage } from "@/redux/features/chat/chatSlice";
import ChatMessages from "./chatMessages";

type FormInputs = {
  message: string;
};
const AskAi = () => {
  const [isListening, setIsListening] = useState(false);
  const [rows, setRows] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dispatch = useDispatch();
  const messages = useSelector((state: RootState) => state.chat.messages);

  const { register, handleSubmit, reset, watch, setValue } =
    useForm<FormInputs>({
      defaultValues: {
        message: "",
      },
    });
  const messageValue = watch("message", "");

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
      dispatch(addMessage({ role: "user", content: data.message.trim() }));
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

  const startListening = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Support for Chinese language
      // recognition.lang = "zh-CN"; // Set to Chinese (Simplified)
      recognition.lang = "en";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice input:", transcript);
        setValue("message", transcript);
        setTimeout(() => {
          if (transcript.trim()) {
            dispatch(addMessage({ role: "user", content: transcript.trim() }));
            reset({ message: "" });
            setRows(1);
            if (textareaRef.current) {
              textareaRef.current.style.height = "auto";
            }
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
      <div className="flex-1 overflow-y-auto p-4 pb-0">
        <ChatMessages messages={messages} />
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
