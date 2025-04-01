from diffusers import DiffusionPipeline
import torch
import os
import argparse
import re
import sys
import base64
from io import BytesIO

# Ensure proper encoding for console output
if sys.platform.startswith('win'):
    # Fix for Windows
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Parse command line arguments - use a different approach to handle spaces in prompt
parser = argparse.ArgumentParser(description='Generate images with Stable Diffusion')
parser.add_argument('--prompt', type=str, default="a cat riding a horse", help='Prompt for image generation')
parser.add_argument('--width', type=int, default=1920, help='Image width (multiple of 8)')
parser.add_argument('--height', type=int, default=1080, help='Image height (multiple of 8)')
parser.add_argument('--output', type=str, default=None, help='Output filename')
parser.add_argument('--return_base64', action='store_true', help='Return base64 encoded image')
parser.add_argument('--guidance_scale', type=float, default=7.5, help='Guidance scale')

# Parse arguments and handle errors
try:
    args = parser.parse_args()
except Exception as e:
    print(f"Error parsing arguments: {e}", file=sys.stderr)
    # Get the prompt from environment as fallback
    args = parser.parse_args([])
    args.prompt = os.environ.get('SD_PROMPT', "Serene Chinese landscape with mountains and rivers")
    args.width = int(os.environ.get('SD_WIDTH', 384))
    args.height = int(os.environ.get('SD_HEIGHT', 384))
    args.return_base64 = True
    args.guidance_scale = float(os.environ.get('SD_GUIDANCE', 7.0))
    print(f"Using fallback arguments: prompt='{args.prompt}', width={args.width}, height={args.height}", file=sys.stderr)

# Make sure dimensions are multiples of 8
width = args.width - (args.width % 8)
height = args.height - (args.height % 8)

# Ensure we have a valid prompt
if not args.prompt or args.prompt.strip() == "":
    print("Warning: Empty prompt provided. Using default prompt.", file=sys.stderr)
    args.prompt = "Serene Chinese landscape with mountains and rivers, traditional painting style"

# Set environment variable to disable symlinks warning
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

# Set cache directory explicitly
cache_dir = os.path.join(os.path.expanduser("~"), ".cache", "huggingface")

# Truncate prompt if it's too long
if len(args.prompt) > 200:
    print(f"Warning: Prompt was too long and has been truncated", file=sys.stderr)
    args.prompt = args.prompt[:200] + "..."

print(f"Generating image with prompt: '{args.prompt}' at {width}x{height}")

try:
    # Try to load from local cache first, if not available then download
    try:
        # Using the smallest stable diffusion model
        pipeline = DiffusionPipeline.from_pretrained(
            "CompVis/stable-diffusion-v1-4", 
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            local_files_only=True,  # Try to use only local files
            cache_dir=cache_dir,
            safety_checker=None  # Disable safety checker
        )
        print("Using cached model files")
    except Exception as e:
        print(f"Model not found in cache, downloading: {e}", file=sys.stderr)
        pipeline = DiffusionPipeline.from_pretrained(
            "CompVis/stable-diffusion-v1-4", 
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            cache_dir=cache_dir,
            safety_checker=None  # Disable safety checker
        )
        print("Model downloaded and cached for future use")

    # Move model to GPU if available
    if torch.cuda.is_available():
        pipeline.to("cuda")
        print("Using GPU for inference")
    else:
        print("CUDA not available, using CPU (this will be slow)")

    print("Starting image generation...")
    image = pipeline(
        args.prompt, 
        width=width, 
        height=height,
        guidance_scale=args.guidance_scale,
        num_inference_steps=25  # Faster generation
    ).images[0]
    print("Image generation completed")

    # If return_base64 flag is set, encode image as base64 and print it
    if args.return_base64:
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        print(f"BASE64_IMAGE_START:{img_str}:BASE64_IMAGE_END")
    else:
        # Save the image to a file
        if args.output:
            filename = args.output
        else:
            # Convert prompt to filename-safe string
            filename = re.sub(r'[^\w\-_\. ]', '', args.prompt.lower().replace(' ', '_'))[:50] + ".png"
        
        image.save(filename)
        print(f"Image saved as '{filename}'")
        
except Exception as e:
    print(f"Error during execution: {e}", file=sys.stderr)
    sys.exit(1) 