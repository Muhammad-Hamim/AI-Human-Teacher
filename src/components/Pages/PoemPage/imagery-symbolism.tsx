/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Info,
  BookOpen,
  Moon,
  CloudSnow,
  ArrowUp,
  ArrowDown,
  Home,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import {
  useGetPoemImagerySymbolismMutation,
  useGetPoemImageMutation,
} from "@/redux/features/interactivePoem/poemInsightsApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ToggleLanguage from "@/components/common/ToggleLanguage";

interface ImagerySymbolismProps {
  poem: any;
}
// Available language options
type Language = "zh-CN" | "en-US";
interface ImagerySymbolismData {
  imageryAndSymbolism: Record<
    string,
    {
      description: string;
      keywords: string[];
      culturalSignificance: string[];
      icon: string;
    }
  >;
  visualRepresentation?: {
    title: string;
    description: string;
  };
}

export default function ImagerySymbolism({ poem }: ImagerySymbolismProps) {
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [data, setData] = useState<ImagerySymbolismData | null>(null);
  const [poemImage, setPoemImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string | null>(null);
  const [activeVisualTab, setActiveVisualTab] =
    useState<string>("illustration");
  // Add language state - default to Chinese
  const [language, setLanguage] = useState<Language>("zh-CN");
  // Use RTK Query mutations for API calls
  const [getPoemImagerySymbolism, { isLoading, error: apiError }] =
    useGetPoemImagerySymbolismMutation();

  const [getPoemImage, { isLoading: isImageLoading, error: imageError }] =
    useGetPoemImageMutation();

  // Fetch imagery and symbolism data from the API
  const fetchImagerySymbolism = async () => {
    if (!poem?._id) return;

    try {
      const response = await getPoemImagerySymbolism({
        poemId: poem._id,
        language,
      }).unwrap();
      setData(response.data);

      // Set the first symbol as active if available
      const symbolKeys = Object.keys(response.data.imageryAndSymbolism || {});
      if (symbolKeys.length > 0 && !activeSymbol) {
        setActiveSymbol(symbolKeys[0]);
      }
    } catch (err) {
      console.error("Error fetching imagery and symbolism data:", err);
    }
  };

  // Fetch poem image from the API
  const fetchPoemImage = async () => {
    if (!poem?._id) return;

    try {
      const response = await getPoemImage(poem._id).unwrap();
      setPoemImage(response.data.imageBase64);
      setImagePrompt(response.data.prompt);
      // Switch to AI image tab
      setActiveVisualTab("ai-image");
    } catch (err) {
      console.error("Error fetching poem image:", err);
    }
  };

  // Handle image download
  const handleDownloadImage = () => {
    if (!poemImage) return;

    const link = document.createElement("a");
    link.href = `data:image/png;base64,${poemImage}`;
    link.download = `${poem.title || "poem"}_illustration.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get all imagery and symbolism keys
  const getSymbolKeys = () => {
    if (!data?.imageryAndSymbolism) return [];
    return Object.keys(data.imageryAndSymbolism);
  };

  // Get symbol explanation
  const getSymbolExplanation = (key: string) => {
    if (!data?.imageryAndSymbolism) return "";
    return data.imageryAndSymbolism[key]?.description || "";
  };

  // Get icon for symbol
  const getSymbolIcon = (key: string) => {
    if (!data?.imageryAndSymbolism) return <Info className="h-5 w-5" />;

    const iconName = data.imageryAndSymbolism[key]?.icon || "Info";

    switch (iconName) {
      case "Moon":
        return <Moon className="h-5 w-5" />;
      case "CloudSnow":
        return <CloudSnow className="h-5 w-5" />;
      case "Home":
        return <Home className="h-5 w-5" />;
      case "ArrowUpDown":
        return <ArrowUpDown className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  // Get highlighted text for the poem
  const getHighlightedText = (text: string, symbolKey: string) => {
    if (!symbolKey || !data?.imageryAndSymbolism) return text;

    const keywords = data.imageryAndSymbolism[symbolKey]?.keywords || [];

    if (keywords.length === 0) return text;

    // Replace keywords with highlighted version
    let highlightedText = text;
    keywords.forEach((keyword) => {
      const regex = new RegExp(keyword, "g");
      highlightedText = highlightedText.replace(
        regex,
        `<span class="bg-yellow-200 text-black dark:bg-yellow-600 dark:text-white px-1 rounded">${keyword}</span>`
      );
    });

    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  // Get cultural significance for symbol
  const getCulturalSignificance = (key: string) => {
    if (!data?.imageryAndSymbolism) return [];
    return data.imageryAndSymbolism[key]?.culturalSignificance || [];
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Imagery & Symbolism</h2>
        <div className="sm:flex items-center gap-2">
          {/* Language Toggle */}
          <ToggleLanguage language={language} setLanguage={setLanguage} />
          <Button
            onClick={fetchImagerySymbolism}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : data ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh Analysis
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                Generate Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {apiError && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 mb-6 rounded-md">
          Failed to fetch imagery and symbolism data. Please try again later.
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-100/5 border border-gray-200/20 rounded-lg">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-lg font-medium">
            Analyzing imagery and symbolism...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This may take a moment as our AI examines the poem's symbolic
            elements
          </p>
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-100/5 border border-gray-200/20 rounded-lg">
          <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-lg font-medium">
            No imagery analysis available yet
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Click the "Generate Analysis" button to have our AI analyze the
            poem's imagery and symbolism
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Symbolic Elements</CardTitle>
              <CardDescription>
                Select an element to explore its meaning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getSymbolKeys().map((key) => (
                  <Button
                    key={key}
                    variant={activeSymbol === key ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setActiveSymbol(key)}
                  >
                    <div className="flex items-center">
                      {getSymbolIcon(key)}
                      <span className="ml-2 capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="capitalize">
                {activeSymbol
                  ? activeSymbol.replace(/_/g, " ")
                  : "Select a symbol"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeSymbol ? (
                <div className="space-y-6">
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p>{getSymbolExplanation(activeSymbol)}</p>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-2">In the poem:</h3>

                    <div className="space-y-4 bg-gray-100/10 p-4 rounded-md">
                      {poem?.lines && Array.isArray(poem.lines) ? (
                        poem.lines.map((line: any, index: number) => (
                          <div
                            key={index}
                            className="p-2 hover:bg-gray-200/10 rounded transition-colors"
                          >
                            {getHighlightedText(
                              line.chinese || "",
                              activeSymbol
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                              {line.pinyin || ""}
                            </p>
                            <p className="text-sm italic mt-1">
                              {line.translation || ""}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-400">
                          No poem lines available to highlight
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-2">
                      Cultural Significance:
                    </h3>

                    <div className="bg-gray-800 p-4 rounded-md border border-gray-700 text-gray-200 shadow-md">
                      <div className="space-y-2">
                        <p>
                          In Chinese culture and literature, this symbol
                          represents:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-300">
                          {getCulturalSignificance(activeSymbol).map(
                            (item, index) => (
                              <li key={index}>{item}</li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                  <BookOpen size={48} className="mb-4 opacity-50" />
                  <p>Select a symbolic element to explore</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visual Representation - With Tabs for different types */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Visual Representation</CardTitle>
            <Button
              onClick={fetchPoemImage}
              variant="outline"
              disabled={isImageLoading}
              size="sm"
              className="gap-2"
            >
              {isImageLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : poemImage ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Image
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  Generate AI Image
                </>
              )}
            </Button>
          </div>
          {imageError && (
            <p className="text-red-500 text-sm mt-2">
              Failed to generate image. Please try again.
            </p>
          )}
        </CardHeader>

        <Tabs
          value={activeVisualTab}
          onValueChange={setActiveVisualTab}
          className="w-full"
        >
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="illustration">
                Interactive Illustration
              </TabsTrigger>
              <TabsTrigger value="ai-image" disabled={!poemImage}>
                AI Generated Image
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="illustration" className="mt-0">
            <CardContent>
              <div className="bg-gray-900 p-6 rounded-md border border-gray-800">
                <div className="max-w-2xl mx-auto">
                  <div className="relative h-[300px] border border-gray-700 rounded-md bg-gradient-to-b from-gray-950 to-blue-950 overflow-hidden shadow-inner">
                    {/* Moon */}
                    <div
                      className={`absolute top-10 left-1/2 transform -translate-x-1/2 h-20 w-20 rounded-full bg-gray-200 shadow-lg ${
                        activeSymbol === "moonlight"
                          ? "ring-4 ring-blue-400"
                          : ""
                      }`}
                    />

                    {/* Bed */}
                    <div className="absolute bottom-10 left-1/4 h-12 w-32 bg-gray-800 rounded-md border border-gray-700" />

                    {/* Frost/Ground */}
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-800 to-gray-900 ${
                        activeSymbol === "frost" ? "ring-2 ring-blue-500" : ""
                      }`}
                    />

                    {/* Person looking up */}
                    <div className="absolute bottom-20 right-1/4 flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-700" />
                      <div className="h-16 w-6 bg-gray-700 rounded-b-md" />
                      <ArrowUp
                        className={`h-6 w-6 text-gray-300 ${
                          activeSymbol === "looking_up_down" ||
                          activeSymbol === "moonlight"
                            ? "animate-bounce"
                            : ""
                        }`}
                      />
                    </div>

                    {/* Person looking down */}
                    <div className="absolute bottom-20 right-1/3 flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-700" />
                      <div className="h-16 w-6 bg-gray-700 rounded-b-md" />
                      <ArrowDown
                        className={`h-6 w-6 text-gray-300 ${
                          activeSymbol === "looking_up_down"
                            ? "animate-bounce"
                            : ""
                        }`}
                      />
                    </div>

                    {/* Home (distant) */}
                    <div className="absolute bottom-12 right-10">
                      <Home
                        className={`h-10 w-10 text-gray-500 opacity-30 ${
                          activeSymbol === "homeland"
                            ? "text-yellow-500 opacity-70"
                            : ""
                        }`}
                      />
                    </div>
                  </div>

                  <div className="text-center mt-4 text-sm text-gray-400">
                    Interactive illustration of the imagery in the poem
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="ai-image" className="mt-0">
            <CardContent>
              {isImageLoading ? (
                <div className="flex flex-col items-center justify-center h-[300px] bg-gray-900 rounded-md border border-gray-800">
                  <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                  <p className="text-lg text-gray-300">
                    Generating AI image...
                  </p>
                  <p className="text-sm text-gray-500 mt-2 max-w-md text-center">
                    Please wait while our AI creates a visual representation
                    inspired by the poem
                  </p>
                </div>
              ) : poemImage ? (
                <div className="bg-gray-900 p-6 rounded-md border border-gray-800">
                  <div className="max-w-2xl mx-auto">
                    <div className="relative border border-gray-700 rounded-md overflow-hidden shadow-inner">
                      <img
                        src={`data:image/png;base64,${poemImage}`}
                        alt={`AI generated image of ${poem.title}`}
                        className="w-full h-auto object-contain"
                      />
                    </div>

                    {imagePrompt && (
                      <div className="mt-4 text-sm text-gray-400 bg-gray-800/50 p-3 rounded-md">
                        <p className="font-medium mb-1">Image Description:</p>
                        <p className="italic">{imagePrompt}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] bg-gray-900 rounded-md border border-gray-800">
                  <ImageIcon className="h-16 w-16 text-gray-600 mb-4" />
                  <p className="text-gray-400">
                    Click "Generate AI Image" to create a visual representation
                    of the poem
                  </p>
                </div>
              )}
            </CardContent>
            {poemImage && (
              <CardFooter className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadImage}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Image
                </Button>
              </CardFooter>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
