"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const { user, isLoading, checkAuth, logout, setUser } = useAuthStore();

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return { user, isLoading, logout, setUser };
}
