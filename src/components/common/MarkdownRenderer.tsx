import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Custom components for consistent markdown styling
const markdownComponents = {
  // Code blocks
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-gray-800 p-2 rounded-md overflow-x-auto text-sm my-2">
      {children}
    </pre>
  ),
  // Inline code
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-gray-800 px-1 py-0.5 rounded text-sm text-teal-400 font-mono">
      {children}
    </code>
  ),
  // Headers
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-xl font-bold my-4">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-lg font-bold my-3">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-md font-bold my-2">{children}</h3>
  ),
  // Lists
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc pl-6 my-2">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal pl-6 my-2">{children}</ol>
  ),
  // Links
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a
      href={href}
      className="text-blue-400 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  // Block quotes
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-gray-600 pl-4 italic my-2">
      {children}
    </blockquote>
  ),
};

const MarkdownRenderer = ({
  content,
  className = "",
}: MarkdownRendererProps) => {
  if (!content) return null;

  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={markdownComponents}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
