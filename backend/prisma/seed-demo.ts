import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import "dotenv/config";
import { Prisma, PrismaClient } from "../src/generated/prisma/client.js";

const DEMO_COMPANY_CODE = "SHARMA_ROADLINES_DEMO";
const DEMO_COMPANY_ADMIN_EMAIL = "admin@sharmaroadlines.demo";
const DEFAULT_SUPER_ADMIN_EMAIL = "superadmin@sinfleet.demo";

const databaseUrl = requiredEnv("DATABASE_URL");
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const demoReset = process.env.DEMO_RESET === "true";
const superAdminEmail = (process.env.DEMO_SUPER_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || DEFAULT_SUPER_ADMIN_EMAIL).toLowerCase().trim();
const superAdminPassword = process.env.DEMO_SUPER_ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || temporaryPassword();
const companyAdminPassword = process.env.DEMO_COMPANY_ADMIN_PASSWORD || temporaryPassword();

const adapter = new PrismaPg({
  connectionString: databaseUrl
});

const prisma = new PrismaClient({ adapter });

const today = new Date("2026-05-16T00:00:00.000Z");

async function main() {
  if (demoReset) {
    await resetDemoCompany();
  }

  const superAdmin = await seedSuperAdmin();
  const company = await seedCompany();
  const companyAdmin = await seedCompanyAdmin(company.id);
  await seedSubscription(company.id);
  const vehicles = await seedVehicles(company.id);
  const drivers = await seedDrivers(company.id);
  const clients = await seedClients(company.id);
  const trips = await seedTrips(company.id, vehicles, drivers, clients);
  await seedDiesel(company.id, trips);
  await seedExpenses(company.id, trips);
  await seedPayments(company.id, trips);
  await syncFleetStatuses(company.id);

  console.log("");
  console.log("Demo seed complete.");
  console.log(`Super Admin: ${superAdmin.email}`);
  console.log(`Company: Sharma Roadlines Demo (${DEMO_COMPANY_CODE})`);
  console.log(`Company Admin: ${companyAdmin.email}`);
  console.log(`Company Admin Password: ${process.env.DEMO_COMPANY_ADMIN_PASSWORD ? "[from DEMO_COMPANY_ADMIN_PASSWORD]" : companyAdminPassword}`);
  console.log(`Super Admin Password: ${process.env.DEMO_SUPER_ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD ? "[from env]" : superAdminPassword}`);
  console.log("Set DEMO_RESET=true only when you want to remove and recreate this demo tenant.");
}

async function resetDemoCompany() {
  const company = await prisma.company.findUnique({
    where: { companyCode: DEMO_COMPANY_CODE },
    select: { id: true, companyName: true }
  });

  if (!company) {
    return;
  }

  await prisma.company.delete({
    where: { id: company.id }
  });

  console.log(`Reset demo company: ${company.companyName}`);
}

async function seedSuperAdmin() {
  const passwordHash = await bcrypt.hash(superAdminPassword, saltRounds);

  return prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      name: "SinFleet Demo Super Admin",
      passwordHash,
      role: "SUPER_ADMIN",
      companyId: null,
      isActive: true
    },
    create: {
      name: "SinFleet Demo Super Admin",
      email: superAdminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      companyId: null,
      isActive: true
    },
    select: {
      email: true
    }
  });
}

async function seedCompany() {
  const startsAt = daysFromToday(-20);
  const endsAt = daysFromToday(345);

  return prisma.company.upsert({
    where: { companyCode: DEMO_COMPANY_CODE },
    update: {
      companyName: "Sharma Roadlines Demo",
      ownerName: "Rajesh Sharma",
      ownerPhone: "9811004501",
      ownerEmail: "rajesh.sharma@sharmaroadlines.demo",
      city: "Greater Noida",
      state: "Uttar Pradesh",
      address: "Transport Nagar, Greater Noida, Uttar Pradesh",
      gstNumber: "09AARCS2026D1ZD",
      planName: "Demo Premium",
      maxVehicles: 25,
      maxUsers: 15,
      subscriptionStartDate: startsAt,
      subscriptionEndDate: endsAt,
      legalName: "Sharma Roadlines Demo Private Limited",
      email: "office@sharmaroadlines.demo",
      phone: "9811004501",
      status: "ACTIVE"
    },
    create: {
      companyName: "Sharma Roadlines Demo",
      companyCode: DEMO_COMPANY_CODE,
      ownerName: "Rajesh Sharma",
      ownerPhone: "9811004501",
      ownerEmail: "rajesh.sharma@sharmaroadlines.demo",
      city: "Greater Noida",
      state: "Uttar Pradesh",
      address: "Transport Nagar, Greater Noida, Uttar Pradesh",
      gstNumber: "09AARCS2026D1ZD",
      planName: "Demo Premium",
      maxVehicles: 25,
      maxUsers: 15,
      subscriptionStartDate: startsAt,
      subscriptionEndDate: endsAt,
      legalName: "Sharma Roadlines Demo Private Limited",
      email: "office@sharmaroadlines.demo",
      phone: "9811004501",
      status: "ACTIVE"
    }
  });
}

async function seedCompanyAdmin(companyId: string) {
  const passwordHash = await bcrypt.hash(companyAdminPassword, saltRounds);

  return prisma.user.upsert({
    where: { email: DEMO_COMPANY_ADMIN_EMAIL },
    update: {
      companyId,
      name: "Rajesh Sharma",
      phone: "9811004501",
      passwordHash,
      role: "COMPANY_ADMIN",
      isActive: true
    },
    create: {
      companyId,
      name: "Rajesh Sharma",
      email: DEMO_COMPANY_ADMIN_EMAIL,
      phone: "9811004501",
      passwordHash,
      role: "COMPANY_ADMIN",
      isActive: true
    },
    select: {
      email: true
    }
  });
}

async function seedSubscription(companyId: string) {
  const existing = await prisma.subscription.findFirst({
    where: { companyId, planName: "Demo Premium", isActive: true }
  });

  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: {
        vehicleLimit: 25,
        userLimit: 15,
        startsAt: daysFromToday(-20),
        endsAt: daysFromToday(345)
      }
    });
  }

  return prisma.subscription.create({
    data: {
      companyId,
      planName: "Demo Premium",
      vehicleLimit: 25,
      userLimit: 15,
      startsAt: daysFromToday(-20),
      endsAt: daysFromToday(345),
      isActive: true
    }
  });
}

async function seedVehicles(companyId: string) {
  const vehicles = [
    ["UP16HT4581", "TRUCK_12_WHEEL", "Tata", "Signa 4825.TK", 2021, "OWNED", 28, "IDLE", 24],
    ["UP16JT7720", "TRUCK_10_WHEEL", "Ashok Leyland", "2820 Tipper", 2020, "OWNED", 18, "ON_TRIP", 320],
    ["HR55AG9102", "TRAILER", "BharatBenz", "5528T", 2022, "ATTACHED", 35, "ON_TRIP", 18],
    ["DL01GC2245", "TRUCK_14_WHEEL", "Tata", "LPT 4225", 2019, "OWNED", 30, "MAINTENANCE", 210],
    ["UP14FT6671", "TRUCK_12_WHEEL", "Eicher", "Pro 6028", 2021, "RENTED", 25, "IDLE", 45],
    ["HR38AB5402", "SIGNATURE_SIGNA", "Tata", "Signa 5530.S", 2023, "OWNED", 40, "ON_TRIP", 400],
    ["UP16KT3009", "TRUCK_10_WHEEL", "Mahindra", "Blazo X 28", 2020, "OWNED", 18, "ACTIVE", 12],
    ["DL01MA7716", "TRAILER", "Ashok Leyland", "AVTR 5525", 2022, "ATTACHED", 38, "IDLE", 95],
    ["UP80DT1904", "TRUCK_12_WHEEL", "BharatBenz", "3523R", 2018, "OWNED", 24, "ACTIVE", 160],
    ["HR55AL8230", "TRUCK_14_WHEEL", "Tata", "Prima 4625.S", 2023, "OWNED", 32, "IDLE", 28]
  ] as const;

  return Promise.all(
    vehicles.map(([vehicleNumber, vehicleType, make, model, manufacturingYear, ownershipType, capacityTon, status, expiryDays], index) =>
      prisma.vehicle.upsert({
        where: { companyId_vehicleNumber: { companyId, vehicleNumber } },
        update: {
          vehicleType,
          make,
          model,
          manufacturingYear,
          fuelType: "DIESEL",
          ownershipType,
          capacityTon,
          status,
          rcNumber: `RC-${vehicleNumber}`,
          insuranceExpiryDate: daysFromToday(expiryDays),
          fitnessExpiryDate: daysFromToday(expiryDays + 45),
          permitExpiryDate: daysFromToday(index % 3 === 0 ? 20 : 180),
          pollutionExpiryDate: daysFromToday(index % 4 === 0 ? 10 : 90),
          gpsDeviceId: `GPS-SRD-${String(index + 1).padStart(3, "0")}`,
          notes: "Demo vehicle for seeded QA walkthrough.",
          deletedAt: null
        },
        create: {
          companyId,
          vehicleNumber,
          vehicleType,
          make,
          model,
          manufacturingYear,
          fuelType: "DIESEL",
          ownershipType,
          capacityTon,
          status,
          rcNumber: `RC-${vehicleNumber}`,
          insuranceExpiryDate: daysFromToday(expiryDays),
          fitnessExpiryDate: daysFromToday(expiryDays + 45),
          permitExpiryDate: daysFromToday(index % 3 === 0 ? 20 : 180),
          pollutionExpiryDate: daysFromToday(index % 4 === 0 ? 10 : 90),
          gpsDeviceId: `GPS-SRD-${String(index + 1).padStart(3, "0")}`,
          notes: "Demo vehicle for seeded QA walkthrough."
        }
      })
    )
  );
}

async function seedDrivers(companyId: string) {
  const drivers = [
    ["Mahesh Yadav", "9871001201", "UPDL20264581", "FIXED", 28000, "ON_TRIP", 24],
    ["Imran Khan", "9871001202", "HRDL20267720", "PER_TRIP", 1800, "ACTIVE", 360],
    ["Suresh Pal", "9871001203", "DLDL20269102", "COMMISSION", 4, "ON_TRIP", 18],
    ["Amit Chauhan", "9871001204", "UPDL20262245", "FIXED", 30000, "INACTIVE", 210],
    ["Naresh Gurjar", "9871001205", "UPDL20266671", "PER_TRIP", 2000, "ACTIVE", 32],
    ["Rafiq Ansari", "9871001206", "HRDL20265402", "FIXED", 32000, "ON_TRIP", 400],
    ["Deepak Sharma", "9871001207", "UPDL20263009", "NONE", 0, "ACTIVE", 12],
    ["Vikas Tyagi", "9871001208", "DLDL20267716", "PER_TRIP", 2200, "ACTIVE", 95],
    ["Pawan Kumar", "9871001209", "UPDL20261904", "FIXED", 27000, "ACTIVE", 26]
  ] as const;

  return Promise.all(
    drivers.map(([name, phone, licenseNumber, salaryType, salaryAmount, status, expiryDays], index) =>
      prisma.driverProfile.upsert({
        where: { companyId_phone: { companyId, phone } },
        update: {
          name,
          alternatePhone: `98120012${String(index).padStart(2, "0")}`,
          licenseNumber,
          licenseExpiryDate: daysFromToday(expiryDays),
          aadhaarNumber: `XXXX-XXXX-${4500 + index}`,
          address: `${index + 10}, Transport Colony, Greater Noida`,
          joiningDate: daysFromToday(-700 + index * 30),
          salaryType,
          salaryAmount: salaryAmount || null,
          status,
          notes: "Demo driver for QA walkthrough.",
          deletedAt: null
        },
        create: {
          companyId,
          name,
          phone,
          alternatePhone: `98120012${String(index).padStart(2, "0")}`,
          licenseNumber,
          licenseExpiryDate: daysFromToday(expiryDays),
          aadhaarNumber: `XXXX-XXXX-${4500 + index}`,
          address: `${index + 10}, Transport Colony, Greater Noida`,
          joiningDate: daysFromToday(-700 + index * 30),
          salaryType,
          salaryAmount: salaryAmount || null,
          status,
          notes: "Demo driver for QA walkthrough."
        }
      })
    )
  );
}

async function seedClients(companyId: string) {
  const clients = [
    ["Noida Cement Works", "Vivek Bansal", "9813105001", "09AACCN2026D1Z1", "Greater Noida", "Uttar Pradesh", "15 days"],
    ["Rajdhani Steel Traders", "Ankit Jain", "9813105002", "07AACCR2026D1Z2", "Delhi", "Delhi", "30 days"],
    ["Yamuna Infra Projects", "Nitin Tyagi", "9813105003", "09AACCY2026D1Z3", "Ghaziabad", "Uttar Pradesh", "20 days"],
    ["Pink City Construction", "Manish Saini", "9813105004", "08AACCP2026D1Z4", "Jaipur", "Rajasthan", "15 days"],
    ["Kanpur Hardware Mart", "Sanjay Agarwal", "9813105005", "09AACCK2026D1Z5", "Kanpur", "Uttar Pradesh", "30 days"],
    ["Lucknow Metro Suppliers", "Farhan Ali", "9813105006", "09AACCL2026D1Z6", "Lucknow", "Uttar Pradesh", "10 days"]
  ] as const;

  return Promise.all(
    clients.map(([clientName, contactPerson, phone, gstNumber, city, state, paymentTerms]) =>
      prisma.client.upsert({
        where: { companyId_phone: { companyId, phone } },
        update: {
          clientName,
          contactPerson,
          gstNumber,
          billingAddress: `${city} industrial area`,
          city,
          state,
          paymentTerms,
          status: "ACTIVE",
          notes: "Demo client account.",
          deletedAt: null
        },
        create: {
          companyId,
          clientName,
          contactPerson,
          phone,
          email: `${clientName.toLowerCase().replaceAll(" ", ".")}@example.demo`,
          gstNumber,
          billingAddress: `${city} industrial area`,
          city,
          state,
          paymentTerms,
          status: "ACTIVE",
          notes: "Demo client account."
        }
      })
    )
  );
}

async function seedTrips(companyId: string, vehicles: VehicleRecord[], drivers: DriverRecord[], clients: ClientRecord[]) {
  const routes = [
    ["Greater Noida", "Jaipur", "Cement Bags", 28, 76000, 15000, "IN_TRANSIT"],
    ["Delhi", "Lucknow", "Steel Coils", 24, 92000, 20000, "DELIVERED"],
    ["Ghaziabad", "Kanpur", "Construction Steel", 22, 88000, 10000, "BILLED"],
    ["Greater Noida", "Agra", "Ready Mix Material", 18, 42000, 10000, "PAID"],
    ["Noida", "Gurugram", "Tiles", 14, 36000, 5000, "BOOKED"],
    ["Faridabad", "Bareilly", "Cement Bags", 26, 68000, 12000, "LOADING"],
    ["Greater Noida", "Chandigarh", "Machinery Parts", 16, 74000, 15000, "DELIVERED"],
    ["Delhi", "Dehradun", "Iron Rods", 18, 54000, 8000, "CANCELLED"],
    ["Ghaziabad", "Meerut", "Bricks", 20, 28000, 5000, "PAID"],
    ["Greater Noida", "Lucknow", "Steel Sheets", 25, 98000, 25000, "IN_TRANSIT"],
    ["Delhi", "Jaipur", "Sanitary Ware", 15, 52000, 8000, "BILLED"],
    ["Noida", "Kanpur", "Hardware Goods", 20, 79000, 15000, "DELIVERED"],
    ["Ghaziabad", "Aligarh", "Cement Bags", 22, 34000, 5000, "PAID"],
    ["Greater Noida", "Hisar", "Construction Equipment", 12, 61000, 12000, "BOOKED"],
    ["Delhi", "Varanasi", "Steel Pipes", 23, 112000, 30000, "BILLED"],
    ["Noida", "Mathura", "Tiles", 13, 38000, 6000, "DELIVERED"],
    ["Ghaziabad", "Jaipur", "Cement Bags", 27, 84000, 15000, "IN_TRANSIT"],
    ["Greater Noida", "Panipat", "Industrial Tools", 16, 57000, 10000, "DELIVERED"],
    ["Delhi", "Ayodhya", "Steel Structure", 24, 105000, 25000, "BILLED"],
    ["Noida", "Moradabad", "Ceramic Goods", 17, 46000, 6000, "PAID"]
  ] as const;

  const seeded: TripRecord[] = [];

  for (const [index, route] of routes.entries()) {
    const [sourceLocation, destinationLocation, materialName, quantity, freightAmount, advanceAmount, status] = route;
    const paymentAmount = suggestedPayment(Number(freightAmount), Number(advanceAmount), status);
    const receivedAmount = Number(advanceAmount) + paymentAmount;
    const balanceAmount = Math.max(Number(freightAmount) - receivedAmount, 0);
    const loadingDate = daysFromToday(-28 + index * 2);
    const tripNumber = `DEMO-${String(index + 1).padStart(4, "0")}`;

    const trip = await prisma.trip.upsert({
      where: { companyId_tripNumber: { companyId, tripNumber } },
      update: {
        vehicleId: vehicles[index % vehicles.length].id,
        driverId: drivers[index % drivers.length].id,
        clientId: clients[index % clients.length].id,
        sourceLocation,
        destinationLocation,
        loadingDate,
        unloadingDate: ["DELIVERED", "BILLED", "PAID"].includes(status) ? daysFromToday(-26 + index * 2) : null,
        materialName,
        quantity,
        quantityUnit: "TON",
        freightAmount,
        advanceAmount,
        receivedAmount,
        balanceAmount,
        rateType: "FIXED",
        distanceKm: 120 + index * 34,
        status,
        notes: "Demo trip with realistic North India transport route.",
        deletedAt: null
      },
      create: {
        companyId,
        tripNumber,
        vehicleId: vehicles[index % vehicles.length].id,
        driverId: drivers[index % drivers.length].id,
        clientId: clients[index % clients.length].id,
        sourceLocation,
        destinationLocation,
        loadingDate,
        unloadingDate: ["DELIVERED", "BILLED", "PAID"].includes(status) ? daysFromToday(-26 + index * 2) : null,
        materialName,
        quantity,
        quantityUnit: "TON",
        freightAmount,
        advanceAmount,
        receivedAmount,
        balanceAmount,
        rateType: "FIXED",
        distanceKm: 120 + index * 34,
        status,
        notes: "Demo trip with realistic North India transport route."
      }
    });

    seeded.push(trip);
  }

  return seeded;
}

async function seedDiesel(companyId: string, trips: TripRecord[]) {
  for (const [index, trip] of trips.entries()) {
    const liters = 95 + (index % 5) * 18;
    const ratePerLiter = 89 + (index % 4);
    await createDieselIfMissing({
      companyId,
      tripId: trip.id,
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      dieselDate: daysFromToday(-27 + index * 2),
      fuelStationName: ["IndianOil Greater Noida", "HP Highway Pump", "Bharat Petroleum Jaipur Road", "Reliance Fuel Ghaziabad"][index % 4],
      liters,
      ratePerLiter,
      totalAmount: liters * ratePerLiter,
      paymentMode: index % 3 === 0 ? "UPI" : "CASH",
      billNumber: `SRD-DIESEL-${String(index + 1).padStart(4, "0")}`,
      odometerReading: 55000 + index * 780,
      notes: "Demo diesel bill."
    });
  }
}

async function seedExpenses(companyId: string, trips: TripRecord[]) {
  const expenseTypes = ["TOLL", "LOADING", "UNLOADING", "REPAIR", "PARKING", "HELPER", "MAINTENANCE"] as const;

  for (const [index, trip] of trips.entries()) {
    await createExpenseIfMissing({
      companyId,
      tripId: trip.id,
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      expenseDate: daysFromToday(-27 + index * 2),
      expenseType: expenseTypes[index % expenseTypes.length],
      amount: 1200 + (index % 6) * 700,
      paymentMode: index % 2 === 0 ? "CASH" : "UPI",
      paidTo: ["Toll Plaza", "Loading Labour", "Unloading Labour", "Highway Repair Shop", "Parking Yard"][index % 5],
      billNumber: `SRD-EXP-${String(index + 1).padStart(4, "0")}`,
      notes: "Demo trip expense."
    });
  }
}

async function seedPayments(companyId: string, trips: TripRecord[]) {
  for (const trip of trips) {
    const paymentAmount = Number(trip.receivedAmount) - Number(trip.advanceAmount);

    if (paymentAmount <= 0) {
      continue;
    }

    await createPaymentIfMissing({
      companyId,
      clientId: trip.clientId,
      tripId: trip.id,
      paymentDate: daysFromToday(-8),
      amount: paymentAmount,
      paymentMode: Number(trip.balanceAmount) === 0 ? "BANK_TRANSFER" : "UPI",
      referenceNumber: `SRD-PAY-${trip.tripNumber}`,
      notes: "Demo trip payment."
    });
  }
}

async function createDieselIfMissing(data: Prisma.DieselUncheckedCreateInput) {
  const existing = await prisma.diesel.findFirst({
    where: { companyId: data.companyId, billNumber: data.billNumber }
  });

  if (existing) {
    return prisma.diesel.update({ where: { id: existing.id }, data });
  }

  return prisma.diesel.create({ data });
}

async function createExpenseIfMissing(data: Prisma.ExpenseUncheckedCreateInput) {
  const existing = await prisma.expense.findFirst({
    where: { companyId: data.companyId, billNumber: data.billNumber }
  });

  if (existing) {
    return prisma.expense.update({ where: { id: existing.id }, data });
  }

  return prisma.expense.create({ data });
}

async function createPaymentIfMissing(data: Prisma.PaymentUncheckedCreateInput) {
  const existing = await prisma.payment.findFirst({
    where: { companyId: data.companyId, referenceNumber: data.referenceNumber }
  });

  if (existing) {
    return prisma.payment.update({ where: { id: existing.id }, data });
  }

  return prisma.payment.create({ data });
}

async function syncFleetStatuses(companyId: string) {
  const runningTrips = await prisma.trip.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: { in: ["BOOKED", "LOADING", "IN_TRANSIT"] }
    },
    select: {
      vehicleId: true,
      driverId: true
    }
  });

  await prisma.vehicle.updateMany({
    where: { companyId, deletedAt: null },
    data: { status: "IDLE" }
  });
  await prisma.driverProfile.updateMany({
    where: { companyId, deletedAt: null },
    data: { status: "ACTIVE" }
  });
  await prisma.vehicle.updateMany({
    where: { id: { in: runningTrips.map((trip) => trip.vehicleId) } },
    data: { status: "ON_TRIP" }
  });
  await prisma.driverProfile.updateMany({
    where: { id: { in: runningTrips.map((trip) => trip.driverId) } },
    data: { status: "ON_TRIP" }
  });
  await prisma.vehicle.updateMany({
    where: { companyId, vehicleNumber: "DL01GC2245" },
    data: { status: "MAINTENANCE" }
  });
}

function suggestedPayment(freightAmount: number, advanceAmount: number, status: string) {
  if (status === "PAID") {
    return freightAmount - advanceAmount;
  }

  if (status === "BILLED") {
    return Math.round((freightAmount - advanceAmount) * 0.35);
  }

  if (status === "DELIVERED") {
    return Math.round((freightAmount - advanceAmount) * 0.45);
  }

  return 0;
}

function daysFromToday(days: number) {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function temporaryPassword() {
  return `Demo-${randomBytes(9).toString("base64url")}1!`;
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for demo seeding.`);
  }

  return value;
}

type VehicleRecord = Awaited<ReturnType<typeof seedVehicles>>[number];
type DriverRecord = Awaited<ReturnType<typeof seedDrivers>>[number];
type ClientRecord = Awaited<ReturnType<typeof seedClients>>[number];
type TripRecord = Awaited<ReturnType<typeof prisma.trip.upsert>>;

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
