import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AnalyticsData {
  totalArea: number;
  averageFieldSize: number;
  soilTypeDistribution: Record<string, number>;
  cropTypeDistribution: Record<string, number>;
  lastUpdated: string;
}

interface AnalyticsState {
  data: AnalyticsData;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  data: {
    totalArea: 0,
    averageFieldSize: 0,
    soilTypeDistribution: {},
    cropTypeDistribution: {},
    lastUpdated: new Date().toISOString(),
  },
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setAnalyticsData: (state, action: PayloadAction<AnalyticsData>) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateAnalytics: (state, action: PayloadAction<Partial<AnalyticsData>>) => {
      state.data = {
        ...state.data,
        ...action.payload,
        lastUpdated: new Date().toISOString(),
      };
    },
  },
});

export const {
  setAnalyticsData,
  setLoading,
  setError,
  updateAnalytics,
} = analyticsSlice.actions;

export default analyticsSlice.reducer; 