import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { Providers } from './providers'
import { AppRouter } from './router'
import { createRuntime } from './runtime'
import '../styles/globals.css'

const runtime = createRuntime()

createRoot(document.getElementById('root')!).render(
  <StrictMode><Providers runtime={runtime}><BrowserRouter><AppRouter /></BrowserRouter></Providers></StrictMode>,
)
