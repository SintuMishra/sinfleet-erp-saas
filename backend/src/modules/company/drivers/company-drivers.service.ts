import { prisma } from "../../../config/prisma.js";
import { AppError } from "../../../services/app-error.js";
import type { DriverStatus, Prisma } from "../../../generated/prisma/client.js";
import type {
  CreateCompanyDriverInput,
  ListCompanyDriversQuery,
  UpdateCompanyDriverInput
} from "./company-drivers.schemas.js";

const driverSelect = {
  id: true,
  companyId: true,
  name: true,
  phone: true,
  alternatePhone: true,
  licenseNumber: true,
  licenseExpiryDate: true,
  aadhaarNumber: true,
  address: true,
  joiningDate: true,
  salaryType: true,
  salaryAmount: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.DriverProfileSelect;

export async function createCompanyDriver(companyId: string, input: CreateCompanyDriverInput) {
  try {
    return await prisma.driverProfile.create({
      data: {
        companyId,
        name: input.name,
        phone: input.phone,
        alternatePhone: input.alternatePhone,
        licenseNumber: input.licenseNumber,
        licenseExpiryDate: input.licenseExpiryDate,
        aadhaarNumber: input.aadhaarNumber,
        address: input.address,
        joiningDate: input.joiningDate,
        salaryType: input.salaryType,
        salaryAmount: input.salaryAmount,
        status: input.status,
        notes: input.notes
      },
      select: driverSelect
    });
  } catch (error) {
    handleKnownDriverError(error);
  }
}

export async function listCompanyDrivers(companyId: string, query: ListCompanyDriversQuery) {
  const where: Prisma.DriverProfileWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { phone: { contains: query.search, mode: "insensitive" } },
            { licenseNumber: { contains: query.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [items, total, summary] = await Promise.all([
    prisma.driverProfile.findMany({
      where,
      select: driverSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.driverProfile.count({ where }),
    getDriverSummary(companyId)
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

export async function getCompanyDriverById(companyId: string, id: string) {
  const driver = await prisma.driverProfile.findFirst({
    where: { id, companyId, deletedAt: null },
    select: driverSelect
  });

  if (!driver) {
    throw new AppError("Driver not found", 404, "DRIVER_NOT_FOUND");
  }

  return driver;
}

export async function updateCompanyDriver(companyId: string, id: string, input: UpdateCompanyDriverInput) {
  await getCompanyDriverById(companyId, id);

  try {
    return await prisma.driverProfile.update({
      where: { id },
      data: input,
      select: driverSelect
    });
  } catch (error) {
    handleKnownDriverError(error);
  }
}

export async function updateCompanyDriverStatus(companyId: string, id: string, status: DriverStatus) {
  await getCompanyDriverById(companyId, id);

  return prisma.driverProfile.update({
    where: { id },
    data: { status },
    select: driverSelect
  });
}

export async function deleteCompanyDriver(companyId: string, id: string) {
  await getCompanyDriverById(companyId, id);

  return prisma.driverProfile.update({
    where: { id },
    data: {
      status: "INACTIVE",
      deletedAt: new Date()
    },
    select: driverSelect
  });
}

async function getDriverSummary(companyId: string) {
  const [totalDrivers, activeDrivers, onTripDrivers, inactiveDrivers, expiringLicenses] = await Promise.all([
    prisma.driverProfile.count({ where: { companyId, deletedAt: null } }),
    prisma.driverProfile.count({ where: { companyId, deletedAt: null, status: "ACTIVE" } }),
    prisma.driverProfile.count({ where: { companyId, deletedAt: null, status: "ON_TRIP" } }),
    prisma.driverProfile.count({ where: { companyId, deletedAt: null, status: "INACTIVE" } }),
    prisma.driverProfile.count({
      where: {
        companyId,
        deletedAt: null,
        licenseExpiryDate: { lte: daysFromNow(30) }
      }
    })
  ]);

  return {
    totalDrivers,
    activeDrivers,
    onTripDrivers,
    inactiveDrivers,
    expiringLicenses
  };
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function handleKnownDriverError(error: unknown): never {
  if (isPrismaKnownError(error)) {
    if (error.code === "P2002") {
      throw new AppError("Driver phone or license already exists for this company", 409, "DRIVER_DUPLICATE");
    }

    if (error.code === "P2025") {
      throw new AppError("Driver not found", 404, "DRIVER_NOT_FOUND");
    }
  }

  throw error;
}

function isPrismaKnownError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error;
}
