import React from 'react'
import ReactDOM from 'react-dom/client'
import { StateProvider } from './context/StateContext.jsx'
import { CompanionProvider } from './context/CompanionContext.jsx'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <StateProvider>
      <CompanionProvider>
        <App />
      </CompanionProvider>
    </StateProvider>
  </ErrorBoundary>
)
