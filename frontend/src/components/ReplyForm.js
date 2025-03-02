import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Snackbar,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutorenewIcon from '@mui/icons-material/Autorenew';

import { getEmailDetails, generateDraftReply, sendReply, getSettings } from '../api';

const ReplyForm = () => {
  const { emailId } = useParams();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [responseStyle, setResponseStyle] = useState('professional');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showCustomInstructions, setShowCustomInstructions] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Define generateDraft as a useCallback to properly include it in dependencies
  const generateDraft = useCallback(async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const response = await generateDraftReply(
        emailId, 
        responseStyle, 
        showCustomInstructions ? customInstructions : ''
      );
      
      setReplyText(response.draft);
    } catch (err) {
      console.error('Error generating draft:', err);
      setError('Failed to generate AI reply. Please try again or edit manually.');
    } finally {
      setGenerating(false);
    }
  }, [emailId, responseStyle, customInstructions, showCustomInstructions]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get email details
        const emailData = await getEmailDetails(emailId);
        setEmail(emailData);
        
        // Get user settings
        const settings = await getSettings();
        if (settings.response_style) {
          setResponseStyle(settings.response_style);
        }
        
        // Generate initial draft
        await generateDraft();
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load email or generate reply. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [emailId, generateDraft]);

  const handleSend = async () => {
    try {
      setSending(true);
      setError(null);
      
      await sendReply(emailId, replyText);
      
      setSuccess('Reply sent successfully!');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply. Please try again.');
      setSending(false);
    }
  };

  const handleCancel = () => {
    navigate(`/email/${emailId}`);
  };

  const handleBackClick = () => {
    navigate(`/email/${emailId}`);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!email) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Email not found.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
        >
          Back to Email
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Reply to: {email.subject || '(No Subject)'}
        </Typography>
        
        <Card variant="outlined" sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Original Email from {email.sender}:
            </Typography>
            <Typography
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                maxHeight: '150px',
                overflow: 'auto',
              }}
            >
              {email.body}
            </Typography>
          </CardContent>
        </Card>

        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">AI-Generated Reply</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Response Style</InputLabel>
                <Select
                  value={responseStyle}
                  label="Response Style"
                  onChange={(e) => setResponseStyle(e.target.value)}
                  disabled={generating}
                >
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="casual">Casual</MenuItem>
                  <MenuItem value="concise">Concise</MenuItem>
                  <MenuItem value="detailed">Detailed</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<AutorenewIcon />}
                onClick={generateDraft}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Regenerate'}
              </Button>
            </Box>
          </Box>
          
          {showCustomInstructions && (
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Custom Instructions for AI"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              margin="normal"
              disabled={generating}
              placeholder="E.g., Be more formal, include specific details, etc."
            />
          )}
          
          <Button
            size="small"
            onClick={() => setShowCustomInstructions(!showCustomInstructions)}
            sx={{ mb: 1 }}
          >
            {showCustomInstructions ? 'Hide Custom Instructions' : 'Show Custom Instructions'}
          </Button>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={10}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Loading AI-generated reply..."
            disabled={generating}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            onClick={handleSend}
            disabled={sending || generating || !replyText.trim()}
            size="large"
          >
            {sending ? 'Sending...' : 'Send Reply'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<CancelIcon />}
            onClick={handleCancel}
            disabled={sending}
            size="large"
          >
            Cancel
          </Button>
        </Box>
      </Paper>
      
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        message={success}
      />
    </Box>
  );
};

export default ReplyForm;