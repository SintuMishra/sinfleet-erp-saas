import { apiClient } from "@/lib/api-client";
import type { CompanyClient } from "@/lib/company-directory-api";
import type { CompanyTrip } from "@/lib/company-trips-api";

export type CompanyPaymentMode = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "CHEQUE" | "CREDIT" | "OTHER";

export type CompanyPayment = {
  id: string;
  companyId: string;
  clientId: string;
  tripId?: string | null;
  paymentDate: string;
  amount: string;
  paymentMode: CompanyPaymentMode;
  referenceNumber?: string | null;
  notes?: string | null;
  receiptImageUrl?: string | null;
  client: Pick<CompanyClient, "id" | "clientName" | "phone" | "status">;
  trip?: Pick<
    CompanyTrip,
    "id" | "tripNumber" | "sourceLocation" | "destinationLocation" | "freightAmount" | "receivedAmount" | "balanceAmount" | "status"
  > | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentPayload = {
  clientId: string;
  tripId?: string;
  paymentDate: string;
  amount: number;
  paymentMode: CompanyPaymentMode;
  referenceNumber?: string;
  notes?: string;
  receiptImageUrl?: string;
};

export type OutstandingReport = {
  summary: {
    freightAmount: number;
    receivedAmount: number;
    balanceAmount: number;
    tripCount: number;
  };
  clientOutstanding: Array<{
    clientId: string;
    clientName: string;
    phone?: string | null;
    freightAmount: number;
    receivedAmount: number;
    balanceAmount: number;
    tripCount: number;
  }>;
  tripOutstanding: Array<{
    id: string;
    tripNumber: string;
    sourceLocation: string;
    destinationLocation: string;
    freightAmount: string;
    receivedAmount: string;
    balanceAmount: string;
    loadingDate: string;
    status: string;
    client: Pick<CompanyClient, "id" | "clientName" | "phone">;
    vehicle: {
      id: string;
      vehicleNumber: string;
    };
  }>;
};

export type TripProfitReport = {
  trip: Pick<
    CompanyTrip,
    | "id"
    | "tripNumber"
    | "sourceLocation"
    | "destinationLocation"
    | "freightAmount"
    | "receivedAmount"
    | "balanceAmount"
    | "status"
  > & {
    client: { id: string; clientName: string };
    vehicle: { id: string; vehicleNumber: string };
    driver: { id: string; name: string };
  };
  freightAmount: number;
  receivedAmount: number;
  balanceAmount: number;
  dieselTotal: number;
  dieselLiters: number;
  expenseTotal: number;
  netProfit: number;
};

export type DashboardReport = {
  range: { fromDate: string; toDate: string };
  totalVehicles: number;
  activeVehicles: number;
  idleVehicles: number;
  onTripVehicles: number;
  maintenanceVehicles: number;
  totalTrips: number;
  runningTrips: number;
  deliveredTrips: number;
  cancelledTrips: number;
  totalFreight: number;
  totalReceived: number;
  totalOutstanding: number;
  totalDieselAmount: number;
  totalExpenseAmount: number;
  netProfit: number;
  expiringDocumentsCount: number;
  recentTrips: Array<{
    id: string;
    tripNumber: string;
    sourceLocation: string;
    destinationLocation: string;
    loadingDate: string;
    freightAmount: string;
    receivedAmount: string;
    balanceAmount: string;
    status: string;
    vehicle: { id: string; vehicleNumber: string };
    client: { id: string; clientName: string };
  }>;
  topClientsByRevenue: Array<{
    clientId: string;
    clientName: string;
    phone?: string | null;
    totalTrips: number;
    totalFreight: number;
    totalReceived: number;
    outstanding: number;
  }>;
  vehicleProfitSummary: VehicleProfitRow[];
};

export type VehicleProfitRow = {
  vehicleId: string;
  vehicleNumber: string;
  totalTrips: number;
  freightAmount: number;
  receivedAmount: number;
  dieselAmount: number;
  expenseAmount: number;
  netProfit: number;
  pendingAmount: number;
};

export type DriverPerformanceRow = {
  driverId: string;
  driverName: string;
  totalTrips: number;
  deliveredTrips: number;
  cancelledTrips: number;
  freightAmount: number;
  dieselAmount: number;
  expenseAmount: number;
};

export type ClientLedgerRow = {
  clientId: string;
  clientName: string;
  phone?: string | null;
  totalTrips: number;
  totalFreight: number;
  totalReceived: number;
  paymentAmount: number;
  outstanding: number;
  tripBreakdown: Array<{
    id: string;
    tripNumber: string;
    sourceLocation: string;
    destinationLocation: string;
    loadingDate: string;
    freightAmount: string;
    receivedAmount: string;
    balanceAmount: string;
    status: string;
  }>;
};

export type DocumentExpiryReport = {
  days: number;
  vehicles: Array<{
    id: string;
    vehicleNumber: string;
    insuranceExpiryDate: string;
    fitnessExpiryDate: string;
    permitExpiryDate: string;
    pollutionExpiryDate: string;
    status: string;
  }>;
  drivers: Array<{
    id: string;
    name: string;
    phone: string;
    licenseNumber: string;
    licenseExpiryDate: string;
    status: string;
  }>;
  summary: {
    vehicleDocumentsExpiring: number;
    driverLicensesExpiring: number;
    totalExpiring: number;
  };
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function fetchCompanyPayments(params: {
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
  tripId?: string;
  fromDate?: string;
  toDate?: string;
  paymentMode?: CompanyPaymentMode | "ALL";
}) {
  const response = await apiClient.get<
    ApiResponse<{
      items: CompanyPayment[];
      summary: {
        totalReceived: string;
        pendingOutstanding: string;
        todayReceived: string;
        paymentCount: number;
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  >("/company/payments", {
    params: cleanParams({
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
      clientId: params.clientId,
      tripId: params.tripId,
      fromDate: params.fromDate,
      toDate: params.toDate,
      paymentMode: params.paymentMode && params.paymentMode !== "ALL" ? params.paymentMode : undefined
    })
  });

  return response.data.data;
}

export async function createCompanyPayment(payload: PaymentPayload) {
  const response = await apiClient.post<ApiResponse<CompanyPayment>>("/company/payments", payload);
  return response.data.data;
}

export async function updateCompanyPayment(paymentId: string, payload: Partial<PaymentPayload>) {
  const response = await apiClient.patch<ApiResponse<CompanyPayment>>(`/company/payments/${paymentId}`, payload);
  return response.data.data;
}

export async function deleteCompanyPayment(paymentId: string) {
  const response = await apiClient.delete<ApiResponse<CompanyPayment>>(`/company/payments/${paymentId}`);
  return response.data.data;
}

export async function fetchOutstandingReport(search?: string) {
  const response = await apiClient.get<ApiResponse<OutstandingReport>>("/company/reports/outstanding", {
    params: cleanParams({ search })
  });
  return response.data.data;
}

export async function fetchTripProfitReport(tripId: string) {
  const response = await apiClient.get<ApiResponse<TripProfitReport>>(`/company/reports/trip-profit/${tripId}`);
  return response.data.data;
}

export async function fetchDashboardReport(params: { fromDate?: string; toDate?: string }) {
  const response = await apiClient.get<ApiResponse<DashboardReport>>("/company/reports/dashboard", {
    params: cleanParams(params)
  });
  return response.data.data;
}

export async function fetchVehicleProfitReport(params: { fromDate?: string; toDate?: string; vehicleId?: string; page?: number; limit?: number }) {
  const response = await apiClient.get<ApiResponse<{ items: VehicleProfitRow[]; pagination: Pagination }>>("/company/reports/vehicle-profit", {
    params: cleanParams(params)
  });
  return response.data.data;
}

export async function fetchDriverPerformanceReport(params: { fromDate?: string; toDate?: string; driverId?: string; page?: number; limit?: number }) {
  const response = await apiClient.get<ApiResponse<{ items: DriverPerformanceRow[]; pagination: Pagination }>>("/company/reports/driver-performance", {
    params: cleanParams(params)
  });
  return response.data.data;
}

export async function fetchClientLedgerReport(params: { fromDate?: string; toDate?: string; clientId?: string; page?: number; limit?: number }) {
  const response = await apiClient.get<ApiResponse<{ items: ClientLedgerRow[]; pagination: Pagination }>>("/company/reports/client-ledger", {
    params: cleanParams(params)
  });
  return response.data.data;
}

export async function fetchDocumentExpiryReport(params: { days?: number; page?: number; limit?: number }) {
  const response = await apiClient.get<ApiResponse<DocumentExpiryReport>>("/company/reports/document-expiry", {
    params: cleanParams(params)
  });
  return response.data.data;
}

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function cleanParams(params: Record<string, string | number | undefined>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));
}
