import api from "@/lib/api";
import { User } from "@/types";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Update name; include password fields only when changing password. */
export interface UpdateProfileInput {
  name: string;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}

export const authApi = {
  register: (data: RegisterInput) => api.post<{ user: User }>("/register", data),
  login: (data: LoginInput) => api.post<{ user: User }>("/login", data),
  logout: () => api.post("/logout"),
  getUser: () => api.get<User>("/user"),
  updateProfile: (data: UpdateProfileInput) => api.patch<{ user: User }>("/user/profile", data),
};
