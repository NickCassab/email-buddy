import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Alert,
  Snackbar,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Switch,
  Grid,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

import { getSettings, updateSettings, setupOpenAI, setupLocalLLM, testLLM } from '../api';

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    important_keywords: [],
    important_senders: [],
    response_style: 'professional',
    custom_prompts: {
      professional: '',
      casual: '',
      concise: '',
      detailed: '',
    },
    llm_provider: 'openai',
    local_llm_model_path: '',
  });
  
  const [newKeyword, setNewKeyword] = useState('');
  const [newSender, setNewSender] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiConfigured, setOpenaiConfigured] = useState(false);
  const [localLLMConfigured, setLocalLLMConfigured] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  
  // For LLM testing
  const [testingLLM, setTestingLLM] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getSettings();
        setSettings({
          ...data,
          llm_provider: data.llm_provider || 'openai',
          local_llm_model_path: data.local_llm_model_path || '',
        });
        setOpenaiConfigured(data.openai_configured || false);
        setLocalLLMConfigured(data.local_llm_configured || false);
        setSystemInfo(data.system_info || null);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Initialize updated settings
      const updatedSettings = { ...settings };
      let llmSuccess = true;
      
      // Handle OpenAI API key update if provided and selected
      if (settings.llm_provider === 'openai' && openaiApiKey) {
        const openaiResponse = await setupOpenAI(openaiApiKey);
        if (openaiResponse.success) {
          // Let the server save the API key
          setSuccess('OpenAI API key updated successfully');
        } else {
          setError(`OpenAI API Error: ${openaiResponse.error || 'Failed to update API key'}`);
          llmSuccess = false;
        }
      }
      
      // Handle Local LLM setup if selected
      if (settings.llm_provider === 'local' && settings.local_llm_model_path) {
        const localLLMResponse = await setupLocalLLM(settings.local_llm_model_path);
        if (localLLMResponse.success) {
          setSuccess('Local LLM model configured successfully');
        } else {
          setError(`Local LLM Error: ${localLLMResponse.error || 'Failed to configure local model'}`);
          llmSuccess = false;
        }
      }
      
      // Only update settings if LLM configuration was successful
      if (llmSuccess) {
        // Update general settings
        await updateSettings(updatedSettings);
        setSuccess('Settings saved successfully');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestLLM = async () => {
    try {
      setTestingLLM(true);
      setTestResult(null);
      setError(null);
      
      const result = await testLLM();
      
      if (result.success) {
        setTestResult(result);
      } else {
        setError(`LLM Test Error: ${result.error}`);
      }
    } catch (err) {
      console.error('Error testing LLM:', err);
      setError('Failed to test LLM. Please check your configuration.');
    } finally {
      setTestingLLM(false);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !settings.important_keywords.includes(newKeyword.trim())) {
      setSettings({
        ...settings,
        important_keywords: [...settings.important_keywords, newKeyword.trim()],
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword) => {
    setSettings({
      ...settings,
      important_keywords: settings.important_keywords.filter((k) => k !== keyword),
    });
  };

  const addSender = () => {
    if (newSender.trim() && !settings.important_senders.includes(newSender.trim())) {
      setSettings({
        ...settings,
        important_senders: [...settings.important_senders, newSender.trim()],
      });
      setNewSender('');
    }
  };

  const removeSender = (sender) => {
    setSettings({
      ...settings,
      important_senders: settings.important_senders.filter((s) => s !== sender),
    });
  };

  const handlePromptChange = (style, value) => {
    setSettings({
      ...settings,
      custom_prompts: {
        ...settings.custom_prompts,
        [style]: value,
      },
    });
  };

  const handleLLMProviderChange = (event) => {
    setSettings({
      ...settings,
      llm_provider: event.target.value,
    });
  };

  const handleBrowseLocalModel = () => {
    // This is a placeholder - actual file browsing would need to be implemented
    // in the backend since browser JavaScript can't directly access the file system
    alert('This would open a file browser dialog. For now, please enter the full path to the model file manually.');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Settings
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* LLM Configuration Section */}
      <Typography variant="h6" gutterBottom>
        AI Provider Configuration
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">AI Provider</FormLabel>
          <RadioGroup
            row
            name="llm-provider"
            value={settings.llm_provider}
            onChange={handleLLMProviderChange}
          >
            <FormControlLabel value="openai" control={<Radio />} label="OpenAI API" />
            <FormControlLabel value="local" control={<Radio />} label="Local LLM" />
          </RadioGroup>
        </FormControl>

        {settings.llm_provider === 'openai' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              OpenAI API Configuration {openaiConfigured && <Chip label="Configured" color="success" size="small" />}
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Your API key is stored locally on your machine and is only used to generate email replies.
            </Alert>
            
            <TextField
              fullWidth
              type="password"
              label="OpenAI API Key"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="Enter to update your API key"
              helperText="Leave blank if you don't want to change your existing API key"
              margin="normal"
            />
          </Box>
        )}

        {settings.llm_provider === 'local' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Local LLM Configuration {localLLMConfigured && <Chip label="Configured" color="success" size="small" />}
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Local LLM models run entirely on your machine without sending data to external APIs. 
              Requires the llama-cpp-python package to be installed.
            </Alert>

            {systemInfo && !systemInfo.meets_requirements && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Your system may not meet the minimum requirements for running local LLM models efficiently.
                <br />
                Available RAM: {systemInfo.ram_gb.toFixed(1)} GB (Recommended: 8+ GB)
                <br />
                CPU Cores: {systemInfo.cpu_count} (Recommended: 2+ cores)
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', mb: 2 }}>
              <TextField
                fullWidth
                label="Path to Llama Model File (.gguf)"
                value={settings.local_llm_model_path}
                onChange={(e) => setSettings({...settings, local_llm_model_path: e.target.value})}
                placeholder="/path/to/llama-model.gguf"
                margin="normal"
                sx={{ mr: 1 }}
              />
              <Button
                variant="outlined"
                startIcon={<FolderOpenIcon />}
                onClick={handleBrowseLocalModel}
                sx={{ mt: 2, minWidth: '120px' }}
              >
                Browse
              </Button>
            </Box>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              For Milestone 1, you will need to manually install the llama-cpp-python package 
              and download a compatible LLM model file (.gguf format).
              <br />
              Recommended installation: <code>pip install llama-cpp-python</code>
              <br />
              Model files can be downloaded from <a href="https://huggingface.co/TheBloke" target="_blank" rel="noopener noreferrer">HuggingFace</a>.
              <br />
              Recommended model: <a href="https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF" target="_blank" rel="noopener noreferrer">Llama-2-7B-Chat-GGUF</a> (Q4_K_M variant for better performance)
            </Alert>
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleTestLLM}
            disabled={testingLLM || (!openaiConfigured && settings.llm_provider === 'openai') || (!localLLMConfigured && settings.llm_provider === 'local')}
          >
            {testingLLM ? 'Testing...' : 'Test AI Provider'}
          </Button>
          
          {testResult && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Test Result ({testResult.provider}):
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {testResult.response}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Email Importance Criteria
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Keywords (emails containing these words will be flagged as important)
        </Typography>
        
        <Box sx={{ display: 'flex', mb: 1 }}>
          <TextField
            label="New Keyword"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            size="small"
            sx={{ mr: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addKeyword}
            disabled={!newKeyword.trim()}
          >
            Add
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {settings.important_keywords.map((keyword) => (
            <Chip
              key={keyword}
              label={keyword}
              onDelete={() => removeKeyword(keyword)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Important Senders (emails from these addresses/domains will be flagged as important)
        </Typography>
        
        <Box sx={{ display: 'flex', mb: 1 }}>
          <TextField
            label="Email Address or Domain"
            value={newSender}
            onChange={(e) => setNewSender(e.target.value)}
            size="small"
            sx={{ mr: 1 }}
            placeholder="e.g., boss@company.com or company.com"
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addSender}
            disabled={!newSender.trim()}
          >
            Add
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {settings.important_senders.map((sender) => (
            <Chip
              key={sender}
              label={sender}
              onDelete={() => removeSender(sender)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        AI Response Settings
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Default Response Style</InputLabel>
          <Select
            value={settings.response_style}
            label="Default Response Style"
            onChange={(e) => setSettings({ ...settings, response_style: e.target.value })}
          >
            <MenuItem value="professional">Professional</MenuItem>
            <MenuItem value="casual">Casual</MenuItem>
            <MenuItem value="concise">Concise</MenuItem>
            <MenuItem value="detailed">Detailed</MenuItem>
          </Select>
        </FormControl>
        
        <Typography variant="subtitle1" gutterBottom>
          Custom AI Prompts (optional)
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          Customize how the AI generates responses for each style. Leave blank to use the default prompts.
        </Alert>
        
        <List>
          <ListItem>
            <ListItemText
              primary="Professional Style"
              secondary={
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Instructions for professional style responses"
                  value={settings.custom_prompts?.professional || ''}
                  onChange={(e) => handlePromptChange('professional', e.target.value)}
                  margin="dense"
                  variant="outlined"
                />
              }
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItem>
          
          <ListItem>
            <ListItemText
              primary="Casual Style"
              secondary={
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Instructions for casual style responses"
                  value={settings.custom_prompts?.casual || ''}
                  onChange={(e) => handlePromptChange('casual', e.target.value)}
                  margin="dense"
                  variant="outlined"
                />
              }
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItem>
          
          <ListItem>
            <ListItemText
              primary="Concise Style"
              secondary={
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Instructions for concise style responses"
                  value={settings.custom_prompts?.concise || ''}
                  onChange={(e) => handlePromptChange('concise', e.target.value)}
                  margin="dense"
                  variant="outlined"
                />
              }
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItem>
          
          <ListItem>
            <ListItemText
              primary="Detailed Style"
              secondary={
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Instructions for detailed style responses"
                  value={settings.custom_prompts?.detailed || ''}
                  onChange={(e) => handlePromptChange('detailed', e.target.value)}
                  margin="dense"
                  variant="outlined"
                />
              }
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItem>
        </List>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          size="large"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
      
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        message={success}
      />
    </Paper>
  );
};

export default Settings;