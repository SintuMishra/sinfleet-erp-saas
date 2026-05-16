import { prisma } from "../../../config/prisma.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../../services/app-error.js";
import type {
  CreateCompanyDieselInput,
  ListCompanyDieselQuery,
  UpdateCompanyDieselInput
} from "./company-diesel.schemas.js";

const dieselSelect = {
  id: true,
  companyId: true,
  tripId: true,
  vehicleId: true,
  driverId: true,
  dieselDate: true,
  fuelStationName: true,
  liters: true,
  ratePerLiter: true,
  totalAmount: true,
  paymentMode: true,
  billNumber: true,
  odometerReading: true,
  notes: true,
  receiptImageUrl: true,
  createdAt: true,
  updatedAt: true,
  trip: {
    select: {
      id: true,
      tripNumber: true,
      sourceLocation: true,
      destinationLocation: true,
      status: true
    }
  },
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
  }
} satisfies Prisma.DieselSelect;

export async function createCompanyDiesel(companyId: string, input: CreateCompanyDieselInput) {
  await assertDieselRelationsBelongToCompany(companyId, input.vehicleId, input.tripId, input.driverId);

  return prisma.diesel.create({
    data: {
      companyId,
      tripId: input.tripId,
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      dieselDate: input.dieselDate,
      fuelStationName: input.fuelStationName,
      liters: input.liters,
      ratePerLiter: input.ratePerLiter,
      totalAmount: calculateDieselTotal(input.liters, input.ratePerLiter),
      paymentMode: input.paymentMode,
      billNumber: input.billNumber,
      odometerReading: input.odometerReading,
      notes: input.notes,
      receiptImageUrl: input.receiptImageUrl
    },
    select: dieselSelect
  });
}

export async function listCompanyDiesel(companyId: string, query: ListCompanyDieselQuery) {
  const where: Prisma.DieselWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.tripId ? { tripId: query.tripId } : {}),
    ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
    ...(query.driverId ? { driverId: query.driverId } : {}),
    ...(query.fromDate || query.toDate
      ? {
          dieselDate: {
            ...(query.fromDate ? { gte: query.fromDate } : {}),
            ...(query.toDate ? { lte: query.toDate } : {})
          }
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { fuelStationName: { contains: query.search, mode: "insensitive" } },
            { billNumber: { contains: query.search, mode: "insensitive" } },
            { notes: { contains: query.search, mode: "insensitive" } },
            { trip: { tripNumber: { contains: query.search, mode: "insensitive" } } },
            { vehicle: { vehicleNumber: { contains: query.search, mode: "insensitive" } } },
            { driver: { name: { contains: query.search, mode: "insensitive" } } }
          ]
        }
      : {})
  };

  const [items, total, summary] = await Promise.all([
    prisma.diesel.findMany({
      where,
      select: dieselSelect,
      orderBy: { dieselDate: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.diesel.count({ where }),
    getDieselSummary(companyId)
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

export async function getCompanyDieselById(companyId: string, id: string) {
  const diesel = await prisma.diesel.findFirst({
    where: { id, companyId, deletedAt: null },
    select: dieselSelect
  });

  if (!diesel) {
    throw new AppError("Diesel entry not found", 404, "DIESEL_NOT_FOUND");
  }

  return diesel;
}

export async function updateCompanyDiesel(companyId: string, id: string, input: UpdateCompanyDieselInput) {
  const existing = await getCompanyDieselById(companyId, id);
  const vehicleId = input.vehicleId ?? existing.vehicleId;
  const tripId = input.tripId ?? existing.tripId ?? undefined;
  const driverId = input.driverId ?? existing.driverId ?? undefined;

  await assertDieselRelationsBelongToCompany(companyId, vehicleId, tripId, driverId);

  const liters = input.liters ?? Number(existing.liters);
  const ratePerLiter = input.ratePerLiter ?? Number(existing.ratePerLiter);

  return prisma.diesel.update({
    where: { id },
    data: {
      ...input,
      totalAmount: calculateDieselTotal(liters, ratePerLiter)
    },
    select: dieselSelect
  });
}

export async function deleteCompanyDiesel(companyId: string, id: string) {
  await getCompanyDieselById(companyId, id);

  return prisma.diesel.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: dieselSelect
  });
}

async function assertDieselRelationsBelongToCompany(companyId: string, vehicleId: string, tripId?: string, driverId?: string) {
  const [vehicle, trip, driver] = await Promise.all([
    prisma.vehicle.findFirst({ where: { id: vehicleId, companyId, deletedAt: null }, select: { id: true } }),
    tripId ? prisma.trip.findFirst({ where: { id: tripId, companyId, deletedAt: null }, select: { id: true } }) : null,
    driverId ? prisma.driverProfile.findFirst({ where: { id: driverId, companyId, deletedAt: null }, select: { id: true } }) : null
  ]);

  if (!vehicle) {
    throw new AppError("Vehicle not found for this company", 404, "VEHICLE_NOT_FOUND");
  }

  if (tripId && !trip) {
    throw new AppError("Trip not found for this company", 404, "TRIP_NOT_FOUND");
  }

  if (driverId && !driver) {
    throw new AppError("Driver not found for this company", 404, "DRIVER_NOT_FOUND");
  }
}

async function getDieselSummary(companyId: string) {
  const [totals, tripDiesel, vehicleDiesel] = await Promise.all([
    prisma.diesel.aggregate({
      where: { companyId, deletedAt: null },
      _sum: { totalAmount: true, liters: true }
    }),
    prisma.diesel.aggregate({
      where: { companyId, deletedAt: null, tripId: { not: null } },
      _sum: { totalAmount: true }
    }),
    prisma.diesel.aggregate({
      where: { companyId, deletedAt: null, tripId: null },
      _sum: { totalAmount: true }
    })
  ]);

  return {
    totalDieselAmount: totals._sum.totalAmount ?? 0,
    dieselLiters: totals._sum.liters ?? 0,
    tripDieselAmount: tripDiesel._sum.totalAmount ?? 0,
    vehicleDieselAmount: vehicleDiesel._sum.totalAmount ?? 0
  };
}

function calculateDieselTotal(liters: number, ratePerLiter: number) {
  return Number((liters * ratePerLiter).toFixed(2));
}
