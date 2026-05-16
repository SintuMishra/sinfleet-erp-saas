import { prisma } from "../../../config/prisma.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../../services/app-error.js";
import type {
  CreateCompanyPaymentInput,
  ListCompanyPaymentsQuery,
  UpdateCompanyPaymentInput
} from "./company-payments.schemas.js";

const paymentSelect = {
  id: true,
  companyId: true,
  clientId: true,
  tripId: true,
  paymentDate: true,
  amount: true,
  paymentMode: true,
  referenceNumber: true,
  notes: true,
  receiptImageUrl: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: {
      id: true,
      clientName: true,
      phone: true,
      status: true
    }
  },
  trip: {
    select: {
      id: true,
      tripNumber: true,
      sourceLocation: true,
      destinationLocation: true,
      freightAmount: true,
      receivedAmount: true,
      balanceAmount: true,
      status: true
    }
  }
} satisfies Prisma.PaymentSelect;

export async function createCompanyPayment(companyId: string, input: CreateCompanyPaymentInput) {
  await assertPaymentRelationsBelongToCompany(companyId, input.clientId, input.tripId);

  return prisma.$transaction(async (tx) => {
    if (input.tripId) {
      await assertTripPaymentWillNotOverpay(tx, companyId, input.tripId, input.amount);
    }

    const payment = await tx.payment.create({
      data: {
        companyId,
        clientId: input.clientId,
        tripId: input.tripId,
        paymentDate: input.paymentDate,
        amount: input.amount,
        paymentMode: input.paymentMode,
        referenceNumber: input.referenceNumber,
        notes: input.notes,
        receiptImageUrl: input.receiptImageUrl
      },
      select: paymentSelect
    });

    if (input.tripId) {
      await recalculateTripPaymentTotals(tx, companyId, input.tripId);
    }

    return payment;
  });
}

export async function listCompanyPayments(companyId: string, query: ListCompanyPaymentsQuery) {
  const where: Prisma.PaymentWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.clientId ? { clientId: query.clientId } : {}),
    ...(query.tripId ? { tripId: query.tripId } : {}),
    ...(query.paymentMode ? { paymentMode: query.paymentMode } : {}),
    ...(query.fromDate || query.toDate
      ? {
          paymentDate: {
            ...(query.fromDate ? { gte: query.fromDate } : {}),
            ...(query.toDate ? { lte: query.toDate } : {})
          }
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { referenceNumber: { contains: query.search, mode: "insensitive" } },
            { notes: { contains: query.search, mode: "insensitive" } },
            { client: { clientName: { contains: query.search, mode: "insensitive" } } },
            { trip: { tripNumber: { contains: query.search, mode: "insensitive" } } }
          ]
        }
      : {})
  };

  const [items, total, summary] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: paymentSelect,
      orderBy: { paymentDate: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.payment.count({ where }),
    getPaymentSummary(companyId)
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

export async function getCompanyPaymentById(companyId: string, id: string) {
  const payment = await prisma.payment.findFirst({
    where: { id, companyId, deletedAt: null },
    select: paymentSelect
  });

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  return payment;
}

export async function updateCompanyPayment(companyId: string, id: string, input: UpdateCompanyPaymentInput) {
  const existing = await getCompanyPaymentById(companyId, id);
  const clientId = input.clientId ?? existing.clientId;
  const tripId = input.tripId ?? existing.tripId ?? undefined;
  const amount = input.amount ?? Number(existing.amount);

  await assertPaymentRelationsBelongToCompany(companyId, clientId, tripId);

  return prisma.$transaction(async (tx) => {
    if (tripId) {
      await assertTripPaymentWillNotOverpay(tx, companyId, tripId, amount, id);
    }

    const payment = await tx.payment.update({
      where: { id },
      data: input,
      select: paymentSelect
    });

    const tripsToRecalculate = new Set([existing.tripId, tripId].filter(Boolean) as string[]);
    await Promise.all([...tripsToRecalculate].map((paymentTripId) => recalculateTripPaymentTotals(tx, companyId, paymentTripId)));

    return payment;
  });
}

export async function deleteCompanyPayment(companyId: string, id: string) {
  const existing = await getCompanyPaymentById(companyId, id);

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: paymentSelect
    });

    if (existing.tripId) {
      await recalculateTripPaymentTotals(tx, companyId, existing.tripId);
    }

    return payment;
  });
}

async function assertPaymentRelationsBelongToCompany(companyId: string, clientId: string, tripId?: string) {
  const [client, trip] = await Promise.all([
    prisma.client.findFirst({ where: { id: clientId, companyId, deletedAt: null }, select: { id: true } }),
    tripId ? prisma.trip.findFirst({ where: { id: tripId, companyId, deletedAt: null }, select: { id: true, clientId: true } }) : null
  ]);

  if (!client) {
    throw new AppError("Client not found for this company", 404, "CLIENT_NOT_FOUND");
  }

  if (tripId && !trip) {
    throw new AppError("Trip not found for this company", 404, "TRIP_NOT_FOUND");
  }

  if (trip && trip.clientId !== clientId) {
    throw new AppError("Trip belongs to a different client", 400, "TRIP_CLIENT_MISMATCH");
  }
}

async function assertTripPaymentWillNotOverpay(
  tx: Prisma.TransactionClient,
  companyId: string,
  tripId: string,
  amount: number,
  excludePaymentId?: string
) {
  const trip = await tx.trip.findFirst({
    where: { id: tripId, companyId, deletedAt: null },
    select: { freightAmount: true, advanceAmount: true }
  });

  if (!trip) {
    throw new AppError("Trip not found for this company", 404, "TRIP_NOT_FOUND");
  }

  const paymentTotal = await tx.payment.aggregate({
    where: {
      companyId,
      tripId,
      deletedAt: null,
      ...(excludePaymentId ? { id: { not: excludePaymentId } } : {})
    },
    _sum: { amount: true }
  });

  const receivedAmount = Number(trip.advanceAmount) + Number(paymentTotal._sum.amount ?? 0) + amount;

  if (receivedAmount > Number(trip.freightAmount)) {
    throw new AppError("Payment exceeds trip balance", 400, "PAYMENT_EXCEEDS_TRIP_BALANCE");
  }
}

async function recalculateTripPaymentTotals(tx: Prisma.TransactionClient, companyId: string, tripId: string) {
  const trip = await tx.trip.findFirst({
    where: { id: tripId, companyId, deletedAt: null },
    select: { id: true, freightAmount: true, advanceAmount: true }
  });

  if (!trip) {
    return;
  }

  const paymentTotal = await tx.payment.aggregate({
    where: { companyId, tripId, deletedAt: null },
    _sum: { amount: true }
  });

  const receivedAmount = Number(trip.advanceAmount) + Number(paymentTotal._sum.amount ?? 0);

  await tx.trip.update({
    where: { id: tripId },
    data: {
      receivedAmount,
      balanceAmount: Math.max(Number(trip.freightAmount) - receivedAmount, 0)
    }
  });
}

async function getPaymentSummary(companyId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [totalReceived, pendingOutstanding, todayReceived, paymentCount] = await Promise.all([
    prisma.payment.aggregate({
      where: { companyId, deletedAt: null },
      _sum: { amount: true }
    }),
    prisma.trip.aggregate({
      where: { companyId, deletedAt: null, status: { not: "CANCELLED" } },
      _sum: { balanceAmount: true }
    }),
    prisma.payment.aggregate({
      where: {
        companyId,
        deletedAt: null,
        paymentDate: { gte: todayStart, lt: todayEnd }
      },
      _sum: { amount: true }
    }),
    prisma.payment.count({ where: { companyId, deletedAt: null } })
  ]);

  return {
    totalReceived: totalReceived._sum.amount ?? 0,
    pendingOutstanding: pendingOutstanding._sum.balanceAmount ?? 0,
    todayReceived: todayReceived._sum.amount ?? 0,
    paymentCount
  };
}
