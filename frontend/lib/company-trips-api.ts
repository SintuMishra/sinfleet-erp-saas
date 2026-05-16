import { apiClient } from "@/lib/api-client";
import type { CompanyVehicle } from "@/lib/company-api";
import type { CompanyClient, CompanyDriver } from "@/lib/company-directory-api";

export type TripStatus = "BOOKED" | "LOADING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED" | "BILLED" | "PAID";
export type QuantityUnit = "TON" | "KG" | "CFT" | "BAG" | "PIECE" | "OTHER";
export type RateType = "FIXED" | "PER_TON" | "PER_KM" | "PER_CFT" | "OTHER";

export type CompanyTrip = {
  id: string;
  companyId: string;
  tripNumber: string;
  vehicleId: string;
  driverId: string;
  clientId: string;
  sourceLocation: string;
  destinationLocation: string;
  loadingDate: string;
  unloadingDate?: string | null;
  materialName?: string | null;
  quantity?: string | null;
  quantityUnit: QuantityUnit;
  freightAmount: string;
  advanceAmount: string;
  receivedAmount: string;
  balanceAmount: string;
  rateType: RateType;
  distanceKm?: string | null;
  status: TripStatus;
  notes?: string | null;
  vehicle: Pick<CompanyVehicle, "id" | "vehicleNumber" | "vehicleType" | "status">;
  driver: Pick<CompanyDriver, "id" | "name" | "phone" | "status">;
  client: Pick<CompanyClient, "id" | "clientName" | "phone" | "status">;
  createdAt: string;
  updatedAt: string;
};

export type TripPayload = {
  vehicleId: string;
  driverId: string;
  clientId: string;
  sourceLocation: string;
  destinationLocation: string;
  loadingDate: string;
  unloadingDate?: string;
  materialName?: string;
  quantity?: number;
  quantityUnit: QuantityUnit;
  freightAmount: number;
  advanceAmount?: number;
  rateType: RateType;
  distanceKm?: number;
  status: TripStatus;
  notes?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function fetchCompanyTrips(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: TripStatus | "ALL";
  vehicleId?: string;
  driverId?: string;
  clientId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const response = await apiClient.get<
    ApiResponse<{
      items: CompanyTrip[];
      summary: {
        totalTrips: number;
        runningTrips: number;
        deliveredTrips: number;
        todayLoading: number;
        pendingBalance: string;
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  >("/company/trips", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      status: params.status && params.status !== "ALL" ? params.status : undefined,
      vehicleId: params.vehicleId || undefined,
      driverId: params.driverId || undefined,
      clientId: params.clientId || undefined,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined
    }
  });

  return response.data.data;
}

export async function createCompanyTrip(payload: TripPayload) {
  const response = await apiClient.post<ApiResponse<CompanyTrip>>("/company/trips", payload);
  return response.data.data;
}

export async function updateCompanyTrip(tripId: string, payload: Partial<TripPayload>) {
  const response = await apiClient.patch<ApiResponse<CompanyTrip>>(`/company/trips/${tripId}`, payload);
  return response.data.data;
}

export async function updateCompanyTripStatus(tripId: string, status: TripStatus) {
  const response = await apiClient.patch<ApiResponse<CompanyTrip>>(`/company/trips/${tripId}/status`, {
    status
  });
  return response.data.data;
}

export async function deleteCompanyTrip(tripId: string) {
  const response = await apiClient.delete<ApiResponse<CompanyTrip>>(`/company/trips/${tripId}`);
  return response.data.data;
}
