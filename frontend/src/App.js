import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { blue, grey } from '@mui/material/colors';

// Components
import Header from './components/Header';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import ReplyForm from './components/ReplyForm';
import Settings from './components/Settings';
import Setup from './components/Setup';
import EmailDashboard from './components/EmailDashboard';

// API
import { checkStatus } from './api';

// Create theme
const theme = createTheme({
  palette: {
    primary: blue,
    secondary: grey,
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [appStatus, setAppStatus] = useState({
    gmail_configured: false,
    openai_configured: false,
    ready: false,
    recalculating: false
  });

  useEffect(() => {
    // Check if the application is properly configured
    const checkAppStatus = async () => {
      try {
        setIsLoading(true);
        const status = await checkStatus();
        setAppStatus(status);
        setIsConfigured(status.ready);
      } catch (error) {
        console.error('Error checking app status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAppStatus();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header isConfigured={isConfigured} appStatus={appStatus} />
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
          <Routes>
            {/* If not configured, redirect to setup */}
            {!isConfigured && (
              <Route path="*" element={<Navigate to="/setup" replace />} />
            )}
            
            {/* Setup route */}
            <Route path="/setup" element={<Setup appStatus={appStatus} setAppStatus={setAppStatus} setIsConfigured={setIsConfigured} />} />
            
            {/* Main application routes */}
            <Route path="/" element={<EmailList />} />
            <Route path="/dashboard" element={<EmailDashboard />} />
            <Route path="/email/:emailId" element={<EmailDetail />} />
            <Route path="/email/:emailId/reply" element={<ReplyForm />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
