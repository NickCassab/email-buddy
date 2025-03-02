"""
Base LLM service and implementations for different LLM providers.
This module provides a common interface for different LLM providers
and implementations for both OpenAI API and local Llama models.
"""

import os
import openai
from abc import ABC, abstractmethod

class BaseLLMService(ABC):
    """Base abstract class for LLM services"""
    
    @abstractmethod
    def is_configured(self):
        """Check if the LLM service is properly configured and ready to use"""
        pass
    
    @abstractmethod
    def generate_reply(self, sender, subject, body, style='professional', custom_instructions=''):
        """Generate a reply to an email"""
        pass
    
    def _get_style_prompt(self, style):
        """Get the system prompt for the given email style"""
        style_prompts = {
            'professional': """
                You are an email assistant drafting professional business replies.
                Keep responses clear, concise, and formal.
                Use professional language and maintain a respectful tone.
                Ensure your response directly addresses the key points from the original email.
                End with a professional closing.
                Do not include any salutations - the system will add those automatically.
            """,
            
            'casual': """
                You are an email assistant drafting friendly, casual replies.
                Keep the tone conversational and approachable, but still professional.
                Use a more relaxed writing style while being clear and direct.
                Address the key points from the original email in a friendly manner.
                End with a warm, casual closing.
                Do not include any salutations - the system will add those automatically.
            """,
            
            'concise': """
                You are an email assistant drafting extremely concise replies.
                Keep responses brief and to the point - use as few words as possible.
                Focus only on the essential information needed to respond effectively.
                Use short sentences and minimal elaboration.
                End with a brief, efficient closing.
                Do not include any salutations - the system will add those automatically.
            """,
            
            'detailed': """
                You are an email assistant drafting comprehensive, detailed replies.
                Provide thorough responses that address all points raised in the original email.
                Be comprehensive but organized, using paragraphs to separate different points.
                Maintain a professional tone while providing detailed information.
                End with a thorough closing that summarizes key points if needed.
                Do not include any salutations - the system will add those automatically.
            """
        }
        
        return style_prompts.get(style, style_prompts['professional']).strip()


class OpenAIService(BaseLLMService):
    """OpenAI API implementation of the LLM service"""
    
    def __init__(self, api_key):
        """Initialize the OpenAI service with the given API key"""
        self.api_key = api_key
        openai.api_key = api_key
        self.client = openai.OpenAI(api_key=api_key)
    
    def is_configured(self):
        """Check if the OpenAI API key is valid"""
        try:
            # Make a simple API call to validate the key
            response = self.client.models.list()
            return True
        except Exception as e:
            print(f"Error validating OpenAI API key: {str(e)}")
            return False
    
    def generate_reply(self, sender, subject, body, style='professional', custom_instructions=''):
        """Generate a reply to an email using OpenAI's API"""
        # Extract sender name (if available)
        sender_name = sender.split('<')[0].strip()
        if not sender_name or sender_name == sender:
            # If no name is available, try to extract from email
            sender_name = sender.split('@')[0].split('.')[0].capitalize()
        
        # Prepare the system prompt based on the selected style
        system_prompt = self._get_style_prompt(style)
        
        # Add custom instructions if provided
        if custom_instructions:
            system_prompt += f"\n\n{custom_instructions}"
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",  # You can upgrade to gpt-4 for better responses
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Please draft a reply to this email:\n\nFrom: {sender}\nSubject: {subject}\n\n{body}"}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            reply_content = response.choices[0].message.content.strip()
            return reply_content
            
        except Exception as e:
            print(f"Error generating reply with OpenAI: {str(e)}")
            raise e


class LocalLLMService(BaseLLMService):
    """Local LLM implementation using llama-cpp-python"""
    
    def __init__(self, model_path=None):
        """Initialize the local LLM service with the path to the model"""
        self.model_path = model_path
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the local LLM model"""
        try:
            # Only import llama_cpp if a local model is being used
            from llama_cpp import Llama
            
            if not os.path.exists(self.model_path):
                print(f"Model file not found: {self.model_path}")
                return False
            
            # Load the model with default parameters
            # These can be expanded in future milestones
            self.model = Llama(
                model_path=self.model_path,
                n_ctx=2048,        # Context window size
                n_threads=4        # Default to 4 threads
            )
            
            print(f"Successfully loaded model: {self.model_path}")
            return True
        except ImportError:
            print("llama-cpp-python package not installed. Please install it to use local models.")
            return False
        except Exception as e:
            print(f"Error loading local LLM model: {str(e)}")
            return False
    
    def is_configured(self):
        """Check if the local LLM model is loaded and ready"""
        return self.model is not None
    
    def generate_reply(self, sender, subject, body, style='professional', custom_instructions=''):
        """Generate a reply to an email using the local LLM model"""
        if not self.is_configured():
            raise RuntimeError("Local LLM model is not configured properly")
            
        # Extract sender name (if available)
        sender_name = sender.split('<')[0].strip()
        if not sender_name or sender_name == sender:
            # If no name is available, try to extract from email
            sender_name = sender.split('@')[0].split('.')[0].capitalize()
        
        # Prepare the system prompt based on the selected style
        system_prompt = self._get_style_prompt(style)
        
        # Add custom instructions if provided
        if custom_instructions:
            system_prompt += f"\n\n{custom_instructions}"
        
        try:
            # Format prompt for Llama-2 chat format
            prompt = f"""<s>[INST] <<SYS>>
{system_prompt}
<</SYS>>

Please draft a reply to this email:

From: {sender}
Subject: {subject}

{body} [/INST]"""

            # Generate response
            response = self.model(
                prompt,
                max_tokens=500,
                temperature=0.7,
                stop=["</s>"]
            )
            
            # Extract the generated text
            reply_content = response['choices'][0]['text'].strip()
            return reply_content
            
        except Exception as e:
            print(f"Error generating reply with local LLM: {str(e)}")
            raise e


def create_llm_service(provider_type, config):
    """Factory function to create the appropriate LLM service"""
    if provider_type == 'openai':
        return OpenAIService(config.get('api_key', ''))
    elif provider_type == 'local':
        return LocalLLMService(config.get('model_path', ''))
    else:
        raise ValueError(f"Unsupported LLM provider type: {provider_type}")