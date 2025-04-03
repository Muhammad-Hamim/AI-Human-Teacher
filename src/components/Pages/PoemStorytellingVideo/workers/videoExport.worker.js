/* eslint-disable no-restricted-globals */
// Video Export Worker

// Import FFmpeg
// Note: This will need to be properly bundled by Webpack with worker-loader
importScripts('https://unpkg.com/@ffmpeg/ffmpeg@0.10.1/dist/ffmpeg.min.js');

// Initialize FFmpeg
const { createFFmpeg, fetchFile } = FFmpeg;
let ffmpeg = null;

// Handle messages from main thread
self.addEventListener('message', async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      try {
        // Initialize FFmpeg with progress tracking
        ffmpeg = createFFmpeg({
          log: true, 
          progress: ({ ratio }) => {
            self.postMessage({ type: 'progress', data: Math.round(ratio * 100) });
          },
          corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js'
        });
        
        await ffmpeg.load();
        self.postMessage({ type: 'init', data: { success: true } });
      } catch (error) {
        self.postMessage({ 
          type: 'error', 
          data: { message: 'Failed to initialize FFmpeg', details: error.toString() } 
        });
      }
      break;

    case 'processFrames':
      if (!ffmpeg) {
        self.postMessage({ 
          type: 'error', 
          data: { message: 'FFmpeg not initialized' } 
        });
        return;
      }

      try {
        const { frames, frameRate, hasAudio, audioData } = data;
        
        // Process all frames
        for (let i = 0; i < frames.length; i++) {
          // Convert data URL to Uint8Array
          const base64Data = frames[i].split(',')[1];
          const binaryData = atob(base64Data);
          const byteArray = new Uint8Array(binaryData.length);
          
          for (let j = 0; j < binaryData.length; j++) {
            byteArray[j] = binaryData.charCodeAt(j);
          }
          
          // Write frame to virtual filesystem
          const filename = `frame_${i.toString().padStart(5, '0')}.jpg`;
          ffmpeg.FS('writeFile', filename, byteArray);
          
          // Report progress
          if (i % 10 === 0) {
            self.postMessage({ 
              type: 'frameProgress', 
              data: { current: i, total: frames.length } 
            });
          }
        }
        
        // Write audio file if available
        if (hasAudio && audioData) {
          const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
          ffmpeg.FS('writeFile', 'audio.mp3', audioBuffer);
        }
        
        // Create video from frames
        self.postMessage({ type: 'status', data: 'Creating video from frames...' });
        
        await ffmpeg.run(
          '-framerate', frameRate.toString(),
          '-pattern_type', 'glob',
          '-i', 'frame_*.jpg',
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-preset', 'fast',
          '-crf', '23',
          'output.mp4'
        );
        
        // Add audio if available
        if (hasAudio && audioData) {
          self.postMessage({ type: 'status', data: 'Adding audio to video...' });
          
          // Rename the video file
          ffmpeg.FS('rename', 'output.mp4', 'temp_video.mp4');
          
          // Combine video with audio
          await ffmpeg.run(
            '-i', 'temp_video.mp4',
            '-i', 'audio.mp3',
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-shortest',
            'final_video.mp4'
          );
          
          // Read the final video file
          const data = ffmpeg.FS('readFile', 'final_video.mp4');
          self.postMessage({
            type: 'complete',
            data: { 
              buffer: data.buffer,
              mimeType: 'video/mp4',
              fileName: 'poem-video.mp4'
            }
          }, [data.buffer]); // Transfer buffer ownership
        } else {
          // Read the video file without audio
          const data = ffmpeg.FS('readFile', 'output.mp4');
          self.postMessage({
            type: 'complete',
            data: { 
              buffer: data.buffer,
              mimeType: 'video/mp4',
              fileName: 'poem-video.mp4'
            }
          }, [data.buffer]); // Transfer buffer ownership
        }
      } catch (error) {
        self.postMessage({ 
          type: 'error', 
          data: { message: 'Failed to process video', details: error.toString() } 
        });
      }
      break;

    case 'terminate':
      if (ffmpeg) {
        // Clean up
        try {
          // Delete any remaining files
          const files = ffmpeg.FS('readdir', '/');
          files.forEach(file => {
            if (file !== '.' && file !== '..') {
              try {
                ffmpeg.FS('unlink', file);
              } catch (e) {
                // Ignore errors
              }
            }
          });
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      // Terminate the worker
      self.close();
      break;
      
    default:
      self.postMessage({ 
        type: 'error', 
        data: { message: `Unknown command: ${type}` } 
      });
  }
});

// Report that the worker is ready
self.postMessage({ type: 'ready' }); 