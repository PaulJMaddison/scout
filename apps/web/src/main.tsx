import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { AppErrorBoundary } from '@/components/shell/app-error-boundary'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  </StrictMode>,
)
