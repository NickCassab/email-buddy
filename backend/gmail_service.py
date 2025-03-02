import os
import base64
import json
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import config

class GmailService:
    def __init__(self):
        self.SCOPES = ['https://www.googleapis.com/auth/gmail.modify']
        self.API_SERVICE_NAME = 'gmail'
        self.API_VERSION = 'v1'
        self.client_secrets_file = os.path.join('credentials', 'client_secret.json')
        self.token_path = os.path.join('credentials', 'gmail_token.json')
        self.creds = None
        self.service = None
        
        # Create credentials directory if it doesn't exist
        os.makedirs('credentials', exist_ok=True)
    
    def get_authorization_url(self):
        """Get the authorization URL for OAuth"""
        flow = Flow.from_client_secrets_file(
            self.client_secrets_file,
            scopes=self.SCOPES,
            redirect_uri='urn:ietf:wg:oauth:2.0:oob')
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent')
        
        self.flow = flow
        return auth_url
    
    def authenticate_with_code(self, code):
        """Authenticate with the authorization code"""
        self.flow.fetch_token(code=code)
        self.creds = self.flow.credentials
        
        # Save the credentials for future use
        token_data = {
            'token': self.creds.token,
            'refresh_token': self.creds.refresh_token,
            'token_uri': self.creds.token_uri,
            'client_id': self.creds.client_id,
            'client_secret': self.creds.client_secret,
            'scopes': self.creds.scopes
        }
        
        with open(self.token_path, 'w') as token_file:
            json.dump(token_data, token_file)
        
        self.service = build(self.API_SERVICE_NAME, self.API_VERSION, credentials=self.creds)
        return True
    
    def authenticate_with_token(self):
        """Authenticate with the saved token"""
        if not os.path.exists(self.token_path):
            raise FileNotFoundError("Token file not found. Please authenticate first.")
        
        with open(self.token_path, 'r') as token_file:
            token_data = json.load(token_file)
        
        self.creds = Credentials(
            token=token_data['token'],
            refresh_token=token_data['refresh_token'],
            token_uri=token_data['token_uri'],
            client_id=token_data['client_id'],
            client_secret=token_data['client_secret'],
            scopes=token_data['scopes']
        )
        
        self.service = build(self.API_SERVICE_NAME, self.API_VERSION, credentials=self.creds)
        return True
    
    def is_authenticated(self):
        """Check if the service is authenticated"""
        return self.service is not None
    
    def get_recent_emails(self, max_results=50):
        """Get a list of recent emails"""
        try:
            results = self.service.users().messages().list(
                userId='me',
                labelIds=['INBOX'],
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for message in messages:
                msg = self.service.users().messages().get(
                    userId='me', 
                    id=message['id'],
                    format='metadata',
                    metadataHeaders=['From', 'Subject', 'Date']
                ).execute()
                
                email_data = {
                    'id': msg['id'],
                    'threadId': msg['threadId'],
                    'snippet': msg['snippet'],
                    'sender': '',
                    'subject': '',
                    'date': ''
                }
                
                # Extract headers
                headers = msg['payload']['headers']
                for header in headers:
                    if header['name'] == 'From':
                        email_data['sender'] = header['value']
                    elif header['name'] == 'Subject':
                        email_data['subject'] = header['value']
                    elif header['name'] == 'Date':
                        email_data['date'] = header['value']
                
                emails.append(email_data)
            
            return emails
            
        except HttpError as error:
            print(f'An error occurred: {error}')
            return []
    
    def get_email(self, email_id):
        """Get the full content of an email"""
        try:
            message = self.service.users().messages().get(
                userId='me',
                id=email_id,
                format='full'
            ).execute()
            
            email_data = {
                'id': message['id'],
                'threadId': message['threadId'],
                'snippet': message['snippet'],
                'sender': '',
                'recipient': '',
                'cc': [],
                'subject': '',
                'date': '',
                'body': '',
                'body_html': ''
            }
            
            # Extract headers
            headers = message['payload']['headers']
            for header in headers:
                if header['name'] == 'From':
                    email_data['sender'] = header['value']
                elif header['name'] == 'To':
                    email_data['recipient'] = header['value']
                elif header['name'] == 'Cc':
                    email_data['cc'] = [cc.strip() for cc in header['value'].split(',')]
                elif header['name'] == 'Subject':
                    email_data['subject'] = header['value']
                elif header['name'] == 'Date':
                    email_data['date'] = header['value']
            
            # Extract body
            if 'parts' in message['payload']:
                for part in message['payload']['parts']:
                    if part['mimeType'] == 'text/plain':
                        body_data = part['body'].get('data', '')
                        if body_data:
                            email_data['body'] = base64.urlsafe_b64decode(body_data).decode('utf-8')
                    elif part['mimeType'] == 'text/html':
                        body_html = part['body'].get('data', '')
                        if body_html:
                            email_data['body_html'] = base64.urlsafe_b64decode(body_html).decode('utf-8')
            else:
                # For simple messages
                body_data = message['payload']['body'].get('data', '')
                if body_data:
                    email_data['body'] = base64.urlsafe_b64decode(body_data).decode('utf-8')
            
            return email_data
            
        except HttpError as error:
            print(f'An error occurred: {error}')
            return None
    
    def send_reply(self, email_id, reply_text):
        """Send a reply to a specific email"""
        try:
            # Get the original email to extract thread info
            original_email = self.get_email(email_id)
            
            # Create the message
            message = MIMEText(reply_text)
            message['to'] = original_email['sender']
            message['subject'] = f"Re: {original_email['subject']}"
            
            # Get the thread ID from the original email
            thread_id = original_email['threadId']
            
            # Encode the message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            
            # Send the message
            sent_message = self.service.users().messages().send(
                userId='me',
                body={
                    'raw': raw_message,
                    'threadId': thread_id
                }
            ).execute()
            
            return sent_message
            
        except HttpError as error:
            print(f'An error occurred: {error}')
            raise error