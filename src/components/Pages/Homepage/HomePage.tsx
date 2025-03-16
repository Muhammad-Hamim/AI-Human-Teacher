import React, { useState } from "react";
import { Sparkles, Bot, User, Send, Plus } from "lucide-react";
import { useRequestAiResponseMutation } from "@/redux/features/aiResponse/aiResponseApi";

const HomePage = () => {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content: "Hello! I'm AI Human Teacher. How can I help you learn today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [requestAiResponse, { isLoading }] = useRequestAiResponseMutation();

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      // Add user message
      const newMessages = [
        ...messages,
        { role: "user" as const, content: inputValue },
      ];
      setMessages(newMessages);

      // Clear input
      setInputValue("");

      try {
        // Call API
        await requestAiResponse(inputValue);

        // In a real app, we would use the API response
        // For now, simulate an AI response
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant" as const,
              content:
                "This is a simulated response. In a real application, this would come from your AI backend.",
            },
          ]);
        }, 1000);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900">
      {/* Main chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-indigo-600/10 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="h-10 w-10 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-3">
              AI Human Teacher
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
              Your personal AI tutor to help you learn and grow. Ask me anything
              about your studies!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
              {[
                "Explain quantum physics",
                "Help with math homework",
                "Write a poem about learning",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  onClick={() => {
                    setInputValue(suggestion);
                  }}
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {suggestion}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-3xl ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm"
                } p-4 shadow-sm`}
              >
                <div className="flex-shrink-0 mr-4">
                  {message.role === "user" ? (
                    <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto relative">
          <button className="absolute left-4 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors">
            <Plus className="h-5 w-5" />
          </button>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI Human Teacher..."
            className="w-full pl-12 pr-12 py-3 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
            rows={1}
            style={{ minHeight: "50px", maxHeight: "200px" }}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={`absolute right-4 top-3 ${
              inputValue.trim() && !isLoading
                ? "text-indigo-600 hover:text-indigo-700"
                : "text-slate-300"
            } transition-colors`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="text-xs text-center mt-2 text-slate-400">
          AI Human Teacher may produce inaccurate information. Verify important
          information.
        </div>
      </div>
    </div>
  );
};

export default HomePage;
