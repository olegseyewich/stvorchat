import { useEffect, useState, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { api } from "@/lib/api";
import type { User } from "@/types/api";

interface ProtectedRouteProps {
  children: ReactElement;
  isBootstrapping: boolean;
}

const ProtectedRoute = ({ children, isBootstrapping }: ProtectedRouteProps) => {
  const token = useAuthStore((state) => state.token);

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-text">
        <div className="rounded-2xl bg-panel/70 px-8 py-6 text-center shadow-soft">
          Загружаем Stvor...
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AuthRoute = ({ children }: { children: ReactElement }) => {
  const token = useAuthStore((state) => state.token);
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const [hasHydrated, setHasHydrated] = useState(() => useAuthStore.persist.hasHydrated());
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const initialize = useAuthStore((state) => state.initialize);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const initializeTheme = useThemeStore((state) => state.initialize);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const unsubFinish = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    const unsubHydrate = useAuthStore.persist.onHydrate(() => {
      setHasHydrated(false);
    });
    return () => {
      unsubFinish();
      unsubHydrate();
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    initialize();
  }, [hasHydrated, initialize]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!hasHydrated) {
        return;
      }

      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      if (user) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const { data } = await api.get<{ user: User }>("/auth/me");
        setUser(data.user);
      } catch (error) {
        console.error(error);
        logout();
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrap();
  }, [hasHydrated, token, user, setUser, logout]);

  useEffect(() => {
    if (hasHydrated && !token) {
      setIsBootstrapping(false);
    }
  }, [hasHydrated, token]);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <div className={theme === "dark" ? "theme-dark" : ""} data-theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute isBootstrapping={isBootstrapping}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <AuthRoute>
                <LoginPage />
              </AuthRoute>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRoute>
                <RegisterPage />
              </AuthRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
