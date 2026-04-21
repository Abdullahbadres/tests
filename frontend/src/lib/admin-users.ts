import api from "@/lib/api";

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUsersResponse {
  total_registered: number;
  data: AdminUserRow[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface AdminCreateUserInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export const adminUsersApi = {
  list: (page = 1) => api.get<AdminUsersResponse>(`/admin/users?page=${page}`),
  create: (data: AdminCreateUserInput) => api.post<{ user: AdminUserRow }>("/admin/users", data),
  destroy: (id: number) => api.delete(`/admin/users/${id}`),
};
