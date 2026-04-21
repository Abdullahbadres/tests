"use client";

import { authApi } from "@/lib/auth";
import { User } from "@/types";
import { create } from "zustand";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

/** Satu request /api/user per burst (StrictMode + menu + layout). */
let checkAuthInFlight: Promise<void> | null = null;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  logout: async () => {
    await authApi.logout();
    set({ user: null });
  },
  checkAuth: async () => {
    if (checkAuthInFlight) {
      await checkAuthInFlight;
      return;
    }
    checkAuthInFlight = (async () => {
      set({ isLoading: true });
      try {
        const { data } = await authApi.getUser();
        set({ user: data, isLoading: false });
      } catch {
        set({ user: null, isLoading: false });
      }
    })();
    try {
      await checkAuthInFlight;
    } finally {
      checkAuthInFlight = null;
    }
  },
}));
