"use client";

import { AlertTriangle, Edit, Search, Trash2, Truck } from "lucide-react";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/premium/data-table";
import { CompanyShell } from "@/components/company/company-shell";
import {
  type CompanyVehicle,
  type FuelType,
  type OwnershipType,
  type VehiclePayload,
  type VehicleStatus,
  type VehicleType,
  createCompanyVehicle,
  deleteCompanyVehicle,
  fetchCompanyVehicles,
  updateCompanyVehicle,
  updateCompanyVehicleStatus
} from "@/lib/company-api";
import { companyLabels } from "@/lib/company-labels";

const labels = companyLabels.en;
const vehicleTypes: Array<VehicleType | "ALL"> = [
  "ALL",
  "TRUCK_10_WHEEL",
  "TRUCK_12_WHEEL",
  "TRUCK_14_WHEEL",
  "TRAILER",
  "SIGNATURE_SIGNA",
  "OTHER"
];
const statuses: Array<VehicleStatus | "ALL"> = ["ALL", "ACTIVE", "IDLE", "ON_TRIP", "MAINTENANCE", "INACTIVE"];
const fuelTypes: FuelType[] = ["DIESEL", "CNG", "PETROL", "ELECTRIC", "OTHER"];
const ownershipTypes: OwnershipType[] = ["OWNED", "ATTACHED", "RENTED"];

function createBlankForm(): VehiclePayload {
  const today = new Date();
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  return {
    vehicleNumber: "",
    vehicleType: "TRUCK_10_WHEEL",
    make: "",
    model: "",
    manufacturingYear: today.getFullYear(),
    fuelType: "DIESEL",
    ownershipType: "OWNED",
    capacityTon: 10,
    status: "ACTIVE",
    rcNumber: "",
    insuranceExpiryDate: toDateInput(nextYear),
    fitnessExpiryDate: toDateInput(nextYear),
    permitExpiryDate: toDateInput(nextYear),
    pollutionExpiryDate: toDateInput(nextYear),
    gpsDeviceId: "",
    notes: ""
  };
}

export default function CompanyVehiclesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<VehicleStatus | "ALL">("ALL");
  const [vehicleType, setVehicleType] = React.useState<VehicleType | "ALL">("ALL");
  const [form, setForm] = React.useState<VehiclePayload>(() => createBlankForm());
  const [editingVehicleId, setEditingVehicleId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");

  const vehiclesQuery = useQuery({
    queryKey: ["company-vehicles", search, status, vehicleType],
    queryFn: () => fetchCompanyVehicles({ search, status, vehicleType, limit: 50 })
  });

  const createMutation = useMutation({
    mutationFn: createCompanyVehicle,
    onSuccess: async () => {
      setForm(createBlankForm());
      setMessage("Vehicle added.");
      await queryClient.invalidateQueries({ queryKey: ["company-vehicles"] });
      await queryClient.invalidateQueries({ queryKey: ["company-vehicles-dashboard"] });
    },
    onError: () => setMessage("Vehicle could not be added. Check plan limit and vehicle number.")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VehiclePayload }) => updateCompanyVehicle(id, payload),
    onSuccess: async () => {
      setEditingVehicleId(null);
      setForm(createBlankForm());
      setMessage("Vehicle updated.");
      await queryClient.invalidateQueries({ queryKey: ["company-vehicles"] });
      await queryClient.invalidateQueries({ queryKey: ["company-vehicles-dashboard"] });
    },
    onError: () => setMessage("Vehicle could not be updated.")
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: VehicleStatus }) => updateCompanyVehicleStatus(id, nextStatus),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["company-vehicles"] });
      await queryClient.invalidateQueries({ queryKey: ["company-vehicles-dashboard"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyVehicle,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["company-vehicles"] });
      await queryClient.invalidateQueries({ queryKey: ["company-vehicles-dashboard"] });
    }
  });

  const vehicles = vehiclesQuery.data?.items ?? [];
  const summary = vehiclesQuery.data?.summary;

  function updateForm<K extends keyof VehiclePayload>(key: K, value: VehiclePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (editingVehicleId) {
      updateMutation.mutate({ id: editingVehicleId, payload: form });
      return;
    }

    createMutation.mutate(form);
  }

  function startEdit(vehicle: CompanyVehicle) {
    setEditingVehicleId(vehicle.id);
    setMessage("");
    setForm({
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      make: vehicle.make,
      model: vehicle.model,
      manufacturingYear: vehicle.manufacturingYear,
      fuelType: vehicle.fuelType,
      ownershipType: vehicle.ownershipType,
      capacityTon: Number(vehicle.capacityTon),
      status: vehicle.status,
      rcNumber: vehicle.rcNumber,
      insuranceExpiryDate: toDateInput(vehicle.insuranceExpiryDate),
      fitnessExpiryDate: toDateInput(vehicle.fitnessExpiryDate),
      permitExpiryDate: toDateInput(vehicle.permitExpiryDate),
      pollutionExpiryDate: toDateInput(vehicle.pollutionExpiryDate),
      gpsDeviceId: vehicle.gpsDeviceId ?? "",
      notes: vehicle.notes ?? ""
    });
  }

  function cancelEdit() {
    setEditingVehicleId(null);
    setForm(createBlankForm());
  }

  return (
    <CompanyShell>
      <section className="responsive-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{labels.companyPanel}</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{labels.vehicles}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary">English</Button>
            <Button variant="secondary">Hindi Ready</Button>
          </div>
        </div>

        <div className="responsive-summary-grid">
          <SummaryCard label={labels.totalVehicles} value={summary?.totalVehicles ?? 0} />
          <SummaryCard label={labels.activeVehicles} value={summary?.activeVehicles ?? 0} />
          <SummaryCard label={labels.onTrip} value={summary?.onTripVehicles ?? 0} />
          <SummaryCard label={labels.maintenance} value={summary?.maintenanceVehicles ?? 0} />
          <SummaryCard label={labels.expiringDocuments} value={summary?.expiringDocuments ?? 0} />
        </div>

        <div className="responsive-workspace-grid">
          <div className="grid gap-4">
            <Card>
              <CardContent className="grid gap-3 pt-5 md:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_180px_210px]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    className="h-11 w-full rounded-xl border bg-white/90 pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-sky-200"
                    placeholder={labels.searchVehicles}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <select
                  className="h-11 rounded-xl border bg-white/90 px-3 text-base outline-none focus:ring-2 focus:ring-sky-200"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as VehicleStatus | "ALL")}
                  aria-label={labels.status}
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item === "ALL" ? labels.all : item}
                    </option>
                  ))}
                </select>
                <select
                  className="h-11 rounded-xl border bg-white/90 px-3 text-base outline-none focus:ring-2 focus:ring-sky-200"
                  value={vehicleType}
                  onChange={(event) => setVehicleType(event.target.value as VehicleType | "ALL")}
                  aria-label={labels.vehicleType}
                >
                  {vehicleTypes.map((item) => (
                    <option key={item} value={item}>
                      {item === "ALL" ? labels.all : pretty(item)}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vehicle List</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="grid gap-3 premium-record rounded-2xl p-4 md:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                      <div>
                        <p className="text-lg font-semibold">{vehicle.vehicleNumber}</p>
                        <p className="text-sm text-muted-foreground">{pretty(vehicle.vehicleType)}</p>
                      </div>
                      <div>
                        <p className="font-medium">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-muted-foreground">{vehicle.manufacturingYear}</p>
                      </div>
                      <div>
                        <StatusBadge status={vehicle.status} />
                        <DocumentAlert vehicle={vehicle} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button variant="secondary" size="icon" aria-label="Edit vehicle" onClick={() => startEdit(vehicle)}>
                        <Edit className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <select
                        className="h-10 rounded-xl border bg-white/90 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                        value={vehicle.status}
                        onChange={(event) =>
                          statusMutation.mutate({ id: vehicle.id, nextStatus: event.target.value as VehicleStatus })
                        }
                        aria-label="Update vehicle status"
                      >
                        {statuses
                          .filter((item): item is VehicleStatus => item !== "ALL")
                          .map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                      </select>
                      <ConfirmDialog
                        title="Remove vehicle?"
                        description={`This will soft delete ${vehicle.vehicleNumber}. Existing trips and reports stay available for audit history.`}
                        onConfirm={() => deleteMutation.mutate(vehicle.id)}
                      >
                        <Button variant="ghost" size="icon" aria-label="Remove vehicle">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </div>
                ))}
                {!vehicles.length ? (
                  <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
                    {vehiclesQuery.isLoading ? "Loading vehicles" : "No vehicles found"}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Truck className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>{editingVehicleId ? labels.editVehicle : labels.createVehicle}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleSubmit}>
                <FormInput label="Vehicle Number" value={form.vehicleNumber} onChange={(value) => updateForm("vehicleNumber", value)} />
                <label className="grid gap-1 text-sm font-medium">
                  Vehicle Type
                  <select
                    className="h-10 rounded-xl border bg-white/90 px-3 outline-none focus:ring-2 focus:ring-sky-200"
                    value={form.vehicleType}
                    onChange={(event) => updateForm("vehicleType", event.target.value as VehicleType)}
                  >
                    {vehicleTypes
                      .filter((item): item is VehicleType => item !== "ALL")
                      .map((item) => (
                        <option key={item} value={item}>
                          {pretty(item)}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Make" value={form.make} onChange={(value) => updateForm("make", value)} />
                  <FormInput label="Model" value={form.model} onChange={(value) => updateForm("model", value)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput
                    label="Year"
                    value={String(form.manufacturingYear)}
                    onChange={(value) => updateForm("manufacturingYear", Number(value))}
                    type="number"
                  />
                  <FormInput
                    label="Capacity Ton"
                    value={String(form.capacityTon)}
                    onChange={(value) => updateForm("capacityTon", Number(value))}
                    type="number"
                    step="0.01"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField label="Fuel" value={form.fuelType} options={fuelTypes} onChange={(value) => updateForm("fuelType", value as FuelType)} />
                  <SelectField
                    label="Ownership"
                    value={form.ownershipType}
                    options={ownershipTypes}
                    onChange={(value) => updateForm("ownershipType", value as OwnershipType)}
                  />
                </div>
                <SelectField
                  label="Status"
                  value={form.status}
                  options={statuses.filter((item): item is VehicleStatus => item !== "ALL")}
                  onChange={(value) => updateForm("status", value as VehicleStatus)}
                />
                <FormInput label="RC Number" value={form.rcNumber} onChange={(value) => updateForm("rcNumber", value)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput
                    label="Insurance Expiry"
                    value={form.insuranceExpiryDate}
                    onChange={(value) => updateForm("insuranceExpiryDate", value)}
                    type="date"
                  />
                  <FormInput
                    label="Fitness Expiry"
                    value={form.fitnessExpiryDate}
                    onChange={(value) => updateForm("fitnessExpiryDate", value)}
                    type="date"
                  />
                  <FormInput
                    label="Permit Expiry"
                    value={form.permitExpiryDate}
                    onChange={(value) => updateForm("permitExpiryDate", value)}
                    type="date"
                  />
                  <FormInput
                    label="Pollution Expiry"
                    value={form.pollutionExpiryDate}
                    onChange={(value) => updateForm("pollutionExpiryDate", value)}
                    type="date"
                  />
                </div>
                <FormInput label="GPS Device ID" value={form.gpsDeviceId ?? ""} onChange={(value) => updateForm("gpsDeviceId", value)} required={false} />
                <label className="grid gap-1 text-sm font-medium">
                  Notes
                  <textarea
                    className="min-h-20 rounded-xl border bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-200"
                    value={form.notes ?? ""}
                    onChange={(event) => updateForm("notes", event.target.value)}
                  />
                </label>
                {message ? <p className="rounded-md border p-3 text-sm text-muted-foreground">{message}</p> : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button className="h-11 text-base" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingVehicleId ? "Update Vehicle" : "Add Vehicle"}
                  </Button>
                  {editingVehicleId ? (
                    <Button type="button" variant="secondary" className="h-11 text-base" onClick={cancelEdit}>
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

function StatusBadge({ status }: { status: VehicleStatus }) {
  const className =
    status === "ACTIVE"
      ? "border-primary/30 bg-primary/10 text-primary"
      : status === "MAINTENANCE" || status === "INACTIVE"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-accent/30 bg-accent/10 text-foreground";

  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${className}`}>{pretty(status)}</span>;
}

function DocumentAlert({ vehicle }: { vehicle: CompanyVehicle }) {
  const expiring = [
    vehicle.insuranceExpiryDate,
    vehicle.fitnessExpiryDate,
    vehicle.permitExpiryDate,
    vehicle.pollutionExpiryDate
  ].some((date) => new Date(date).getTime() <= Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (!expiring) {
    return <p className="mt-2 text-xs text-muted-foreground">Documents OK</p>;
  }

  return (
    <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-destructive">
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      Documents expiring
    </p>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  step
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  step?: string;
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
        step={step}
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

function pretty(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function toDateInput(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}
