"use client";

import { AlertTriangle, Edit, Search, Trash2, UsersRound } from "lucide-react";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CompanyShell } from "@/components/company/company-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/premium/data-table";
import {
  type CompanyDriver,
  type DriverPayload,
  type DriverStatus,
  type SalaryType,
  createCompanyDriver,
  deleteCompanyDriver,
  fetchCompanyDrivers,
  updateCompanyDriver,
  updateCompanyDriverStatus
} from "@/lib/company-directory-api";
import { companyLabels } from "@/lib/company-labels";

const labels = companyLabels.en;
const statuses: Array<DriverStatus | "ALL"> = ["ALL", "ACTIVE", "ON_TRIP", "INACTIVE", "BLACKLISTED"];
const salaryTypes: SalaryType[] = ["NONE", "FIXED", "PER_TRIP", "COMMISSION"];

function blankDriverForm(): DriverPayload {
  const today = new Date();
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  return {
    name: "",
    phone: "",
    alternatePhone: "",
    licenseNumber: "",
    licenseExpiryDate: toDateInput(nextYear),
    aadhaarNumber: "",
    address: "",
    joiningDate: toDateInput(today),
    salaryType: "NONE",
    salaryAmount: undefined,
    status: "ACTIVE",
    notes: ""
  };
}

export default function CompanyDriversPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<DriverStatus | "ALL">("ALL");
  const [form, setForm] = React.useState<DriverPayload>(() => blankDriverForm());
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");

  const driversQuery = useQuery({
    queryKey: ["company-drivers", search, status],
    queryFn: () => fetchCompanyDrivers({ search, status, limit: 50 })
  });

  const createMutation = useMutation({
    mutationFn: createCompanyDriver,
    onSuccess: async () => {
      setForm(blankDriverForm());
      setMessage("Driver added.");
      await queryClient.invalidateQueries({ queryKey: ["company-drivers"] });
    },
    onError: () => setMessage("Driver could not be added. Check phone and license number.")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DriverPayload }) => updateCompanyDriver(id, payload),
    onSuccess: async () => {
      setEditingId(null);
      setForm(blankDriverForm());
      setMessage("Driver updated.");
      await queryClient.invalidateQueries({ queryKey: ["company-drivers"] });
    },
    onError: () => setMessage("Driver could not be updated.")
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: DriverStatus }) => updateCompanyDriverStatus(id, nextStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company-drivers"] })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyDriver,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company-drivers"] })
  });

  const drivers = driversQuery.data?.items ?? [];
  const summary = driversQuery.data?.summary;

  function updateForm<K extends keyof DriverPayload>(key: K, value: DriverPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const payload = {
      ...form,
      salaryAmount: form.salaryAmount || undefined
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }

    createMutation.mutate(payload);
  }

  function startEdit(driver: CompanyDriver) {
    setEditingId(driver.id);
    setMessage("");
    setForm({
      name: driver.name,
      phone: driver.phone,
      alternatePhone: driver.alternatePhone ?? "",
      licenseNumber: driver.licenseNumber,
      licenseExpiryDate: toDateInput(driver.licenseExpiryDate),
      aadhaarNumber: driver.aadhaarNumber ?? "",
      address: driver.address ?? "",
      joiningDate: toDateInput(driver.joiningDate),
      salaryType: driver.salaryType,
      salaryAmount: driver.salaryAmount ? Number(driver.salaryAmount) : undefined,
      status: driver.status,
      notes: driver.notes ?? ""
    });
  }

  return (
    <CompanyShell>
      <section className="responsive-page">
        <Header title={labels.drivers} />
        <div className="responsive-summary-grid">
          <SummaryCard label="Total Drivers" value={summary?.totalDrivers ?? 0} />
          <SummaryCard label="Active" value={summary?.activeDrivers ?? 0} />
          <SummaryCard label="On Trip" value={summary?.onTripDrivers ?? 0} />
          <SummaryCard label="Inactive" value={summary?.inactiveDrivers ?? 0} />
          <SummaryCard label="License Alerts" value={summary?.expiringLicenses ?? 0} />
        </div>

        <div className="responsive-workspace-grid">
          <div className="grid gap-4">
            <Card>
              <CardContent className="grid gap-3 pt-5 md:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_180px]">
                <SearchInput value={search} onChange={setSearch} placeholder={labels.searchDrivers} />
                <StatusFilter value={status} onChange={(value) => setStatus(value as DriverStatus | "ALL")} options={statuses} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Driver List</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {drivers.map((driver) => (
                  <div key={driver.id} className="grid gap-3 premium-record rounded-2xl p-4 md:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <p className="text-lg font-semibold">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">{driver.phone}</p>
                      </div>
                      <div>
                        <p className="font-medium">{driver.licenseNumber}</p>
                        <LicenseAlert date={driver.licenseExpiryDate} />
                      </div>
                      <div>
                        <StatusBadge status={driver.status} />
                        <p className="mt-2 text-xs text-muted-foreground">{pretty(driver.salaryType)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button variant="secondary" size="icon" aria-label="Edit driver" onClick={() => startEdit(driver)}>
                        <Edit className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <select
                        className="h-10 rounded-xl border bg-white/90 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                        value={driver.status}
                        onChange={(event) =>
                          statusMutation.mutate({ id: driver.id, nextStatus: event.target.value as DriverStatus })
                        }
                        aria-label="Update driver status"
                      >
                        {statuses
                          .filter((item): item is DriverStatus => item !== "ALL")
                          .map((item) => (
                            <option key={item} value={item}>
                              {pretty(item)}
                            </option>
                          ))}
                      </select>
                      <ConfirmDialog
                        title="Remove driver?"
                        description={`This will soft delete ${driver.name}. Trip history and reports remain available.`}
                        onConfirm={() => deleteMutation.mutate(driver.id)}
                      >
                        <Button variant="ghost" size="icon" aria-label="Remove driver">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </div>
                ))}
                {!drivers.length ? (
                  <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
                    {driversQuery.isLoading ? "Loading drivers" : "No drivers found"}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <UsersRound className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>{editingId ? labels.editDriver : labels.createDriver}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleSubmit}>
                <FormInput label="Name" value={form.name} onChange={(value) => updateForm("name", value)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Phone" value={form.phone} onChange={(value) => updateForm("phone", value)} />
                  <FormInput
                    label="Alternate Phone"
                    value={form.alternatePhone ?? ""}
                    onChange={(value) => updateForm("alternatePhone", value)}
                    required={false}
                  />
                </div>
                <FormInput label="License Number" value={form.licenseNumber} onChange={(value) => updateForm("licenseNumber", value)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput
                    label="License Expiry"
                    value={form.licenseExpiryDate}
                    onChange={(value) => updateForm("licenseExpiryDate", value)}
                    type="date"
                  />
                  <FormInput label="Joining Date" value={form.joiningDate} onChange={(value) => updateForm("joiningDate", value)} type="date" />
                </div>
                <FormInput
                  label="Aadhaar"
                  value={form.aadhaarNumber ?? ""}
                  onChange={(value) => updateForm("aadhaarNumber", value)}
                  required={false}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField label="Salary Type" value={form.salaryType} options={salaryTypes} onChange={(value) => updateForm("salaryType", value as SalaryType)} />
                  <FormInput
                    label="Salary Amount"
                    value={form.salaryAmount ? String(form.salaryAmount) : ""}
                    onChange={(value) => updateForm("salaryAmount", value ? Number(value) : undefined)}
                    type="number"
                    required={false}
                  />
                </div>
                <SelectField
                  label="Status"
                  value={form.status}
                  options={statuses.filter((item): item is DriverStatus => item !== "ALL")}
                  onChange={(value) => updateForm("status", value as DriverStatus)}
                />
                <FormInput label="Address" value={form.address ?? ""} onChange={(value) => updateForm("address", value)} required={false} />
                <TextArea label="Notes" value={form.notes ?? ""} onChange={(value) => updateForm("notes", value)} />
                {message ? <p className="rounded-md border p-3 text-sm text-muted-foreground">{message}</p> : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button className="h-11 text-base" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? "Update Driver" : "Add Driver"}
                  </Button>
                  {editingId ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 text-base"
                      onClick={() => {
                        setEditingId(null);
                        setForm(blankDriverForm());
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </CompanyShell>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{labels.companyPanel}</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{title}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary">English</Button>
        <Button variant="secondary">Hindi Ready</Button>
      </div>
    </div>
  );
}

function LicenseAlert({ date }: { date: string }) {
  const expiring = new Date(date).getTime() <= Date.now() + 30 * 24 * 60 * 60 * 1000;

  if (!expiring) {
    return <p className="text-xs text-muted-foreground">License OK</p>;
  }

  return (
    <p className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      License expiring
    </p>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
      <input
        className="h-11 w-full rounded-xl border bg-white/90 pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-sky-200"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function StatusFilter({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <select
      className="h-11 rounded-xl border bg-white/90 px-3 text-base outline-none focus:ring-2 focus:ring-sky-200"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Status"
    >
      {options.map((item) => (
        <option key={item} value={item}>
          {item === "ALL" ? labels.all : pretty(item)}
        </option>
      ))}
    </select>
  );
}

function StatusBadge({ status }: { status: DriverStatus }) {
  const className =
    status === "ACTIVE"
      ? "border-primary/30 bg-primary/10 text-primary"
      : status === "BLACKLISTED" || status === "INACTIVE"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-accent/30 bg-accent/10 text-foreground";

  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${className}`}>{pretty(status)}</span>;
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

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select
        className="h-10 rounded-xl border bg-white/90 px-3 outline-none focus:ring-2 focus:ring-sky-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {pretty(item)}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <textarea
        className="min-h-20 rounded-xl border bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function pretty(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function toDateInput(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}
