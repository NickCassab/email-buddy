# Barebones Email Assistant Application Requirements

## 1. System Architecture

### Frontend (React)
- Simple single-page application built with React.js
- Minimal UI with functional components
- Basic state management using React hooks
- Mobile-friendly layout

### Backend (Python)
- Lightweight Python script using Gmail API
- Basic email processing functionality
- Simple classification logic for important emails
- Local credential storage

### Data Storage
- Minimal local storage using JSON files
- No database required for initial version

## 2. Authentication & Security

- OAuth2 authentication with Gmail
- Secure token storage on local machine
- Session management for Gmail API access
- Secure storage for OpenAI API key
- Local processing of email content (email contents only sent to OpenAI for drafting)

## 3. Email Processing Capabilities

### Email Retrieval
- Gmail API integration for reading emails
- Daily polling for new messages
- Support for single Gmail account
- Basic handling of text content (no special handling for attachments)

### Email Classification
- Simple rule-based system for identifying important emails:
  - Sender is in contacts list
  - Contains specific keywords in subject or body
  - Marked with priority flags
  - Direct messages (not CC'd)
  - Contains questions or requests

## 4. Reply Generation System

### Draft Creation
- Template-based response generation
- Few simple templates for common responses
- Ability to insert information from original email
- Basic formatting options

### User Review Interface
- Display original email and generated response
- Simple editing capability
- Three action buttons: Send, Edit, Cancel

## 5. User Interface Requirements

### Main Screen
- List of important emails identified by the system
- Basic details (sender, subject, time received)
- Simple status indicators (processed, pending)

### Reply Screen
- Original email content
- Draft reply in editable textbox
- Send and cancel buttons
- Basic formatting tools

### Settings Screen
- Gmail account connection
- Basic rules for importance filtering
- OpenAI API key configuration
- AI response style preferences (formal, casual, concise, detailed)
- System prompt customization options

## 6. Technical Requirements

### Development Environment
- Node.js for React frontend
- Python 3.x for backend
- Package management with npm and pip

### Dependencies
- React.js
- Python packages:
  - google-api-python-client
  - google-auth-oauthlib
  - openai (for OpenAI API integration)
- No database dependencies

### Installation & Deployment
- Simple setup script
- Runs on local machine (Windows, macOS, or Linux)
- Minimal external dependencies

## 7. Minimal Features

### Email Processing
- Daily scheduled check for new emails
- Basic classification of important messages
- Simple template-based reply generation

### User Controls
- Manual refresh button for checking emails
- Simple toggle for rules to determine importance
- Basic template editing

## 8. Getting Started Instructions

- Step-by-step guide for setting up Gmail API credentials
- Instructions for configuring OpenAI API key
- Guide for customizing AI response style
- Basic usage tutorial
- Privacy considerations when using AI for email drafting

## 9. Initial Development Focus

- Functional MVP (Minimum Viable Product)
- Gmail API authentication and access
- Basic important email identification
- Simple reply drafting functionality
- User review and send capability
