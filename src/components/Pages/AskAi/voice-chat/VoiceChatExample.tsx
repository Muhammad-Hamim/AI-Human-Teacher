import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import VoiceChatButton from "./VoiceChatButton";

/**
 * Example component showing how to integrate the voice chat feature
 * into a chat interface
 */
const VoiceChatExample = () => {
  return (
    <Card className="w-full max-w-3xl mx-auto bg-gray-950 border-gray-800 text-white">
      <CardHeader className="border-b border-gray-800 bg-gray-900">
        <CardTitle className="text-lg font-semibold">AI Assistant</CardTitle>
        <CardDescription className="text-gray-400">
          Ask questions using text or voice
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 h-[400px] overflow-y-auto flex flex-col gap-4 bg-gray-900">
        {/* Example chat messages */}
        <div className="bg-gray-800 p-3 rounded-lg self-start max-w-[80%]">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-full bg-teal-600 flex items-center justify-center">
              <span className="text-xs text-white font-medium">AI</span>
            </div>
            <p className="text-sm font-medium text-gray-300">Assistant</p>
          </div>
          <p className="text-gray-200 text-sm">
            Hello! I'm your AI assistant. How can I help you today? You can type
            your question or use the voice chat button.
          </p>
        </div>

        <div className="bg-blue-600/20 p-3 rounded-lg self-end max-w-[80%] border border-blue-600/30">
          <div className="flex items-center gap-2 mb-1 justify-end">
            <p className="text-sm font-medium text-gray-300">You</p>
            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-xs text-white font-medium">You</span>
            </div>
          </div>
          <p className="text-gray-200 text-sm">
            Can you explain how to use the voice chat feature?
          </p>
        </div>

        <div className="bg-gray-800 p-3 rounded-lg self-start max-w-[80%]">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-full bg-teal-600 flex items-center justify-center">
              <span className="text-xs text-white font-medium">AI</span>
            </div>
            <p className="text-sm font-medium text-gray-300">Assistant</p>
          </div>
          <p className="text-gray-200 text-sm">
            To use the voice chat feature, simply click the microphone button at
            the bottom right of the chat interface. This will open a voice chat
            dialog where you can speak your question. I'll listen, process your
            request, and respond both with text and voice. You can also stop my
            speech at any time by clicking the "Stop speaking" button.
          </p>
        </div>
      </CardContent>

      <CardFooter className="border-t border-gray-800 p-3 bg-gray-900">
        <div className="flex items-center gap-2 w-full">
          <Input
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-blue-600"
          />
          <VoiceChatButton className="ml-1" />
          <Button
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default VoiceChatExample;
