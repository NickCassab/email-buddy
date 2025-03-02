"""
Configuration management for the Email Assistant application.
Added support for local LLM models.
"""

import os
import json
import shutil
import psutil
import platform

# Configuration file paths
SETTINGS_FILE = 'settings.json'
CREDENTIALS_DIR = 'credentials'
CLIENT_SECRET_FILE = os.path.join(CREDENTIALS_DIR, 'client_secret.json')
TOKEN_FILE = os.path.join(CREDENTIALS_DIR, 'gmail_token.json')

def load_settings():
    """Load user settings"""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r') as file:
                return json.load(file)
        except:
            return _get_default_settings()
    else:
        # Return default settings
        return _get_default_settings()

def save_settings(settings):
    """Save user settings"""
    with open(SETTINGS_FILE, 'w') as file:
        json.dump(settings, file, indent=2)

def save_openai_key(api_key):
    """Save OpenAI API key"""
    settings = load_settings()
    settings['llm_provider'] = 'openai'
    settings['openai_api_key'] = api_key
    save_settings(settings)

def save_local_llm_path(model_path):
    """Save local LLM model path"""
    settings = load_settings()
    settings['llm_provider'] = 'local'
    settings['local_llm_model_path'] = model_path
    save_settings(settings)

def gmail_credentials_exist():
    """Check if Gmail credentials exist"""
    return os.path.exists(CLIENT_SECRET_FILE) and os.path.exists(TOKEN_FILE)

def check_system_requirements():
    """Check system requirements for local LLM usage"""
    system_info = {
        'os': platform.system(),
        'ram_gb': psutil.virtual_memory().total / (1024**3),
        'cpu_count': psutil.cpu_count(logical=False),
        'meets_requirements': False
    }
    
    # Minimum requirements for basic LLM functionality
    min_ram_gb = 8
    min_cpu_count = 2
    
    system_info['meets_requirements'] = (
        system_info['ram_gb'] >= min_ram_gb and 
        system_info['cpu_count'] >= min_cpu_count
    )
    
    return system_info

def _get_default_settings():
    """Get default application settings"""
    return {
        'important_keywords': [
            'urgent', 'important', 'asap', 'deadline', 'required',
            'review', 'approve', 'confirm', 'request', 'attention'
        ],
        'important_senders': [],
        'email_check_frequency': 'daily',
        'response_style': 'professional',
        'custom_prompts': {
            'professional': 'Draft a professional and concise response.',
            'casual': 'Draft a friendly but professional response.',
            'concise': 'Draft an extremely brief response focusing only on essential points.',
            'detailed': 'Draft a comprehensive response addressing all points.'
        },
        'llm_provider': 'openai',  # 'openai' or 'local'
        'local_llm_model_path': '',
        'local_llm_settings': {
            'context_size': 2048,
            'threads': 4
        }
    }