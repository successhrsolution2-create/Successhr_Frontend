import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'
import { disconnectSocket } from '../socket'

const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const API_ROOT = import.meta.env.VITE_API_URL || `http://${defaultHost}:5000`
const SESSION_MARKER = 'cookie'

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch (_error) {
    return null
  }
}

try {
  localStorage.removeItem('token')
} catch (_error) {
  // Local storage can be unavailable in restricted browser modes.
}

export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await axios.post(`${API_ROOT}/api/auth/login`, credentials, { withCredentials: true })
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed')
  }
})

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axios.get(`${API_ROOT}/api/auth/me`, { withCredentials: true })
    return data.user
  } catch (error) {
    try {
      await axios.post(`${API_ROOT}/api/auth/logout`, {}, { withCredentials: true })
    } catch (_logoutError) {
      // Ignore logout cleanup failures; the rejected auth state handles the UI.
    }
    return rejectWithValue(error.response?.data?.message || 'Session expired')
  }
})

const savedUser = readUser()

const initialState = {
  token: savedUser ? SESSION_MARKER : null,
  user: savedUser,
  checking: Boolean(savedUser),
  loading: false,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null
      state.user = null
      state.checking = false
      state.error = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      disconnectSocket()
    },
    clearAuthError(state) {
      state.error = null
    },
    setCredentials(state, action) {
      state.token = SESSION_MARKER
      state.user = action.payload.user
      state.checking = false
      localStorage.removeItem('token')
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    updateUser(state, action) {
      state.user = action.payload
      localStorage.setItem('user', JSON.stringify(action.payload))
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.checking = false
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.checking = false
        state.token = SESSION_MARKER
        state.user = action.payload.user
        localStorage.removeItem('token')
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.checking = false
        state.error = action.payload
      })
      .addCase(fetchMe.pending, (state) => {
        state.checking = true
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.checking = false
        state.token = SESSION_MARKER
        state.user = action.payload
        localStorage.removeItem('token')
        localStorage.setItem('user', JSON.stringify(action.payload))
      })
      .addCase(fetchMe.rejected, (state) => {
        state.token = null
        state.user = null
        state.checking = false
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        disconnectSocket()
      })
  }
})

export const { logout, clearAuthError, setCredentials, updateUser } = authSlice.actions
export default authSlice.reducer
