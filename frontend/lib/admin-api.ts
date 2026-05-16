import { apiClient } from "@/lib/api-client";

export type CompanyStatus = "ACTIVE" | "TRIAL" | "SUSPENDED" | "EXPIRED";

export type AdminCompany = {
  id: string;
  companyName: string;
  companyCode: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  city: string;
  state: string;
  address: string;
  gstNumber?: string | null;
  planName: string;
  maxVehicles: number;
  maxUsers: number;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
    isActive: boolean;
  }>;
  _count: {
    vehicles: number;
    users: number;
    trips: number;
  };
};

export type CreateAdminCompanyPayload = {
  companyName: string;
  companyCode: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  city: string;
  state: string;
  address: string;
  gstNumber?: string;
  planName: string;
  maxVehicles: number;
  maxUsers: number;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  status: CompanyStatus;
  adminUser?: {
    name: string;
    email: string;
    phone?: string;
    temporaryPassword: string;
  };
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function loginSuperAdmin(email: string, password: string) {
  const response = await apiClient.post<
    ApiResponse<{
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
    }>
  >("/auth/login", { email, password });

  return response.data.data;
}

export async function fetchAdminCompanies(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: CompanyStatus | "ALL";
}) {
  const response = await apiClient.get<
    ApiResponse<{
      items: AdminCompany[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  >("/admin/companies", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      status: params.status && params.status !== "ALL" ? params.status : undefined
    }
  });

  return response.data.data;
}

export async function createAdminCompany(payload: CreateAdminCompanyPayload) {
  const response = await apiClient.post<ApiResponse<AdminCompany>>("/admin/companies", payload);
  return response.data.data;
}

export async function updateAdminCompanyStatus(companyId: string, status: CompanyStatus) {
  const response = await apiClient.patch<ApiResponse<AdminCompany>>(`/admin/companies/${companyId}/status`, {
    status
  });
  return response.data.data;
}
