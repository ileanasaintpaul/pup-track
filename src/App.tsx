import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useHousehold } from './hooks/useHousehold';
import { isSupabaseConfigured } from './lib/env';
import './lib/i18n';
import { queryClient } from './lib/queryClient';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './providers/AuthProvider';
import { DogLayout } from './components/DogLayout';
import { Login } from './routes/Login';
import { Growth } from './routes/Growth';
import { Health } from './routes/Health';
import { Home } from './routes/Home';
import { HomeRedirect } from './routes/HomeRedirect';
import { EditDog, NewDog } from './routes/DogForm';
import { Onboarding } from './routes/Onboarding';
import { Placeholder } from './routes/Placeholder';
import { Profile } from './routes/Profile';
import { ResetPassword } from './routes/ResetPassword';
import { Setup } from './routes/Setup';
import { Training } from './routes/Training';

function Loading() {
  const { t } = useTranslation();
  return <p className="centered muted">{t('common.loading')}</p>;
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

function LegacyRedirect({ to }: { to: string }) {
  const { dogId } = useParams();
  return <Navigate to={`/dog/${dogId}/${to}`} replace />;
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
            <Route path="/nouveau-mot-de-passe" element={<ResetPassword />} />

            <Route
              element={
                <RequireAuth>
                  <RequireHousehold>
                    <Outlet />
                  </RequireHousehold>
                </RequireAuth>
              }
            >
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/dog/new" element={<NewDog />} />
              <Route path="/dog/:dogId/edit" element={<EditDog />} />

              <Route path="/dog/:dogId" element={<DogLayout />}>
                <Route index element={<Home />} />
                <Route path="health" element={<Health />} />
                <Route path="health/growth" element={<Growth />} />
                <Route path="training" element={<Training />} />
                <Route path="map" element={<Placeholder titleKey="nav.map" />} />
                <Route path="coach" element={<Placeholder titleKey="nav.coach" />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              <Route path="/dog/:dogId/poids" element={<LegacyRedirect to="health/growth" />} />
              <Route path="/dog/:dogId/taille" element={<LegacyRedirect to="health/growth" />} />
              <Route path="/dog/:dogId/education" element={<LegacyRedirect to="training" />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
