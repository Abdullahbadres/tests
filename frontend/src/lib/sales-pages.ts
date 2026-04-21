import api from "@/lib/api";
import { PaginatedResponse, SalesPage, SectionKey, TemplateKey } from "@/types";

export interface CreateSalesPageInput {
  product_name: string;
  product_description: string;
  key_features: string[];
  target_audience: string;
  price: string;
  uom: string;
  price_currency: string;
  display_currency: string;
  converted_price_display?: string;
  unique_selling_points?: string;
  template: TemplateKey;
}

export const salesPageApi = {
  list: (page = 1) =>
    api.get<PaginatedResponse<SalesPage>>(`/sales-pages?page=${page}`),
  show: (id: string | number) => api.get<SalesPage>(`/sales-pages/${id}`),
  create: (data: CreateSalesPageInput) => api.post<SalesPage>("/sales-pages", data),
  remove: (id: string | number) => api.delete(`/sales-pages/${id}`),
  generate: (id: string | number) => api.post(`/sales-pages/${id}/generate`),
  regenerateSection: (id: string | number, section: SectionKey) =>
    api.put(`/sales-pages/${id}/regenerate-section`, { section }),
  updateTemplate: (id: string | number, template: TemplateKey) =>
    api.patch(`/sales-pages/${id}/template`, { template }),
  exportHtml: (id: string | number) =>
    api.get(`/sales-pages/${id}/export`, { responseType: "blob" }),
};
