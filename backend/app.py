"""
Main Flask application for the Email Assistant.
Updated with LLM service abstraction to support both OpenAI and local LLM models.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from gmail_service import GmailService
from llm_service import create_llm_service, OpenAIService, LocalLLMService
from email_processor import EmailProcessor
import config

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize services
gmail_service = None
llm_service = None
email_processor = None

@app.route('/api/status', methods=['GET'])
def status():
    """Check if services are properly configured and connected"""
    gmail_status = gmail_service is not None and gmail_service.is_authenticated()
    llm_status = llm_service is not None and llm_service.is_configured()
    
    # Get current LLM provider type
    settings = config.load_settings()
    llm_provider = settings.get('llm_provider', 'openai')
    
    return jsonify({
        'gmail_configured': gmail_status,
        'llm_configured': llm_status,
        'llm_provider': llm_provider,
        'ready': gmail_status and llm_status
    })

@app.route('/api/setup/gmail', methods=['GET'])
def gmail_auth_url():
    """Get the Gmail OAuth URL for initial setup"""
    global gmail_service
    try:
        print("Initializing Gmail service...")
        gmail_service = GmailService()
        print("Getting authorization URL...")
        auth_url = gmail_service.get_authorization_url()
        print(f"Authorization URL generated: {auth_url[:50]}...")  # Print part of the URL for debugging
        return jsonify({'auth_url': auth_url})
    except Exception as e:
        import traceback
        print(f"Error getting Gmail authorization URL: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Failed to get authorization URL: {str(e)}'}), 500

@app.route('/api/setup/gmail/callback', methods=['POST'])
def gmail_auth_callback():
    """Handle the Gmail OAuth callback"""
    auth_code = request.json.get('code')
    try:
        gmail_service.authenticate_with_code(auth_code)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/setup/openai', methods=['POST'])
def setup_openai():
    """Configure the OpenAI API key"""
    global llm_service
    api_key = request.json.get('api_key')
    
    try:
        llm_service = OpenAIService(api_key)
        if llm_service.is_configured():
            config.save_openai_key(api_key)
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Invalid API key'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/setup/local-llm', methods=['POST'])
def setup_local_llm():
    """Configure the local LLM model"""
    global llm_service
    model_path = request.json.get('model_path')
    
    # Check if model file exists
    if not os.path.exists(model_path):
        return jsonify({'success': False, 'error': f'Model file not found: {model_path}'})
    
    # Check system requirements
    system_info = config.check_system_requirements()
    if not system_info['meets_requirements']:
        return jsonify({
            'success': False, 
            'error': 'System does not meet minimum requirements for running local LLM models',
            'system_info': system_info
        })
    
    try:
        # Try to load the model
        llm_service = LocalLLMService(model_path)
        
        if llm_service.is_configured():
            config.save_local_llm_path(model_path)
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to load the model'})
    except ImportError:
        return jsonify({'success': False, 'error': 'Required package llama-cpp-python not installed. Run: pip install llama-cpp-python'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/test-llm', methods=['POST'])
def test_llm():
    """Test the configured LLM model"""
    if not llm_service or not llm_service.is_configured():
        return jsonify({'success': False, 'error': 'LLM service not configured'}), 401
    
    try:
        # Get current LLM provider
        settings = config.load_settings()
        provider = settings.get('llm_provider', 'openai')
        
        # Simple test prompt
        test_result = llm_service.generate_reply(
            sender="Test User <test@example.com>",
            subject="Test Email",
            body="This is a test email to verify that the LLM service is working correctly.",
            style="concise"
        )
        
        return jsonify({
            'success': True, 
            'provider': provider,
            'response': test_result
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/emails/important', methods=['GET'])
def get_important_emails():
    """Get a list of important emails"""
    global email_processor
    
    if not gmail_service or not gmail_service.is_authenticated():
        return jsonify({'error': 'Gmail service not configured'}), 401
    
    if not email_processor:
        email_processor = EmailProcessor(gmail_service)
    
    try:
        important_emails = email_processor.get_important_emails()
        return jsonify(important_emails)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/emails/refresh', methods=['POST'])
def refresh_emails():
    """Manually refresh emails from Gmail"""
    global email_processor
    
    if not gmail_service or not gmail_service.is_authenticated():
        return jsonify({'error': 'Gmail service not configured'}), 401
    
    if not email_processor:
        email_processor = EmailProcessor(gmail_service)
    
    try:
        email_processor.refresh_emails()
        important_emails = email_processor.get_important_emails()
        return jsonify(important_emails)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/emails/<email_id>', methods=['GET'])
def get_email_detail(email_id):
    """Get details of a specific email"""
    if not gmail_service or not gmail_service.is_authenticated():
        return jsonify({'error': 'Gmail service not configured'}), 401
    
    try:
        email_detail = gmail_service.get_email(email_id)
        return jsonify(email_detail)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/emails/<email_id>/draft-reply', methods=['POST'])
def draft_reply(email_id):
    """Generate an AI draft reply for a specific email"""
    if not gmail_service or not gmail_service.is_authenticated():
        return jsonify({'error': 'Gmail service not configured'}), 401
    
    if not llm_service or not llm_service.is_configured():
        return jsonify({'error': 'LLM service not configured'}), 401
    
    try:
        email_detail = gmail_service.get_email(email_id)
        
        style = request.json.get('style', 'professional')
        custom_instructions = request.json.get('custom_instructions', '')
        
        draft = llm_service.generate_reply(
            sender=email_detail['sender'],
            subject=email_detail['subject'],
            body=email_detail['body'],
            style=style,
            custom_instructions=custom_instructions
        )
        
        return jsonify({'draft': draft})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/emails/<email_id>/send-reply', methods=['POST'])
def send_reply(email_id):
    """Send a reply to a specific email"""
    if not gmail_service or not gmail_service.is_authenticated():
        return jsonify({'error': 'Gmail service not configured'}), 401
    
    reply_text = request.json.get('reply_text')
    
    try:
        gmail_service.send_reply(email_id, reply_text)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get current user settings"""
    settings = config.load_settings()
    
    # Remove sensitive information like API keys
    if 'openai_api_key' in settings:
        settings['openai_configured'] = bool(settings['openai_api_key'])
        del settings['openai_api_key']
    
    # Check if local model path exists
    if 'local_llm_model_path' in settings and settings['local_llm_model_path']:
        settings['local_llm_configured'] = os.path.exists(settings['local_llm_model_path'])
    else:
        settings['local_llm_configured'] = False
    
    # Check system requirements for local models
    settings['system_info'] = config.check_system_requirements()
    
    return jsonify(settings)

@app.route('/api/emails/recalculate-importance', methods=['POST'])
def recalculate_importance():
    """Recalculate importance scores for all emails"""
    global email_processor
    
    if not gmail_service or not gmail_service.is_authenticated():
        return jsonify({'error': 'Gmail service not configured'}), 401
    
    if not email_processor:
        email_processor = EmailProcessor(gmail_service)
    
    try:
        email_processor.recalculate_importance_scores()
        important_emails = email_processor.get_important_emails()
        return jsonify(important_emails)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings', methods=['POST'])
def update_settings():
    """Update user settings"""
    global llm_service
    
    new_settings = request.json
    current_settings = config.load_settings()
    
    # Check if LLM provider has changed
    old_provider = current_settings.get('llm_provider', 'openai')
    new_provider = new_settings.get('llm_provider', old_provider)
    
    # Update settings, preserving API keys if not provided
    if 'openai_api_key' not in new_settings and 'openai_api_key' in current_settings:
        new_settings['openai_api_key'] = current_settings['openai_api_key']
    
    config.save_settings(new_settings)
    
    # Reinitialize LLM service if provider or key was updated
    if new_provider != old_provider or 'openai_api_key' in new_settings:
        if new_provider == 'openai':
            llm_service = OpenAIService(new_settings.get('openai_api_key', ''))
        elif new_provider == 'local':
            llm_service = LocalLLMService(new_settings.get('local_llm_model_path', ''))
    
    return jsonify({'success': True})

if __name__ == '__main__':
    # Load existing configuration if available
    settings = config.load_settings()
    
    # Initialize Gmail service if previously configured
    if config.gmail_credentials_exist():
        gmail_service = GmailService()
        try:
            gmail_service.authenticate_with_token()
        except:
            gmail_service = None
    
    # Initialize LLM service based on configured provider
    provider = settings.get('llm_provider', 'openai')
    if provider == 'openai' and 'openai_api_key' in settings and settings['openai_api_key']:
        llm_service = OpenAIService(settings['openai_api_key'])
    elif provider == 'local' and 'local_llm_model_path' in settings and settings['local_llm_model_path']:
        try:
            llm_service = LocalLLMService(settings['local_llm_model_path'])
        except ImportError:
            print("Warning: llama-cpp-python package not installed. Local LLM functionality will be unavailable.")
            print("To enable local LLMs, install the package: pip install llama-cpp-python")
    
    # Start Flask app
    app.run(debug=True, port=5000)