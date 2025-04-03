import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  setPoemTitle,
  setPoemContent,
  addImages,
  removeImage,
  setAudioFile,
  removeAudio,
  setAnimationStyle,
  setAnimationTiming,
  startGeneration,
  updateProgress,
  generationComplete,
  generationFailed,
  resetState,
} from "@/redux/features/poemVideo/poemVideoSlice";
import {
  useSimulateVideoGenerationMutation,
  useTranscodeAudioMutation,
  useGenerateAudioMutation,
} from "@/redux/features/poemVideo/poemVideoApi";
import {
  validateAudioFile,
  validateImageFile,
  fileToBase64,
  createImagePreviews,
} from "./utils";
import AnimatedPreview from "./AnimatedPreview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import AnimatedVideoPlayer from "./AnimatedVideoPlayer";

const PoemStorytellingVideo: React.FC = () => {
  const dispatch = useAppDispatch();
  const poemVideo = useAppSelector((state) => state.poemVideo);

  const [activeTab, setActiveTab] = useState("upload");
  const [audioSrc, setAudioSrc] = useState<string | undefined>(undefined);
  const [simulateVideoGeneration] = useSimulateVideoGenerationMutation();
  const [transcodeAudio] = useTranscodeAudioMutation();
  const [generateAudio] = useGenerateAudioMutation();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Handle image uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate each file
    const validFiles: File[] = [];

    files.forEach((file) => {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else if (validation.error) {
        toast.error(validation.error);
      }
    });

    if (validFiles.length > 0) {
      // Create image previews as base64 or URLs
      const imagePreviews = createImagePreviews(validFiles);

      // Convert files to serializable objects for Redux storage
      const serializedFiles = validFiles.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
      }));

      // Dispatch with serializable data
      dispatch(
        addImages({
          serializedFiles: serializedFiles,
          previews: imagePreviews,
        })
      );
    }

    // Reset the input to allow selecting the same files again
    e.target.value = "";
  };

  // Handle audio upload
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate the file
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Audio file is too large. Maximum size is 10MB.");
      return;
    }

    try {
      // Convert to base64 for storage and preview
      const base64 = await fileToBase64(file);

      // Store only serializable data in Redux
      dispatch(
        setAudioFile({
          serializedFile: {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
          },
          base64,
        })
      );

      // Use the base64 data for audio preview
      setAudioSrc(base64);
    } catch (error) {
      console.error("Error processing audio file:", error);
      toast.error("Failed to process audio file");
    }

    // Reset the input to allow selecting the same file again
    e.target.value = "";
  };

  // Handle generating the video
  const handleGenerateVideo = async () => {
    // Validate required fields
    if (!poemVideo.poem.title || !poemVideo.poem.content) {
      toast.error("Please enter a poem title and content");
      return;
    }

    if (poemVideo.images.serializedFiles.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    // Start generation process
    dispatch(startGeneration());
    setActiveTab("preview");

    try {
      // Mock progress updates
      const progressInterval = setInterval(() => {
        dispatch(
          updateProgress(Math.min(95, poemVideo.processing.progress + 5))
        );
      }, 500);

      // Convert images to base64
      const base64Images = await Promise.all(
        poemVideo.images.previews.map((preview) => {
          // The preview URLs already contain the images we need
          return preview;
        })
      );

      // Call the API to generate the video
      const response = await simulateVideoGeneration({
        poemTitle: poemVideo.poem.title,
        poemContent: poemVideo.poem.content,
        images: base64Images,
        audio: poemVideo.audio.base64 || undefined,
        animationStyle: poemVideo.animation.selectedStyle,
        animationTiming: poemVideo.animation.timing,
      }).unwrap();

      clearInterval(progressInterval);

      // Handle successful generation
      if (response.success) {
        // Store the generated video URL
        dispatch(generationComplete(response.data.videoUrl));

        // Force the component to update and show the video
        if (videoRef.current) {
          videoRef.current.src = response.data.videoUrl;
          videoRef.current.load();
        }

        toast.success("Video generated successfully!");
      } else {
        throw new Error(response.error || "Generation failed");
      }
    } catch (error) {
      console.error("Error generating video:", error);
      dispatch(generationFailed("Failed to generate video. Please try again."));
      toast.error("Failed to generate video");
    }
  };

  // Reset the form
  const handleReset = () => {
    dispatch(resetState());
    setAudioSrc(undefined);
    setActiveTab("upload");
  };

  // Render the form section for poem upload
  const renderPoemUploadSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Poem Details</CardTitle>
        <CardDescription>Enter your poem title and content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="poemTitle">Poem Title</Label>
          <Input
            id="poemTitle"
            placeholder="Enter poem title"
            value={poemVideo.poem.title}
            onChange={(e) => dispatch(setPoemTitle(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="poemContent">Poem Content</Label>
          <Textarea
            id="poemContent"
            placeholder="Enter your poem here..."
            className="min-h-[200px] resize-none"
            value={poemVideo.poem.content}
            onChange={(e) => dispatch(setPoemContent(e.target.value))}
          />
        </div>
      </CardContent>
    </Card>
  );

  // Render the form section for media upload
  const renderMediaUploadSection = () => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Media</CardTitle>
        <CardDescription>Upload images and optional audio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image upload */}
        <div className="space-y-2">
          <Label htmlFor="imageUpload">Upload Images</Label>
          <Input
            id="imageUpload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />
          <p className="text-sm text-gray-500">
            Upload images to accompany your poem (JPG, PNG, GIF, max 5MB each)
          </p>

          {/* Image previews */}
          {poemVideo.images.previews.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {poemVideo.images.previews.map((src, index) => (
                <div key={index} className="relative group">
                  <img
                    src={src}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => dispatch(removeImage(index))}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audio upload */}
        <div className="space-y-2">
          <Label htmlFor="audioUpload">Upload Audio (Optional)</Label>
          <Input
            id="audioUpload"
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
          />
          <p className="text-sm text-gray-500">
            Upload audio narration (MP3, WAV, OGG, max 10MB)
          </p>

          {/* Audio preview */}
          {audioSrc && (
            <div className="mt-4 p-4 border rounded-md">
              <audio
                ref={audioRef}
                src={audioSrc}
                controls
                className="w-full"
              />
              <button
                type="button"
                className="mt-2 text-sm text-red-500"
                onClick={() => {
                  dispatch(removeAudio());
                  setAudioSrc(undefined);
                }}
              >
                Remove Audio
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render the form section for animation settings
  const renderAnimationSettingsSection = () => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Animation Settings</CardTitle>
        <CardDescription>Customize how your poem is animated</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Animation style selection */}
        <div className="space-y-2">
          <Label>Animation Style</Label>
          <RadioGroup
            value={poemVideo.animation.selectedStyle}
            onValueChange={(value) => dispatch(setAnimationStyle(value))}
            className="grid grid-cols-2 gap-4"
          >
            {poemVideo.animation.availableStyles.map((style) => (
              <div key={style.id} className="flex items-start space-x-3">
                <RadioGroupItem value={style.id} id={style.id} />
                <div className="grid gap-1.5">
                  <Label htmlFor={style.id}>{style.name}</Label>
                  <p className="text-sm text-gray-500">{style.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Animation timing settings */}
        <div className="space-y-4">
          <Label>Animation Timing</Label>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <span className="text-sm">
                {poemVideo.animation.timing.duration / 1000}s
              </span>
            </div>
            <Slider
              id="duration"
              min={500}
              max={5000}
              step={100}
              value={[poemVideo.animation.timing.duration]}
              onValueChange={(value) =>
                dispatch(setAnimationTiming({ duration: value[0] }))
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="delay">Delay (seconds)</Label>
              <span className="text-sm">
                {poemVideo.animation.timing.delay / 1000}s
              </span>
            </div>
            <Slider
              id="delay"
              min={0}
              max={2000}
              step={100}
              value={[poemVideo.animation.timing.delay]}
              onValueChange={(value) =>
                dispatch(setAnimationTiming({ delay: value[0] }))
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="staggering">Staggering (seconds)</Label>
              <span className="text-sm">
                {poemVideo.animation.timing.staggering / 1000}s
              </span>
            </div>
            <Slider
              id="staggering"
              min={100}
              max={1000}
              step={50}
              value={[poemVideo.animation.timing.staggering]}
              onValueChange={(value) =>
                dispatch(setAnimationTiming({ staggering: value[0] }))
              }
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={handleGenerateVideo}>Generate Video</Button>
      </CardFooter>
    </Card>
  );

  // Render the preview section
  const renderPreviewSection = () => (
    <div className="space-y-6">
      {poemVideo.processing.isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle>Generating Your Video</CardTitle>
            <CardDescription>
              Please wait while we create your animated poem video...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={poemVideo.processing.progress} className="h-2" />
            <p className="mt-2 text-center text-sm">
              {poemVideo.processing.progress}% complete
            </p>
          </CardContent>
        </Card>
      )}

      {poemVideo.processing.error && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>{poemVideo.processing.error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setActiveTab("upload")} variant="outline">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      )}

      {!poemVideo.processing.isGenerating && !poemVideo.processing.error && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Preview Your Animated Poem
          </h2>

          {poemVideo.output.videoUrl ? (
            // Show the advanced video player when a video has been generated
            <div className="rounded-lg overflow-hidden bg-gray-950">
              <AnimatedVideoPlayer
                audioSrc={audioSrc}
                animationStyle={poemVideo.animation.selectedStyle}
                imagePreviews={poemVideo.images.previews}
                onComplete={() => console.log("Video playback completed")}
              />
            </div>
          ) : (
            // Show the standard preview when no video is yet generated
            <AnimatedPreview
              poemTitle={poemVideo.poem.title}
              poemContent={poemVideo.poem.content}
              images={poemVideo.images.previews}
              audioSrc={audioSrc}
              animationStyle={poemVideo.animation.selectedStyle}
              animationTiming={poemVideo.animation.timing}
            />
          )}

          {poemVideo.output.videoUrl && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Generated Video</CardTitle>
                <CardDescription>
                  Your video has been generated successfully! You can play it
                  above or download it.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleReset}>
                  Create Another
                </Button>
                <Button
                  onClick={() => {
                    // Get the video data from session storage for download
                    const storedData =
                      sessionStorage.getItem("poem_video_frames");
                    if (storedData) {
                      try {
                        const parsed = JSON.parse(storedData);

                        // Create a link to download the first frame as an image
                        // In a real implementation, you would convert frames to a video file
                        const a = document.createElement("a");
                        a.href = parsed.frames[0];
                        a.download = `${poemVideo.poem.title.replace(
                          /\s+/g,
                          "_"
                        )}_preview.jpg`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);

                        toast.success("Preview image downloaded successfully");
                        toast.info(
                          "For a full video, export would require server-side processing"
                        );
                      } catch (error) {
                        console.error("Error downloading video:", error);
                        toast.error("Failed to download video");
                      }
                    }
                  }}
                >
                  Download Preview
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      className="container mx-auto py-8 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Poem to Video Creator
        </h1>
        <p className="text-gray-500 mb-8">
          Transform your poems into beautiful animated videos with synchronized
          audio and visuals.
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="upload">Upload Content</TabsTrigger>
            <TabsTrigger value="preview">Preview & Generate</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {renderPoemUploadSection()}
            {renderMediaUploadSection()}
            {renderAnimationSettingsSection()}
          </TabsContent>

          <TabsContent value="preview">{renderPreviewSection()}</TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default PoemStorytellingVideo;
