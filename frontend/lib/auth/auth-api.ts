import { apiClient } from "@/lib/api-client";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "DRIVER" | "USER";
  companyId?: string | null;
  isActive: boolean;
  company?: {
    id: string;
    companyName: string;
    companyCode: string;
    status: string;
  } | null;
};

export async function fetchCurrentUser() {
  const response = await apiClient.get<ApiResponse<CurrentUser>>("/auth/me");
  return response.data.data;
}
