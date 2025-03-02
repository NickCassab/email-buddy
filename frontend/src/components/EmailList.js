import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';

import { getImportantEmails, refreshEmails } from '../api';

const EmailList = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getImportantEmails();
      setEmails(data);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Failed to load emails. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await refreshEmails();
      setEmails(data);
    } catch (err) {
      console.error('Error refreshing emails:', err);
      setError('Failed to refresh emails. Please try again later.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleEmailClick = (emailId) => {
    navigate(`/email/${emailId}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
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

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Important Emails
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {emails.length === 0 ? (
        <Alert severity="info">
          No important emails found. Click refresh to check for new emails.
        </Alert>
      ) : (
        <List>
          {emails.map((email, index) => (
            <React.Fragment key={email.id}>
              {index > 0 && <Divider />}
              <ListItem 
                button 
                onClick={() => handleEmailClick(email.id)}
                sx={{ 
                  bgcolor: email.processed ? 'background.default' : 'white',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="subtitle1"
                        component="div"
                        sx={{ fontWeight: email.processed ? 'normal' : 'bold' }}
                      >
                        {email.subject || '(No Subject)'}
                      </Typography>
                      {!email.processed && (
                        <Chip label="New" size="small" color="primary" />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {email.sender}
                      </Typography>
                      <Typography component="div" variant="body2" sx={{ color: 'text.secondary' }}>
                        {formatDate(email.date)}
                      </Typography>
                      <Typography component="div" variant="body2" color="text.secondary" noWrap>
                        {email.snippet}
                      </Typography>
                    </>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default EmailList;