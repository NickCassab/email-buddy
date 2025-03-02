import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Check if the application is properly configured
 */
export const checkStatus = async () => {
  const response = await api.get('/status');
  return response.data;
};

/**
 * Get the Gmail OAuth URL for authorization
 */
export const getGmailAuthUrl = async () => {
  const response = await api.get('/setup/gmail');
  return response.data.auth_url;
};

/**
 * Submit the Gmail OAuth code
 */
export const submitGmailAuthCode = async (code) => {
  const response = await api.post('/setup/gmail/callback', { code });
  return response.data;
};

/**
 * Set up the OpenAI API key
 */
export const setupOpenAI = async (apiKey) => {
  const response = await api.post('/setup/openai', { api_key: apiKey });
  return response.data;
};

/**
 * Set up a local LLM model
 */
export const setupLocalLLM = async (modelPath) => {
  const response = await api.post('/setup/local-llm', { model_path: modelPath });
  return response.data;
};

/**
 * Test the configured LLM provider
 */
export const testLLM = async () => {
  const response = await api.post('/test-llm');
  return response.data;
};

/**
 * Get a list of important emails
 */
export const getImportantEmails = async () => {
  const response = await api.get('/emails/important');
  return response.data;
};

/**
 * Refresh emails from Gmail
 */
export const refreshEmails = async () => {
  const response = await api.post('/emails/refresh');
  return response.data;
};

/**
 * Get details of a specific email
 */
export const getEmailDetails = async (emailId) => {
  const response = await api.get(`/emails/${emailId}`);
  return response.data;
};

/**
 * Generate an AI draft reply for a specific email
 */
export const generateDraftReply = async (emailId, style = 'professional', customInstructions = '') => {
  const response = await api.post(`/emails/${emailId}/draft-reply`, {
    style,
    custom_instructions: customInstructions,
  });
  return response.data;
};

/**
 * Send a reply to a specific email
 */
export const sendReply = async (emailId, replyText) => {
  const response = await api.post(`/emails/${emailId}/send-reply`, {
    reply_text: replyText,
  });
  return response.data;
};

/**
 * Get user settings
 */
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

/**
 * Recalculate importance scores for emails
 */
export const recalculateImportance = async () => {
  const response = await api.post('/emails/recalculate-importance');
  return response.data;
};

/**
 * Update user settings
 */
export const updateSettings = async (settings) => {
  const response = await api.post('/settings', settings);
  return response.data;
};

export default api;