import { prisma } from "../../../config/prisma.js";
import { ROLES } from "../../../constants/roles.js";
import { AppError } from "../../../services/app-error.js";
import { hashPassword } from "../../../services/password.service.js";
import type {
  CreateAdminCompanyInput,
  ListAdminCompaniesQuery,
  UpdateAdminCompanyInput
} from "./admin-companies.schemas.js";
import type { CompanyStatus, Prisma } from "../../../generated/prisma/client.js";

const companySelect = {
  id: true,
  companyName: true,
  companyCode: true,
  ownerName: true,
  ownerPhone: true,
  ownerEmail: true,
  city: true,
  state: true,
  address: true,
  gstNumber: true,
  planName: true,
  maxVehicles: true,
  maxUsers: true,
  subscriptionStartDate: true,
  subscriptionEndDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  users: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true
    },
    orderBy: { createdAt: "asc" }
  },
  _count: {
    select: {
      vehicles: true,
      users: true,
      trips: true
    }
  }
} satisfies Prisma.CompanySelect;

export async function createAdminCompany(input: CreateAdminCompanyInput) {
  if (input.subscriptionEndDate <= input.subscriptionStartDate) {
    throw new AppError("Subscription end date must be after start date", 400, "INVALID_SUBSCRIPTION_DATES");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          companyName: input.companyName,
          companyCode: input.companyCode,
          ownerName: input.ownerName,
          ownerPhone: input.ownerPhone,
          ownerEmail: input.ownerEmail,
          city: input.city,
          state: input.state,
          address: input.address,
          gstNumber: input.gstNumber,
          planName: input.planName,
          maxVehicles: input.maxVehicles,
          maxUsers: input.maxUsers,
          subscriptionStartDate: input.subscriptionStartDate,
          subscriptionEndDate: input.subscriptionEndDate,
          status: input.status,
          legalName: input.companyName,
          email: input.ownerEmail,
          phone: input.ownerPhone,
          subscriptions: {
            create: {
              planName: input.planName,
              vehicleLimit: input.maxVehicles,
              userLimit: input.maxUsers,
              startsAt: input.subscriptionStartDate,
              endsAt: input.subscriptionEndDate,
              isActive: ["ACTIVE", "TRIAL"].includes(input.status)
            }
          }
        },
        select: companySelect
      });

      if (input.adminUser) {
        const passwordHash = await hashPassword(input.adminUser.temporaryPassword);

        await tx.user.create({
          data: {
            companyId: company.id,
            name: input.adminUser.name,
            email: input.adminUser.email,
            phone: input.adminUser.phone,
            passwordHash,
            role: ROLES.COMPANY_ADMIN,
            isActive: true
          }
        });
      }

      return getAdminCompanyById(company.id, tx);
    });
  } catch (error) {
    handleKnownCompanyError(error);
  }
}

export async function listAdminCompanies(query: ListAdminCompaniesQuery) {
  const where: Prisma.CompanyWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { companyName: { contains: query.search, mode: "insensitive" } },
            { companyCode: { contains: query.search, mode: "insensitive" } },
            { ownerName: { contains: query.search, mode: "insensitive" } },
            { ownerEmail: { contains: query.search, mode: "insensitive" } },
            { city: { contains: query.search, mode: "insensitive" } },
            { state: { contains: query.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [items, total] = await prisma.$transaction([
    prisma.company.findMany({
      where,
      select: companySelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.company.count({ where })
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  };
}

export async function getAdminCompanyById(id: string, client: Prisma.TransactionClient | typeof prisma = prisma) {
  const company = await client.company.findUnique({
    where: { id },
    select: companySelect
  });

  if (!company) {
    throw new AppError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  return company;
}

export async function updateAdminCompany(id: string, input: UpdateAdminCompanyInput) {
  if (
    input.subscriptionStartDate &&
    input.subscriptionEndDate &&
    input.subscriptionEndDate <= input.subscriptionStartDate
  ) {
    throw new AppError("Subscription end date must be after start date", 400, "INVALID_SUBSCRIPTION_DATES");
  }

  try {
    return await prisma.company.update({
      where: { id },
      data: {
        ...input,
        ...(input.companyName ? { legalName: input.companyName } : {}),
        ...(input.ownerEmail ? { email: input.ownerEmail } : {}),
        ...(input.ownerPhone ? { phone: input.ownerPhone } : {})
      },
      select: companySelect
    });
  } catch (error) {
    handleKnownCompanyError(error);
  }
}

export async function updateAdminCompanyStatus(id: string, status: CompanyStatus) {
  try {
    return await prisma.company.update({
      where: { id },
      data: {
        status,
        subscriptions: {
          updateMany: {
            where: { isActive: true },
            data: { isActive: ["ACTIVE", "TRIAL"].includes(status) }
          }
        }
      },
      select: companySelect
    });
  } catch (error) {
    handleKnownCompanyError(error);
  }
}

function handleKnownCompanyError(error: unknown): never {
  if (isPrismaKnownError(error)) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "unique field";
      throw new AppError(`Duplicate value for ${target}`, 409, "DUPLICATE_VALUE");
    }

    if (error.code === "P2025") {
      throw new AppError("Company not found", 404, "COMPANY_NOT_FOUND");
    }
  }

  throw error;
}

function isPrismaKnownError(error: unknown): error is { code: string; meta?: { target?: unknown } } {
  return typeof error === "object" && error !== null && "code" in error;
}
