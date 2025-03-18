import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import { TMessage } from "@/types/messages/TMessages";
import { useGetMessagesQuery } from "@/redux/features/chat/chatApi";
import { FileVolume2 } from "lucide-react";

// Type definitions
type MarkdownProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  style?: React.CSSProperties;
};

type CodeProps = {
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
};

interface PoemLine {
  zh: string;
  pinyin: string[];
  translation: string;
}

interface PoemData {
  title: string;
  lines: PoemLine[];
}

// Poem Renderer Component
const PoemRenderer = ({ data }: { data: PoemData }) => {
  const synth = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  const speak = (text: string, lang = 'zh-CN') => {
    if (!synth.current) {
      console.error('Text-to-speech not supported in this browser');
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    synth.current.speak(utterance);
  };

  return (
    <div className="poem-container dark-mode">
      <h2 className="text-golden">{data.title}</h2>
      <div className="character-grid">
        {data.lines.map((line, index) => (
          <div className="line-block" key={`${line.zh}-${index}`}>
            <div className="characters">
              {line.zh.split('').map((char, i) => (
                <span 
                  className="char-box" 
                  key={`${char}-${i}`}
                  onClick={() => speak(char)}
                  role="button"
                  tabIndex={0}
                >
                  {char}
                  <div className="pinyin">{line.pinyin[i]}</div>
                </span>
              ))}
            </div>
            <div className="translation">
              {line.translation}
              <FileVolume2 
                className="speak-icon" 
                onClick={() => speak(line.zh)}
                role="button"
                tabIndex={0}
              />
            </div>
          </div>
        ))}
      </div>
      <button 
        className="recite-btn"
        onClick={() => speak(data.lines.map(l => l.zh).join(''))}
      >
        Recite Full Poem 🔊
      </button>
    </div>
  );
};

// Dynamic Code Component
const DynamicComponent = ({ code }: { code: string }) => {
  try {
    const Component = new Function("React", `return (${code})`)(React);
    return <Component />;
  } catch (error) {
    return (
      <div className="rounded-md my-3 bg-red-900 text-red-300 p-3">
        <p>Error executing code:</p>
        <SyntaxHighlighter style={vscDarkPlus} language="javascript">
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }
};

// Main Chat Messages Component
const ChatMessages = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { data: messages = { data: [] }, isLoading } = useGetMessagesQuery(chatId || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!chatId || messages.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Chinese Poetry Tutor</h1>
        <p className="text-muted-foreground max-w-md">
          Ask about classical Chinese poems, get detailed explanations, 
          or request interactive learning experiences.
        </p>
      </div>
    );
  }

  if (isLoading) return <div className="p-4">Loading conversation...</div>;

  return (
    <div className="space-y-6 pb-4">
      {messages.data.map((message: TMessage, index: number) => (
        <motion.div
          key={message._id || index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex ${message.isAIResponse ? 'justify-start' : 'justify-end'}`}
        >
          <div className={`flex ${message.isAIResponse ? 'flex-row' : 'flex-row-reverse'} max-w-[85%] gap-3`}>
            <Avatar className={`h-8 w-8 ${message.isAIResponse ? 'bg-secondary' : 'bg-primary'}`}>
              <span className="text-xs">{message.isAIResponse ? 'AI' : 'U'}</span>
            </Avatar>

            <div className={`p-4 rounded-2xl ${
              message.isAIResponse 
                ? "bg-[#212121] text-secondary-foreground rounded-tl-none"
                : "bg-primary text-primary-foreground rounded-tr-none"
            }`}>
              {message.isAIResponse ? (
                <div className="markdown-body text-sm">
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      code({ className, children, inline, ...props }: CodeProps) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeContent = String(children).replace(/\n$/, '');

                        // Handle interactive poems
                        if (match?.[1] === 'poem-interactive') {
                          try {
                            const poemData = JSON.parse(codeContent);
                            return <PoemRenderer data={poemData} />;
                          } catch (error) {
                            return (
                              <div className="error-block">
                                Error parsing poem: {(error as Error).message}
                              </div>
                            );
                          }
                        }

                        // Handle executable code
                        if (!inline && match && ['js', 'jsx', 'javascript'].includes(match[1])) {
                          return <DynamicComponent code={codeContent} />;
                        }

                        // Default code handling
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            className="code-block"
                          >
                            {codeContent}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="inline-code">{children}</code>
                        );
                      },
                      // Markdown component overrides
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
              ) : (
                <div className="user-message">{message.message.content}</div>
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