import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  useTheme,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import {
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  Insights as InsightsIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';

interface Metric {
  name: string;
  value: number;
  timestamp: string;
}

interface Insight {
  type: string;
  data: any;
  recommendations: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box p={3}>{children}</Box>}
  </div>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const EnhancedDashboard: React.FC = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const fetchData = async () => {
    try {
      const [metricsResponse, insightsResponse] = await Promise.all([
        fetch('http://localhost:5000/api/metrics'),
        fetch('http://localhost:5000/api/insights'),
      ]);

      if (!metricsResponse.ok || !insightsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [metricsData, insightsData] = await Promise.all([
        metricsResponse.json(),
        insightsResponse.json(),
      ]);

      setMetrics(metricsData);
      setInsights(insightsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderMetricCard = (title: string, value: number, icon: React.ReactNode, color: string) => (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={icon}
        title={title}
        action={
          <IconButton onClick={fetchData}>
            <RefreshIcon />
          </IconButton>
        }
      />
      <CardContent>
        <Typography variant="h4" component="div" color={color}>
          {value.toFixed(2)}
        </Typography>
      </CardContent>
    </Card>
  );

  const renderPerformanceRadar = () => {
    const performanceData = insights.find(i => i.type === 'performance')?.data;
    if (!performanceData) return null;

    const data = [
      { subject: 'Reliability', A: performanceData.reliability * 100 },
      { subject: 'Efficiency', A: performanceData.efficiency * 100 },
      { subject: 'Scalability', A: performanceData.scalability * 100 },
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="Performance"
            dataKey="A"
            stroke={theme.palette.primary.main}
            fill={theme.palette.primary.main}
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const renderSecurityScatter = () => {
    const securityData = insights.find(i => i.type === 'security')?.data;
    if (!securityData) return null;

    const data = securityData.vulnerabilities.map((vuln: string, index: number) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 100,
      name: vuln,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <CartesianGrid />
          <XAxis type="number" dataKey="x" name="Severity" />
          <YAxis type="number" dataKey="y" name="Impact" />
          <ZAxis type="number" dataKey="z" name="Complexity" />
          <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Vulnerabilities" data={data} fill={theme.palette.error.main} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  const renderKnowledgeGraph = () => {
    const knowledgeData = insights.find(i => i.type === 'knowledge')?.data;
    if (!knowledgeData) return null;

    const data = knowledgeData.central_components.map((component: string, index: number) => ({
      name: component,
      value: Math.random() * 100,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        TerraFusion Enhanced Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Performance Metrics */}
        <Grid item xs={12} md={3}>
          {renderMetricCard(
            'Reliability',
            insights.find(i => i.type === 'performance')?.data.reliability || 0,
            <SecurityIcon color="primary" />,
            theme.palette.primary.main
          )}
        </Grid>
        <Grid item xs={12} md={3}>
          {renderMetricCard(
            'Efficiency',
            insights.find(i => i.type === 'performance')?.data.efficiency || 0,
            <SpeedIcon color="success" />,
            theme.palette.success.main
          )}
        </Grid>
        <Grid item xs={12} md={3}>
          {renderMetricCard(
            'Scalability',
            insights.find(i => i.type === 'performance')?.data.scalability || 0,
            <StorageIcon color="info" />,
            theme.palette.info.main
          )}
        </Grid>
        <Grid item xs={12} md={3}>
          {renderMetricCard(
            'Threat Level',
            insights.find(i => i.type === 'security')?.data.threat_level === 'low' ? 0.2 : 0.8,
            <TimelineIcon color="warning" />,
            theme.palette.warning.main
          )}
        </Grid>

        {/* Enhanced Visualizations */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab icon={<SpeedIcon />} label="Performance" />
              <Tab icon={<SecurityIcon />} label="Security" />
              <Tab icon={<PsychologyIcon />} label="Knowledge" />
              <Tab icon={<InsightsIcon />} label="AI Insights" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>
                Performance Analysis
              </Typography>
              {renderPerformanceRadar()}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Security Analysis
              </Typography>
              {renderSecurityScatter()}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Knowledge Graph
              </Typography>
              {renderKnowledgeGraph()}
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                AI-Generated Insights
              </Typography>
              <Grid container spacing={2}>
                {insights.map((insight, index) => (
                  <Grid item xs={12} key={index}>
                    <Card>
                      <CardHeader
                        title={insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                        subheader={`Last updated: ${new Date().toLocaleString()}`}
                      />
                      <CardContent>
                        {insight.recommendations.map((recommendation, idx) => (
                          <Chip
                            key={idx}
                            label={recommendation}
                            color="primary"
                            variant="outlined"
                            sx={{ m: 0.5 }}
                          />
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedDashboard; 