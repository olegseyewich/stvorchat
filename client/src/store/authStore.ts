import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, parseApiError, setAuthToken } from "@/lib/api";
import { disconnectSocket, initSocket } from "@/lib/socket";
import type { AuthResponse, User } from "@/types/api";

interface AuthCredentials {
  email: string;
  password: string;
}

interface RegisterPayload extends AuthCredentials {
  displayName: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => void;
  login: (payload: AuthCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const hydrateAuth = (token: string | null) => {
  setAuthToken(token);
  if (token) {
    initSocket(token);
  } else {
    disconnectSocket();
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      initialize: () => {
        const { token } = get();
        hydrateAuth(token);
      },
      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post<AuthResponse>("/auth/login", payload);
          set({ user: data.user, token: data.token, isLoading: false, error: null });
          hydrateAuth(data.token);
        } catch (error) {
          const parsed = parseApiError(error);
          set({ error: parsed.message, isLoading: false });
          throw error;
        }
      },
      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post<AuthResponse>("/auth/register", payload);
          set({ user: data.user, token: data.token, isLoading: false, error: null });
          hydrateAuth(data.token);
        } catch (error) {
          const parsed = parseApiError(error);
          set({ error: parsed.message, isLoading: false });
          throw error;
        }
      },
      logout: () => {
        set({ user: null, token: null, error: null });
        hydrateAuth(null);
      },
      setUser: (user) => {
        set({ user });
      },
    }),
    {
      name: "stvor-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        hydrateAuth(state.token);
      },
    },
  ),
);


