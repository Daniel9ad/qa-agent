import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import userReducer from '@/lib/redux/features/userSlice';
import projectReducer from '@/lib/redux/features/projectSlice';

const projectPersistConfig = {
  key: 'project',
  storage
};

const persistedProjectReducer = persistReducer(projectPersistConfig, projectReducer);

const rootReducer = combineReducers({
  user: userReducer,
  project: persistedProjectReducer
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;