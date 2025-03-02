# Email Assistant Project Structure

```
email-assistant/
├── backend/
│   ├── app.py                  # Main Flask application
│   ├── gmail_service.py        # Gmail API integration
│   ├── openai_service.py       # OpenAI API integration
│   ├── email_processor.py      # Email classification and processing
│   ├── config.py               # Configuration management
│   ├── requirements.txt        # Python dependencies
│   └── credentials/            # Directory for storing credentials (gitignored)
│       ├── .gitignore
│       ├── gmail_token.json    # OAuth token for Gmail (auto-generated)
│       └── client_secret.json  # OAuth client credentials (user provided)
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── EmailList.js    # List of important emails
│   │   │   ├── EmailDetail.js  # Email detail view
│   │   │   ├── ReplyForm.js    # Email reply form with AI draft
│   │   │   └── Settings.js     # User settings
│   │   ├── App.js              # Main React component
│   │   ├── index.js            # React entry point
│   │   └── api.js              # API calls to backend
│   ├── package.json
│   └── README.md
│
├── run.py                      # Script to start both frontend and backend
└── README.md                   # Project documentation
```
