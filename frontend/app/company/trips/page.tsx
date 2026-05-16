"use client";

import { Edit, Eye, Route, Search, Trash2 } from "lucide-react";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CompanyShell } from "@/components/company/company-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/premium/data-table";
import { fetchCompanyVehicles } from "@/lib/company-api";
import { fetchCompanyClients, fetchCompanyDrivers } from "@/lib/company-directory-api";
import { fetchTripProfitReport } from "@/lib/company-payments-api";
import {
  type CompanyTrip,
  type QuantityUnit,
  type RateType,
  type TripPayload,
  type TripStatus,
  createCompanyTrip,
  deleteCompanyTrip,
  fetchCompanyTrips,
  updateCompanyTrip,
  updateCompanyTripStatus
} from "@/lib/company-trips-api";
import { companyLabels } from "@/lib/company-labels";

const labels = companyLabels.en;
const statuses: Array<TripStatus | "ALL"> = ["ALL", "BOOKED", "LOADING", "IN_TRANSIT", "DELIVERED", "CANCELLED", "BILLED", "PAID"];
const quantityUnits: QuantityUnit[] = ["TON", "KG", "CFT", "BAG", "PIECE", "OTHER"];
const rateTypes: RateType[] = ["FIXED", "PER_TON", "PER_KM", "PER_CFT", "OTHER"];

function blankTripForm(): TripPayload {
  return {
    vehicleId: "",
    driverId: "",
    clientId: "",
    sourceLocation: "",
    destinationLocation: "",
    loadingDate: toDateInput(new Date()),
    unloadingDate: "",
    materialName: "",
    quantity: undefined,
    quantityUnit: "TON",
    freightAmount: 0,
    advanceAmount: 0,
    rateType: "FIXED",
    distanceKm: undefined,
    status: "BOOKED",
    notes: ""
  };
}

export default function CompanyTripsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<TripStatus | "ALL">("ALL");
  const [selectedTrip, setSelectedTrip] = React.useState<CompanyTrip | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<TripPayload>(() => blankTripForm());
  const [message, setMessage] = React.useState("");

  const tripsQuery = useQuery({
    queryKey: ["company-trips", search, status],
    queryFn: () => fetchCompanyTrips({ search, status, limit: 50 })
  });
  const vehiclesQuery = useQuery({
    queryKey: ["company-trip-vehicles"],
    queryFn: () => fetchCompanyVehicles({ limit: 100 })
  });
  const driversQuery = useQuery({
    queryKey: ["company-trip-drivers"],
    queryFn: () => fetchCompanyDrivers({ limit: 100 })
  });
  const clientsQuery = useQuery({
    queryKey: ["company-trip-clients"],
    queryFn: () => fetchCompanyClients({ limit: 100 })
  });
  const tripProfitQuery = useQuery({
    queryKey: ["company-trip-profit", selectedTrip?.id],
    queryFn: () => fetchTripProfitReport(selectedTrip!.id),
    enabled: Boolean(selectedTrip?.id)
  });

  const createMutation = useMutation({
    mutationFn: createCompanyTrip,
    onSuccess: async (trip) => {
      setForm(blankTripForm());
      setSelectedTrip(trip);
      setMessage("Trip created.");
      await invalidateTripData(queryClient);
    },
    onError: () => setMessage("Trip could not be created. Check vehicle, driver, client, and amount.")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TripPayload }) => updateCompanyTrip(id, payload),
    onSuccess: async (trip) => {
      setEditingId(null);
      setSelectedTrip(trip);
      setForm(blankTripForm());
      setMessage("Trip updated.");
      await invalidateTripData(queryClient);
    },
    onError: () => setMessage("Trip could not be updated.")
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: TripStatus }) => updateCompanyTripStatus(id, nextStatus),
    onSuccess: async (trip) => {
      setSelectedTrip(trip);
      await invalidateTripData(queryClient);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyTrip,
    onSuccess: async () => {
      setSelectedTrip(null);
      await invalidateTripData(queryClient);
    }
  });

  const trips = tripsQuery.data?.items ?? [];
  const summary = tripsQuery.data?.summary;
  const vehicles = vehiclesQuery.data?.items ?? [];
  const drivers = driversQuery.data?.items ?? [];
  const clients = clientsQuery.data?.items ?? [];

  function updateForm<K extends keyof TripPayload>(key: K, value: TripPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const payload = cleanTripPayload(form);

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }

    createMutation.mutate(payload);
  }

  function startEdit(trip: CompanyTrip) {
    setEditingId(trip.id);
    setSelectedTrip(trip);
    setMessage("");
    setForm({
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      clientId: trip.clientId,
      sourceLocation: trip.sourceLocation,
      destinationLocation: trip.destinationLocation,
      loadingDate: toDateInput(trip.loadingDate),
      unloadingDate: trip.unloadingDate ? toDateInput(trip.unloadingDate) : "",
      materialName: trip.materialName ?? "",
      quantity: trip.quantity ? Number(trip.quantity) : undefined,
      quantityUnit: trip.quantityUnit,
      freightAmount: Number(trip.freightAmount),
      advanceAmount: Number(trip.advanceAmount),
      rateType: trip.rateType,
      distanceKm: trip.distanceKm ? Number(trip.distanceKm) : undefined,
      status: trip.status,
      notes: trip.notes ?? ""
    });
  }

  return (
    <CompanyShell>
      <section className="grid gap-6">
        <Header />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard label="Total Trips" value={summary?.totalTrips ?? 0} />
          <SummaryCard label="Running Trips" value={summary?.runningTrips ?? 0} />
          <SummaryCard label="Delivered Trips" value={summary?.deliveredTrips ?? 0} />
          <SummaryCard label="Pending Balance" value={`₹${Number(summary?.pendingBalance ?? 0).toLocaleString("en-IN")}`} />
          <SummaryCard label="Today Loading" value={summary?.todayLoading ?? 0} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_430px]">
          <div className="grid gap-4">
            <Card>
              <CardContent className="grid gap-3 pt-5 md:grid-cols-[1fr_180px]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    className="h-11 w-full rounded-xl border bg-white/90 pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-sky-200"
                    placeholder={labels.searchTrips}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <select
                  className="h-11 rounded-xl border bg-white/90 px-3 text-base outline-none focus:ring-2 focus:ring-sky-200"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as TripStatus | "ALL")}
                  aria-label="Trip status"
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item === "ALL" ? labels.all : simpleStatus(item)}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trip List</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {trips.map((trip) => (
                  <div key={trip.id} className="grid gap-3 premium-record rounded-2xl p-4">
                    <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                      <div>
                        <p className="text-lg font-semibold">{trip.tripNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {trip.sourceLocation} to {trip.destinationLocation}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{trip.vehicle.vehicleNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {trip.driver.name} / {trip.client.clientName}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                        <StatusBadge status={trip.status} />
                        <Button variant="secondary" size="icon" aria-label="View trip" onClick={() => setSelectedTrip(trip)}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button variant="secondary" size="icon" aria-label="Edit trip" onClick={() => startEdit(trip)}>
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <ConfirmDialog
                          title="Remove trip?"
                          description={`This will soft delete ${trip.tripNumber} and release assigned resources if no other active trip needs them.`}
                          onConfirm={() => deleteMutation.mutate(trip.id)}
                        >
                          <Button variant="ghost" size="icon" aria-label="Remove trip">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-3">
                      <Amount label="Freight" value={trip.freightAmount} />
                      <Amount label="Received" value={trip.receivedAmount} />
                      <Amount label="Balance" value={trip.balanceAmount} />
                    </div>
                    <select
                      className="h-10 rounded-xl border bg-white/90 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200 sm:max-w-56"
                      value={trip.status}
                      onChange={(event) =>
                        statusMutation.mutate({ id: trip.id, nextStatus: event.target.value as TripStatus })
                      }
                      aria-label="Update trip status"
                    >
                      {statuses
                        .filter((item): item is TripStatus => item !== "ALL")
                        .map((item) => (
                          <option key={item} value={item}>
                            {simpleStatus(item)}
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
                {!trips.length ? (
                  <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
                    {tripsQuery.isLoading ? "Loading trips" : "No trips found"}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {selectedTrip ? (
              <Card>
                <CardHeader>
                  <CardTitle>Trip Detail</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <Detail label="Trip" value={selectedTrip.tripNumber} />
                  <Detail label="Status" value={simpleStatus(selectedTrip.status)} />
                  <Detail label="Vehicle" value={selectedTrip.vehicle.vehicleNumber} />
                  <Detail label="Driver" value={selectedTrip.driver.name} />
                  <Detail label="Client" value={selectedTrip.client.clientName} />
                  <Detail label="Material" value={selectedTrip.materialName || "Not added"} />
                  <Detail label="Route" value={`${selectedTrip.sourceLocation} to ${selectedTrip.destinationLocation}`} />
                  <Detail label="Freight" value={`₹${Number(selectedTrip.freightAmount).toLocaleString("en-IN")}`} />
                  <Detail label="Received" value={`₹${Number(selectedTrip.receivedAmount).toLocaleString("en-IN")}`} />
                  <Detail label="Balance" value={`₹${Number(selectedTrip.balanceAmount).toLocaleString("en-IN")}`} />
                  {tripProfitQuery.data ? (
                    <>
                      <Detail label="Diesel Total" value={`₹${tripProfitQuery.data.dieselTotal.toLocaleString("en-IN")}`} />
                      <Detail label="Expense Total" value={`₹${tripProfitQuery.data.expenseTotal.toLocaleString("en-IN")}`} />
                      <Detail label="Net Profit/Loss" value={`₹${tripProfitQuery.data.netProfit.toLocaleString("en-IN")}`} />
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Route className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>{editingId ? labels.editTrip : labels.createTrip}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleSubmit}>
                <SelectField label="Vehicle" value={form.vehicleId} options={vehicles.map((item) => ({ value: item.id, label: item.vehicleNumber }))} onChange={(value) => updateForm("vehicleId", value)} />
                <SelectField label="Driver" value={form.driverId} options={drivers.map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => updateForm("driverId", value)} />
                <SelectField label="Client" value={form.clientId} options={clients.map((item) => ({ value: item.id, label: item.clientName }))} onChange={(value) => updateForm("clientId", value)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Source" value={form.sourceLocation} onChange={(value) => updateForm("sourceLocation", value)} />
                  <FormInput label="Destination" value={form.destinationLocation} onChange={(value) => updateForm("destinationLocation", value)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Loading Date" value={form.loadingDate} onChange={(value) => updateForm("loadingDate", value)} type="date" />
                  <FormInput label="Unloading Date" value={form.unloadingDate ?? ""} onChange={(value) => updateForm("unloadingDate", value)} type="date" required={false} />
                </div>
                <FormInput label="Material" value={form.materialName ?? ""} onChange={(value) => updateForm("materialName", value)} required={false} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Quantity" value={form.quantity ? String(form.quantity) : ""} onChange={(value) => updateForm("quantity", value ? Number(value) : undefined)} type="number" required={false} />
                  <EnumSelect label="Unit" value={form.quantityUnit} options={quantityUnits} onChange={(value) => updateForm("quantityUnit", value as QuantityUnit)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Freight" value={String(form.freightAmount)} onChange={(value) => updateForm("freightAmount", Number(value))} type="number" />
                  <FormInput label="Advance" value={String(form.advanceAmount ?? 0)} onChange={(value) => updateForm("advanceAmount", Number(value))} type="number" required={false} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <EnumSelect label="Rate Type" value={form.rateType} options={rateTypes} onChange={(value) => updateForm("rateType", value as RateType)} />
                  <FormInput label="Distance KM" value={form.distanceKm ? String(form.distanceKm) : ""} onChange={(value) => updateForm("distanceKm", value ? Number(value) : undefined)} type="number" required={false} />
                </div>
                <EnumSelect label="Status" value={form.status} options={statuses.filter((item): item is TripStatus => item !== "ALL")} onChange={(value) => updateForm("status", value as TripStatus)} />
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
                    {editingId ? "Update Trip" : "New Trip"}
                  </Button>
                  {editingId ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 text-base"
                      onClick={() => {
                        setEditingId(null);
                        setForm(blankTripForm());
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

async function invalidateTripData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["company-trips"] }),
    queryClient.invalidateQueries({ queryKey: ["company-vehicles"] }),
    queryClient.invalidateQueries({ queryKey: ["company-drivers"] })
  ]);
}

function cleanTripPayload(form: TripPayload): TripPayload {
  return {
    ...form,
    unloadingDate: form.unloadingDate || undefined,
    materialName: form.materialName || undefined,
    quantity: form.quantity || undefined,
    advanceAmount: form.advanceAmount || 0,
    distanceKm: form.distanceKm || undefined,
    notes: form.notes || undefined
  };
}

function Header() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{labels.companyPanel}</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{labels.trips}</h1>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary">English</Button>
        <Button variant="secondary">Hindi Ready</Button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
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

function StatusBadge({ status }: { status: TripStatus }) {
  const className =
    status === "DELIVERED" || status === "PAID"
      ? "border-primary/30 bg-primary/10 text-primary"
      : status === "CANCELLED"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-accent/30 bg-accent/10 text-foreground";

  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${className}`}>{simpleStatus(status)}</span>;
}

function Amount({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">₹{Number(value).toLocaleString("en-IN")}</p>
    </div>
  );
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

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select
        className="h-10 rounded-xl border bg-white/90 px-3 outline-none focus:ring-2 focus:ring-sky-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      >
        <option value="">Select</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EnumSelect({
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
            {simpleStatus(item)}
          </option>
        ))}
      </select>
    </label>
  );
}

function simpleStatus(value: string) {
  const simple: Record<string, string> = {
    BOOKED: "New Trip",
    LOADING: "Loading",
    IN_TRANSIT: "Running",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    BILLED: "Payment Pending",
    PAID: "Paid"
  };

  return (
    simple[value] ??
    value
      .split("_")
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(" ")
  );
}

function toDateInput(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}
