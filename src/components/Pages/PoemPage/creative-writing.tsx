import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Download, Copy, Check } from "lucide-react"
import { useGetMockCreativeWritingQuery } from "@/redux/features/interactivePoem/deepSeekApi"

interface CreativeWritingProps {
  poem: any
}

export default function CreativeWriting({ poem }: CreativeWritingProps) {
  const [activeTab, setActiveTab] = useState("generate")
  const [theme, setTheme] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [style, setStyle] = useState<"similar" | "modern" | "traditional">("similar")
  const [generatedPoem, setGeneratedPoem] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [remixText, setRemixText] = useState("")
  const [remixFeedback, setRemixFeedback] = useState("")

  // Use mock query for development
  const { data: mockData, refetch: generatePoem } = useGetMockCreativeWritingQuery(
    {
      originalPoemText: poem.lines.map((line: any) => line.chinese).join("\n"),
      theme,
      keywords,
      style,
    },
    { skip: !isGenerating },
  )

  // Handle poem generation
  const handleGeneratePoem = async () => {
    setIsGenerating(true)
    try {
      const result = await generatePoem()
      if (result.data) {
        setGeneratedPoem(result.data.generatedPoem)
      }
    } catch (error) {
      console.error("Error generating poem:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Add keyword
  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput("")
    }
  }

  // Remove keyword
  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  // Copy generated poem
  const copyToClipboard = () => {
    if (!generatedPoem) return

    const textToCopy = `${generatedPoem.chinese}\n\n${generatedPoem.pinyin}\n\n${generatedPoem.english}`
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  // Analyze remix
  const analyzeRemix = () => {
    // In a real implementation, this would call the AI API
    setRemixFeedback(
      "Your remix maintains the theme of nostalgia but shifts the focus to urban imagery. The contrast between city lights and natural elements creates an interesting juxtaposition. Consider adding more sensory details to enhance the emotional impact.",
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Creative Writing</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="generate">AI-Generated Poems</TabsTrigger>
          <TabsTrigger value="remix">Poem Remixing</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Generation Settings</CardTitle>
                <CardDescription>Customize how the AI generates a poem in the style of {poem.author}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Theme</label>
                    <Input
                      placeholder="Enter a theme (e.g., nature, friendship)"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Keywords</label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add keywords"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                      />
                      <Button onClick={addKeyword} type="button">
                        Add
                      </Button>
                    </div>

                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {keyword}
                            <button
                              onClick={() => removeKeyword(keyword)}
                              className="ml-1 h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Style</label>
                    <div className="flex gap-2">
                      <Button
                        variant={style === "similar" ? "default" : "outline"}
                        onClick={() => setStyle("similar")}
                        className="flex-1"
                      >
                        Similar
                      </Button>
                      <Button
                        variant={style === "modern" ? "default" : "outline"}
                        onClick={() => setStyle("modern")}
                        className="flex-1"
                      >
                        Modern
                      </Button>
                      <Button
                        variant={style === "traditional" ? "default" : "outline"}
                        onClick={() => setStyle("traditional")}
                        className="flex-1"
                      >
                        Traditional
                      </Button>
                    </div>
                  </div>

                  <Button onClick={handleGeneratePoem} disabled={isGenerating} className="w-full">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Poem
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Generated Poem</CardTitle>
                {generatedPoem && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {generatedPoem ? (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="text-2xl font-medium whitespace-pre-line">{generatedPoem.chinese}</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-line">{generatedPoem.pinyin}</div>
                      <div className="italic whitespace-pre-line">{generatedPoem.english}</div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-2">AI Explanation</h3>
                      <p className="text-sm text-muted-foreground">{mockData?.explanation}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Sparkles size={48} className="mb-4 opacity-50" />
                    <p>Configure the settings and generate a poem</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="remix">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Original Poem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {poem.lines.map((line: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="text-lg">{line.chinese}</div>
                      <div className="text-sm text-muted-foreground">{line.pinyin}</div>
                      <div className="text-sm italic">{line.translation}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Remix</CardTitle>
                <CardDescription>Modify the poem by changing words or phrases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter your remixed version of the poem..."
                    value={remixText}
                    onChange={(e) => setRemixText(e.target.value)}
                    className="min-h-[200px]"
                  />

                  <Button onClick={analyzeRemix}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get AI Feedback
                  </Button>

                  {remixFeedback && (
                    <div className="border rounded-md p-4 bg-muted/50 mt-4">
                      <h3 className="text-sm font-medium mb-2">AI Feedback:</h3>
                      <p className="text-sm">{remixFeedback}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

