import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  profile: { targetRole: string; skills: string[]; experience: string; resumeUrl?: string };
  stats: { totalSessions: number; averageScore: number; streak: number; totalQuestions: number };
  subscription: { plan: string };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('token'),
};

export const loginUser = createAsyncThunk('auth/login', async (data: any, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(data) as any;
    localStorage.setItem('token', res.token);
    return res;
  } catch (e: any) { return rejectWithValue(e.message); }
});

export const loginDemoUser = createAsyncThunk('auth/demo', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.demoLogin() as any;
    localStorage.setItem('token', res.token);
    return res;
  } catch (e: any) { return rejectWithValue(e.message); }
});

export const registerUser = createAsyncThunk('auth/register', async (data: any, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(data) as any;
    localStorage.setItem('token', res.token);
    return res;
  } catch (e: any) { return rejectWithValue(e.message); }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try { return await authAPI.getMe() as any; }
  catch (e: any) { return rejectWithValue(e.message); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const handlePending = (state: AuthState) => { state.isLoading = true; state.error = null; };
    const handleFulfilled = (state: AuthState, action: { payload: any }) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token || state.token;
      state.isAuthenticated = true;
    };
    const handleRejected = (state: AuthState, action: { payload: any }) => {
      state.isLoading = false;
      state.error = action.payload;
    };
    builder
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, handleFulfilled)
      .addCase(loginUser.rejected, handleRejected)
      .addCase(loginDemoUser.pending, handlePending)
      .addCase(loginDemoUser.fulfilled, handleFulfilled)
      .addCase(loginDemoUser.rejected, handleRejected)
      .addCase(registerUser.pending, handlePending)
      .addCase(registerUser.fulfilled, handleFulfilled)
      .addCase(registerUser.rejected, handleRejected)
      .addCase(getMe.pending, handlePending)
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(getMe.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        localStorage.removeItem('token');
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
