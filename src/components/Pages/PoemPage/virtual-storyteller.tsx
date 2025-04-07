/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Volume2, Pause, Play, SkipBack, Music, Loader2 } from "lucide-react";
import { useGetPoemNarrationMutation } from "@/redux/features/interactivePoem/deepSeekApi";
import ToggleLanguage from "@/components/common/ToggleLanguage";

export interface PoemNarrationResponse {
  success: boolean;
  message: string;
  data: {
    poem: {
      id: string;
      title: string;
      author: string;
      dynasty: string;
    };
    narration: {
      text: string;
      audio: {
        url: string;
        base64: string;
        contentType: string;
      };
    };
  };
}

interface VirtualStorytellerProps {
  poem: any;
}
// Available language options
type TLanguage = "zh-CN" | "en-US";

export default function VirtualStoryteller({ poem }: VirtualStorytellerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [speed, setSpeed] = useState(1);
  const [narrationText, setNarrationText] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  // Add language state - default to Chinese
  const [language, setLanguage] = useState<TLanguage>("zh-CN");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Use the mutation hook
  const [getPoemNarration, { isLoading }] = useGetPoemNarrationMutation();

  // Handle audio playback rate and volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      audioRef.current.volume = volume / 100;
    }
  }, [speed, volume]);

  // Handle narration generation
  const handleGenerateNarration = async () => {
    // Check if poem object and poem ID exist
    if (!poem || !poem._id) {
      console.error("No poem ID available", poem);
      alert("Cannot generate narration: Missing poem information");
      return;
    }

    setIsGenerating(true);

    try {
      const response = (await getPoemNarration({
        poemId: poem._id, // Use _id instead of id
        language,
      }).unwrap()) as PoemNarrationResponse;

      if (response.success && response.data.narration) {
        // Set narration text
        setNarrationText(response.data.narration.text);

        // Create audio source from base64
        const audioData = response.data.narration.audio.base64;
        const contentType = response.data.narration.audio.contentType;
        const audioSrc = `data:${contentType};base64,${audioData}`;
        setAudioSrc(audioSrc);
      } else {
        console.error("Failed to generate narration:", response.message);
        alert("Failed to generate narration. Please try again.");
      }
    } catch (error) {
      console.error("Error generating narration:", error);
      alert(
        "An error occurred while generating the narration. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle play/pause
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  // Reset playback
  const resetPlayback = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Virtual Storyteller</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Storyteller Settings</CardTitle>
            <CardDescription>
              Customize how the AI narrates the poem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="volume">Volume: {volume}%</Label>
                </div>
                <Slider
                  id="volume"
                  min={0}
                  max={100}
                  step={5}
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="speed">Speed: {speed.toFixed(1)}x</Label>
                </div>
                <Slider
                  id="speed"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[speed]}
                  onValueChange={(value) => setSpeed(value[0])}
                />
              </div>
              {/* Select story telling Language: */}
              <ToggleLanguage language={language} setLanguage={setLanguage} />
              <Button
                onClick={handleGenerateNarration}
                disabled={isGenerating || isLoading}
                className="w-full"
              >
                {isGenerating || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Generate Narration
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Storytelling Experience</CardTitle>
            {narrationText && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Music className="h-3 w-3" />
                  Professional narration
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {narrationText ? (
              <div className="space-y-6">
                <div className="border rounded-md p-4 bg-muted/30 min-h-[200px] max-h-[300px] overflow-y-auto">
                  <p className="whitespace-pre-line">{narrationText}</p>
                </div>

                {audioSrc && (
                  <>
                    <audio ref={audioRef} src={audioSrc} preload="auto" />
                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={resetPlayback}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={isPlaying ? "destructive" : "default"}
                        size="lg"
                        className="rounded-full h-12 w-12"
                        onClick={togglePlayback}
                      >
                        {isPlaying ? (
                          <Pause className="h-6 w-6" />
                        ) : (
                          <Play className="h-6 w-6" />
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Volume2 size={48} className="mb-4 opacity-50" />
                <p>Generate a narration to begin the storytelling experience</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
