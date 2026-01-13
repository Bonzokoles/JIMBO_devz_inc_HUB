import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <App />
    </div>
  </StrictMode>,
)
