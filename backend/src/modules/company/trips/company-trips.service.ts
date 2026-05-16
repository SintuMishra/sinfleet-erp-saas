import { prisma } from "../../../config/prisma.js";
import { AppError } from "../../../services/app-error.js";
import type { Prisma, TripStatus } from "../../../generated/prisma/client.js";
import type {
  CreateCompanyTripInput,
  ListCompanyTripsQuery,
  UpdateCompanyTripInput
} from "./company-trips.schemas.js";

const tripSelect = {
  id: true,
  companyId: true,
  tripNumber: true,
  vehicleId: true,
  driverId: true,
  clientId: true,
  sourceLocation: true,
  destinationLocation: true,
  loadingDate: true,
  unloadingDate: true,
  materialName: true,
  quantity: true,
  quantityUnit: true,
  freightAmount: true,
  advanceAmount: true,
  receivedAmount: true,
  balanceAmount: true,
  rateType: true,
  distanceKm: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  vehicle: {
    select: {
      id: true,
      vehicleNumber: true,
      vehicleType: true,
      status: true
    }
  },
  driver: {
    select: {
      id: true,
      name: true,
      phone: true,
      status: true
    }
  },
  client: {
    select: {
      id: true,
      clientName: true,
      phone: true,
      status: true
    }
  }
} satisfies Prisma.TripSelect;

const runningStatuses: TripStatus[] = ["BOOKED", "LOADING", "IN_TRANSIT"];
const releaseStatuses: TripStatus[] = ["DELIVERED", "PAID", "CANCELLED"];

export async function createCompanyTrip(companyId: string, input: CreateCompanyTripInput) {
  await assertTripRelationsBelongToCompany(companyId, input.vehicleId, input.driverId, input.clientId);

  return prisma.$transaction(async (tx) => {
    const tripNumber = await generateTripNumber(companyId, input.loadingDate, tx);
    const trip = await tx.trip.create({
      data: {
        companyId,
        tripNumber,
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        clientId: input.clientId,
        sourceLocation: input.sourceLocation,
        destinationLocation: input.destinationLocation,
        loadingDate: input.loadingDate,
        unloadingDate: input.unloadingDate,
        materialName: input.materialName,
        quantity: input.quantity,
        quantityUnit: input.quantityUnit,
        freightAmount: input.freightAmount,
        advanceAmount: input.advanceAmount,
        receivedAmount: input.advanceAmount,
        balanceAmount: calculateBalance(input.freightAmount, input.advanceAmount),
        rateType: input.rateType,
        distanceKm: input.distanceKm,
        status: input.status,
        notes: input.notes
      },
      select: tripSelect
    });

    await syncTripResourceStatuses(tx, companyId, input.vehicleId, input.driverId);

    return trip;
  });
}

export async function listCompanyTrips(companyId: string, query: ListCompanyTripsQuery) {
  const where: Prisma.TripWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
    ...(query.driverId ? { driverId: query.driverId } : {}),
    ...(query.clientId ? { clientId: query.clientId } : {}),
    ...(query.fromDate || query.toDate
      ? {
          loadingDate: {
            ...(query.fromDate ? { gte: query.fromDate } : {}),
            ...(query.toDate ? { lte: query.toDate } : {})
          }
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { tripNumber: { contains: query.search, mode: "insensitive" } },
            { sourceLocation: { contains: query.search, mode: "insensitive" } },
            { destinationLocation: { contains: query.search, mode: "insensitive" } },
            { materialName: { contains: query.search, mode: "insensitive" } },
            { vehicle: { vehicleNumber: { contains: query.search, mode: "insensitive" } } },
            { driver: { name: { contains: query.search, mode: "insensitive" } } },
            { client: { clientName: { contains: query.search, mode: "insensitive" } } }
          ]
        }
      : {})
  };

  const [items, total, summary] = await Promise.all([
    prisma.trip.findMany({
      where,
      select: tripSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.trip.count({ where }),
    getTripSummary(companyId)
  ]);

  return {
    items,
    summary,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  };
}

export async function getCompanyTripById(companyId: string, id: string) {
  const trip = await prisma.trip.findFirst({
    where: { id, companyId, deletedAt: null },
    select: tripSelect
  });

  if (!trip) {
    throw new AppError("Trip not found", 404, "TRIP_NOT_FOUND");
  }

  return trip;
}

export async function updateCompanyTrip(companyId: string, id: string, input: UpdateCompanyTripInput) {
  const existingTrip = await getCompanyTripById(companyId, id);

  await assertTripRelationsBelongToCompany(
    companyId,
    input.vehicleId ?? existingTrip.vehicleId,
    input.driverId ?? existingTrip.driverId,
    input.clientId ?? existingTrip.clientId
  );

  return prisma.$transaction(async (tx) => {
    const freightAmount = input.freightAmount ?? Number(existingTrip.freightAmount);
    const advanceAmount = input.advanceAmount ?? Number(existingTrip.advanceAmount);
    const nextStatus = input.status ?? existingTrip.status;
    const paymentTotal = await tx.payment.aggregate({
      where: { companyId, tripId: id, deletedAt: null },
      _sum: { amount: true }
    });
    const receivedAmount = advanceAmount + Number(paymentTotal._sum.amount ?? 0);

    const trip = await tx.trip.update({
      where: { id },
      data: {
        ...input,
        receivedAmount,
        balanceAmount: calculateBalance(freightAmount, receivedAmount)
      },
      select: tripSelect
    });

    await syncTripResourceStatuses(tx, companyId, existingTrip.vehicleId, existingTrip.driverId);
    await syncTripResourceStatuses(tx, companyId, input.vehicleId ?? existingTrip.vehicleId, input.driverId ?? existingTrip.driverId, nextStatus);

    return trip;
  });
}

export async function updateCompanyTripStatus(companyId: string, id: string, status: TripStatus) {
  const existingTrip = await getCompanyTripById(companyId, id);

  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.update({
      where: { id },
      data: { status },
      select: tripSelect
    });

    await syncTripResourceStatuses(tx, companyId, existingTrip.vehicleId, existingTrip.driverId, status);

    return trip;
  });
}

export async function deleteCompanyTrip(companyId: string, id: string) {
  const existingTrip = await getCompanyTripById(companyId, id);

  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.update({
      where: { id },
      data: {
        status: "CANCELLED",
        deletedAt: new Date()
      },
      select: tripSelect
    });

    await syncTripResourceStatuses(tx, companyId, existingTrip.vehicleId, existingTrip.driverId);

    return trip;
  });
}

async function assertTripRelationsBelongToCompany(companyId: string, vehicleId: string, driverId: string, clientId: string) {
  const [vehicle, driver, client] = await Promise.all([
    prisma.vehicle.findFirst({ where: { id: vehicleId, companyId, deletedAt: null }, select: { id: true } }),
    prisma.driverProfile.findFirst({ where: { id: driverId, companyId, deletedAt: null }, select: { id: true } }),
    prisma.client.findFirst({ where: { id: clientId, companyId, deletedAt: null }, select: { id: true } })
  ]);

  if (!vehicle) {
    throw new AppError("Vehicle not found for this company", 404, "VEHICLE_NOT_FOUND");
  }

  if (!driver) {
    throw new AppError("Driver not found for this company", 404, "DRIVER_NOT_FOUND");
  }

  if (!client) {
    throw new AppError("Client not found for this company", 404, "CLIENT_NOT_FOUND");
  }
}

async function generateTripNumber(companyId: string, loadingDate: Date, tx: Prisma.TransactionClient) {
  const datePart = loadingDate.toISOString().slice(0, 10).replaceAll("-", "");
  const prefix = `TRIP-${datePart}`;
  const count = await tx.trip.count({
    where: {
      companyId,
      tripNumber: {
        startsWith: prefix
      }
    }
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

async function syncTripResourceStatuses(
  tx: Prisma.TransactionClient,
  companyId: string,
  vehicleId: string,
  driverId: string,
  status?: TripStatus
) {
  if (status && runningStatuses.includes(status)) {
    await markVehicleAndDriverOnTrip(tx, vehicleId, driverId);
    return;
  }

  if (status && !releaseStatuses.includes(status)) {
    return;
  }

  await refreshVehicleAndDriverAvailability(tx, companyId, vehicleId, driverId);
}

async function markVehicleAndDriverOnTrip(tx: Prisma.TransactionClient, vehicleId: string, driverId: string) {
  await Promise.all([
    tx.vehicle.update({ where: { id: vehicleId }, data: { status: "ON_TRIP" } }),
    tx.driverProfile.update({ where: { id: driverId }, data: { status: "ON_TRIP" } })
  ]);
}

async function refreshVehicleAndDriverAvailability(
  tx: Prisma.TransactionClient,
  companyId: string,
  vehicleId: string,
  driverId: string
) {
  const [vehicleRunningTrip, driverRunningTrip] = await Promise.all([
    tx.trip.findFirst({
      where: { companyId, vehicleId, deletedAt: null, status: { in: runningStatuses } },
      select: { id: true }
    }),
    tx.trip.findFirst({
      where: { companyId, driverId, deletedAt: null, status: { in: runningStatuses } },
      select: { id: true }
    })
  ]);

  await Promise.all([
    tx.vehicle.update({ where: { id: vehicleId }, data: { status: vehicleRunningTrip ? "ON_TRIP" : "IDLE" } }),
    tx.driverProfile.update({ where: { id: driverId }, data: { status: driverRunningTrip ? "ON_TRIP" : "ACTIVE" } })
  ]);
}

async function getTripSummary(companyId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [totalTrips, runningTrips, deliveredTrips, todayLoading, pendingBalance] = await Promise.all([
    prisma.trip.count({ where: { companyId, deletedAt: null } }),
    prisma.trip.count({ where: { companyId, deletedAt: null, status: { in: runningStatuses } } }),
    prisma.trip.count({ where: { companyId, deletedAt: null, status: "DELIVERED" } }),
    prisma.trip.count({
      where: {
        companyId,
        deletedAt: null,
        loadingDate: { gte: todayStart, lt: todayEnd }
      }
    }),
    prisma.trip.aggregate({
      where: {
        companyId,
        deletedAt: null,
        status: { notIn: ["CANCELLED", "PAID"] }
      },
      _sum: { balanceAmount: true }
    })
  ]);

  return {
    totalTrips,
    runningTrips,
    deliveredTrips,
    todayLoading,
    pendingBalance: pendingBalance._sum.balanceAmount ?? 0
  };
}

function calculateBalance(freightAmount: number, advanceAmount = 0) {
  return Math.max(freightAmount - advanceAmount, 0);
}
