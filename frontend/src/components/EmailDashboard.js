import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Card,
  CardContent,
  Slider,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TableChartIcon from '@mui/icons-material/TableChart';
import TuneIcon from '@mui/icons-material/Tune';
import CategoryIcon from '@mui/icons-material/Category';
import { format } from 'date-fns';

// Chart components
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

import { getImportantEmails, refreshEmails, getSettings, updateSettings, recalculateImportance } from '../api';

// Define color scheme for charts
const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];
const IMPORTANCE_COLORS = {
  high: '#f44336',
  medium: '#ff9800',
  low: '#2196f3',
  veryLow: '#9e9e9e'
};

const EmailDashboard = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [chartType, setChartType] = useState('bar');
  const [chartMetric, setChartMetric] = useState('importance');
  const [chartGrouping, setChartGrouping] = useState('sender');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'importance_score',
    direction: 'desc'
  });
  const [filters, setFilters] = useState({
    importance: [0, 15],
    processed: 'all',
    timeframe: 'all'
  });
  const [settings, setSettings] = useState({
    important_keywords: [],
    important_senders: [],
    importance_weights: {
      subject_keyword: 3,
      body_keyword: 1, 
      important_sender: 5,
      question_mark: 1,
      direct_message: 2,
      email_length: 1
    }
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [newSender, setNewSender] = useState('');
  const [clusterBy, setClusterBy] = useState('domain');
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState('all');
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  // Extract domain from email address
  const extractDomain = (email) => {
    if (!email) return 'Unknown';
    const matches = email.match(/@([^>]+)/);
    return matches ? matches[1] : 'Unknown';
  };

  // Extract sender name from email
  const extractSenderName = (sender) => {
    if (!sender) return 'Unknown';
    const namePart = sender.split('<')[0].trim();
    return namePart || 'Unknown';
  };

  // Define the generateClusters function using useCallback to avoid dependencies issues
  const generateClusters = useCallback(() => {
    if (!emails.length) {
      setClusters([]);
      return;
    }

    const clustersMap = {};
    
    emails.forEach(email => {
      let clusterKey = 'Unknown';
      
      if (clusterBy === 'domain') {
        clusterKey = extractDomain(email.sender);
      } else if (clusterBy === 'sender') {
        clusterKey = extractSenderName(email.sender);
      } else if (clusterBy === 'importance') {
        const score = email.importance_score;
        if (score >= 10) clusterKey = 'High Priority';
        else if (score >= 7) clusterKey = 'Medium Priority';
        else if (score >= 4) clusterKey = 'Low Priority';
        else clusterKey = 'Very Low Priority';
      } else if (clusterBy === 'date') {
        try {
          const date = new Date(email.date);
          clusterKey = format(date, 'yyyy-MM-dd');
        } catch (e) {
          clusterKey = 'Unknown Date';
        }
      }
      
      if (!clustersMap[clusterKey]) {
        clustersMap[clusterKey] = {
          id: clusterKey,
          name: clusterKey,
          emails: [],
          count: 0,
          avgImportance: 0,
          totalImportance: 0
        };
      }
      
      clustersMap[clusterKey].emails.push(email);
      clustersMap[clusterKey].count += 1;
      clustersMap[clusterKey].totalImportance += email.importance_score;
    });
    
    // Calculate averages and create array
    const clustersArray = Object.values(clustersMap).map(cluster => {
      cluster.avgImportance = cluster.totalImportance / cluster.count;
      return cluster;
    });
    
    // Sort by name
    const sortedClusters = clustersArray.sort((a, b) => a.name.localeCompare(b.name));
    setClusters(sortedClusters);
  }, [emails, clusterBy, extractDomain, extractSenderName]);

  // Get all emails on component mount
  useEffect(() => {
    fetchEmails();
    fetchSettings();
  }, []);

  // Update clusters when emails change or clustering criteria changes
  useEffect(() => {
    generateClusters();
  }, [emails, clusterBy, generateClusters]);

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

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      setSettings({
        important_keywords: data.important_keywords || [],
        important_senders: data.important_senders || [],
        importance_weights: data.importance_weights || {
          subject_keyword: 3,
          body_keyword: 1, 
          important_sender: 5,
          question_mark: 1,
          direct_message: 2,
          email_length: 1
        }
      });
    } catch (err) {
      console.error('Error fetching settings:', err);
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSortClick = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleEmailClick = (emailId) => {
    navigate(`/email/${emailId}`);
  };

  const handleAddKeyword = () => {
    if (newKeyword && !settings.important_keywords.includes(newKeyword)) {
      const updatedKeywords = [...settings.important_keywords, newKeyword];
      setSettings({
        ...settings,
        important_keywords: updatedKeywords
      });
      setNewKeyword('');
      saveSettings({
        ...settings,
        important_keywords: updatedKeywords
      });
    }
  };

  const handleRemoveKeyword = (keyword) => {
    const updatedKeywords = settings.important_keywords.filter(k => k !== keyword);
    setSettings({
      ...settings,
      important_keywords: updatedKeywords
    });
    saveSettings({
      ...settings,
      important_keywords: updatedKeywords
    });
  };

  const handleAddSender = () => {
    if (newSender && !settings.important_senders.includes(newSender)) {
      const updatedSenders = [...settings.important_senders, newSender];
      setSettings({
        ...settings,
        important_senders: updatedSenders
      });
      setNewSender('');
      saveSettings({
        ...settings,
        important_senders: updatedSenders
      });
    }
  };

  const handleRemoveSender = (sender) => {
    const updatedSenders = settings.important_senders.filter(s => s !== sender);
    setSettings({
      ...settings,
      important_senders: updatedSenders
    });
    saveSettings({
      ...settings,
      important_senders: updatedSenders
    });
  };

  const handleWeightChange = (weightKey, newValue) => {
    const updatedWeights = {
      ...settings.importance_weights,
      [weightKey]: newValue
    };
    setSettings({
      ...settings,
      importance_weights: updatedWeights
    });
    saveSettings({
      ...settings,
      importance_weights: updatedWeights
    });
  };

  const saveSettings = async (updatedSettings) => {
    try {
      await updateSettings(updatedSettings);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again later.');
    }
  };

  // Apply all filters and search to emails
  const filteredEmails = emails.filter(email => {
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!(
        (email.subject && email.subject.toLowerCase().includes(query)) ||
        (email.sender && email.sender.toLowerCase().includes(query)) ||
        (email.snippet && email.snippet.toLowerCase().includes(query))
      )) {
        return false;
      }
    }
    
    // Importance score range
    if (email.importance_score < filters.importance[0] || 
        email.importance_score > filters.importance[1]) {
      return false;
    }
    
    // Processed state
    if (filters.processed !== 'all') {
      if (filters.processed === 'processed' && !email.processed) return false;
      if (filters.processed === 'unprocessed' && email.processed) return false;
    }
    
    // Timeframe filter
    if (filters.timeframe !== 'all') {
      try {
        const emailDate = new Date(email.date);
        const now = new Date();
        
        if (filters.timeframe === 'today') {
          // Check if the email is from today
          if (emailDate.toDateString() !== now.toDateString()) return false;
        } else if (filters.timeframe === 'week') {
          // Check if the email is from the last 7 days
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          if (emailDate < weekAgo) return false;
        } else if (filters.timeframe === 'month') {
          // Check if the email is from the last 30 days
          const monthAgo = new Date();
          monthAgo.setDate(now.getDate() - 30);
          if (emailDate < monthAgo) return false;
        }
      } catch (e) {
        // If date parsing fails, include the email anyway
      }
    }
    
    // Cluster filter
    if (selectedCluster !== 'all') {
      let clusterKey = 'Unknown';
      
      if (clusterBy === 'domain') {
        clusterKey = extractDomain(email.sender);
      } else if (clusterBy === 'sender') {
        clusterKey = extractSenderName(email.sender);
      } else if (clusterBy === 'importance') {
        const score = email.importance_score;
        if (score >= 10) clusterKey = 'High Priority';
        else if (score >= 7) clusterKey = 'Medium Priority';
        else if (score >= 4) clusterKey = 'Low Priority';
        else clusterKey = 'Very Low Priority';
      } else if (clusterBy === 'date') {
        try {
          const date = new Date(email.date);
          clusterKey = format(date, 'yyyy-MM-dd');
        } catch (e) {
          clusterKey = 'Unknown Date';
        }
      }
      
      if (clusterKey !== selectedCluster) return false;
    }
    
    return true;
  });

  // Sort emails based on current sort configuration
  const sortedEmails = [...filteredEmails].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Group emails for chart data based on selected grouping
  const prepareChartData = () => {
    const groupedData = {};
    
    filteredEmails.forEach(email => {
      let key;
      
      // Determine grouping key
      if (chartGrouping === 'sender') {
        key = extractSenderName(email.sender);
      } else if (chartGrouping === 'domain') {
        key = extractDomain(email.sender);
      } else if (chartGrouping === 'date') {
        try {
          const date = new Date(email.date);
          key = format(date, 'MMM d');
        } catch (e) {
          key = 'Unknown';
        }
      } else if (chartGrouping === 'importance') {
        const score = email.importance_score;
        if (score >= 10) key = 'High (10+)';
        else if (score >= 7) key = 'Medium (7-9)';
        else if (score >= 4) key = 'Low (4-6)';
        else key = 'Very Low (0-3)';
      } else {
        key = 'Other';
      }
      
      // Initialize group if it doesn't exist
      if (!groupedData[key]) {
        groupedData[key] = {
          name: key,
          count: 0,
          totalImportance: 0,
          averageImportance: 0,
          emails: []
        };
      }
      
      // Update group data
      groupedData[key].count += 1;
      groupedData[key].totalImportance += email.importance_score;
      groupedData[key].emails.push(email);
    });
    
    // Calculate averages and format for charts
    const result = Object.values(groupedData).map(group => {
      group.averageImportance = group.totalImportance / group.count;
      return group;
    });
    
    // Sort by name for consistent display
    return result.sort((a, b) => a.name.localeCompare(b.name));
  };

  const chartData = prepareChartData();
  
  // Determine y-axis metric for charts
  const getChartMetricValue = (item) => {
    switch (chartMetric) {
      case 'count':
        return item.count;
      case 'importance':
        return item.averageImportance;
      case 'total':
        return item.totalImportance;
      default:
        return item.count;
    }
  };

  // Format y-axis label
  const formatYAxisLabel = () => {
    switch (chartMetric) {
      case 'count':
        return 'Email Count';
      case 'importance':
        return 'Avg. Importance Score';
      case 'total':
        return 'Total Importance Score';
      default:
        return 'Count';
    }
  };

  // Get importance level color
  const getImportanceColor = (score) => {
    if (score >= 10) return IMPORTANCE_COLORS.high;
    if (score >= 7) return IMPORTANCE_COLORS.medium;
    if (score >= 4) return IMPORTANCE_COLORS.low;
    return IMPORTANCE_COLORS.veryLow;
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
          Email Analysis Dashboard
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Emails'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab icon={<DashboardIcon />} label="Dashboard" />
          <Tab icon={<TableChartIcon />} label="Data Table" />
          <Tab icon={<CategoryIcon />} label="Clustering" />
          <Tab icon={<TuneIcon />} label="Importance Criteria" />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      {tabValue === 0 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Email Statistics Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Emails
                      </Typography>
                      <Typography variant="h4">
                        {emails.length}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Avg. Importance Score
                      </Typography>
                      <Typography variant="h4">
                        {emails.length > 0 
                          ? (emails.reduce((acc, email) => acc + email.importance_score, 0) / emails.length).toFixed(1) 
                          : '0'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Unprocessed Emails
                      </Typography>
                      <Typography variant="h4">
                        {emails.filter(e => !e.processed).length}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Unique Senders
                      </Typography>
                      <Typography variant="h4">
                        {new Set(emails.map(e => extractSenderName(e.sender))).size}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Chart Controls
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Chart Type</InputLabel>
                        <Select
                          value={chartType}
                          label="Chart Type"
                          onChange={(e) => setChartType(e.target.value)}
                        >
                          <MenuItem value="bar">Bar Chart</MenuItem>
                          <MenuItem value="pie">Pie Chart</MenuItem>
                          <MenuItem value="line">Line Chart</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Metric</InputLabel>
                        <Select
                          value={chartMetric}
                          label="Metric"
                          onChange={(e) => setChartMetric(e.target.value)}
                        >
                          <MenuItem value="count">Email Count</MenuItem>
                          <MenuItem value="importance">Avg. Importance</MenuItem>
                          <MenuItem value="total">Total Importance</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Group By</InputLabel>
                        <Select
                          value={chartGrouping}
                          label="Group By"
                          onChange={(e) => setChartGrouping(e.target.value)}
                        >
                          <MenuItem value="sender">Sender Name</MenuItem>
                          <MenuItem value="domain">Domain</MenuItem>
                          <MenuItem value="date">Date</MenuItem>
                          <MenuItem value="importance">Importance Level</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Analysis
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' && (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: formatYAxisLabel(), angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [value.toFixed(1), formatYAxisLabel()]} />
                      <Legend />
                      <Bar 
                        dataKey={(item) => getChartMetricValue(item)} 
                        name={formatYAxisLabel()}
                        fill="#8884d8"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                  {chartType === 'pie' && (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey={(item) => getChartMetricValue(item)}
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value.toFixed(1), formatYAxisLabel()]} />
                      <Legend />
                    </PieChart>
                  )}
                  {chartType === 'line' && (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: formatYAxisLabel(), angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [value.toFixed(1), formatYAxisLabel()]} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey={(item) => getChartMetricValue(item)} 
                        name={formatYAxisLabel()}
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filters
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Importance Score Range
                  </Typography>
                  <Slider
                    value={filters.importance}
                    onChange={(e, newValue) => setFilters({...filters, importance: newValue})}
                    valueLabelDisplay="auto"
                    min={0}
                    max={15}
                    sx={{ mt: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.processed}
                      label="Status"
                      onChange={(e) => setFilters({...filters, processed: e.target.value})}
                    >
                      <MenuItem value="all">All Emails</MenuItem>
                      <MenuItem value="processed">Processed Only</MenuItem>
                      <MenuItem value="unprocessed">Unprocessed Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Timeframe</InputLabel>
                    <Select
                      value={filters.timeframe}
                      label="Timeframe"
                      onChange={(e) => setFilters({...filters, timeframe: e.target.value})}
                    >
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="week">Last 7 Days</MenuItem>
                      <MenuItem value="month">Last 30 Days</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Data Table Tab */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Emails"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by sender, subject, or content"
            />
          </Box>
          
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table aria-label="email table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'sender'}
                      direction={sortConfig.key === 'sender' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSortClick('sender')}
                    >
                      Sender
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'subject'}
                      direction={sortConfig.key === 'subject' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSortClick('subject')}
                    >
                      Subject
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'date'}
                      direction={sortConfig.key === 'date' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSortClick('date')}
                    >
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <TableSortLabel
                      active={sortConfig.key === 'importance_score'}
                      direction={sortConfig.key === 'importance_score' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSortClick('importance_score')}
                    >
                      Importance
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedEmails.map((email) => (
                  <TableRow 
                    key={email.id}
                    hover
                    onClick={() => handleEmailClick(email.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{extractSenderName(email.sender)}</TableCell>
                    <TableCell>{email.subject}</TableCell>
                    <TableCell>{formatDate(email.date)}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={email.importance_score} 
                        sx={{ backgroundColor: getImportanceColor(email.importance_score), color: 'white' }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={email.processed ? 'Processed' : 'New'} 
                        color={email.processed ? 'default' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {sortedEmails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No emails found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Typography variant="body2" color="text.secondary">
            Showing {sortedEmails.length} of {emails.length} emails
          </Typography>
        </Box>
      )}

      {/* Clustering Tab */}
      {tabValue === 2 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Clustering Options
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Cluster By</InputLabel>
                    <Select
                      value={clusterBy}
                      label="Cluster By"
                      onChange={(e) => setClusterBy(e.target.value)}
                    >
                      <MenuItem value="domain">Email Domain</MenuItem>
                      <MenuItem value="sender">Sender Name</MenuItem>
                      <MenuItem value="importance">Importance Level</MenuItem>
                      <MenuItem value="date">Date (Daily)</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Selected Cluster</InputLabel>
                    <Select
                      value={selectedCluster}
                      label="Selected Cluster"
                      onChange={(e) => setSelectedCluster(e.target.value)}
                    >
                      <MenuItem value="all">All Clusters</MenuItem>
                      {clusters.map(cluster => (
                        <MenuItem key={cluster.id} value={cluster.id}>
                          {cluster.name} ({cluster.count})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cluster Visualization
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={clusters}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="name"
                          label={({ name, count, percent }) => 
                            `${name}: ${count} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {clusters.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={CHART_COLORS[index % CHART_COLORS.length]} 
                              stroke={selectedCluster === entry.id ? '#000' : undefined}
                              strokeWidth={selectedCluster === entry.id ? 2 : undefined}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [value, 'Email Count']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cluster Details
                  </Typography>
                  <TableContainer>
                    <Table aria-label="cluster details">
                      <TableHead>
                        <TableRow>
                          <TableCell>Cluster Name</TableCell>
                          <TableCell align="center">Emails</TableCell>
                          <TableCell align="center">Avg. Importance</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {clusters.map((cluster) => (
                          <TableRow 
                            key={cluster.id}
                            sx={{ 
                              backgroundColor: selectedCluster === cluster.id ? 'rgba(0, 0, 0, 0.04)' : undefined 
                            }}
                          >
                            <TableCell>{cluster.name}</TableCell>
                            <TableCell align="center">{cluster.count}</TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={cluster.avgImportance.toFixed(1)} 
                                sx={{ 
                                  backgroundColor: getImportanceColor(cluster.avgImportance), 
                                  color: 'white' 
                                }}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button 
                                size="small" 
                                variant={selectedCluster === cluster.id ? "contained" : "outlined"}
                                onClick={() => setSelectedCluster(
                                  selectedCluster === cluster.id ? 'all' : cluster.id
                                )}
                              >
                                {selectedCluster === cluster.id ? 'Unselect' : 'Select'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {clusters.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              No clusters available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Importance Criteria Tab */}
      {tabValue === 3 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Important Keywords
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Emails containing these keywords will be flagged as important
                  </Typography>
                  
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Add Keyword"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      sx={{ mr: 1 }}
                    />
                    <Button 
                      variant="outlined"
                      onClick={handleAddKeyword}
                      disabled={!newKeyword || settings.important_keywords.includes(newKeyword)}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {settings.important_keywords.map((keyword) => (
                      <Chip
                        key={keyword}
                        label={keyword}
                        onDelete={() => handleRemoveKeyword(keyword)}
                        color="primary"
                      />
                    ))}
                    {settings.important_keywords.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No keywords added yet
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Important Senders
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Emails from these addresses or domains will be flagged as important
                  </Typography>
                  
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Add Sender or Domain"
                      value={newSender}
                      onChange={(e) => setNewSender(e.target.value)}
                      sx={{ mr: 1 }}
                      placeholder="name@example.com or example.com"
                    />
                    <Button 
                      variant="outlined"
                      onClick={handleAddSender}
                      disabled={!newSender || settings.important_senders.includes(newSender)}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {settings.important_senders.map((sender) => (
                      <Chip
                        key={sender}
                        label={sender}
                        onDelete={() => handleRemoveSender(sender)}
                        color="primary"
                      />
                    ))}
                    {settings.important_senders.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No senders added yet
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Importance Score Weights
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={async () => {
                        try {
                          setError(null);
                          const response = await recalculateImportance();
                          if (response.success) {
                            await fetchEmails();
                            alert('Importance scores are being recalculated. This may take a few minutes for large mailboxes.');
                          } else {
                            setError('Failed to recalculate importance scores: ' + response.error);
                          }
                        } catch (err) {
                          console.error('Error recalculating importance:', err);
                          setError('Failed to recalculate importance scores. Please try again.');
                        }
                      }}
                    >
                      Recalculate All Scores
                    </Button>
                  </Box>
                  <Typography variant="body2" paragraph>
                    Adjust the weight of each factor in calculating email importance
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Keyword in Subject (+{settings.importance_weights.subject_keyword} points)
                      </Typography>
                      <Slider
                        value={settings.importance_weights.subject_keyword}
                        onChange={(e, newValue) => handleWeightChange('subject_keyword', newValue)}
                        min={0}
                        max={10}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                      />
                      
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Keyword in Body (+{settings.importance_weights.body_keyword} points)
                      </Typography>
                      <Slider
                        value={settings.importance_weights.body_keyword}
                        onChange={(e, newValue) => handleWeightChange('body_keyword', newValue)}
                        min={0}
                        max={5}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                      />
                      
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Important Sender (+{settings.importance_weights.important_sender} points)
                      </Typography>
                      <Slider
                        value={settings.importance_weights.important_sender}
                        onChange={(e, newValue) => handleWeightChange('important_sender', newValue)}
                        min={0}
                        max={10}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Questions in Email (+{settings.importance_weights.question_mark} per question)
                      </Typography>
                      <Slider
                        value={settings.importance_weights.question_mark}
                        onChange={(e, newValue) => handleWeightChange('question_mark', newValue)}
                        min={0}
                        max={5}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                      />
                      
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Direct Message (+{settings.importance_weights.direct_message} points)
                      </Typography>
                      <Slider
                        value={settings.importance_weights.direct_message}
                        onChange={(e, newValue) => handleWeightChange('direct_message', newValue)}
                        min={0}
                        max={5}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                      />
                      
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Appropriate Email Length (+{settings.importance_weights.email_length} points)
                      </Typography>
                      <Slider
                        value={settings.importance_weights.email_length}
                        onChange={(e, newValue) => handleWeightChange('email_length', newValue)}
                        min={0}
                        max={3}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle1">
                      Importance Level Thresholds
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1, gap: 1 }}>
                      <Box sx={{ 
                        bgcolor: IMPORTANCE_COLORS.veryLow, 
                        color: 'white', 
                        py: 1, 
                        px: 2, 
                        borderRadius: 1
                      }}>
                        Very Low: 0-3
                      </Box>
                      <Box sx={{ 
                        bgcolor: IMPORTANCE_COLORS.low, 
                        color: 'white', 
                        py: 1, 
                        px: 2, 
                        borderRadius: 1
                      }}>
                        Low: 4-6
                      </Box>
                      <Box sx={{ 
                        bgcolor: IMPORTANCE_COLORS.medium, 
                        color: 'white', 
                        py: 1, 
                        px: 2, 
                        borderRadius: 1
                      }}>
                        Medium: 7-9
                      </Box>
                      <Box sx={{ 
                        bgcolor: IMPORTANCE_COLORS.high, 
                        color: 'white', 
                        py: 1, 
                        px: 2, 
                        borderRadius: 1
                      }}>
                        High: 10+
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default EmailDashboard;