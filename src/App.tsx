import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { useHousehold } from './hooks/useHousehold';
import { isSupabaseConfigured } from './lib/env';
import { queryClient } from './lib/queryClient';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './providers/AuthProvider';
import { Login } from './routes/Login';
import { Home } from './routes/Home';
import { EditDog, NewDog } from './routes/DogForm';
import { Onboarding } from './routes/Onboarding';
import { ResetPassword } from './routes/ResetPassword';
import { Setup } from './routes/Setup';
import { Training } from './routes/Training';
import { WeightLog } from './routes/WeightLog';

function Loading() {
  return <p className="centered muted">Chargement…</p>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireHousehold({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { data: household, isPending } = useHousehold(session?.user.id);

  if (isPending) return <Loading />;
  if (!household) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <Loading />;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RedirectIfHousehold({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { data: household, isPending } = useHousehold(session?.user.id);

  if (isPending) return <Loading />;
  if (household) return <Navigate to="/" replace />;
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
              path="/onboarding"
              element={
                <RequireAuth>
                  <RedirectIfHousehold>
                    <Onboarding />
                  </RedirectIfHousehold>
                </RequireAuth>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <RequireHousehold>
                    <Home />
                  </RequireHousehold>
                </RequireAuth>
              }
            />
            <Route
              path="/dog/new"
              element={
                <RequireAuth>
                  <RequireHousehold>
                    <NewDog />
                  </RequireHousehold>
                </RequireAuth>
              }
            />
            <Route
              path="/dog/:dogId"
              element={
                <RequireAuth>
                  <RequireHousehold>
                    <EditDog />
                  </RequireHousehold>
                </RequireAuth>
              }
            />
            <Route
              path="/dog/:dogId/poids"
              element={
                <RequireAuth>
                  <RequireHousehold>
                    <WeightLog />
                  </RequireHousehold>
                </RequireAuth>
              }
            />
            <Route
              path="/dog/:dogId/education"
              element={
                <RequireAuth>
                  <RequireHousehold>
                    <Training />
                  </RequireHousehold>
                </RequireAuth>
              }
            />
            <Route path="/nouveau-mot-de-passe" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
