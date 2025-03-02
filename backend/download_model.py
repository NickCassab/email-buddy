"""
Helper script to download a local LLM model for use with the Email Assistant.
This script downloads a quantized Llama model in GGUF format from HuggingFace.
"""

import os
import sys
import argparse
import requests
from tqdm import tqdm

def download_file(url, destination):
    """Download a file from URL with progress bar"""
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()  # Raise exception for bad status codes
        
        # Get file size for progress bar
        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024  # 1 KB blocks
        
        # Create directory for the file if it doesn't exist
        os.makedirs(os.path.dirname(os.path.abspath(destination)), exist_ok=True)
        
        # Download with progress bar
        with open(destination, 'wb') as file, tqdm(
            desc=os.path.basename(destination),
            total=total_size,
            unit='B',
            unit_scale=True,
            unit_divisor=1024,
        ) as bar:
            for data in response.iter_content(block_size):
                file.write(data)
                bar.update(len(data))
                
        return True
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        # Remove partial file if download failed
        if os.path.exists(destination):
            os.remove(destination)
        return False

def get_available_models():
    """Return a list of available models to download"""
    return [
        {
            "name": "Llama-2-7B-Chat (Q4_K_M)",
            "description": "Llama 2 7B Chat model quantized to 4-bit (2.9 GB)",
            "url": "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf",
            "size": "2.9 GB"
        },
        {
            "name": "Llama-2-7B-Chat (Q5_K_M)",
            "description": "Llama 2 7B Chat model quantized to 5-bit (3.5 GB)",
            "url": "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q5_K_M.gguf",
            "size": "3.5 GB"
        },
        {
            "name": "Mistral-7B-Instruct (Q4_K_M)",
            "description": "Mistral 7B Instruct model quantized to 4-bit (3.0 GB)",
            "url": "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf",
            "size": "3.0 GB"
        }
    ]

def main():
    """Main function to download a model"""
    parser = argparse.ArgumentParser(description="Download LLM models for Email Assistant")
    parser.add_argument('--list', action='store_true', help='List available models')
    parser.add_argument('--model', type=int, help='Model number to download (from list)')
    parser.add_argument('--output', type=str, default='models', help='Output directory (default: models)')
    
    args = parser.parse_args()
    
    models = get_available_models()
    
    if args.list or args.model is None:
        print("Available models to download:")
        for i, model in enumerate(models, 1):
            print(f"{i}. {model['name']} - {model['description']} - Size: {model['size']}")
        print("\nUsage: python download_model.py --model <number>")
        return
    
    if args.model < 1 or args.model > len(models):
        print(f"Error: Model number must be between 1 and {len(models)}")
        return
    
    selected_model = models[args.model - 1]
    
    print(f"Downloading {selected_model['name']} ({selected_model['size']})...")
    
    output_dir = args.output
    output_file = os.path.join(output_dir, os.path.basename(selected_model['url']))
    
    success = download_file(selected_model['url'], output_file)
    
    if success:
        print(f"\nModel downloaded successfully to: {output_file}")
        print("\nTo use this model with Email Assistant:")
        print(f"1. Make sure llama-cpp-python is installed: pip install llama-cpp-python")
        print(f"2. In Email Assistant settings, select 'Local LLM' and enter the full path: {os.path.abspath(output_file)}")
    else:
        print("\nFailed to download the model. Please check your internet connection and try again.")

if __name__ == "__main__":
    main()