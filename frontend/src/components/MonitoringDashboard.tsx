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
} from 'recharts';
import {
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
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

interface DashboardProps {
  refreshInterval?: number;
}

const MonitoringDashboard: React.FC<DashboardProps> = ({ refreshInterval = 60000 }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [metricsResponse, insightsResponse] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/insights'),
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
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

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

  const renderInsightCard = (insight: Insight) => (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
        subheader={`Last updated: ${new Date().toLocaleString()}`}
      />
      <CardContent>
        {insight.recommendations.map((recommendation, index) => (
          <Alert
            key={index}
            severity="info"
            sx={{ mb: 1 }}
            icon={<WarningIcon />}
          >
            {recommendation}
          </Alert>
        ))}
      </CardContent>
    </Card>
  );

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
        TerraFusion Monitoring Dashboard
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

        {/* Metrics Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Metrics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <RechartsTooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={theme.palette.primary.main}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Insights */}
        {insights.map((insight, index) => (
          <Grid item xs={12} md={6} key={index}>
            {renderInsightCard(insight)}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MonitoringDashboard; 