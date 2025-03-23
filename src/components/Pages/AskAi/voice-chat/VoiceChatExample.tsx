import  { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import VoiceChatButton from "./VoiceChatButton";
import ReactMarkdown from "react-markdown";

/**
 * Example component showing how to integrate the voice chat feature
 * into a chat interface
 */

// Markdown example for demonstration
const markdownExample = `
# Hello from AI Assistant

I can help you with various tasks. Here are some examples:

- Answer questions
- Provide information
- Help with coding

\`\`\`javascript
// Example code
function greet() {
  console.log("Hello, world!");
}
\`\`\`

Visit [our documentation](https://example.com) for more information.
`;

// Custom markdown styles for the example
const markdownStyles = {
  pre: "bg-gray-900 p-3 rounded-md overflow-auto my-3 font-mono text-sm",
  code: "bg-gray-900 px-1 py-0.5 rounded-sm font-mono text-sm text-teal-400",
  h1: "text-xl font-bold my-4",
  h2: "text-lg font-bold my-3",
  h3: "text-md font-bold my-2",
  ul: "list-disc pl-6 my-2",
  ol: "list-decimal pl-6 my-2",
  a: "text-blue-400 hover:underline",
  blockquote: "border-l-4 border-gray-600 pl-4 italic my-2",
};

export default function VoiceChatExample() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Hi, I'm your AI assistant. How can I help you today?",
      sender: "ai",
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (inputValue.trim()) {
      // Add user message
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, content: inputValue, sender: "user" },
      ]);

      // Simulate AI response with markdown
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: prev.length + 1, content: markdownExample, sender: "ai" },
        ]);
      }, 1000);

      setInputValue("");
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex flex-col space-y-1.5">
          <CardTitle>AI Assistant</CardTitle>
          <CardDescription>
            Ask me any question via text or use the microphone to speak
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-100"
                }`}
              >
                {message.sender === "ai" ? (
                  <ReactMarkdown
                    components={Object.fromEntries(
                      Object.entries(markdownStyles).map(([key, value]) => [
                        key,
                        ({
                          node,
                          ...props
                        }: {
                          node: any;
                          [key: string]: any;
                        }) => <div className={value} {...props} />,
                      ])
                    )}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div>{message.content}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-700 p-4">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <VoiceChatButton />
          <Button type="submit" size="icon" onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
