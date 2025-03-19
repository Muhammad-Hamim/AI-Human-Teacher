import { Avatar } from "@/components/ui/avatar";
import { useGetMessagesQuery } from "@/redux/features/chat/chatApi";
import { TMessage } from "@/types/messages/TMessages";
import { memo, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import PoemDisplay from './PoemDisplay';


// Message content renderer with overflow prevention
const MessageContent = memo(({ content }: { content: string }) => {
  // Check if content looks like a poem
  const isPoemContent = useMemo(() => {
    return content.includes('《') && content.includes('》') && 
           content.includes('诗句') && content.includes('诗歌解析');
  }, [content]);
  
  if (isPoemContent) {
    return (
      <>
        <PoemDisplay content={content} />
        {/* Fallback to regular markdown if poem parsing fails */}
        <div className="hidden">
          <ReactMarkdown 
            rehypePlugins={[rehypeRaw]}
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    language={match[1]}
                    style={oneDark}
                    customStyle={{ margin: 0 }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              // Prevent image overflow
              img: ({node, ...props}) => (
                <img
                  {...props}
                  className="max-w-full h-auto"
                  alt={props.alt || "Image"}
                />
              ),
              // Prevent table overflow
              table: ({node, ...props}) => (
                <div className="overflow-x-auto w-full">
                  <table {...props} className="min-w-full" />
                </div>
              ),
              // Handle pre tag overflow
              pre: ({node, ...props}) => (
                <pre {...props} className="overflow-x-auto" />
              )
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </>
    );
  }
  
  // Regular content rendering with overflow prevention
  return (
    <ReactMarkdown 
      rehypePlugins={[rehypeRaw]}
      components={{
        code({node, inline, className, children, ...props}) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              language={match[1]}
              style={oneDark}
              customStyle={{ margin: 0 }}
              wrapLongLines={true} // Wrap long lines
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        // Prevent image overflow
        img: ({node, ...props}) => (
          <img
            {...props}
            className="max-w-full h-auto"
            alt={props.alt || "Image"}
          />
        ),
        // Prevent table overflow
        table: ({node, ...props}) => (
          <div className="overflow-x-auto w-full">
            <table {...props} className="min-w-full" />
          </div>
        ),
        // Handle pre tag overflow
        pre: ({node, ...props}) => (
          <pre {...props} className="overflow-x-auto" />
        ),
        // Ensure links don't break layout
        a: ({node, ...props}) => (
          <a {...props} className="break-words" />
        ),
        // Handle long words in paragraphs
        p: ({node, ...props}) => (
          <p {...props} className="break-words" />
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

MessageContent.displayName = 'MessageContent';

// Individual message component with overflow prevention
const Message = memo(({ message }: { message: TMessage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${
        message.isAIResponse ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`flex ${
          message.isAIResponse ? "flex-row" : "flex-row-reverse"
        } max-w-[85%] gap-3`}
      >
        <Avatar
          className={`h-8 w-8 ${
            message.isAIResponse ? "bg-secondary" : "bg-[#202327]"
          }`}
        >
          <span className="text-xs">
            {message.isAIResponse ? "AI" : "U"}
          </span>
        </Avatar>
        <div
          className={`p-4 rounded-2xl ${
            message.isAIResponse
              ? "bg-[#16181c] text-secondary-foreground rounded-tl-none"
              : "bg-[#202327] text-primary-foreground rounded-tr-none"
          } overflow-hidden`} // Added overflow-hidden
        >
          {message.isAIResponse ? (
            <div className="user-message prose prose-invert max-w-none break-words overflow-hidden">
              <MessageContent content={message.message.content} />
            </div>
          ) : (
            <div className="user-message break-words">{message.message.content}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

Message.displayName = 'Message';

// Messages list component
const ChatMessagesList = memo(({ messages }: { messages: { data: TMessage[] } }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data.length]);
  
  return (
    <div className="space-y-6 pb-4 overflow-hidden w-full"> {/* Added overflow-hidden and w-full */}
      {messages.data.map((message: TMessage, index: number) => (
        <Message key={message._id || index} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
});

ChatMessagesList.displayName = 'ChatMessagesList';

// Main component with proper memoization
const ChatMessages = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { data: messages = { data: [] }, isLoading } = useGetMessagesQuery(
    chatId as string,
    {
      skip: !chatId,
      refetchOnMountOrArgChange: true
    }
  );
  
  // Memoize the empty state
  const emptyState = useMemo(() => (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <h1 className="text-2xl font-bold mb-2">Chinese Poetry Tutor</h1>
      <p className="text-muted-foreground max-w-md">
        Ask about classical Chinese poems, get detailed explanations, or
        request interactive learning experiences.
      </p>
    </div>
  ), []);
  
  // Show empty state or loading indicator
  if (!chatId || isLoading) {
    return emptyState;
  }
  
  if (messages.data.length === 0) {
    return emptyState;
  }
  
  return <ChatMessagesList messages={messages} />;
};

// Export with proper memo comparison function to prevent unnecessary re-renders
export default memo(ChatMessages, (prevProps, nextProps) => {
  // This component doesn't take props, so it should only re-render
  // when its internal state changes or when the route changes
  return true;
});