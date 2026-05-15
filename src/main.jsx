import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { PagoAprobado, PagoRechazado, PagoPendiente } from './pages.jsx'
import './index.css'

function Router() {
  const path = window.location.pathname
  if (path === '/gracias')        return <PagoAprobado />
  if (path === '/error-pago')     return <PagoRechazado />
  if (path === '/pago-pendiente') return <PagoPendiente />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Router /></React.StrictMode>
)
