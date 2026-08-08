import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { isSupabaseConfigured } from './lib/env';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { Login } from './routes/Login';
import { Home } from './routes/Home';
import { Setup } from './routes/Setup';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <p className="centered muted">Chargement…</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <p className="centered muted">Chargement…</p>;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  if (!isSupabaseConfigured) return <Setup />;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <RedirectIfAuthenticated>
                  <Login />
                </RedirectIfAuthenticated>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Home />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
