import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Link,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { getGmailAuthUrl, submitGmailAuthCode, setupOpenAI } from '../api';

const steps = ['Gmail Integration', 'OpenAI Configuration', 'Complete'];

const Setup = ({ appStatus, setAppStatus, setIsConfigured }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [gmailAuthUrl, setGmailAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Determine the starting step based on the app status
    if (appStatus.gmail_configured && !appStatus.openai_configured) {
      setActiveStep(1);
    } else if (appStatus.gmail_configured && appStatus.openai_configured) {
      setActiveStep(2);
    } else {
      // Start with Gmail setup
      fetchGmailAuthUrl();
    }
  }, [appStatus]);

  const fetchGmailAuthUrl = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = await getGmailAuthUrl();
      setGmailAuthUrl(url);
    } catch (err) {
      console.error('Error fetching Gmail auth URL:', err);
      setError('Failed to get Gmail authorization URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGmailAuthSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await submitGmailAuthCode(authCode);
      
      if (response.success) {
        // Update app status
        setAppStatus({ ...appStatus, gmail_configured: true });
        // Move to next step
        setActiveStep(1);
      } else {
        setError(response.error || 'Failed to authenticate with Gmail. Please check the code and try again.');
      }
    } catch (err) {
      console.error('Error submitting Gmail auth code:', err);
      setError('Failed to authenticate with Gmail. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAISetup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await setupOpenAI(openaiApiKey);
      
      if (response.success) {
        // Update app status
        setAppStatus({ ...appStatus, openai_configured: true, ready: true });
        setIsConfigured(true);
        // Move to next step
        setActiveStep(2);
      } else {
        setError(response.error || 'Failed to configure OpenAI. Please check the API key and try again.');
      }
    } catch (err) {
      console.error('Error setting up OpenAI:', err);
      setError('Failed to configure OpenAI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/');
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Connect to Gmail
            </Typography>
            
            <Typography paragraph>
              This app needs access to your Gmail account to read and send emails.
              Click the authorization link below, grant permissions, and paste the authorization code.
            </Typography>
            
            {loading && !gmailAuthUrl ? (
              <CircularProgress />
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  The app will only access your Gmail account on your local machine.
                  No data is sent to external servers except for the OpenAI API (for drafting replies).
                </Alert>
                
                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom>
                    1. Click the link below to authorize the application:
                  </Typography>
                  <Link 
                    href={gmailAuthUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ display: 'block', mb: 2, wordBreak: 'break-all' }}
                  >
                    {gmailAuthUrl}
                  </Link>
                  
                  <Typography gutterBottom>
                    2. After authorizing, copy the code and paste it below:
                  </Typography>
                  <TextField
                    fullWidth
                    label="Authorization Code"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    margin="normal"
                    placeholder="Paste the authorization code here"
                  />
                </Box>
                
                <Button
                  variant="contained"
                  onClick={handleGmailAuthSubmit}
                  disabled={loading || !authCode.trim()}
                >
                  {loading ? 'Connecting...' : 'Connect Gmail'}
                </Button>
              </>
            )}
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure OpenAI
            </Typography>
            
            <Typography paragraph>
              Enter your OpenAI API key to enable AI-powered email drafting.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Your OpenAI API key will be stored securely on your local machine only.
              The app will use this key to generate email draft responses.
            </Alert>
            
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                1. If you don't have an API key, get one from <Link href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI's website</Link>.
              </Typography>
              <Typography gutterBottom>
                2. Paste your API key below:
              </Typography>
              <TextField
                fullWidth
                type="password"
                label="OpenAI API Key"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                margin="normal"
                placeholder="sk-..."
              />
            </Box>
            
            <Button
              variant="contained"
              onClick={handleOpenAISetup}
              disabled={loading || !openaiApiKey.trim()}
            >
              {loading ? 'Configuring...' : 'Configure OpenAI'}
            </Button>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Setup Complete!
            </Typography>
            
            <Typography paragraph>
              Your Email Assistant is now fully configured and ready to use.
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 3, textAlign: 'left' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  What happens next:
                </Typography>
                <Typography component="div">
                  <ul>
                    <li>The app will scan your Gmail inbox for important emails</li>
                    <li>You'll see a list of emails that need your attention</li>
                    <li>For each email, you can generate an AI-powered reply draft</li>
                    <li>Review and edit the draft before sending</li>
                  </ul>
                </Typography>
              </CardContent>
            </Card>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleFinish}
              size="large"
            >
              Start Using Email Assistant
            </Button>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Email Assistant Setup
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {renderStepContent(activeStep)}
    </Paper>
  );
};

export default Setup;
