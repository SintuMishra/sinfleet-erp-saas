import { apiClient } from "@/lib/api-client";
import type { CompanyVehicle } from "@/lib/company-api";
import type { CompanyDriver } from "@/lib/company-directory-api";
import type { CompanyTrip } from "@/lib/company-trips-api";

export type PaymentMode = "CASH" | "UPI" | "CARD" | "CREDIT" | "OTHER";
export type ExpenseType =
  | "TOLL"
  | "REPAIR"
  | "CHALLAN"
  | "LOADING"
  | "UNLOADING"
  | "DRIVER_ADVANCE"
  | "HELPER"
  | "FOOD"
  | "PARKING"
  | "TYRE"
  | "MAINTENANCE"
  | "OTHER";

export type CompanyDiesel = {
  id: string;
  companyId: string;
  tripId?: string | null;
  vehicleId: string;
  driverId?: string | null;
  dieselDate: string;
  fuelStationName?: string | null;
  liters: string;
  ratePerLiter: string;
  totalAmount: string;
  paymentMode: PaymentMode;
  billNumber?: string | null;
  odometerReading?: number | null;
  notes?: string | null;
  receiptImageUrl?: string | null;
  trip?: Pick<CompanyTrip, "id" | "tripNumber" | "sourceLocation" | "destinationLocation" | "status"> | null;
  vehicle: Pick<CompanyVehicle, "id" | "vehicleNumber" | "vehicleType" | "status">;
  driver?: Pick<CompanyDriver, "id" | "name" | "phone" | "status"> | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyExpense = {
  id: string;
  companyId: string;
  tripId?: string | null;
  vehicleId?: string | null;
  driverId?: string | null;
  expenseDate: string;
  expenseType: ExpenseType;
  amount: string;
  paymentMode: PaymentMode;
  paidTo?: string | null;
  billNumber?: string | null;
  notes?: string | null;
  receiptImageUrl?: string | null;
  trip?: Pick<CompanyTrip, "id" | "tripNumber" | "sourceLocation" | "destinationLocation" | "status"> | null;
  vehicle?: Pick<CompanyVehicle, "id" | "vehicleNumber" | "vehicleType" | "status"> | null;
  driver?: Pick<CompanyDriver, "id" | "name" | "phone" | "status"> | null;
  createdAt: string;
  updatedAt: string;
};

export type DieselPayload = {
  tripId?: string;
  vehicleId: string;
  driverId?: string;
  dieselDate: string;
  fuelStationName?: string;
  liters: number;
  ratePerLiter: number;
  paymentMode: PaymentMode;
  billNumber?: string;
  odometerReading?: number;
  notes?: string;
  receiptImageUrl?: string;
};

export type ExpensePayload = {
  tripId?: string;
  vehicleId?: string;
  driverId?: string;
  expenseDate: string;
  expenseType: ExpenseType;
  amount: number;
  paymentMode: PaymentMode;
  paidTo?: string;
  billNumber?: string;
  notes?: string;
  receiptImageUrl?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function fetchCompanyDiesel(params: {
  page?: number;
  limit?: number;
  search?: string;
  tripId?: string;
  vehicleId?: string;
  driverId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const response = await apiClient.get<
    ApiResponse<{
      items: CompanyDiesel[];
      summary: {
        totalDieselAmount: string;
        dieselLiters: string;
        tripDieselAmount: string;
        vehicleDieselAmount: string;
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  >("/company/diesel", {
    params: cleanParams({
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
      tripId: params.tripId,
      vehicleId: params.vehicleId,
      driverId: params.driverId,
      fromDate: params.fromDate,
      toDate: params.toDate
    })
  });

  return response.data.data;
}

export async function createCompanyDiesel(payload: DieselPayload) {
  const response = await apiClient.post<ApiResponse<CompanyDiesel>>("/company/diesel", payload);
  return response.data.data;
}

export async function updateCompanyDiesel(dieselId: string, payload: Partial<DieselPayload>) {
  const response = await apiClient.patch<ApiResponse<CompanyDiesel>>(`/company/diesel/${dieselId}`, payload);
  return response.data.data;
}

export async function deleteCompanyDiesel(dieselId: string) {
  const response = await apiClient.delete<ApiResponse<CompanyDiesel>>(`/company/diesel/${dieselId}`);
  return response.data.data;
}

export async function fetchCompanyExpenses(params: {
  page?: number;
  limit?: number;
  search?: string;
  tripId?: string;
  vehicleId?: string;
  driverId?: string;
  expenseType?: ExpenseType | "ALL";
  fromDate?: string;
  toDate?: string;
}) {
  const response = await apiClient.get<
    ApiResponse<{
      items: CompanyExpense[];
      summary: {
        totalExpenseAmount: string;
        tripExpenses: string;
        vehicleExpenses: string;
        companyExpenses: string;
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  >("/company/expenses", {
    params: cleanParams({
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
      tripId: params.tripId,
      vehicleId: params.vehicleId,
      driverId: params.driverId,
      expenseType: params.expenseType && params.expenseType !== "ALL" ? params.expenseType : undefined,
      fromDate: params.fromDate,
      toDate: params.toDate
    })
  });

  return response.data.data;
}

export async function createCompanyExpense(payload: ExpensePayload) {
  const response = await apiClient.post<ApiResponse<CompanyExpense>>("/company/expenses", payload);
  return response.data.data;
}

export async function updateCompanyExpense(expenseId: string, payload: Partial<ExpensePayload>) {
  const response = await apiClient.patch<ApiResponse<CompanyExpense>>(`/company/expenses/${expenseId}`, payload);
  return response.data.data;
}

export async function deleteCompanyExpense(expenseId: string) {
  const response = await apiClient.delete<ApiResponse<CompanyExpense>>(`/company/expenses/${expenseId}`);
  return response.data.data;
}

function cleanParams(params: Record<string, string | number | undefined>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));
}
