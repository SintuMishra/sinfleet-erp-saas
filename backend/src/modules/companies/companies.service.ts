import { prisma } from "../../config/prisma.js";

export async function listCompanies() {
  return prisma.company.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function createCompany(input: {
  companyName: string;
  companyCode: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  city: string;
  state: string;
  address: string;
  planName: string;
  maxVehicles: number;
  maxUsers: number;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  legalName?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
}) {
  return prisma.company.create({
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
      legalName: input.legalName ?? input.companyName,
      email: input.email ?? input.ownerEmail,
      phone: input.phone ?? input.ownerPhone
    }
  });
}
