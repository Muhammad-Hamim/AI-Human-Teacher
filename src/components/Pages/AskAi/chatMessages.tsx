import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";

import { TMessage } from "@/types/messages/TMessages";
import { useGetMessagesQuery } from "@/redux/features/chat/chatApi";

// Define types for markdown components
type MarkdownProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  style?: React.CSSProperties;
};

// Define code component props
type CodeProps = {
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
};

const ChatMessages = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { data: messages = { data: [] }, isLoading } = useGetMessagesQuery(
    chatId as string
  );
  console.log(messages)
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
              {message.user.senderType === "user" || !message.isAIResponse ? (
                <div className="whitespace-pre-wrap">
                  {message.message.content}
                </div>
              ) : (
                <div className="markdown-body text-sm">
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      code({
                        className,
                        children,
                        inline,
                        ...props
                      }: CodeProps) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-md my-3 max-h-[400px] overflow-y-auto"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code
                            className="bg-gray-800 px-1 py-0.5 rounded text-sm"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      h1: ({ children }: MarkdownProps) => (
                        <h1 className="text-2xl font-bold my-4">{children}</h1>
                      ),
                      h2: ({ children }: MarkdownProps) => (
                        <h2 className="text-xl font-bold my-3">{children}</h2>
                      ),
                      h3: ({ children }: MarkdownProps) => (
                        <h3 className="text-lg font-bold my-2">{children}</h3>
                      ),
                      ul: ({ children }: MarkdownProps) => (
                        <ul className="list-disc pl-6 my-4">{children}</ul>
                      ),
                      ol: ({ children }: MarkdownProps) => (
                        <ol className="list-decimal pl-6 my-4">{children}</ol>
                      ),
                      li: ({ children }: MarkdownProps) => (
                        <li className="mb-1">{children}</li>
                      ),
                      p: ({ children }: MarkdownProps) => (
                        <p className="mb-4">{children}</p>
                      ),
                      blockquote: ({ children }: MarkdownProps) => (
                        <blockquote className="border-l-4 border-gray-600 pl-4 py-1 my-4 italic">
                          {children}
                        </blockquote>
                      ),
                      a: ({ href, children }: MarkdownProps) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          {children}
                        </a>
                      ),
                      table: ({ children }: MarkdownProps) => (
                        <div className="overflow-x-auto my-4">
                          <table className="border-collapse border border-gray-700">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }: MarkdownProps) => (
                        <th className="border border-gray-700 px-4 py-2 bg-gray-800">
                          {children}
                        </th>
                      ),
                      td: ({ children }: MarkdownProps) => (
                        <td className="border border-gray-700 px-4 py-2">
                          {children}
                        </td>
                      ),
                      div: ({ children, style, className }: MarkdownProps) => (
                        <div className={className} style={style}>
                          {children}
                        </div>
                      ),
                      span: ({ children, style, className }: MarkdownProps) => (
                        <span className={className} style={style}>
                          {children}
                        </span>
                      ),
                      img: ({ src, alt, style, className }: any) => (
                        <img
                          src={src}
                          alt={alt || ""}
                          className={`max-w-full rounded-md my-2 ${
                            className || ""
                          }`}
                          style={style}
                        />
                      ),
                    }}
                  >
                    {message.message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
