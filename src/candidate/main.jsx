import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import ErrorBoundary from '../components/ErrorBoundary'
import { store } from './store'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <ErrorBoundary>
          <App />
          <Toaster position="top-right" />
        </ErrorBoundary>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)
