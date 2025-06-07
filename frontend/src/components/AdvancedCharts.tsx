import React, { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Card,
    CardContent,
    useTheme
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ScatterChart,
    Scatter,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    BarChart,
    Bar,
    ResponsiveContainer
} from 'recharts';
import { useTheme as useRechartsTheme } from 'recharts';

interface Metric {
    timestamp: string;
    value: number;
    type: string;
}

interface Insight {
    type: string;
    message: string;
    confidence?: number;
    severity?: string;
}

interface ChartProps {
    metrics: Metric[];
    insights: Insight[];
    loading: boolean;
    error: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdvancedCharts: React.FC<ChartProps> = ({
    metrics,
    insights,
    loading,
    error
}) => {
    const theme = useTheme();
    const rechartsTheme = useRechartsTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [processedData, setProcessedData] = useState<any>(null);

    useEffect(() => {
        if (metrics.length > 0) {
            processData();
        }
    }, [metrics]);

    const processData = () => {
        const performanceData = metrics
            .filter(m => m.type === 'performance')
            .map(m => ({
                timestamp: new Date(m.timestamp).toLocaleTimeString(),
                value: m.value
            }));

        const securityData = metrics
            .filter(m => m.type === 'security')
            .map(m => ({
                timestamp: new Date(m.timestamp).toLocaleTimeString(),
                value: m.value
            }));

        const radarData = [
            { metric: 'Performance', value: metrics.find(m => m.type === 'performance')?.value || 0 },
            { metric: 'Security', value: metrics.find(m => m.type === 'security')?.value || 0 },
            { metric: 'Reliability', value: metrics.find(m => m.type === 'reliability')?.value || 0 },
            { metric: 'Efficiency', value: metrics.find(m => m.type === 'efficiency')?.value || 0 },
            { metric: 'Scalability', value: metrics.find(m => m.type === 'scalability')?.value || 0 }
        ];

        const scatterData = metrics.map(m => ({
            x: new Date(m.timestamp).getTime(),
            y: m.value,
            type: m.type
        }));

        const pieData = [
            { name: 'Performance', value: metrics.find(m => m.type === 'performance')?.value || 0 },
            { name: 'Security', value: metrics.find(m => m.type === 'security')?.value || 0 },
            { name: 'Reliability', value: metrics.find(m => m.type === 'reliability')?.value || 0 },
            { name: 'Efficiency', value: metrics.find(m => m.type === 'efficiency')?.value || 0 },
            { name: 'Scalability', value: metrics.find(m => m.type === 'scalability')?.value || 0 }
        ];

        const areaData = metrics
            .filter(m => m.type === 'performance')
            .map(m => ({
                timestamp: new Date(m.timestamp).toLocaleTimeString(),
                value: m.value,
                upper: m.value + 0.1,
                lower: m.value - 0.1
            }));

        const barData = metrics
            .filter(m => m.type === 'security')
            .map(m => ({
                timestamp: new Date(m.timestamp).toLocaleTimeString(),
                value: m.value
            }));

        setProcessedData({
            performanceData,
            securityData,
            radarData,
            scatterData,
            pieData,
            areaData,
            barData
        });
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box m={2}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box p={2}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper elevation={3}>
                        <Tabs value={activeTab} onChange={handleTabChange}>
                            <Tab label="Performance" />
                            <Tab label="Security" />
                            <Tab label="System Health" />
                            <Tab label="Patterns" />
                            <Tab label="Trends" />
                        </Tabs>
                    </Paper>
                </Grid>

                {activeTab === 0 && (
                    <>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">Performance Trends</Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={processedData?.areaData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="timestamp" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#8884d8"
                                                fill="#8884d8"
                                                fillOpacity={0.3}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="upper"
                                                stroke="#82ca9d"
                                                fill="#82ca9d"
                                                fillOpacity={0.1}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="lower"
                                                stroke="#ffc658"
                                                fill="#ffc658"
                                                fillOpacity={0.1}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">System Metrics</Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RadarChart data={processedData?.radarData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="metric" />
                                            <PolarRadiusAxis />
                                            <Radar
                                                name="Metrics"
                                                dataKey="value"
                                                stroke="#8884d8"
                                                fill="#8884d8"
                                                fillOpacity={0.6}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </>
                )}

                {activeTab === 1 && (
                    <>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">Security Metrics</Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={processedData?.barData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="timestamp" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="value" fill="#82ca9d" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">Security Distribution</Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={processedData?.pieData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                label
                                            >
                                                {processedData?.pieData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </>
                )}

                {activeTab === 2 && (
                    <>
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">System Health Overview</Typography>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <ScatterChart>
                                            <CartesianGrid />
                                            <XAxis type="number" dataKey="x" name="Time" />
                                            <YAxis type="number" dataKey="y" name="Value" />
                                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                            <Legend />
                                            <Scatter name="Metrics" data={processedData?.scatterData} fill="#8884d8" />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </>
                )}

                {activeTab === 3 && (
                    <>
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">Pattern Analysis</Typography>
                                    <Box display="flex" flexWrap="wrap" gap={2}>
                                        {insights.map((insight, index) => (
                                            <Paper
                                                key={index}
                                                elevation={2}
                                                sx={{
                                                    p: 2,
                                                    minWidth: 200,
                                                    backgroundColor: theme.palette.background.default
                                                }}
                                            >
                                                <Typography variant="subtitle1" color="primary">
                                                    {insight.type}
                                                </Typography>
                                                <Typography variant="body2">{insight.message}</Typography>
                                                {insight.confidence && (
                                                    <Typography variant="caption" color="textSecondary">
                                                        Confidence: {insight.confidence.toFixed(2)}
                                                    </Typography>
                                                )}
                                            </Paper>
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </>
                )}

                {activeTab === 4 && (
                    <>
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">Performance Trends</Typography>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <LineChart data={processedData?.performanceData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="timestamp" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#8884d8"
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 8 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </>
                )}
            </Grid>
        </Box>
    );
};

export default AdvancedCharts; 