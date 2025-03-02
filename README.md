# Email Assistant

A lightweight application that helps you manage your Gmail inbox by identifying important emails and creating AI-powered draft replies.

## Features

- **Gmail Integration**: Connects to your Gmail account to fetch emails
- **Email Classification**: Automatically identifies important emails based on customizable criteria
- **AI-Powered Replies**: Uses OpenAI's API to draft contextually appropriate email responses
- **Review & Edit**: Review, edit, and send AI-generated drafts directly from the application
- **Customizable Settings**: Configure importance criteria and AI response styles
- **Privacy-Focused**: Runs entirely on your local machine with no external data sharing

## Requirements

- Node.js (14.x or later)
- Python (3.8 or later)
- Gmail account
- OpenAI API key

## Setup Instructions

### 1. Clone or download this repository

```bash
git clone https://your-repository-url/email-assistant.git
cd email-assistant
```

### 2. Set up Google Cloud OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to "APIs & Services" > "Enabled APIs & Services"
4. Click "+ ENABLE APIS AND SERVICES"
5. Search for "Gmail API" and enable it
6. Go to "OAuth consent screen" and configure:
   - User Type: External
   - App name: "Email Assistant"
   - Add scope for Gmail API (https://www.googleapis.com/auth/gmail.modify)
7. Go to "Credentials" and create OAuth client ID:
   - Application type: Desktop app
   - Name: "Email Assistant"
8. Download the JSON file with credentials
9. Create a folder named "credentials" in the backend directory
10. Rename the downloaded file to "client_secret.json" and move it to the "backend/credentials" folder

### 3. Get an OpenAI API key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key for later use in the application

### 4. Run the application

```bash
python run.py
```

This script will:
- Check and install required dependencies
- Set up necessary directories
- Start the Python backend server
- Start the React frontend development server
- Open your browser to the application

## First-Time Setup

When you first run the application, you'll need to:

1. **Connect Gmail**:
   - The app will provide a URL to authorize access to Gmail
   - Grant permission and copy the authorization code
   - Paste the code into the application

2. **Configure OpenAI**:
   - Enter your OpenAI API key
   - The app will validate the key

Once setup is complete, the application will scan your Gmail inbox for important emails.

## Using the Application

### Email List

- The main screen shows a list of emails identified as important
- Click "Refresh" to check for new important emails
- Click on an email to view its details

### Email Details

- View the full content of the email
- Click "Reply with AI" to generate a draft response

### Reply Screen

- The AI will generate a draft reply based on the email context
- Choose a response style (Professional, Casual, Concise, or Detailed)
- Edit the draft as needed
- Click "Send Reply" to send the email or "Cancel" to discard

### Settings

- **Email Importance Criteria**:
  - Add/remove keywords that make an email important
  - Add/remove important sender addresses or domains
  
- **AI Response Settings**:
  - Set the default response style
  - Customize instructions for each style
  
- **API Configuration**:
  - Update your OpenAI API key if needed

## Privacy

- All data is processed locally on your machine
- Email content is only sent to OpenAI when generating replies
- Gmail credentials and the OpenAI API key are stored locally on your computer
- No data is shared with any other external services

## Troubleshooting

- **Authentication Issues**: If you encounter problems with Gmail authentication, delete the token file in the `backend/credentials` folder and restart the application.
- **API Limits**: If you hit OpenAI API rate limits, wait a few minutes before trying again.
- **Application Not Starting**: Make sure both Node.js and Python are properly installed on your system.

## License

MIT License
