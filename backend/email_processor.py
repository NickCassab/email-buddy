import os
import json
import re
from datetime import datetime
import config

class EmailProcessor:
    def __init__(self, gmail_service):
        """Initialize the email processor with the Gmail service"""
        self.gmail_service = gmail_service
        self.data_file = 'email_data.json'
        self.emails = self._load_data()
        self.settings = config.load_settings()
    
    def _load_data(self):
        """Load email data from the data file"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as file:
                    return json.load(file)
            except:
                return {'important_emails': [], 'processed_ids': []}
        else:
            return {'important_emails': [], 'processed_ids': []}
    
    def _save_data(self):
        """Save email data to the data file"""
        with open(self.data_file, 'w') as file:
            json.dump(self.emails, file)
    
    def refresh_emails(self):
        """Refresh emails from Gmail and identify important ones"""
        recent_emails = self.gmail_service.get_recent_emails(max_results=50)
        
        # Update settings
        self.settings = config.load_settings()
        
        # Process each email to identify important ones
        for email in recent_emails:
            # Skip already processed emails
            if email['id'] in self.emails['processed_ids']:
                continue
            
            # Mark as processed
            self.emails['processed_ids'].append(email['id'])
            
            # Get full email content
            full_email = self.gmail_service.get_email(email['id'])
            
            # Calculate importance score
            importance_score = self._calculate_importance(full_email)
            
            # Add all emails to important_emails list with their importance score
            # This change allows us to see all emails in the dashboard, not just "important" ones
            important_email = {
                'id': full_email['id'],
                'threadId': full_email['threadId'],
                'sender': full_email['sender'],
                'subject': full_email['subject'],
                'date': full_email['date'],
                'snippet': full_email['snippet'],
                'processed': False,
                'importance_score': importance_score,
                'identified_at': datetime.now().isoformat()
            }
            
            self.emails['important_emails'].append(important_email)
        
        # Save updated data
        self._save_data()
    
    def get_important_emails(self):
        """Get the list of important emails"""
        # Sort by importance score and date (newest first)
        sorted_emails = sorted(
            self.emails['important_emails'],
            key=lambda x: (x['processed'], -x['importance_score'], x['date']),
            reverse=True
        )
        
        return sorted_emails
    
    def mark_as_processed(self, email_id):
        """Mark an email as processed"""
        for email in self.emails['important_emails']:
            if email['id'] == email_id:
                email['processed'] = True
        
        self._save_data()
    
    def recalculate_importance_scores(self):
        """Recalculate importance scores for all emails"""
        for email in self.emails['important_emails']:
         # Get full email content to recalculate
            full_email = self.gmail_service.get_email(email['id'])
            email['importance_score'] = self._calculate_importance(full_email)
    
    # Save updated data
        self._save_data()

    def _calculate_importance(self, email):
        """Calculate an importance score for the email based on configurable weights"""
        score = 0
        
        # Get importance criteria from settings
        keywords = self.settings.get('important_keywords', ['urgent', 'important', 'asap', 'deadline', 'required'])
        important_senders = self.settings.get('important_senders', [])
        
        # Get weights from settings or use defaults
        weights = self.settings.get('importance_weights', {
            'subject_keyword': 3,
            'body_keyword': 1,
            'important_sender': 5,
            'question_mark': 1,
            'direct_message': 2,
            'email_length': 1
        })
        
        # Keyword matches in subject
        for keyword in keywords:
            if keyword.lower() in email['subject'].lower():
                score += weights.get('subject_keyword', 3)
        
        # Keyword matches in body
        for keyword in keywords:
            if keyword.lower() in email['body'].lower():
                score += weights.get('body_keyword', 1)
        
        # Important sender
        for sender in important_senders:
            if sender.lower() in email['sender'].lower():
                score += weights.get('important_sender', 5)
                break
        
        # Contains questions
        question_count = email['body'].count('?')
        score += min(question_count, 3) * weights.get('question_mark', 1)
        
        # Contains direct addressing ("you", "your")
        you_count = len(re.findall(r'\byou\b|\byour\b', email['body'].lower()))
        if you_count >= 2:
            score += 1
        
        # Length of email (very short or very long emails might be less important)
        body_length = len(email['body'])
        if 100 <= body_length <= 1000:
            score += weights.get('email_length', 1)
        
        # Email is a direct message (not CC'd)
        if not email['cc']:
            score += weights.get('direct_message', 2)
        
        return score
