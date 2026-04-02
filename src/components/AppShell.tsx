'use client'
import { AuthProvider, useAuth } from '@/components/AuthContext'
import Sidebar from '@/components/Sidebar'
import LoginPage from '@/app/login/page'

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4 animate-pulse">
            <span className="text-3xl">🏪</span>
          </div>
          <p className="text-muted text-sm">Loading Gorayo Wholesalers...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 p-7 min-h-screen">
        {children}
      </main>
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  )
}
