"use client";

import { Edit, Fuel, Search, Trash2 } from "lucide-react";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CompanyShell } from "@/components/company/company-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/premium/data-table";
import { fetchCompanyVehicles } from "@/lib/company-api";
import { fetchCompanyDrivers } from "@/lib/company-directory-api";
import {
  type CompanyDiesel,
  type DieselPayload,
  type PaymentMode,
  createCompanyDiesel,
  deleteCompanyDiesel,
  fetchCompanyDiesel,
  updateCompanyDiesel
} from "@/lib/company-expenses-api";
import { fetchCompanyTrips } from "@/lib/company-trips-api";
import { companyLabels } from "@/lib/company-labels";

const labels = companyLabels.en;
const paymentModes: PaymentMode[] = ["CASH", "UPI", "CARD", "CREDIT", "OTHER"];

function blankDieselForm(): DieselPayload {
  return {
    tripId: "",
    vehicleId: "",
    driverId: "",
    dieselDate: toDateInput(new Date()),
    fuelStationName: "",
    liters: 0,
    ratePerLiter: 0,
    paymentMode: "CASH",
    billNumber: "",
    odometerReading: undefined,
    notes: ""
  };
}

export default function CompanyDieselPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [vehicleId, setVehicleId] = React.useState("");
  const [tripId, setTripId] = React.useState("");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<DieselPayload>(() => blankDieselForm());
  const [message, setMessage] = React.useState("");

  const dieselQuery = useQuery({
    queryKey: ["company-diesel", search, vehicleId, tripId, fromDate, toDate],
    queryFn: () => fetchCompanyDiesel({ search, vehicleId, tripId, fromDate, toDate, limit: 50 })
  });
  const vehiclesQuery = useQuery({ queryKey: ["company-diesel-vehicles"], queryFn: () => fetchCompanyVehicles({ limit: 100 }) });
  const tripsQuery = useQuery({ queryKey: ["company-diesel-trips"], queryFn: () => fetchCompanyTrips({ limit: 100 }) });
  const driversQuery = useQuery({ queryKey: ["company-diesel-drivers"], queryFn: () => fetchCompanyDrivers({ limit: 100 }) });

  const createMutation = useMutation({
    mutationFn: createCompanyDiesel,
    onSuccess: async () => {
      setForm(blankDieselForm());
      setMessage("Diesel entry saved.");
      await queryClient.invalidateQueries({ queryKey: ["company-diesel"] });
    },
    onError: () => setMessage("Diesel entry could not be saved. Check vehicle, trip, and amount.")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DieselPayload }) => updateCompanyDiesel(id, payload),
    onSuccess: async () => {
      setEditingId(null);
      setForm(blankDieselForm());
      setMessage("Diesel entry updated.");
      await queryClient.invalidateQueries({ queryKey: ["company-diesel"] });
    },
    onError: () => setMessage("Diesel entry could not be updated.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyDiesel,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["company-diesel"] })
  });

  const diesel = dieselQuery.data?.items ?? [];
  const summary = dieselQuery.data?.summary;
  const vehicles = vehiclesQuery.data?.items ?? [];
  const trips = tripsQuery.data?.items ?? [];
  const drivers = driversQuery.data?.items ?? [];
  const totalAmount = Number(form.liters || 0) * Number(form.ratePerLiter || 0);

  function updateForm<K extends keyof DieselPayload>(key: K, value: DieselPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const payload = cleanDieselPayload(form);
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }
    createMutation.mutate(payload);
  }

  function startEdit(item: CompanyDiesel) {
    setEditingId(item.id);
    setMessage("");
    setForm({
      tripId: item.tripId ?? "",
      vehicleId: item.vehicleId,
      driverId: item.driverId ?? "",
      dieselDate: toDateInput(item.dieselDate),
      fuelStationName: item.fuelStationName ?? "",
      liters: Number(item.liters),
      ratePerLiter: Number(item.ratePerLiter),
      paymentMode: item.paymentMode,
      billNumber: item.billNumber ?? "",
      odometerReading: item.odometerReading ?? undefined,
      notes: item.notes ?? ""
    });
  }

  return (
    <CompanyShell>
      <section className="grid gap-6">
        <Header />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Diesel Amount" value={money(summary?.totalDieselAmount)} />
          <SummaryCard label="Diesel Liters" value={`${Number(summary?.dieselLiters ?? 0).toLocaleString("en-IN")} L`} />
          <SummaryCard label="Trip Diesel" value={money(summary?.tripDieselAmount)} />
          <SummaryCard label="Vehicle Diesel" value={money(summary?.vehicleDieselAmount)} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <div className="grid gap-4">
            <Card>
              <CardContent className="grid gap-3 pt-5 md:grid-cols-[1fr_150px_150px] xl:grid-cols-[1fr_140px_140px_140px_140px]">
                <SearchInput value={search} onChange={setSearch} />
                <FilterSelect label="Vehicle" value={vehicleId} options={vehicles.map((item) => ({ value: item.id, label: item.vehicleNumber }))} onChange={setVehicleId} />
                <FilterSelect label="Trip" value={tripId} options={trips.map((item) => ({ value: item.id, label: item.tripNumber }))} onChange={setTripId} />
                <input className="h-11 rounded-xl border bg-white/90 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} aria-label="From date" />
                <input className="h-11 rounded-xl border bg-white/90 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} aria-label="To date" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Diesel List</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {diesel.map((item) => (
                  <div key={item.id} className="grid gap-3 premium-record rounded-2xl p-4">
                    <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                      <div>
                        <p className="text-lg font-semibold">{item.vehicle.vehicleNumber}</p>
                        <p className="text-sm text-muted-foreground">{item.trip?.tripNumber ?? "General vehicle diesel"}</p>
                      </div>
                      <div>
                        <p className="font-medium">{item.fuelStationName || "Fuel station not added"}</p>
                        <p className="text-sm text-muted-foreground">{new Date(item.dieselDate).toLocaleDateString("en-IN")} / {simple(item.paymentMode)}</p>
                      </div>
                      <div className="flex gap-2 lg:justify-end">
                        <Button variant="secondary" size="icon" aria-label="Edit diesel" onClick={() => startEdit(item)}>
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <ConfirmDialog
                          title="Remove diesel entry?"
                          description="This will soft delete the diesel entry and remove it from current cost reports."
                          onConfirm={() => deleteMutation.mutate(item.id)}
                        >
                          <Button variant="ghost" size="icon" aria-label="Remove diesel">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-3">
                      <Detail label="Liters" value={`${Number(item.liters).toLocaleString("en-IN")} L`} />
                      <Detail label="Rate" value={money(item.ratePerLiter)} />
                      <Detail label="Amount" value={money(item.totalAmount)} />
                    </div>
                  </div>
                ))}
                {!diesel.length ? <Empty loading={dieselQuery.isLoading} /> : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Fuel className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>{editingId ? labels.editDiesel : labels.createDiesel}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleSubmit}>
                <SelectField label="Vehicle" value={form.vehicleId} options={vehicles.map((item) => ({ value: item.id, label: item.vehicleNumber }))} onChange={(value) => updateForm("vehicleId", value)} />
                <SelectField label="Trip (Optional)" value={form.tripId ?? ""} options={trips.map((item) => ({ value: item.id, label: item.tripNumber }))} onChange={(value) => updateForm("tripId", value)} required={false} />
                <SelectField label="Driver (Optional)" value={form.driverId ?? ""} options={drivers.map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => updateForm("driverId", value)} required={false} />
                <FormInput label="Diesel Date" value={form.dieselDate} onChange={(value) => updateForm("dieselDate", value)} type="date" />
                <FormInput label="Fuel Station" value={form.fuelStationName ?? ""} onChange={(value) => updateForm("fuelStationName", value)} required={false} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Liters" value={String(form.liters)} onChange={(value) => updateForm("liters", Number(value))} type="number" />
                  <FormInput label="Rate/Liter" value={String(form.ratePerLiter)} onChange={(value) => updateForm("ratePerLiter", Number(value))} type="number" />
                </div>
                <Detail label="Auto Amount" value={money(totalAmount)} />
                <EnumSelect label="Payment Mode" value={form.paymentMode} options={paymentModes} onChange={(value) => updateForm("paymentMode", value as PaymentMode)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Bill No." value={form.billNumber ?? ""} onChange={(value) => updateForm("billNumber", value)} required={false} />
                  <FormInput label="Odometer" value={form.odometerReading ? String(form.odometerReading) : ""} onChange={(value) => updateForm("odometerReading", value ? Number(value) : undefined)} type="number" required={false} />
                </div>
                <Notes value={form.notes ?? ""} onChange={(value) => updateForm("notes", value)} />
                {message ? <p className="rounded-md border p-3 text-sm text-muted-foreground">{message}</p> : null}
                <FormActions editing={Boolean(editingId)} disabled={createMutation.isPending || updateMutation.isPending} onCancel={() => { setEditingId(null); setForm(blankDieselForm()); }} />
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </CompanyShell>
  );
}

function cleanDieselPayload(form: DieselPayload): DieselPayload {
  return {
    ...form,
    tripId: form.tripId || undefined,
    driverId: form.driverId || undefined,
    fuelStationName: form.fuelStationName || undefined,
    billNumber: form.billNumber || undefined,
    odometerReading: form.odometerReading || undefined,
    notes: form.notes || undefined
  };
}

function Header() {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{labels.companyPanel}</p>
      <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{labels.diesel}</h1>
    </div>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
      <input className="h-11 w-full rounded-xl border bg-white/90 pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-sky-200" placeholder={labels.searchDiesel} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold sm:text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function FormInput({ label, value, onChange, type = "text", required = true }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input className="h-10 rounded-xl border bg-white/90 px-3 outline-none focus:ring-2 focus:ring-sky-200" value={value} onChange={(event) => onChange(event.target.value)} type={type} required={required} step={type === "number" ? "0.01" : undefined} />
    </label>
  );
}

function SelectField({ label, value, options, onChange, required = true }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select className="h-10 rounded-xl border bg-white/90 px-3 outline-none focus:ring-2 focus:ring-sky-200" value={value} onChange={(event) => onChange(event.target.value)} required={required}>
        <option value="">Select</option>
        {options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
  );
}

function FilterSelect(props: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <SelectField {...props} required={false} />;
}

function EnumSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select className="h-10 rounded-xl border bg-white/90 px-3 outline-none focus:ring-2 focus:ring-sky-200" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((item) => <option key={item} value={item}>{simple(item)}</option>)}
      </select>
    </label>
  );
}

function Notes({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      Notes
      <textarea className="min-h-20 rounded-xl border bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-200" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function FormActions({ editing, disabled, onCancel }: { editing: boolean; disabled: boolean; onCancel: () => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button className="h-11 text-base" disabled={disabled}>{editing ? "Update Diesel" : "Save Diesel"}</Button>
      {editing ? <Button type="button" variant="secondary" className="h-11 text-base" onClick={onCancel}>Cancel</Button> : null}
    </div>
  );
}

function Empty({ loading }: { loading: boolean }) {
  return <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">{loading ? "Loading diesel" : "No diesel entries found"}</div>;
}

function money(value: string | number | undefined) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function simple(value: string) {
  return value.split("_").map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(" ");
}

function toDateInput(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}
