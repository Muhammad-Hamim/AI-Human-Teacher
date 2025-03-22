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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Volume2,
  Pause,
  Play,
  SkipBack,
  Music,
  Wind,
  Footprints,
  Loader2,
} from "lucide-react";
import { useGetMockStorytellerNarrationQuery } from "@/redux/features/interactivePoem/deepSeekApi";

interface VirtualStorytellerProps {
  poem: any;
}

export default function VirtualStoryteller({ poem }: VirtualStorytellerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [includeSoundEffects, setIncludeSoundEffects] = useState(true);
  const [tone, setTone] = useState<"dramatic" | "calm" | "nostalgic">(
    "nostalgic"
  );
  const [volume, setVolume] = useState(80);
  const [speed, setSpeed] = useState(1);
  const [narration, setNarration] = useState<any>(null);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [triggerQuery, setTriggerQuery] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sound effect audio elements
  const windSoundRef = useRef<HTMLAudioElement | null>(null);
  const footstepsSoundRef = useRef<HTMLAudioElement | null>(null);
  const breathSoundRef = useRef<HTMLAudioElement | null>(null);
  const fluteSoundRef = useRef<HTMLAudioElement | null>(null);

  // Use mock query for development - don't skip based on isGenerating, use triggerQuery instead
  const {
    data: mockData,
    isLoading,
    isSuccess,
  } = useGetMockStorytellerNarrationQuery(
    {
      poemText: poem.lines.map((line: any) => line.chinese).join("\n"),
      poemTitle: poem.title,
      author: poem.author,
      includeSoundEffects,
      tone,
    },
    { skip: !triggerQuery }
  );

  // Process data when it arrives
  useEffect(() => {
    if (isSuccess && mockData) {
      setNarration(mockData);
      setIsGenerating(false);
      setTriggerQuery(false);
    }
  }, [isSuccess, mockData]);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      speechSynthesisRef.current = new SpeechSynthesisUtterance();

      // Try to find a suitable voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.lang.includes("en") &&
          (voice.name.includes("Female") || voice.name.includes("f"))
      );

      if (preferredVoice) {
        speechSynthesisRef.current.voice = preferredVoice;
      }

      // Set up event handlers
      speechSynthesisRef.current.onend = () => {
        if (currentSegment < narrationSegments.length - 1) {
          setCurrentSegment((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          setCurrentSegment(0);
        }
      };

      // Load voices when they change
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        const voice = updatedVoices.find(
          (voice) =>
            voice.lang.includes("en") &&
            (voice.name.includes("Female") || voice.name.includes("f"))
        );

        if (voice && speechSynthesisRef.current) {
          speechSynthesisRef.current.voice = voice;
        }
      };
    }

    // Initialize sound effects
    windSoundRef.current = new Audio("/sounds/wind.mp3");
    footstepsSoundRef.current = new Audio("/sounds/footsteps.mp3");
    breathSoundRef.current = new Audio("/sounds/breath.mp3");
    fluteSoundRef.current = new Audio("/sounds/flute.mp3");

    return () => {
      if (window.speechSynthesis && speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
      // Clean up sound effects
      [windSoundRef, footstepsSoundRef, breathSoundRef, fluteSoundRef].forEach(
        (ref) => {
          if (ref.current) {
            ref.current.pause();
            ref.current.currentTime = 0;
          }
        }
      );
    };
  }, []);

  // Update speech properties when settings change
  useEffect(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.rate = speed;
      speechSynthesisRef.current.volume = volume / 100;
    }
  }, [speed, volume]);

  // Split narration into segments for sound effects
  const narrationSegments = narration?.narration?.split("[sound:") || [];

  // Play the current segment
  useEffect(() => {
    if (isPlaying && narration && narrationSegments.length > 0) {
      let text = narrationSegments[currentSegment];

      // Extract sound effect if present
      let soundEffect = null;
      if (currentSegment > 0) {
        const soundMatch = text.match(/^([^\]]+)\]/);
        if (soundMatch) {
          soundEffect = soundMatch[1].trim();
          text = text.replace(/^[^\]]+\]/, "").trim();
        }
      }

      // Play sound effect if enabled
      if (includeSoundEffects && soundEffect) {
        playSoundEffect(soundEffect);
      }

      // Speak the text
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        speechSynthesisRef.current.text = text;
        window.speechSynthesis.speak(speechSynthesisRef.current);
      }
    }
  }, [
    isPlaying,
    currentSegment,
    narration,
    includeSoundEffects,
    narrationSegments,
  ]);

  // Play sound effect based on cue
  const playSoundEffect = (effect: string) => {
    switch (effect) {
      case "gentle wind":
        if (windSoundRef.current) {
          windSoundRef.current.volume = volume / 100;
          windSoundRef.current.play();
        }
        break;
      case "soft footsteps":
        if (footstepsSoundRef.current) {
          footstepsSoundRef.current.volume = volume / 100;
          footstepsSoundRef.current.play();
        }
        break;
      case "deep breath":
        if (breathSoundRef.current) {
          breathSoundRef.current.volume = volume / 100;
          breathSoundRef.current.play();
        }
        break;
      case "distant flute melody":
        if (fluteSoundRef.current) {
          fluteSoundRef.current.volume = volume / 100;
          fluteSoundRef.current.play();
        }
        break;
    }
  };

  // Handle narration generation - simplified to just trigger the query
  const handleGenerateNarration = () => {
    setIsGenerating(true);
    setTriggerQuery(true);
  };

  // Toggle play/pause
  const togglePlayback = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();

      // Pause sound effects
      [windSoundRef, footstepsSoundRef, breathSoundRef, fluteSoundRef].forEach(
        (ref) => {
          if (ref.current) {
            ref.current.pause();
          }
        }
      );
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        // Start from beginning
        setCurrentSegment(0);
      }
    }

    setIsPlaying(!isPlaying);
  };

  // Reset playback
  const resetPlayback = () => {
    window.speechSynthesis.cancel();

    // Stop sound effects
    [windSoundRef, footstepsSoundRef, breathSoundRef, fluteSoundRef].forEach(
      (ref) => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      }
    );

    setCurrentSegment(0);
    setIsPlaying(false);
  };

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
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound-effects">Sound Effects</Label>
                  <Switch
                    id="sound-effects"
                    checked={includeSoundEffects}
                    onCheckedChange={setIncludeSoundEffects}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Add ambient sounds to enhance the storytelling experience
                </p>
              </div>

              <div className="space-y-2">
                <Label>Narration Tone</Label>
                <div className="flex gap-2">
                  <Button
                    variant={tone === "dramatic" ? "default" : "outline"}
                    onClick={() => setTone("dramatic")}
                    className="flex-1"
                  >
                    Dramatic
                  </Button>
                  <Button
                    variant={tone === "calm" ? "default" : "outline"}
                    onClick={() => setTone("calm")}
                    className="flex-1"
                  >
                    Calm
                  </Button>
                  <Button
                    variant={tone === "nostalgic" ? "default" : "outline"}
                    onClick={() => setTone("nostalgic")}
                    className="flex-1"
                  >
                    Nostalgic
                  </Button>
                </div>
              </div>

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
            {narration && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Music className="h-3 w-3" />
                  {tone} tone
                </Badge>
                {includeSoundEffects && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Wind className="h-3 w-3" />
                    Sound effects
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {narration ? (
              <div className="space-y-6">
                <div className="border rounded-md p-4 bg-muted/30 min-h-[200px] max-h-[300px] overflow-y-auto">
                  <p className="whitespace-pre-line">{narration.narration}</p>
                </div>

                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="icon" onClick={resetPlayback}>
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

                {narration.soundEffects && includeSoundEffects && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Sound Effects:</h3>
                    <div className="flex flex-wrap gap-2">
                      {narration.soundEffects.map(
                        (effect: any, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Footprints className="h-3 w-3" />
                            {effect.cue}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
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
