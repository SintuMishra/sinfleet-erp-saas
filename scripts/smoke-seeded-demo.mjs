import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
loadEnv(path.join(rootDir, ".env"));
loadEnv(path.join(rootDir, "backend", ".env"));

const apiBaseUrl = (process.env.SMOKE_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || `http://localhost:${process.env.PORT || 5001}/api`).replace(/\/$/, "");
const superAdminEmail = process.env.DEMO_SUPER_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL;
const superAdminPassword = process.env.DEMO_SUPER_ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD;
const companyAdminEmail = process.env.DEMO_COMPANY_ADMIN_EMAIL || "admin@sharmaroadlines.demo";
const companyAdminPassword = process.env.DEMO_COMPANY_ADMIN_PASSWORD;

const checks = [];

async function main() {
  requireValue(superAdminEmail, "DEMO_SUPER_ADMIN_EMAIL or SUPER_ADMIN_EMAIL");
  requireValue(superAdminPassword, "DEMO_SUPER_ADMIN_PASSWORD or SUPER_ADMIN_PASSWORD");
  requireValue(companyAdminPassword, "DEMO_COMPANY_ADMIN_PASSWORD");

  await check("Health API", async () => {
    const response = await request("/health");
    if (!response.ok) throw new Error(`Expected 2xx, got ${response.status}`);
  });

  const superAdmin = await login("Super Admin login", superAdminEmail, superAdminPassword);
  await check("Super Admin /auth/me", () => requestJson("/auth/me", { token: superAdmin.accessToken }));
  await check("Super Admin companies route", () => requestJson("/admin/companies?limit=5", { token: superAdmin.accessToken }));
  await check("Super Admin audit route", () => requestJson("/admin/audit-logs?limit=5", { token: superAdmin.accessToken }));

  const companyAdmin = await login("Company Admin login", companyAdminEmail, companyAdminPassword);
  await check("Company Admin /auth/me", () => requestJson("/auth/me", { token: companyAdmin.accessToken }));
  await check("Company dashboard report", () => requestJson("/company/reports/dashboard", { token: companyAdmin.accessToken }));
  await check("Company vehicles route", () => requestJson("/company/vehicles?limit=5", { token: companyAdmin.accessToken }));
  await check("Company outstanding report", () => requestJson("/company/reports/outstanding", { token: companyAdmin.accessToken }));
  await check("Company audit route", () => requestJson("/company/audit-logs?limit=5", { token: companyAdmin.accessToken }));

  console.log(`\nSeeded demo smoke passed (${checks.length} checks) against ${apiBaseUrl}`);
}

async function login(label, email, password) {
  return check(label, async () => {
    const json = await requestJson("/auth/login", {
      method: "POST",
      body: { email, password }
    });

    if (!json.data?.accessToken) {
      throw new Error("Login response did not include accessToken");
    }

    return json.data;
  });
}

async function check(label, fn) {
  try {
    const result = await fn();
    checks.push(label);
    console.log(`PASS ${label}`);
    return result;
  } catch (error) {
    console.error(`FAIL ${label}`);
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    throw error;
  }
}

async function requestJson(endpoint, options = {}) {
  const response = await request(endpoint, options);
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`${endpoint} returned ${response.status}: ${JSON.stringify(json)}`);
  }

  if (!json?.success) {
    throw new Error(`${endpoint} returned an unexpected response: ${JSON.stringify(json)}`);
  }

  return json;
}

async function request(endpoint, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
  };

  return fetch(`${apiBaseUrl}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
}

function requireValue(value, label) {
  if (!value) {
    throw new Error(`Missing ${label}. Set stable demo passwords before running the smoke test.`);
  }
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

main().catch(() => {
  process.exit(1);
});
