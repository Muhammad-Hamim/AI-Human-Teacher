import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Search,
  Plus,
  BrainCircuit,
  Send,
  Mic,
  Book,
  List,
  HelpCircle,
  BookOpen,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import {
  useGetPoemsQuery,
  useGetPoemByIdQuery,
} from "@/redux/features/poems/poemsApi";
import { Poem } from "@/redux/features/poems/poemsApi";
import ThinkingAnimation from "../AskAi/Conversation/ThinkingAnimation";

type FormInputs = {
  message: string;
};

// Bot message types
type MessageType = "bot" | "user" | "poemList" | "quickActions";
interface Message {
  type: MessageType;
  content: string;
  poemList?: Poem[];
}

// Quick action button types
type ActionType = "list" | "browse" | "random" | "help";
interface QuickAction {
  type: ActionType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const QuickActions = ({
  onActionClick,
}: {
  onActionClick: (actionType: ActionType) => void;
}) => {
  const actions: QuickAction[] = [
    {
      type: "list",
      label: "Show Poem List",
      icon: <List className="h-4 w-4" />,
      description: "View a list of available poems",
    },
    {
      type: "browse",
      label: "Browse Collection",
      icon: <BookOpen className="h-4 w-4" />,
      description: "Explore all poems in our collection",
    },
    {
      type: "random",
      label: "Random Poem",
      icon: <Bookmark className="h-4 w-4" />,
      description: "Study a randomly selected poem",
    },
    {
      type: "help",
      label: "Help & Tips",
      icon: <HelpCircle className="h-4 w-4" />,
      description: "Learn how to use this feature",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full max-w-lg">
      {actions.map((action) => (
        <button
          key={action.type}
          onClick={() => onActionClick(action.type)}
          className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/70 hover:bg-indigo-600/30 border border-gray-700 hover:border-indigo-500/50 transition-all text-left"
        >
          <div className="bg-indigo-500/20 p-2 rounded-full">{action.icon}</div>
          <div>
            <div className="text-sm font-medium text-white">{action.label}</div>
            <div className="text-xs text-gray-400">{action.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

const GenerateInteractivePoem = () => {
  const [rows, setRows] = useState(1);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPoemId, setCurrentPoemId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: poemsData, isLoading: isPoemsLoading } = useGetPoemsQuery();
  const { data: poemData } = useGetPoemByIdQuery(currentPoemId || "", {
    skip: !currentPoemId,
  });

  const { register, handleSubmit, reset, watch } = useForm<FormInputs>({
    defaultValues: {
      message: "",
    },
  });
  const messageValue = watch("message", "");

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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking]);

  // Initial welcome message with quick actions
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          type: "bot",
          content:
            "Welcome to the Interactive Poem Generator! I can help you learn poems in an interactive way. Select an option below or type your request:",
        },
        {
          type: "quickActions",
          content: "",
        },
      ]);
    }
  }, [messages]);

  const handleQuickAction = (actionType: ActionType) => {
    switch (actionType) {
      case "list":
        processUserMessage("Show me a list of available poems");
        break;
      case "browse":
        processUserMessage("Browse poem collection");
        break;
      case "random":
        handleRandomPoem();
        break;
      case "help":
        setMessages((prev) => [
          ...prev,
          {
            type: "user",
            content: "I need help with using this feature",
          },
          {
            type: "bot",
            content: `
Here are some tips to help you get started:

• Type "list" to see all available poems
• Type a poem title to find a specific poem
• Click "Browse Collection" to view all poems in a gallery
• Ask for recommendations based on themes or authors
• Type "yes" after selecting a poem to start learning
            `.trim(),
          },
        ]);
        break;
    }
  };

  const handleRandomPoem = () => {
    if (poemsData && poemsData.data.length > 0) {
      const randomIndex = Math.floor(Math.random() * poemsData.data.length);
      const randomPoem = poemsData.data[randomIndex];

      setMessages((prev) => [
        ...prev,
        {
          type: "user",
          content: "Show me a random poem",
        },
        {
          type: "bot",
          content: `I've selected "${randomPoem.title}" by ${randomPoem.author} for you. Would you like to study this poem interactively? Type "yes" to proceed.`,
        },
      ]);

      setCurrentPoemId(randomPoem._id);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          type: "user",
          content: "Show me a random poem",
        },
        {
          type: "bot",
          content:
            "I couldn't find any poems in our collection. Please try again later or browse the collection to see if new poems have been added.",
        },
      ]);
    }
  };

  const processUserMessage = async (message: string) => {
    // Add user message to chat
    setMessages((prev) => [...prev, { type: "user", content: message }]);

    setIsThinking(true);

    // Process message content
    const lowerMessage = message.toLowerCase();

    // Check for poem collection request
    if (
      lowerMessage.includes("collection") ||
      lowerMessage.includes("show all") ||
      lowerMessage.includes("browse")
    ) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content:
              "Taking you to the poem collection page where you can browse all available poems.",
          },
        ]);

        setTimeout(() => {
          navigate("/poem-collection");
        }, 1000);
      }, 800);
    }
    // Check for poem list request
    else if (
      lowerMessage.includes("list") ||
      lowerMessage.includes("available poems") ||
      lowerMessage.includes("show me poems")
    ) {
      if (isPoemsLoading) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content: "Fetching the list of poems, please wait a moment...",
            },
          ]);
        }, 800);
      } else if (poemsData && poemsData.data.length > 0) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              type: "poemList",
              content: "Here are the available poems:",
              poemList: poemsData.data,
            },
          ]);
        }, 800);
      } else {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content:
                "No poems found in the database. Please try again later.",
            },
          ]);
        }, 800);
      }
    }
    // Check for specific poem request
    else if (
      lowerMessage.includes("learn") ||
      lowerMessage.includes("poem") ||
      lowerMessage.includes("study")
    ) {
      // Check if it's a direct poem title
      const potentialPoemTitle = message.trim();

      const matchingPoem = poemsData?.data.find(
        (poem) => poem.title.toLowerCase() === potentialPoemTitle.toLowerCase()
      );

      if (matchingPoem) {
        // Found a match
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content: `I found "${matchingPoem.title}" by ${matchingPoem.author}. Would you like to study this poem interactively? Type "yes" to proceed.`,
            },
          ]);
          setCurrentPoemId(matchingPoem._id);
        }, 800);
      } else {
        // No match found
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content:
                "I couldn't find that specific poem. Would you like to see a list of available poems? Type 'list' to see them.",
            },
          ]);
        }, 800);
      }
    }
    // Check for confirmation to proceed with the selected poem
    else if (lowerMessage.includes("yes") && currentPoemId) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: "Great! Taking you to the interactive poem page now...",
          },
        ]);

        // Navigate to the poem page with the selected poem data
        if (poemData) {
          setTimeout(() => {
            navigate(`/poem/${poemData.data._id}`);
          }, 1000);
        }
      }, 800);
    }
    // Handle general case
    else {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content:
              "I'm here to help you explore and learn poems. You can ask to see a list of available poems, browse the poem collection, or specify a poem you'd like to study.",
          },
        ]);
      }, 800);
    }

    setTimeout(() => {
      setIsThinking(false);
    }, 1000);
  };

  const onSubmit = (data: FormInputs) => {
    if (data.message && data.message.trim()) {
      processUserMessage(data.message.trim());
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

  const handleNewChat = () => {
    setMessages([
      {
        type: "bot",
        content:
          "Welcome to the Interactive Poem Generator! I can help you learn poems in an interactive way. Select an option below or type your request:",
      },
      {
        type: "quickActions",
        content: "",
      },
    ]);
    setCurrentPoemId(null);
  };

  const handlePoemSelection = (poemId: string) => {
    const selectedPoem = poemsData?.data.find((poem) => poem._id === poemId);

    if (selectedPoem) {
      setCurrentPoemId(poemId);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: `You've selected "${selectedPoem.title}" by ${selectedPoem.author}. Would you like to study this poem interactively? Type "yes" to proceed.`,
        },
      ]);
    }
  };

  const handleViewCollection = () => {
    navigate("/poem-collection");
  };

  // Render different message types
  const renderMessage = (message: Message, index: number) => {
    switch (message.type) {
      case "user":
        return (
          <div
            key={index}
            className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 mb-4 ml-auto max-w-[80%]"
          >
            <p className="text-gray-200">{message.content}</p>
          </div>
        );
      case "bot":
        return (
          <div
            key={index}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4 mr-auto max-w-[80%]"
          >
            <p className="text-gray-200">{message.content}</p>
          </div>
        );
      case "quickActions":
        return (
          <div key={index} className="mb-6 mr-auto">
            <QuickActions onActionClick={handleQuickAction} />
          </div>
        );
      case "poemList":
        return (
          <div
            key={index}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4 mr-auto max-w-[80%]"
          >
            <p className="text-gray-200 mb-2">{message.content}</p>
            <div className="grid gap-2">
              {message.poemList?.map((poem) => (
                <div
                  key={poem._id}
                  onClick={() => handlePoemSelection(poem._id)}
                  className="p-2 rounded-md bg-gray-700/50 hover:bg-indigo-500/20 cursor-pointer transition-colors border border-gray-600"
                >
                  <p className="font-medium">{poem.title}</p>
                  <p className="text-xs text-gray-400">{poem.author}</p>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <motion.main
        className="flex overflow-hidden flex-col h-[calc(100vh-100px)] w-[70%] mx-auto bg-gray-900 rounded-xl border border-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex-1 overflow-y-auto message-scrollbar p-6 pb-4 bg-gray-900">
          {messages.map((message, index) => renderMessage(message, index))}
          {isThinking && <ThinkingAnimation />}
          <div ref={messagesEndRef} /> {/* Empty div to scroll to */}
        </div>

        <Card className="border border-gray-800 mx-6 my-4 p-3 bg-gray-800/70 backdrop-blur-sm shadow-lg rounded-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <div className="relative">
              <Textarea
                {...register("message")}
                placeholder="Ask about poems or type a poem name..."
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
                  <TooltipContent>New conversation</TooltipContent>
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
                  <TooltipContent>Search poems</TooltipContent>
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
                      onClick={handleViewCollection}
                    >
                      <Book className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Poem collection</TooltipContent>
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
                      <BrainCircuit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Advanced poem analysis</TooltipContent>
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
                      <Mic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Voice input</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </form>
        </Card>
      </motion.main>
    </TooltipProvider>
  );
};

export default GenerateInteractivePoem;
