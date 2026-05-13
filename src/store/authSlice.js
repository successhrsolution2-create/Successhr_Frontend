import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'
import { disconnectSocket } from '../socket'

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch (_error) {
    return null
  }
}

export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await axios.post(`${API_ROOT}/api/auth/login`, credentials)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed')
  }
})

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token')
    const { data } = await axios.get(`${API_ROOT}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data.user
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Session expired')
  }
})

const savedToken = localStorage.getItem('token')

const initialState = {
  token: savedToken,
  user: readUser(),
  checking: Boolean(savedToken),
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
    setCredentials(state, action) {
      state.token = action.payload.token
      state.user = action.payload.user
      state.checking = false
      localStorage.setItem('token', action.payload.token)
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
        state.token = action.payload.token
        state.user = action.payload.user
        localStorage.setItem('token', action.payload.token)
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
        state.user = action.payload
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

export const { logout, setCredentials, updateUser } = authSlice.actions
export default authSlice.reducer
