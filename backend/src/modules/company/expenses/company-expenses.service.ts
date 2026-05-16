import { prisma } from "../../../config/prisma.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../../services/app-error.js";
import type {
  CreateCompanyExpenseInput,
  ListCompanyExpensesQuery,
  UpdateCompanyExpenseInput
} from "./company-expenses.schemas.js";

const expenseSelect = {
  id: true,
  companyId: true,
  tripId: true,
  vehicleId: true,
  driverId: true,
  expenseDate: true,
  expenseType: true,
  amount: true,
  paymentMode: true,
  paidTo: true,
  billNumber: true,
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
} satisfies Prisma.ExpenseSelect;

export async function createCompanyExpense(companyId: string, input: CreateCompanyExpenseInput) {
  await assertExpenseRelationsBelongToCompany(companyId, input.tripId, input.vehicleId, input.driverId);

  return prisma.expense.create({
    data: {
      companyId,
      tripId: input.tripId,
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      expenseDate: input.expenseDate,
      expenseType: input.expenseType,
      amount: input.amount,
      paymentMode: input.paymentMode,
      paidTo: input.paidTo,
      billNumber: input.billNumber,
      notes: input.notes,
      receiptImageUrl: input.receiptImageUrl
    },
    select: expenseSelect
  });
}

export async function listCompanyExpenses(companyId: string, query: ListCompanyExpensesQuery) {
  const where: Prisma.ExpenseWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.tripId ? { tripId: query.tripId } : {}),
    ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
    ...(query.driverId ? { driverId: query.driverId } : {}),
    ...(query.expenseType ? { expenseType: query.expenseType } : {}),
    ...(query.fromDate || query.toDate
      ? {
          expenseDate: {
            ...(query.fromDate ? { gte: query.fromDate } : {}),
            ...(query.toDate ? { lte: query.toDate } : {})
          }
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { paidTo: { contains: query.search, mode: "insensitive" } },
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
    prisma.expense.findMany({
      where,
      select: expenseSelect,
      orderBy: { expenseDate: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.expense.count({ where }),
    getExpenseSummary(companyId)
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

export async function getCompanyExpenseById(companyId: string, id: string) {
  const expense = await prisma.expense.findFirst({
    where: { id, companyId, deletedAt: null },
    select: expenseSelect
  });

  if (!expense) {
    throw new AppError("Expense not found", 404, "EXPENSE_NOT_FOUND");
  }

  return expense;
}

export async function updateCompanyExpense(companyId: string, id: string, input: UpdateCompanyExpenseInput) {
  const existing = await getCompanyExpenseById(companyId, id);

  await assertExpenseRelationsBelongToCompany(
    companyId,
    input.tripId ?? existing.tripId ?? undefined,
    input.vehicleId ?? existing.vehicleId ?? undefined,
    input.driverId ?? existing.driverId ?? undefined
  );

  return prisma.expense.update({
    where: { id },
    data: input,
    select: expenseSelect
  });
}

export async function deleteCompanyExpense(companyId: string, id: string) {
  await getCompanyExpenseById(companyId, id);

  return prisma.expense.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: expenseSelect
  });
}

async function assertExpenseRelationsBelongToCompany(companyId: string, tripId?: string, vehicleId?: string, driverId?: string) {
  const [trip, vehicle, driver] = await Promise.all([
    tripId ? prisma.trip.findFirst({ where: { id: tripId, companyId, deletedAt: null }, select: { id: true } }) : null,
    vehicleId ? prisma.vehicle.findFirst({ where: { id: vehicleId, companyId, deletedAt: null }, select: { id: true } }) : null,
    driverId ? prisma.driverProfile.findFirst({ where: { id: driverId, companyId, deletedAt: null }, select: { id: true } }) : null
  ]);

  if (tripId && !trip) {
    throw new AppError("Trip not found for this company", 404, "TRIP_NOT_FOUND");
  }

  if (vehicleId && !vehicle) {
    throw new AppError("Vehicle not found for this company", 404, "VEHICLE_NOT_FOUND");
  }

  if (driverId && !driver) {
    throw new AppError("Driver not found for this company", 404, "DRIVER_NOT_FOUND");
  }
}

async function getExpenseSummary(companyId: string) {
  const [totalExpenses, tripExpenses, vehicleExpenses, companyExpenses] = await Promise.all([
    prisma.expense.aggregate({
      where: { companyId, deletedAt: null },
      _sum: { amount: true }
    }),
    prisma.expense.aggregate({
      where: { companyId, deletedAt: null, tripId: { not: null } },
      _sum: { amount: true }
    }),
    prisma.expense.aggregate({
      where: { companyId, deletedAt: null, tripId: null, vehicleId: { not: null } },
      _sum: { amount: true }
    }),
    prisma.expense.aggregate({
      where: { companyId, deletedAt: null, tripId: null, vehicleId: null },
      _sum: { amount: true }
    })
  ]);

  return {
    totalExpenseAmount: totalExpenses._sum.amount ?? 0,
    tripExpenses: tripExpenses._sum.amount ?? 0,
    vehicleExpenses: vehicleExpenses._sum.amount ?? 0,
    companyExpenses: companyExpenses._sum.amount ?? 0
  };
}
