import { apiClient } from "@/lib/api-client";

export type DriverStatus = "ACTIVE" | "ON_TRIP" | "INACTIVE" | "BLACKLISTED";
export type SalaryType = "FIXED" | "PER_TRIP" | "COMMISSION" | "NONE";
export type ClientStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export type CompanyDriver = {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  alternatePhone?: string | null;
  licenseNumber: string;
  licenseExpiryDate: string;
  aadhaarNumber?: string | null;
  address?: string | null;
  joiningDate: string;
  salaryType: SalaryType;
  salaryAmount?: string | null;
  status: DriverStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyClient = {
  id: string;
  companyId: string;
  clientName: string;
  contactPerson?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  billingAddress?: string | null;
  city?: string | null;
  state?: string | null;
  paymentTerms?: string | null;
  status: ClientStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DriverPayload = {
  name: string;
  phone: string;
  alternatePhone?: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  aadhaarNumber?: string;
  address?: string;
  joiningDate: string;
  salaryType: SalaryType;
  salaryAmount?: number;
  status: DriverStatus;
  notes?: string;
};

export type ClientPayload = {
  clientName: string;
  contactPerson?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gstNumber?: string;
  billingAddress?: string;
  city?: string;
  state?: string;
  paymentTerms?: string;
  status: ClientStatus;
  notes?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function fetchCompanyDrivers(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: DriverStatus | "ALL";
}) {
  const response = await apiClient.get<
    ApiResponse<{
      items: CompanyDriver[];
      summary: {
        totalDrivers: number;
        activeDrivers: number;
        onTripDrivers: number;
        inactiveDrivers: number;
        expiringLicenses: number;
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  >("/company/drivers", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      status: params.status && params.status !== "ALL" ? params.status : undefined
    }
  });

  return response.data.data;
}

export async function createCompanyDriver(payload: DriverPayload) {
  const response = await apiClient.post<ApiResponse<CompanyDriver>>("/company/drivers", payload);
  return response.data.data;
}

export async function updateCompanyDriver(driverId: string, payload: Partial<DriverPayload>) {
  const response = await apiClient.patch<ApiResponse<CompanyDriver>>(`/company/drivers/${driverId}`, payload);
  return response.data.data;
}

export async function updateCompanyDriverStatus(driverId: string, status: DriverStatus) {
  const response = await apiClient.patch<ApiResponse<CompanyDriver>>(`/company/drivers/${driverId}/status`, {
    status
  });
  return response.data.data;
}

export async function deleteCompanyDriver(driverId: string) {
  const response = await apiClient.delete<ApiResponse<CompanyDriver>>(`/company/drivers/${driverId}`);
  return response.data.data;
}

export async function fetchCompanyClients(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClientStatus | "ALL";
}) {
  const response = await apiClient.get<
    ApiResponse<{
      items: CompanyClient[];
      summary: {
        totalClients: number;
        activeClients: number;
        inactiveClients: number;
        blockedClients: number;
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  >("/company/clients", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      status: params.status && params.status !== "ALL" ? params.status : undefined
    }
  });

  return response.data.data;
}

export async function createCompanyClient(payload: ClientPayload) {
  const response = await apiClient.post<ApiResponse<CompanyClient>>("/company/clients", payload);
  return response.data.data;
}

export async function updateCompanyClient(clientId: string, payload: Partial<ClientPayload>) {
  const response = await apiClient.patch<ApiResponse<CompanyClient>>(`/company/clients/${clientId}`, payload);
  return response.data.data;
}

export async function updateCompanyClientStatus(clientId: string, status: ClientStatus) {
  const response = await apiClient.patch<ApiResponse<CompanyClient>>(`/company/clients/${clientId}/status`, {
    status
  });
  return response.data.data;
}

export async function deleteCompanyClient(clientId: string) {
  const response = await apiClient.delete<ApiResponse<CompanyClient>>(`/company/clients/${clientId}`);
  return response.data.data;
}
