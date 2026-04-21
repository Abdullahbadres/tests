export type UserRole = "user" | "super_admin";

export interface User {
  id: number;
  name: string;
  email: string;
  /** Defaults to `user` when missing (legacy data). */
  role?: UserRole;
  created_at: string;
}

export interface GeneratedContent {
  headline: string;
  sub_headline: string;
  product_description: string;
  benefits: { title: string; description: string }[];
  features: { title: string; description: string }[];
  social_proof: {
    testimonials: { name: string; role: string; quote: string }[];
    stats: { value: string; label: string }[];
  };
  pricing: {
    display_price: string;
    billing_note: string;
    value_statement: string;
    included: string[];
  };
  cta: {
    button_text: string;
    supporting_text: string;
    urgency_note?: string;
  };
  seo_meta: {
    title: string;
    description: string;
  };
}

export type TemplateKey = "modern" | "bold" | "elegant";
export type SectionKey =
  | "headline"
  | "sub_headline"
  | "product_description"
  | "benefits"
  | "features"
  | "social_proof"
  | "pricing"
  | "cta";

export interface SalesPage {
  id: number;
  user_id: number;
  product_name: string;
  product_description: string;
  key_features: string[];
  target_audience: string;
  price: string;
  uom: string;
  price_currency: string;
  display_currency: string;
  converted_price_display?: string | null;
  unique_selling_points?: string;
  template: TemplateKey;
  generated_content: GeneratedContent | null;
  status: "pending" | "generating" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}
