"use client";

import { Building2, Eye, Plus, Search } from "lucide-react";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/premium/data-table";
import {
  type AdminCompany,
  type CompanyStatus,
  type CreateAdminCompanyPayload,
  createAdminCompany,
  fetchAdminCompanies,
  updateAdminCompanyStatus
} from "@/lib/admin-api";
import { adminLabels } from "@/lib/admin-labels";

const labels = adminLabels.en;
const statuses: Array<CompanyStatus | "ALL"> = ["ALL", "TRIAL", "ACTIVE", "SUSPENDED", "EXPIRED"];

const initialForm: CreateAdminCompanyPayload = {
  companyName: "",
  companyCode: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  city: "",
  state: "",
  address: "",
  gstNumber: "",
  planName: "Starter",
  maxVehicles: 10,
  maxUsers: 3,
  subscriptionStartDate: new Date().toISOString().slice(0, 10),
  subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  status: "TRIAL",
  adminUser: {
    name: "",
    email: "",
    phone: "",
    temporaryPassword: ""
  }
};

export default function AdminCompaniesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<CompanyStatus | "ALL">("ALL");
  const [selectedCompany, setSelectedCompany] = React.useState<AdminCompany | null>(null);
  const [form, setForm] = React.useState<CreateAdminCompanyPayload>(initialForm);
  const [formMessage, setFormMessage] = React.useState("");

  const companiesQuery = useQuery({
    queryKey: ["admin-companies", search, status],
    queryFn: () => fetchAdminCompanies({ search, status, limit: 50 })
  });

  const createMutation = useMutation({
    mutationFn: createAdminCompany,
    onSuccess: async (company) => {
      setForm(initialForm);
      setSelectedCompany(company);
      setFormMessage("Company created.");
      await queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
    },
    onError: () => setFormMessage("Company could not be created. Check unique code and emails.")
  });

  const statusMutation = useMutation({
    mutationFn: ({ companyId, nextStatus }: { companyId: string; nextStatus: CompanyStatus }) =>
      updateAdminCompanyStatus(companyId, nextStatus),
    onSuccess: async (company) => {
      setSelectedCompany(company);
      await queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
    }
  });

  const companies = companiesQuery.data?.items ?? [];

  function updateForm<K extends keyof CreateAdminCompanyPayload>(key: K, value: CreateAdminCompanyPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateAdminUser<K extends keyof NonNullable<CreateAdminCompanyPayload["adminUser"]>>(
    key: K,
    value: NonNullable<CreateAdminCompanyPayload["adminUser"]>[K]
  ) {
    setForm((current) => ({
      ...current,
      adminUser: {
        name: current.adminUser?.name ?? "",
        email: current.adminUser?.email ?? "",
        phone: current.adminUser?.phone ?? "",
        temporaryPassword: current.adminUser?.temporaryPassword ?? "",
        [key]: value
      }
    }));
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    const payload: CreateAdminCompanyPayload = {
      ...form,
      companyCode: form.companyCode.toUpperCase(),
      adminUser:
        form.adminUser?.name && form.adminUser.email && form.adminUser.temporaryPassword ? form.adminUser : undefined
    };

    createMutation.mutate(payload);
  }

  return (
    <AdminShell>
      <section className="responsive-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{labels.owner}</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{labels.companies}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary">English</Button>
            <Button variant="secondary">Hindi Ready</Button>
          </div>
        </div>

        <div className="responsive-workspace-grid">
          <div className="grid gap-4">
            <Card>
              <CardContent className="grid gap-3 pt-5 md:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_180px]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    className="h-11 w-full rounded-xl border bg-white/90 pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-sky-200"
                    placeholder={labels.search}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <select
                  className="h-11 rounded-xl border bg-white/90 px-3 text-base outline-none focus:ring-2 focus:ring-sky-200"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as CompanyStatus | "ALL")}
                  aria-label={labels.status}
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item === "ALL" ? labels.all : item}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company List</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveTable minWidth={760}>
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="border-b text-muted-foreground">
                      <tr>
                        <th className="py-3 pr-3 font-medium">Company</th>
                        <th className="py-3 pr-3 font-medium">Owner</th>
                        <th className="py-3 pr-3 font-medium">Plan</th>
                        <th className="py-3 pr-3 font-medium">Usage</th>
                        <th className="py-3 pr-3 font-medium">Status</th>
                        <th className="py-3 pr-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((company) => (
                        <tr key={company.id} className="border-b last:border-0">
                          <td className="py-3 pr-3">
                            <p className="font-medium">{company.companyName}</p>
                            <p className="text-xs text-muted-foreground">{company.companyCode}</p>
                          </td>
                          <td className="py-3 pr-3">
                            <p>{company.ownerName}</p>
                            <p className="text-xs text-muted-foreground">{company.ownerEmail}</p>
                          </td>
                          <td className="py-3 pr-3">{company.planName}</td>
                          <td className="py-3 pr-3">
                            {company._count.vehicles}/{company.maxVehicles} vehicles
                          </td>
                          <td className="py-3 pr-3">
                            <StatusBadge status={company.status} />
                          </td>
                          <td className="py-3 pr-3">
                            <Button variant="secondary" size="icon" aria-label="View company" onClick={() => setSelectedCompany(company)}>
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ResponsiveTable>
                {!companies.length ? (
                  <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
                    {companiesQuery.isLoading ? "Loading companies" : "No companies found"}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {selectedCompany ? (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{labels.companyDetails}</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">{selectedCompany.companyName}</p>
                  </div>
                  <Building2 className="h-6 w-6 text-primary" aria-hidden="true" />
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <Detail label="Owner" value={selectedCompany.ownerName} />
                  <Detail label="Phone" value={selectedCompany.ownerPhone} />
                  <Detail label="Email" value={selectedCompany.ownerEmail} />
                  <Detail label="Location" value={`${selectedCompany.city}, ${selectedCompany.state}`} />
                  <Detail label="Plan" value={`${selectedCompany.planName} (${selectedCompany.maxVehicles} vehicles)`} />
                  <Detail label="Users" value={`${selectedCompany._count.users}/${selectedCompany.maxUsers}`} />
                  <div className="md:col-span-2">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {statuses
                        .filter((item): item is CompanyStatus => item !== "ALL")
                        .map((item) => (
                          <Button
                            key={item}
                            variant={selectedCompany.status === item ? "default" : "secondary"}
                            onClick={() => statusMutation.mutate({ companyId: selectedCompany.id, nextStatus: item })}
                            disabled={statusMutation.isPending}
                          >
                            {item}
                          </Button>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Plus className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>{labels.createCompany}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleCreate}>
                <FormInput label="Company Name" value={form.companyName} onChange={(value) => updateForm("companyName", value)} />
                <FormInput label="Company Code" value={form.companyCode} onChange={(value) => updateForm("companyCode", value)} />
                <FormInput label="Owner Name" value={form.ownerName} onChange={(value) => updateForm("ownerName", value)} />
                <FormInput label="Owner Phone" value={form.ownerPhone} onChange={(value) => updateForm("ownerPhone", value)} />
                <FormInput label="Owner Email" value={form.ownerEmail} onChange={(value) => updateForm("ownerEmail", value)} type="email" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="City" value={form.city} onChange={(value) => updateForm("city", value)} />
                  <FormInput label="State" value={form.state} onChange={(value) => updateForm("state", value)} />
                </div>
                <FormInput label="Address" value={form.address} onChange={(value) => updateForm("address", value)} />
                <FormInput label="GST Number" value={form.gstNumber ?? ""} onChange={(value) => updateForm("gstNumber", value)} required={false} />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <FormInput label="Plan" value={form.planName} onChange={(value) => updateForm("planName", value)} />
                  <FormInput
                    label="Vehicles"
                    value={String(form.maxVehicles)}
                    onChange={(value) => updateForm("maxVehicles", Number(value))}
                    type="number"
                  />
                  <FormInput
                    label="Users"
                    value={String(form.maxUsers)}
                    onChange={(value) => updateForm("maxUsers", Number(value))}
                    type="number"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput
                    label="Start"
                    value={form.subscriptionStartDate}
                    onChange={(value) => updateForm("subscriptionStartDate", value)}
                    type="date"
                  />
                  <FormInput
                    label="End"
                    value={form.subscriptionEndDate}
                    onChange={(value) => updateForm("subscriptionEndDate", value)}
                    type="date"
                  />
                </div>
                <label className="grid gap-1 text-sm font-medium">
                  Status
                  <select
                    className="h-10 rounded-xl border bg-white/90 px-3 outline-none focus:ring-2 focus:ring-sky-200"
                    value={form.status}
                    onChange={(event) => updateForm("status", event.target.value as CompanyStatus)}
                  >
                    {statuses
                      .filter((item): item is CompanyStatus => item !== "ALL")
                      .map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="mt-2 border-t pt-3">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">First Company Admin</p>
                  <FormInput label="Admin Name" value={form.adminUser?.name ?? ""} onChange={(value) => updateAdminUser("name", value)} required={false} />
                  <FormInput
                    label="Admin Email"
                    value={form.adminUser?.email ?? ""}
                    onChange={(value) => updateAdminUser("email", value)}
                    type="email"
                    required={false}
                  />
                  <FormInput
                    label="Admin Phone"
                    value={form.adminUser?.phone ?? ""}
                    onChange={(value) => updateAdminUser("phone", value)}
                    required={false}
                  />
                  <FormInput
                    label="Temporary Password"
                    value={form.adminUser?.temporaryPassword ?? ""}
                    onChange={(value) => updateAdminUser("temporaryPassword", value)}
                    type="password"
                    required={false}
                  />
                </div>
                {formMessage ? <p className="rounded-md border p-3 text-sm text-muted-foreground">{formMessage}</p> : null}
                <Button className="h-11 text-base" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating" : "Create Company"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </AdminShell>
  );
}

function StatusBadge({ status }: { status: CompanyStatus }) {
  const className =
    status === "ACTIVE"
      ? "border-primary/30 bg-primary/10 text-primary"
      : status === "SUSPENDED" || status === "EXPIRED"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-accent/30 bg-accent/10 text-foreground";

  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${className}`}>{status}</span>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = true
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input
        className="h-10 rounded-xl border bg-white/90 px-3 outline-none focus:ring-2 focus:ring-sky-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required={required}
      />
    </label>
  );
}
