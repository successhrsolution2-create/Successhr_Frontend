import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import crmAuthReducer from '../crm/store/authSlice'
import crmCandidateReducer from '../crm/store/candidateSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    crmAuth: crmAuthReducer,
    crmCandidates: crmCandidateReducer
  }
})
