import os
import json
import re
from datetime import datetime
import config
from gmail_service import GmailService
from email_processor import EmailProcessor

def recalculate_importance_scores():
    """
    Recalculate importance scores for all emails based on current settings.
    This is useful after changing importance criteria or weights.
    """
    print("Starting importance score recalculation...")
    
    # Load settings
    settings = config.load_settings()
    
    # Check if data file exists
    data_file = 'email_data.json'
    if not os.path.exists(data_file):
        print("Email data file not found. No scores to recalculate.")
        return
    
    # Load email data
    try:
        with open(data_file, 'r') as file:
            email_data = json.load(file)
    except Exception as e:
        print(f"Error loading email data: {str(e)}")
        return
    
    # Initialize Gmail service
    try:
        gmail_service = GmailService()
        gmail_service.authenticate_with_token()
    except Exception as e:
        print(f"Error authenticating with Gmail: {str(e)}")
        return
    
    # Create email processor
    email_processor = EmailProcessor(gmail_service)
    
    # Get keywords and important senders
    keywords = settings.get('important_keywords', [])
    important_senders = settings.get('important_senders', [])
    
    # Get weights
    weights = settings.get('importance_weights', {
        'subject_keyword': 3,
        'body_keyword': 1,
        'important_sender': 5,
        'question_mark': 1,
        'direct_message': 2,
        'email_length': 1
    })
    
    print(f"Using criteria: {len(keywords)} keywords, {len(important_senders)} important senders")
    print(f"Weights: {weights}")
    
    # Counter for processed emails
    processed_count = 0
    updated_count = 0
    
    # Process each email
    for email in email_data['important_emails']:
        processed_count += 1
        
        # Get full email content from Gmail
        try:
            full_email = gmail_service.get_email(email['id'])
            
            if full_email:
                # Calculate new importance score
                old_score = email['importance_score']
                
                # Calculate score using the same logic as in EmailProcessor
                score = 0
                
                # Keyword matches in subject
                for keyword in keywords:
                    if keyword.lower() in full_email['subject'].lower():
                        score += weights.get('subject_keyword', 3)
                
                # Keyword matches in body
                for keyword in keywords:
                    if keyword.lower() in full_email['body'].lower():
                        score += weights.get('body_keyword', 1)
                
                # Important sender
                for sender in important_senders:
                    if sender.lower() in full_email['sender'].lower():
                        score += weights.get('important_sender', 5)
                        break
                
                # Contains questions
                question_count = full_email['body'].count('?')
                score += min(question_count, 3) * weights.get('question_mark', 1)
                
                # Contains direct addressing ("you", "your")
                you_count = len(re.findall(r'\byou\b|\byour\b', full_email['body'].lower()))
                if you_count >= 2:
                    score += 1
                
                # Length of email
                body_length = len(full_email['body'])
                if 100 <= body_length <= 1000:
                    score += weights.get('email_length', 1)
                
                # Email is a direct message (not CC'd)
                if not full_email['cc']:
                    score += weights.get('direct_message', 2)
                
                # Update score if changed
                if score != old_score:
                    email['importance_score'] = score
                    updated_count += 1
                    print(f"Updated email '{full_email['subject']}': {old_score} -> {score}")
        except Exception as e:
            print(f"Error processing email {email['id']}: {str(e)}")
    
    # Save updated email data
    try:
        with open(data_file, 'w') as file:
            json.dump(email_data, file)
        print(f"Recalculation complete. Processed {processed_count} emails, updated {updated_count} scores.")
    except Exception as e:
        print(f"Error saving updated email data: {str(e)}")

if __name__ == "__main__":
    recalculate_importance_scores()
