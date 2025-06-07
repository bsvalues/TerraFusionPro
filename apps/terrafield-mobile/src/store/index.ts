import { configureStore } from '@reduxjs/toolkit';
import fieldReducer from './slices/fieldSlice';
import settingsReducer from './slices/settingsSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    fields: fieldReducer,
    settings: settingsReducer,
    analytics: analyticsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 