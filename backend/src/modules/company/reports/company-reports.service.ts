import { prisma } from "../../../config/prisma.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../../services/app-error.js";
import type {
  ClientLedgerQuery,
  DocumentExpiryQuery,
  DriverPerformanceQuery,
  ReportDateRangeQuery,
  VehicleProfitQuery
} from "./company-reports.schemas.js";

type DateRange = {
  fromDate: Date;
  toDate: Date;
};

export async function getCompanyDashboardReport(companyId: string, query: ReportDateRangeQuery) {
  const range = resolveDateRange(query);
  const tripDateWhere = dateFilter("loadingDate", range);
  const dieselDateWhere = dateFilter("dieselDate", range);
  const expenseDateWhere = dateFilter("expenseDate", range);

  const [
    totalVehicles,
    activeVehicles,
    idleVehicles,
    onTripVehicles,
    maintenanceVehicles,
    totalTrips,
    runningTrips,
    deliveredTrips,
    cancelledTrips,
    freightTotals,
    dieselTotals,
    expenseTotals,
    expiringDocumentsCount,
    recentTrips,
    topClientTrips,
    vehicleProfitSummary
  ] = await Promise.all([
    prisma.vehicle.count({ where: { companyId, deletedAt: null } }),
    prisma.vehicle.count({ where: { companyId, deletedAt: null, status: "ACTIVE" } }),
    prisma.vehicle.count({ where: { companyId, deletedAt: null, status: "IDLE" } }),
    prisma.vehicle.count({ where: { companyId, deletedAt: null, status: "ON_TRIP" } }),
    prisma.vehicle.count({ where: { companyId, deletedAt: null, status: "MAINTENANCE" } }),
    prisma.trip.count({ where: { companyId, deletedAt: null, ...tripDateWhere } }),
    prisma.trip.count({ where: { companyId, deletedAt: null, status: { in: ["BOOKED", "LOADING", "IN_TRANSIT"] }, ...tripDateWhere } }),
    prisma.trip.count({ where: { companyId, deletedAt: null, status: "DELIVERED", ...tripDateWhere } }),
    prisma.trip.count({ where: { companyId, deletedAt: null, status: "CANCELLED", ...tripDateWhere } }),
    prisma.trip.aggregate({
      where: { companyId, deletedAt: null, status: { not: "CANCELLED" }, ...tripDateWhere },
      _sum: { freightAmount: true, receivedAmount: true, balanceAmount: true }
    }),
    prisma.diesel.aggregate({
      where: { companyId, deletedAt: null, ...dieselDateWhere },
      _sum: { totalAmount: true }
    }),
    prisma.expense.aggregate({
      where: { companyId, deletedAt: null, ...expenseDateWhere },
      _sum: { amount: true }
    }),
    getExpiringDocumentsCount(companyId, 30),
    prisma.trip.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        tripNumber: true,
        sourceLocation: true,
        destinationLocation: true,
        loadingDate: true,
        freightAmount: true,
        receivedAmount: true,
        balanceAmount: true,
        status: true,
        vehicle: { select: { id: true, vehicleNumber: true } },
        client: { select: { id: true, clientName: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    getTopClientsByRevenue(companyId, range),
    getCompanyVehicleProfitReport(companyId, { ...query, page: 1, limit: 8 })
  ]);

  const totalFreight = Number(freightTotals._sum.freightAmount ?? 0);
  const totalDieselAmount = Number(dieselTotals._sum.totalAmount ?? 0);
  const totalExpenseAmount = Number(expenseTotals._sum.amount ?? 0);

  return {
    range,
    totalVehicles,
    activeVehicles,
    idleVehicles,
    onTripVehicles,
    maintenanceVehicles,
    totalTrips,
    runningTrips,
    deliveredTrips,
    cancelledTrips,
    totalFreight,
    totalReceived: Number(freightTotals._sum.receivedAmount ?? 0),
    totalOutstanding: Number(freightTotals._sum.balanceAmount ?? 0),
    totalDieselAmount,
    totalExpenseAmount,
    netProfit: totalFreight - totalDieselAmount - totalExpenseAmount,
    expiringDocumentsCount,
    recentTrips,
    topClientsByRevenue: topClientTrips,
    vehicleProfitSummary: vehicleProfitSummary.items
  };
}

export async function getCompanyVehicleProfitReport(companyId: string, query: VehicleProfitQuery) {
  const range = resolveDateRange(query);
  const vehicleWhere: Prisma.VehicleWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.vehicleId ? { id: query.vehicleId } : {})
  };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where: vehicleWhere,
      select: { id: true, vehicleNumber: true },
      orderBy: { vehicleNumber: "asc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.vehicle.count({ where: vehicleWhere })
  ]);

  const vehicleIds = vehicles.map((vehicle) => vehicle.id);
  const [trips, diesel, expenses] = await Promise.all([
    prisma.trip.findMany({
      where: { companyId, deletedAt: null, vehicleId: { in: vehicleIds }, status: { not: "CANCELLED" }, ...dateFilter("loadingDate", range) },
      select: { vehicleId: true, freightAmount: true, receivedAmount: true, balanceAmount: true }
    }),
    prisma.diesel.groupBy({
      by: ["vehicleId"],
      where: { companyId, deletedAt: null, vehicleId: { in: vehicleIds }, ...dateFilter("dieselDate", range) },
      _sum: { totalAmount: true }
    }),
    prisma.expense.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...dateFilter("expenseDate", range),
        OR: [{ vehicleId: { in: vehicleIds } }, { trip: { vehicleId: { in: vehicleIds } } }]
      },
      select: { vehicleId: true, amount: true, trip: { select: { vehicleId: true } } }
    })
  ]);

  const totals = new Map<string, { totalTrips: number; freightAmount: number; receivedAmount: number; pendingAmount: number; dieselAmount: number; expenseAmount: number }>();
  for (const vehicle of vehicles) {
    totals.set(vehicle.id, { totalTrips: 0, freightAmount: 0, receivedAmount: 0, pendingAmount: 0, dieselAmount: 0, expenseAmount: 0 });
  }
  for (const trip of trips) {
    const total = totals.get(trip.vehicleId);
    if (total) {
      total.totalTrips += 1;
      total.freightAmount += Number(trip.freightAmount);
      total.receivedAmount += Number(trip.receivedAmount);
      total.pendingAmount += Number(trip.balanceAmount);
    }
  }
  for (const item of diesel) {
    const total = totals.get(item.vehicleId);
    if (total) total.dieselAmount += Number(item._sum.totalAmount ?? 0);
  }
  for (const expense of expenses) {
    const vehicleId = expense.vehicleId ?? expense.trip?.vehicleId;
    const total = vehicleId ? totals.get(vehicleId) : undefined;
    if (total) total.expenseAmount += Number(expense.amount);
  }

  return {
    items: vehicles.map((vehicle) => {
      const total = totals.get(vehicle.id)!;
      return {
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        ...total,
        netProfit: total.freightAmount - total.dieselAmount - total.expenseAmount
      };
    }),
    pagination: pagination(query.page, query.limit, total)
  };
}

export async function getCompanyDriverPerformanceReport(companyId: string, query: DriverPerformanceQuery) {
  const range = resolveDateRange(query);
  const driverWhere: Prisma.DriverProfileWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.driverId ? { id: query.driverId } : {})
  };

  const [drivers, total] = await Promise.all([
    prisma.driverProfile.findMany({
      where: driverWhere,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.driverProfile.count({ where: driverWhere })
  ]);
  const driverIds = drivers.map((driver) => driver.id);

  const [trips, diesel, expenses] = await Promise.all([
    prisma.trip.findMany({
      where: { companyId, deletedAt: null, driverId: { in: driverIds }, ...dateFilter("loadingDate", range) },
      select: { driverId: true, status: true, freightAmount: true }
    }),
    prisma.diesel.groupBy({
      by: ["driverId"],
      where: { companyId, deletedAt: null, driverId: { in: driverIds }, ...dateFilter("dieselDate", range) },
      _sum: { totalAmount: true }
    }),
    prisma.expense.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...dateFilter("expenseDate", range),
        OR: [{ driverId: { in: driverIds } }, { trip: { driverId: { in: driverIds } } }]
      },
      select: { driverId: true, amount: true, trip: { select: { driverId: true } } }
    })
  ]);

  const totals = new Map<string, { totalTrips: number; deliveredTrips: number; cancelledTrips: number; freightAmount: number; dieselAmount: number; expenseAmount: number }>();
  for (const driver of drivers) {
    totals.set(driver.id, { totalTrips: 0, deliveredTrips: 0, cancelledTrips: 0, freightAmount: 0, dieselAmount: 0, expenseAmount: 0 });
  }
  for (const trip of trips) {
    const total = totals.get(trip.driverId);
    if (total) {
      total.totalTrips += 1;
      total.deliveredTrips += trip.status === "DELIVERED" || trip.status === "BILLED" || trip.status === "PAID" ? 1 : 0;
      total.cancelledTrips += trip.status === "CANCELLED" ? 1 : 0;
      total.freightAmount += trip.status === "CANCELLED" ? 0 : Number(trip.freightAmount);
    }
  }
  for (const item of diesel) {
    if (item.driverId) {
      const total = totals.get(item.driverId);
      if (total) total.dieselAmount += Number(item._sum.totalAmount ?? 0);
    }
  }
  for (const expense of expenses) {
    const driverId = expense.driverId ?? expense.trip?.driverId;
    const total = driverId ? totals.get(driverId) : undefined;
    if (total) total.expenseAmount += Number(expense.amount);
  }

  return {
    items: drivers.map((driver) => ({
      driverId: driver.id,
      driverName: driver.name,
      ...totals.get(driver.id)!
    })),
    pagination: pagination(query.page, query.limit, total)
  };
}

export async function getCompanyClientLedgerReport(companyId: string, query: ClientLedgerQuery) {
  const range = resolveDateRange(query);
  const clientWhere: Prisma.ClientWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.clientId ? { id: query.clientId } : {})
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where: clientWhere,
      select: { id: true, clientName: true, phone: true },
      orderBy: { clientName: "asc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.client.count({ where: clientWhere })
  ]);
  const clientIds = clients.map((client) => client.id);
  const [trips, payments] = await Promise.all([
    prisma.trip.findMany({
      where: { companyId, deletedAt: null, clientId: { in: clientIds }, status: { not: "CANCELLED" }, ...dateFilter("loadingDate", range) },
      select: {
        id: true,
        clientId: true,
        tripNumber: true,
        sourceLocation: true,
        destinationLocation: true,
        loadingDate: true,
        freightAmount: true,
        receivedAmount: true,
        balanceAmount: true,
        status: true
      },
      orderBy: { loadingDate: "desc" }
    }),
    prisma.payment.groupBy({
      by: ["clientId"],
      where: { companyId, deletedAt: null, clientId: { in: clientIds }, ...dateFilter("paymentDate", range) },
      _sum: { amount: true }
    })
  ]);

  const paymentMap = new Map(payments.map((payment) => [payment.clientId, Number(payment._sum.amount ?? 0)]));

  return {
    items: clients.map((client) => {
      const tripBreakdown = trips.filter((trip) => trip.clientId === client.id);
      const totalFreight = sum(tripBreakdown, "freightAmount");
      const totalReceived = sum(tripBreakdown, "receivedAmount");
      const outstanding = sum(tripBreakdown, "balanceAmount");
      return {
        clientId: client.id,
        clientName: client.clientName,
        phone: client.phone,
        totalTrips: tripBreakdown.length,
        totalFreight,
        totalReceived,
        paymentAmount: paymentMap.get(client.id) ?? 0,
        outstanding,
        tripBreakdown
      };
    }),
    pagination: pagination(query.page, query.limit, total)
  };
}

export async function getCompanyDocumentExpiryReport(companyId: string, query: DocumentExpiryQuery) {
  const now = new Date();
  const expiresBy = new Date(now);
  expiresBy.setDate(expiresBy.getDate() + query.days);

  const [vehicles, vehicleTotal, drivers, driverTotal] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { insuranceExpiryDate: { gte: now, lte: expiresBy } },
          { fitnessExpiryDate: { gte: now, lte: expiresBy } },
          { permitExpiryDate: { gte: now, lte: expiresBy } },
          { pollutionExpiryDate: { gte: now, lte: expiresBy } }
        ]
      },
      select: {
        id: true,
        vehicleNumber: true,
        insuranceExpiryDate: true,
        fitnessExpiryDate: true,
        permitExpiryDate: true,
        pollutionExpiryDate: true,
        status: true
      },
      orderBy: { vehicleNumber: "asc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.vehicle.count({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { insuranceExpiryDate: { gte: now, lte: expiresBy } },
          { fitnessExpiryDate: { gte: now, lte: expiresBy } },
          { permitExpiryDate: { gte: now, lte: expiresBy } },
          { pollutionExpiryDate: { gte: now, lte: expiresBy } }
        ]
      }
    }),
    prisma.driverProfile.findMany({
      where: { companyId, deletedAt: null, licenseExpiryDate: { gte: now, lte: expiresBy } },
      select: { id: true, name: true, phone: true, licenseNumber: true, licenseExpiryDate: true, status: true },
      orderBy: { licenseExpiryDate: "asc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.driverProfile.count({
      where: { companyId, deletedAt: null, licenseExpiryDate: { gte: now, lte: expiresBy } }
    })
  ]);

  return {
    days: query.days,
    vehicles,
    drivers,
    summary: {
      vehicleDocumentsExpiring: vehicleTotal,
      driverLicensesExpiring: driverTotal,
      totalExpiring: vehicleTotal + driverTotal
    },
    pagination: {
      vehicles: pagination(query.page, query.limit, vehicleTotal),
      drivers: pagination(query.page, query.limit, driverTotal)
    }
  };
}

export async function getCompanyOutstandingReport(companyId: string, search?: string) {
  const tripWhere: Prisma.TripWhereInput = {
    companyId,
    deletedAt: null,
    status: { not: "CANCELLED" },
    balanceAmount: { gt: 0 },
    ...(search
      ? {
          OR: [
            { tripNumber: { contains: search, mode: "insensitive" } },
            { sourceLocation: { contains: search, mode: "insensitive" } },
            { destinationLocation: { contains: search, mode: "insensitive" } },
            { client: { clientName: { contains: search, mode: "insensitive" } } },
            { vehicle: { vehicleNumber: { contains: search, mode: "insensitive" } } }
          ]
        }
      : {})
  };

  const trips = await prisma.trip.findMany({
    where: tripWhere,
    select: {
      id: true,
      tripNumber: true,
      sourceLocation: true,
      destinationLocation: true,
      freightAmount: true,
      receivedAmount: true,
      balanceAmount: true,
      loadingDate: true,
      status: true,
      client: {
        select: {
          id: true,
          clientName: true,
          phone: true
        }
      },
      vehicle: {
        select: {
          id: true,
          vehicleNumber: true
        }
      }
    },
    orderBy: { loadingDate: "desc" }
  });

  const clientMap = new Map<
    string,
    {
      clientId: string;
      clientName: string;
      phone?: string | null;
      freightAmount: number;
      receivedAmount: number;
      balanceAmount: number;
      tripCount: number;
    }
  >();

  for (const trip of trips) {
    const current = clientMap.get(trip.client.id) ?? {
      clientId: trip.client.id,
      clientName: trip.client.clientName,
      phone: trip.client.phone,
      freightAmount: 0,
      receivedAmount: 0,
      balanceAmount: 0,
      tripCount: 0
    };

    current.freightAmount += Number(trip.freightAmount);
    current.receivedAmount += Number(trip.receivedAmount);
    current.balanceAmount += Number(trip.balanceAmount);
    current.tripCount += 1;
    clientMap.set(trip.client.id, current);
  }

  const summary = trips.reduce(
    (totals, trip) => ({
      freightAmount: totals.freightAmount + Number(trip.freightAmount),
      receivedAmount: totals.receivedAmount + Number(trip.receivedAmount),
      balanceAmount: totals.balanceAmount + Number(trip.balanceAmount),
      tripCount: totals.tripCount + 1
    }),
    { freightAmount: 0, receivedAmount: 0, balanceAmount: 0, tripCount: 0 }
  );

  return {
    summary,
    clientOutstanding: [...clientMap.values()].sort((a, b) => b.balanceAmount - a.balanceAmount),
    tripOutstanding: trips
  };
}

export async function getCompanyTripProfitReport(companyId: string, tripId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, companyId, deletedAt: null },
    select: {
      id: true,
      tripNumber: true,
      sourceLocation: true,
      destinationLocation: true,
      freightAmount: true,
      receivedAmount: true,
      balanceAmount: true,
      status: true,
      client: {
        select: {
          id: true,
          clientName: true
        }
      },
      vehicle: {
        select: {
          id: true,
          vehicleNumber: true
        }
      },
      driver: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!trip) {
    throw new AppError("Trip not found", 404, "TRIP_NOT_FOUND");
  }

  const [dieselTotal, expenseTotal] = await Promise.all([
    prisma.diesel.aggregate({
      where: { companyId, tripId, deletedAt: null },
      _sum: { totalAmount: true, liters: true }
    }),
    prisma.expense.aggregate({
      where: { companyId, tripId, deletedAt: null },
      _sum: { amount: true }
    })
  ]);

  const freightAmount = Number(trip.freightAmount);
  const dieselAmount = Number(dieselTotal._sum.totalAmount ?? 0);
  const expenseAmount = Number(expenseTotal._sum.amount ?? 0);

  return {
    trip,
    freightAmount,
    receivedAmount: Number(trip.receivedAmount),
    balanceAmount: Number(trip.balanceAmount),
    dieselTotal: dieselAmount,
    dieselLiters: Number(dieselTotal._sum.liters ?? 0),
    expenseTotal: expenseAmount,
    netProfit: freightAmount - dieselAmount - expenseAmount
  };
}

export async function getCompanyClientSummaryReport(companyId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, companyId, deletedAt: null },
    select: {
      id: true,
      clientName: true,
      phone: true,
      email: true,
      status: true
    }
  });

  if (!client) {
    throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");
  }

  const [tripTotals, paymentTotals, outstandingTrips] = await Promise.all([
    prisma.trip.aggregate({
      where: { companyId, clientId, deletedAt: null, status: { not: "CANCELLED" } },
      _sum: { freightAmount: true, receivedAmount: true, balanceAmount: true },
      _count: { id: true }
    }),
    prisma.payment.aggregate({
      where: { companyId, clientId, deletedAt: null },
      _sum: { amount: true },
      _count: { id: true }
    }),
    prisma.trip.findMany({
      where: { companyId, clientId, deletedAt: null, status: { not: "CANCELLED" }, balanceAmount: { gt: 0 } },
      select: {
        id: true,
        tripNumber: true,
        sourceLocation: true,
        destinationLocation: true,
        freightAmount: true,
        receivedAmount: true,
        balanceAmount: true,
        status: true
      },
      orderBy: { loadingDate: "desc" }
    })
  ]);

  return {
    client,
    summary: {
      freightAmount: tripTotals._sum.freightAmount ?? 0,
      receivedAmount: tripTotals._sum.receivedAmount ?? 0,
      balanceAmount: tripTotals._sum.balanceAmount ?? 0,
      paymentAmount: paymentTotals._sum.amount ?? 0,
      tripCount: tripTotals._count.id,
      paymentCount: paymentTotals._count.id
    },
    outstandingTrips
  };
}

async function getTopClientsByRevenue(companyId: string, range: DateRange) {
  const trips = await prisma.trip.groupBy({
    by: ["clientId"],
    where: { companyId, deletedAt: null, status: { not: "CANCELLED" }, ...dateFilter("loadingDate", range) },
    _sum: { freightAmount: true, receivedAmount: true, balanceAmount: true },
    _count: { id: true },
    orderBy: { _sum: { freightAmount: "desc" } },
    take: 5
  });

  const clients = await prisma.client.findMany({
    where: { id: { in: trips.map((trip) => trip.clientId) }, companyId },
    select: { id: true, clientName: true, phone: true }
  });
  const clientMap = new Map(clients.map((client) => [client.id, client]));

  return trips.map((trip) => ({
    clientId: trip.clientId,
    clientName: clientMap.get(trip.clientId)?.clientName ?? "Unknown Client",
    phone: clientMap.get(trip.clientId)?.phone,
    totalTrips: trip._count.id,
    totalFreight: Number(trip._sum.freightAmount ?? 0),
    totalReceived: Number(trip._sum.receivedAmount ?? 0),
    outstanding: Number(trip._sum.balanceAmount ?? 0)
  }));
}

async function getExpiringDocumentsCount(companyId: string, days: number) {
  const now = new Date();
  const expiresBy = new Date(now);
  expiresBy.setDate(expiresBy.getDate() + days);

  const [vehicles, drivers] = await Promise.all([
    prisma.vehicle.count({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { insuranceExpiryDate: { gte: now, lte: expiresBy } },
          { fitnessExpiryDate: { gte: now, lte: expiresBy } },
          { permitExpiryDate: { gte: now, lte: expiresBy } },
          { pollutionExpiryDate: { gte: now, lte: expiresBy } }
        ]
      }
    }),
    prisma.driverProfile.count({
      where: { companyId, deletedAt: null, licenseExpiryDate: { gte: now, lte: expiresBy } }
    })
  ]);

  return vehicles + drivers;
}

function resolveDateRange(query: ReportDateRangeQuery): DateRange {
  const toDate = query.toDate ? endOfDay(query.toDate) : endOfDay(new Date());
  const fromDate = query.fromDate ? startOfDay(query.fromDate) : startOfDay(daysBefore(toDate, 30));
  return { fromDate, toDate };
}

function dateFilter(field: "loadingDate" | "dieselDate" | "expenseDate" | "paymentDate", range: DateRange) {
  return {
    [field]: {
      gte: range.fromDate,
      lte: range.toDate
    }
  };
}

function pagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

function sum<T extends Record<K, Prisma.Decimal | number | string>, K extends keyof T>(items: T[], key: K) {
  return items.reduce((total, item) => total + Number(item[key]), 0);
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function daysBefore(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() - days);
  return date;
}
