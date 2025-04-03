/**
 * Video Export Utility
 * This utility uses the MediaRecorder API to create videos from frames.
 */

// Check if the browser supports MediaRecorder and the necessary MIME types
const isBrowserSupported = () => {
  if (!window.MediaRecorder) {
    return false;
  }

  // Check for WebM support (most browsers)
  try {
    return MediaRecorder.isTypeSupported("video/webm");
  } catch (e) {
    return false;
  }
};

// Export a video from a series of images
export const exportVideo = (
  frames: HTMLImageElement[],
  options: {
    frameRate?: number;
    width?: number;
    height?: number;
    quality?: string; // 'high', 'medium', 'low'
    mimeType?: string;
    onProgress?: (progress: number) => void;
    audioSrc?: string;
  } = {}
) => {
  return new Promise<Blob>((resolve, reject) => {
    if (!isBrowserSupported()) {
      reject(new Error("Browser does not support MediaRecorder API"));
      return;
    }

    // Default options
    const frameRate = options.frameRate || 24;
    const width = options.width || 1280;
    const height = options.height || 720;
    const quality = options.quality || "medium";
    const onProgress = options.onProgress || (() => {});

    // Set video bitrate based on quality
    let videoBitsPerSecond = 2500000; // Default medium quality (~2.5 Mbps)

    if (quality === "high") {
      videoBitsPerSecond = 5000000; // High quality (~5 Mbps)
    } else if (quality === "low") {
      videoBitsPerSecond = 1000000; // Low quality (~1 Mbps)
    }

    // Create a canvas to draw the frames on
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    // Create a media stream from the canvas
    let stream: MediaStream;
    try {
      stream = canvas.captureStream(frameRate);
    } catch (error) {
      reject(new Error(`Failed to create media stream: ${error}`));
      return;
    }

    // Add audio track if available
    if (options.audioSrc) {
      try {
        const audioElement = new Audio(options.audioSrc);
        audioElement.load();

        audioElement.addEventListener(
          "canplaythrough",
          () => {
            try {
              const audioStream = audioElement.captureStream();
              const audioTrack = audioStream.getAudioTracks()[0];
              if (audioTrack) {
                stream.addTrack(audioTrack);
              }
              startRecording();
            } catch (error) {
              console.warn(
                "Failed to add audio track, continuing without audio:",
                error
              );
              startRecording();
            }
          },
          { once: true }
        );

        // Set a timeout in case audio never loads
        setTimeout(() => {
          if (!audioElement.readyState) {
            console.warn(
              "Audio element failed to load, continuing without audio"
            );
            startRecording();
          }
        }, 5000);
      } catch (error) {
        console.warn("Error setting up audio:", error);
        startRecording();
      }
    } else {
      startRecording();
    }

    function startRecording() {
      // Create media recorder
      let recorder: MediaRecorder;

      try {
        // Try with specified MIME type or default to WebM
        const mimeType = options.mimeType || "video/webm;codecs=vp9";

        if (MediaRecorder.isTypeSupported(mimeType)) {
          recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond,
          });
        } else {
          console.warn(
            `MIME type ${mimeType} not supported, falling back to default`
          );
          recorder = new MediaRecorder(stream);
        }
      } catch (error) {
        console.warn(
          "Error creating MediaRecorder with specified options, using defaults:",
          error
        );
        recorder = new MediaRecorder(stream);
      }

      // Collect recorded chunks
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Create final video blob
        const mimeType = recorder.mimeType || "video/webm";
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };

      recorder.onerror = (error) => {
        reject(error);
      };

      // Start recording
      recorder.start();

      // Process each frame
      let frameIndex = 0;

      const processNextFrame = () => {
        if (frameIndex >= frames.length) {
          // All frames processed, stop recording
          try {
            recorder.stop();
          } catch (error) {
            reject(new Error(`Failed to stop recorder: ${error}`));
          }
          return;
        }

        // Draw current frame
        try {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(frames[frameIndex], 0, 0, width, height);

          // Report progress
          const progress = Math.floor((frameIndex / frames.length) * 100);
          onProgress(progress);
        } catch (error) {
          console.error(`Error drawing frame ${frameIndex}:`, error);
        }

        // Schedule next frame according to frame rate
        frameIndex++;
        setTimeout(processNextFrame, 1000 / frameRate);
      };

      // Start processing frames
      processNextFrame();
    }
  });
};

// Helper function to download a blob as a file
export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};
