import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";

const databaseUrl = requiredEnv("DATABASE_URL");
const superAdminEmail = requiredEnv("SUPER_ADMIN_EMAIL").toLowerCase().trim();
const superAdminPassword = requiredEnv("SUPER_ADMIN_PASSWORD");
const superAdminName = process.env.SUPER_ADMIN_NAME || "SinSoftware Super Admin";
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

if (superAdminPassword === "change-this-before-seeding") {
  throw new Error("Set a secure SUPER_ADMIN_PASSWORD before running the seed.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(superAdminPassword, saltRounds);

  const user = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      name: superAdminName,
      passwordHash,
      role: "SUPER_ADMIN",
      companyId: null,
      isActive: true
    },
    create: {
      name: superAdminName,
      email: superAdminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      companyId: null,
      isActive: true
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });

  console.log(`Seeded ${user.role}: ${user.email} (${user.name})`);
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for seeding.`);
  }

  return value;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
