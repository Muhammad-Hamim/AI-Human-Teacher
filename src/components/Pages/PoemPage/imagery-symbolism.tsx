/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info, BookOpen, Moon, CloudSnow, ArrowUp, ArrowDown, Home } from "lucide-react"

interface ImagerySymbolismProps {
  poem: any
}

export default function ImagerySymbolism({ poem }: ImagerySymbolismProps) {
  const [activeSymbol, setActiveSymbol] = useState<string | null>("moonlight")

  // Get all imagery and symbolism keys
  const getSymbolKeys = () => {
    if (!poem.imageryAndSymbolism) return []
    return Object.keys(poem.imageryAndSymbolism)
  }

  // Get symbol explanation
  const getSymbolExplanation = (key: string) => {
    if (!poem.imageryAndSymbolism) return ""
    return poem.imageryAndSymbolism[key] || ""
  }

  // Get icon for symbol
  const getSymbolIcon = (key: string) => {
    switch (key) {
      case "moonlight":
        return <Moon className="h-5 w-5" />
      case "frost":
        return <CloudSnow className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  // Get highlighted text for the poem
  const getHighlightedText = (text: string, symbolKey: string) => {
    if (!symbolKey) return text

    // Define keywords for each symbol
    const symbolKeywords: Record<string, string[]> = {
      moonlight: ["明月", "月", "月光"],
      frost: ["霜", "地上霜"],
    }

    const keywords = symbolKeywords[symbolKey] || []

    if (keywords.length === 0) return text

    // Replace keywords with highlighted version
    let highlightedText = text
    keywords.forEach((keyword) => {
      const regex = new RegExp(keyword, "g")
      highlightedText = highlightedText.replace(regex, `<span class="bg-yellow-200 px-1 rounded">${keyword}</span>`)
    })

    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Imagery & Symbolism</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Symbolic Elements</CardTitle>
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
                    <span className="ml-2 capitalize">{key}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="capitalize">{activeSymbol ? activeSymbol : "Select a symbol"}</CardTitle>
          </CardHeader>
          <CardContent>
            {activeSymbol ? (
              <div className="space-y-6">
                <div className="prose">
                  <p>{getSymbolExplanation(activeSymbol)}</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">In the poem:</h3>

                  <div className="space-y-4">
                    {poem.lines.map((line: any, index: number) => (
                      <div key={index} className="p-2">
                        {getHighlightedText(line.chinese, activeSymbol)}
                        <p className="text-sm text-gray-500 mt-1">{line.pinyin}</p>
                        <p className="text-sm italic mt-1">{line.translation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">Cultural Significance:</h3>

                  <div className="bg-gray-800 p-4 rounded-md border border-gray-700 text-gray-200 shadow-md">
                    {activeSymbol === "moonlight" && (
                      <div className="space-y-2">
                        <p>The moon holds profound significance in Chinese culture and literature:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-300">
                          <li>Symbol of reunion and family togetherness</li>
                          <li>Associated with the Mid-Autumn Festival</li>
                          <li>Represents beauty, purity, and elegance</li>
                          <li>Often evokes feelings of nostalgia and longing</li>
                        </ul>
                      </div>
                    )}

                    {activeSymbol === "frost" && (
                      <div className="space-y-2">
                        <p>Frost in Chinese poetry often symbolizes:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-300">
                          <li>The passing of time and seasons</li>
                          <li>Hardship and adversity</li>
                          <li>Purity and clarity</li>
                          <li>The cold isolation of being away from home</li>
                        </ul>
                      </div>
                    )}
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Visual Representation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 p-6 rounded-md border border-gray-800">
            <div className="max-w-2xl mx-auto">
              <div className="relative h-[300px] border border-gray-700 rounded-md bg-gradient-to-b from-gray-950 to-blue-950 overflow-hidden shadow-inner">
                {/* Moon */}
                <div
                  className={`absolute top-10 left-1/2 transform -translate-x-1/2 h-20 w-20 rounded-full bg-gray-200 shadow-lg ${
                    activeSymbol === "moonlight" ? "ring-4 ring-blue-400 animate-pulse" : ""
                  }`}
                />

                {/* Bed */}
                <div className="absolute bottom-10 left-1/4 h-12 w-32 bg-gray-800 rounded-md border border-gray-700" />

                {/* Frost/Ground */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-800 to-gray-900 ${
                    activeSymbol === "frost" ? "ring-2 ring-blue-500 animate-pulse" : ""
                  }`}
                />

                {/* Person looking up */}
                <div className="absolute bottom-20 right-1/4 flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-700" />
                  <div className="h-16 w-6 bg-gray-700 rounded-b-md" />
                  <ArrowUp className={`h-6 w-6 text-gray-300 ${activeSymbol === "moonlight" ? "animate-bounce" : ""}`} />
                </div>

                {/* Person looking down */}
                <div className="absolute bottom-20 right-1/3 flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-700" />
                  <div className="h-16 w-6 bg-gray-700 rounded-b-md" />
                  <ArrowDown className="h-6 w-6 text-gray-300" />
                </div>

                {/* Home (distant) */}
                <div className="absolute bottom-12 right-10">
                  <Home className="h-10 w-10 text-gray-500 opacity-30" />
                </div>
              </div>

              <div className="text-center mt-4 text-sm text-gray-400">
                Visual representation of the imagery in "静夜思" (Quiet Night Thoughts)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

