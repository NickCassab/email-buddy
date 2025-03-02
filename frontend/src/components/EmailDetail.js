import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { format } from 'date-fns';

import { getEmailDetails } from '../api';

const EmailDetail = () => {
  const { emailId } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmailDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getEmailDetails(emailId);
        setEmail(data);
      } catch (err) {
        console.error('Error fetching email details:', err);
        setError('Failed to load email details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmailDetails();
  }, [emailId]);

  const handleReplyClick = () => {
    navigate(`/email/${emailId}/reply`);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPPP p'); // Full date and time
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
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
          Back to List
        </Button>
        <Button
          variant="contained"
          startIcon={<ReplyIcon />}
          onClick={handleReplyClick}
        >
          Reply with AI
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {email.subject || '(No Subject)'}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip label={`From: ${email.sender}`} variant="outlined" />
          {email.recipient && (
            <Chip label={`To: ${email.recipient}`} variant="outlined" />
          )}
          {email.cc && email.cc.length > 0 && (
            <Chip label={`CC: ${email.cc.join(', ')}`} variant="outlined" />
          )}
          <Chip label={formatDate(email.date)} variant="outlined" />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            {email.body_html ? (
              <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
            ) : (
              <Typography
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                }}
              >
                {email.body}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ReplyIcon />}
            onClick={handleReplyClick}
            size="large"
          >
            Reply with AI
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EmailDetail;
