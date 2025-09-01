import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
//import './index.css'
import App from './App.jsx'
import './i18n.js';

// === ENV sanity check ===
console.log('VITE_USE_LOCAL =', import.meta.env.VITE_USE_LOCAL);
console.log('VITE_HLS_PROXY_BASE =', import.meta.env.VITE_HLS_PROXY_BASE);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
