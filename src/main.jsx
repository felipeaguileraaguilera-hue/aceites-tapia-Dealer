import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// SSO: detectar token del portal
const hash = window.location.hash
if (hash.includes('access_token=')) {
  const params = new URLSearchParams(hash.substring(1))
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (access_token && refresh_token) {
    supabase.auth.setSession({ access_token, refresh_token })
    window.location.hash = '' // limpiar URL
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
