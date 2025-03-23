"use client";

import type React from "react";
import { useRef, useEffect } from "react";

// Define WebKit audio context interface
interface WebkitWindow extends Window {
  webkitAudioContext: typeof AudioContext;
}

interface Props {
  audioContext?: AudioContext | null;
  source?: MediaElementAudioSourceNode | null;
  onAnalysis: (intensity: number) => void;
  isActive: boolean;
}

const AudioAnalyzer: React.FC<Props> = ({
  audioContext,
  source,
  onAnalysis,
  isActive,
}) => {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Create AudioContext and analyzer if not provided
  useEffect(() => {
    if (!isActive) return;

    let localContext: AudioContext | null = audioContext || null;

    const setupAnalyzer = async () => {
      try {
        if (!localContext && typeof window !== "undefined") {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as WebkitWindow).webkitAudioContext;
          localContext = new AudioContextClass();
        }

        if (!localContext) return;

        // If we don't have a mediaSource, try to get microphone access
        if (!source) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const micSource = localContext.createMediaStreamSource(stream);

          const analyser = localContext.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          dataArrayRef.current = dataArray;

          micSource.connect(analyser);

          startAnalysis();
        }
      } catch (error) {
        console.error("Error setting up audio analyzer:", error);
      }
    };

    setupAnalyzer();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      // Don't close the AudioContext as it might be shared
    };
  }, [audioContext, source, isActive]);

  // If using passed-in audio source
  useEffect(() => {
    if (!isActive) return;

    if (audioContext && source) {
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      source.connect(analyser);

      startAnalysis();

      return () => {
        source.disconnect(analyser);
        cancelAnimationFrame(animationFrameRef.current);
      };
    }
  }, [audioContext, source, isActive]);

  const startAnalysis = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    const analyze = () => {
      if (!isActive) {
        cancelAnimationFrame(animationFrameRef.current);
        onAnalysis(0); // Set intensity to 0 when not active
        return;
      }

      analyserRef.current!.getByteFrequencyData(dataArrayRef.current!);

      // Calculate average intensity from frequency data
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current!.length; i++) {
        sum += dataArrayRef.current![i];
      }
      const average = sum / dataArrayRef.current!.length;

      // Add natural speech pattern simulation
      // Speech has natural pauses and variations in intensity
      const time = Date.now() / 1000;
      const speechPattern =
        Math.sin(time * 1.5) * 0.15 +
        Math.sin(time * 2.7) * 0.1 +
        Math.sin(time * 4.1) * 0.05;

      // Combine real data with speech pattern for more natural movement
      const normalizedIntensity = Math.min(
        1,
        Math.max(0, average / 255 + speechPattern)
      );

      onAnalysis(normalizedIntensity);

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  };

  useEffect(() => {
    // When component becomes inactive, cancel animation frame
    if (!isActive) {
      cancelAnimationFrame(animationFrameRef.current);
      onAnalysis(0); // Reset intensity to 0
    } else if (analyserRef.current && dataArrayRef.current) {
      // When component becomes active, start analysis
      startAnalysis();
    }
  }, [isActive]);

  return null;
};

export default AudioAnalyzer;
