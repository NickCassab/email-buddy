import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import EmailIcon from '@mui/icons-material/Email';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

const Header = ({ isConfigured, appStatus }) => {
  const location = useLocation();
  
  return (
    <AppBar position="static">
      <Toolbar>
        <EmailIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <RouterLink to="/" style={{ color: 'white', textDecoration: 'none' }}>
            Email Assistant
          </RouterLink>
        </Typography>
        
        {isConfigured ? (
          <>
            <Button 
              component={RouterLink} 
              to="/" 
              color="inherit"
              variant={location.pathname === '/' ? 'outlined' : 'text'}
              sx={{ mr: 1 }}
            >
              Inbox
            </Button>
            <Button 
              component={RouterLink} 
              to="/dashboard" 
              color="inherit"
              startIcon={<DashboardIcon />}
              variant={location.pathname === '/dashboard' ? 'outlined' : 'text'}
              sx={{ mr: 1 }}
            >
              Dashboard
            </Button>
            <Button 
              component={RouterLink} 
              to="/settings" 
              color="inherit" 
              startIcon={<SettingsIcon />}
              variant={location.pathname === '/settings' ? 'outlined' : 'text'}
            >
              Settings
            </Button>
          </>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip 
              label={appStatus.gmail_configured ? "Gmail Connected" : "Gmail Not Connected"} 
              color={appStatus.gmail_configured ? "success" : "error"} 
              size="small"
            />
            <Chip 
              label={appStatus.openai_configured ? "OpenAI Connected" : "OpenAI Not Connected"} 
              color={appStatus.openai_configured ? "success" : "error"} 
              size="small"
            />
            <Box sx={{ ml: 2 }}>
              <Button 
                component={RouterLink} 
                to="/setup" 
                color="inherit" 
                variant="outlined"
              >
                Setup
              </Button>
            </Box>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
