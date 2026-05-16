import { prisma } from "../../../config/prisma.js";
import { AppError } from "../../../services/app-error.js";
import type { Prisma, VehicleStatus } from "../../../generated/prisma/client.js";
import type {
  CreateCompanyVehicleInput,
  ListCompanyVehiclesQuery,
  UpdateCompanyVehicleInput
} from "./company-vehicles.schemas.js";

const vehicleSelect = {
  id: true,
  companyId: true,
  vehicleNumber: true,
  vehicleType: true,
  make: true,
  model: true,
  manufacturingYear: true,
  fuelType: true,
  ownershipType: true,
  capacityTon: true,
  status: true,
  rcNumber: true,
  insuranceExpiryDate: true,
  fitnessExpiryDate: true,
  permitExpiryDate: true,
  pollutionExpiryDate: true,
  gpsDeviceId: true,
  notes: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.VehicleSelect;

export async function createCompanyVehicle(companyId: string, input: CreateCompanyVehicleInput) {
  await assertVehiclePlanLimit(companyId);

  try {
    return await prisma.vehicle.create({
      data: {
        companyId,
        vehicleNumber: input.vehicleNumber,
        vehicleType: input.vehicleType,
        make: input.make,
        model: input.model,
        manufacturingYear: input.manufacturingYear,
        fuelType: input.fuelType,
        ownershipType: input.ownershipType,
        capacityTon: input.capacityTon,
        status: input.status,
        rcNumber: input.rcNumber,
        insuranceExpiryDate: input.insuranceExpiryDate,
        fitnessExpiryDate: input.fitnessExpiryDate,
        permitExpiryDate: input.permitExpiryDate,
        pollutionExpiryDate: input.pollutionExpiryDate,
        gpsDeviceId: input.gpsDeviceId,
        notes: input.notes
      },
      select: vehicleSelect
    });
  } catch (error) {
    handleKnownVehicleError(error);
  }
}

export async function listCompanyVehicles(companyId: string, query: ListCompanyVehiclesQuery) {
  const where: Prisma.VehicleWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.vehicleType ? { vehicleType: query.vehicleType } : {}),
    ...(query.search
      ? {
          OR: [
            { vehicleNumber: { contains: query.search, mode: "insensitive" } },
            { make: { contains: query.search, mode: "insensitive" } },
            { model: { contains: query.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [items, total] = await prisma.$transaction([
    prisma.vehicle.findMany({
      where,
      select: vehicleSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.vehicle.count({ where })
  ]);
  const summary = await getVehicleSummary(companyId);

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

export async function getCompanyVehicleById(companyId: string, id: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id,
      companyId,
      deletedAt: null
    },
    select: vehicleSelect
  });

  if (!vehicle) {
    throw new AppError("Vehicle not found", 404, "VEHICLE_NOT_FOUND");
  }

  return vehicle;
}

export async function updateCompanyVehicle(companyId: string, id: string, input: UpdateCompanyVehicleInput) {
  await getCompanyVehicleById(companyId, id);

  try {
    return await prisma.vehicle.update({
      where: { id },
      data: input,
      select: vehicleSelect
    });
  } catch (error) {
    handleKnownVehicleError(error);
  }
}

export async function updateCompanyVehicleStatus(companyId: string, id: string, status: VehicleStatus) {
  await getCompanyVehicleById(companyId, id);

  return prisma.vehicle.update({
    where: { id },
    data: { status },
    select: vehicleSelect
  });
}

export async function deleteCompanyVehicle(companyId: string, id: string) {
  await getCompanyVehicleById(companyId, id);

  return prisma.vehicle.update({
    where: { id },
    data: {
      status: "INACTIVE",
      deletedAt: new Date()
    },
    select: vehicleSelect
  });
}

async function assertVehiclePlanLimit(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      maxVehicles: true,
      status: true,
      _count: {
        select: {
          vehicles: {
            where: { deletedAt: null }
          }
        }
      }
    }
  });

  if (!company) {
    throw new AppError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  if (["SUSPENDED", "EXPIRED"].includes(company.status)) {
    throw new AppError("Company subscription is not active", 403, "COMPANY_NOT_ACTIVE");
  }

  if (company._count.vehicles >= company.maxVehicles) {
    throw new AppError("Vehicle plan limit reached", 403, "VEHICLE_LIMIT_REACHED");
  }
}

async function getVehicleSummary(companyId: string) {
  const [totalVehicles, activeVehicles, onTripVehicles, maintenanceVehicles, expiringDocuments] = await Promise.all([
    prisma.vehicle.count({ where: { companyId, deletedAt: null } }),
    prisma.vehicle.count({ where: { companyId, deletedAt: null, status: "ACTIVE" } }),
    prisma.vehicle.count({ where: { companyId, deletedAt: null, status: "ON_TRIP" } }),
    prisma.vehicle.count({ where: { companyId, deletedAt: null, status: "MAINTENANCE" } }),
    prisma.vehicle.count({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { insuranceExpiryDate: { lte: daysFromNow(30) } },
          { fitnessExpiryDate: { lte: daysFromNow(30) } },
          { permitExpiryDate: { lte: daysFromNow(30) } },
          { pollutionExpiryDate: { lte: daysFromNow(30) } }
        ]
      }
    })
  ]);

  return {
    totalVehicles,
    activeVehicles,
    onTripVehicles,
    maintenanceVehicles,
    expiringDocuments
  };
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function handleKnownVehicleError(error: unknown): never {
  if (isPrismaKnownError(error)) {
    if (error.code === "P2002") {
      throw new AppError("Vehicle number already exists for this company", 409, "VEHICLE_NUMBER_EXISTS");
    }

    if (error.code === "P2025") {
      throw new AppError("Vehicle not found", 404, "VEHICLE_NOT_FOUND");
    }
  }

  throw error;
}

function isPrismaKnownError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error;
}
