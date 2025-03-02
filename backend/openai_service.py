import openai
import os

class OpenAIService:
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
