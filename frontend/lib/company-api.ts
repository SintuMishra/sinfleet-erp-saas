import { apiClient } from "@/lib/api-client";

export type VehicleType =
  | "TRUCK_10_WHEEL"
  | "TRUCK_12_WHEEL"
  | "TRUCK_14_WHEEL"
  | "TRAILER"
  | "SIGNATURE_SIGNA"
  | "OTHER";

export type FuelType = "DIESEL" | "CNG" | "PETROL" | "ELECTRIC" | "OTHER";
export type OwnershipType = "OWNED" | "ATTACHED" | "RENTED";
export type VehicleStatus = "ACTIVE" | "IDLE" | "ON_TRIP" | "MAINTENANCE" | "INACTIVE";

export type CompanyVehicle = {
  id: string;
  companyId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  manufacturingYear: number;
  fuelType: FuelType;
  ownershipType: OwnershipType;
  capacityTon: string;
  status: VehicleStatus;
  rcNumber: string;
  insuranceExpiryDate: string;
  fitnessExpiryDate: string;
  permitExpiryDate: string;
  pollutionExpiryDate: string;
  gpsDeviceId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VehicleSummary = {
  totalVehicles: number;
  activeVehicles: number;
  onTripVehicles: number;
  maintenanceVehicles: number;
  expiringDocuments: number;
};

export type VehiclePayload = {
  vehicleNumber: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  manufacturingYear: number;
  fuelType: FuelType;
  ownershipType: OwnershipType;
  capacityTon: number;
  status: VehicleStatus;
  rcNumber: string;
  insuranceExpiryDate: string;
  fitnessExpiryDate: string;
  permitExpiryDate: string;
  pollutionExpiryDate: string;
  gpsDeviceId?: string;
  notes?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function loginCompanyUser(email: string, password: string) {
  const response = await apiClient.post<
    ApiResponse<{
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        companyId?: string | null;
      };
    }>
  >("/auth/login", { email, password });

  return response.data.data;
}

export async function fetchCompanyVehicles(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: VehicleStatus | "ALL";
  vehicleType?: VehicleType | "ALL";
}) {
  const response = await apiClient.get<
    ApiResponse<{
      items: CompanyVehicle[];
      summary: VehicleSummary;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  >("/company/vehicles", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      status: params.status && params.status !== "ALL" ? params.status : undefined,
      vehicleType: params.vehicleType && params.vehicleType !== "ALL" ? params.vehicleType : undefined
    }
  });

  return response.data.data;
}

export async function createCompanyVehicle(payload: VehiclePayload) {
  const response = await apiClient.post<ApiResponse<CompanyVehicle>>("/company/vehicles", payload);
  return response.data.data;
}

export async function updateCompanyVehicle(vehicleId: string, payload: Partial<VehiclePayload>) {
  const response = await apiClient.patch<ApiResponse<CompanyVehicle>>(`/company/vehicles/${vehicleId}`, payload);
  return response.data.data;
}

export async function updateCompanyVehicleStatus(vehicleId: string, status: VehicleStatus) {
  const response = await apiClient.patch<ApiResponse<CompanyVehicle>>(`/company/vehicles/${vehicleId}/status`, {
    status
  });
  return response.data.data;
}

export async function deleteCompanyVehicle(vehicleId: string) {
  const response = await apiClient.delete<ApiResponse<CompanyVehicle>>(`/company/vehicles/${vehicleId}`);
  return response.data.data;
}
