import { prisma } from "../../../config/prisma.js";
import { AppError } from "../../../services/app-error.js";
import type { ClientStatus, Prisma } from "../../../generated/prisma/client.js";
import type {
  CreateCompanyClientInput,
  ListCompanyClientsQuery,
  UpdateCompanyClientInput
} from "./company-clients.schemas.js";

const clientSelect = {
  id: true,
  companyId: true,
  clientName: true,
  contactPerson: true,
  phone: true,
  alternatePhone: true,
  email: true,
  gstNumber: true,
  billingAddress: true,
  city: true,
  state: true,
  paymentTerms: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ClientSelect;

export async function createCompanyClient(companyId: string, input: CreateCompanyClientInput) {
  try {
    return await prisma.client.create({
      data: {
        companyId,
        clientName: input.clientName,
        contactPerson: input.contactPerson,
        phone: input.phone,
        alternatePhone: input.alternatePhone,
        email: input.email,
        gstNumber: input.gstNumber,
        billingAddress: input.billingAddress,
        city: input.city,
        state: input.state,
        paymentTerms: input.paymentTerms,
        status: input.status,
        notes: input.notes
      },
      select: clientSelect
    });
  } catch (error) {
    handleKnownClientError(error);
  }
}

export async function listCompanyClients(companyId: string, query: ListCompanyClientsQuery) {
  const where: Prisma.ClientWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { clientName: { contains: query.search, mode: "insensitive" } },
            { contactPerson: { contains: query.search, mode: "insensitive" } },
            { phone: { contains: query.search, mode: "insensitive" } },
            { gstNumber: { contains: query.search, mode: "insensitive" } },
            { city: { contains: query.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [items, total, summary] = await Promise.all([
    prisma.client.findMany({
      where,
      select: clientSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.client.count({ where }),
    getClientSummary(companyId)
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

export async function getCompanyClientById(companyId: string, id: string) {
  const client = await prisma.client.findFirst({
    where: { id, companyId, deletedAt: null },
    select: clientSelect
  });

  if (!client) {
    throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");
  }

  return client;
}

export async function updateCompanyClient(companyId: string, id: string, input: UpdateCompanyClientInput) {
  await getCompanyClientById(companyId, id);

  try {
    return await prisma.client.update({
      where: { id },
      data: input,
      select: clientSelect
    });
  } catch (error) {
    handleKnownClientError(error);
  }
}

export async function updateCompanyClientStatus(companyId: string, id: string, status: ClientStatus) {
  await getCompanyClientById(companyId, id);

  return prisma.client.update({
    where: { id },
    data: { status },
    select: clientSelect
  });
}

export async function deleteCompanyClient(companyId: string, id: string) {
  await getCompanyClientById(companyId, id);

  return prisma.client.update({
    where: { id },
    data: {
      status: "INACTIVE",
      deletedAt: new Date()
    },
    select: clientSelect
  });
}

async function getClientSummary(companyId: string) {
  const [totalClients, activeClients, inactiveClients, blockedClients] = await Promise.all([
    prisma.client.count({ where: { companyId, deletedAt: null } }),
    prisma.client.count({ where: { companyId, deletedAt: null, status: "ACTIVE" } }),
    prisma.client.count({ where: { companyId, deletedAt: null, status: "INACTIVE" } }),
    prisma.client.count({ where: { companyId, deletedAt: null, status: "BLOCKED" } })
  ]);

  return {
    totalClients,
    activeClients,
    inactiveClients,
    blockedClients
  };
}

function handleKnownClientError(error: unknown): never {
  if (isPrismaKnownError(error)) {
    if (error.code === "P2002") {
      throw new AppError("Client phone or GST number already exists for this company", 409, "CLIENT_DUPLICATE");
    }

    if (error.code === "P2025") {
      throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");
    }
  }

  throw error;
}

function isPrismaKnownError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error;
}
