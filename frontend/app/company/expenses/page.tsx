"use client";

import { Edit, ReceiptText, Search, Trash2 } from "lucide-react";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CompanyShell } from "@/components/company/company-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/premium/data-table";
import { fetchCompanyVehicles } from "@/lib/company-api";
import { fetchCompanyDrivers } from "@/lib/company-directory-api";
import {
  type CompanyExpense,
  type ExpensePayload,
  type ExpenseType,
  type PaymentMode,
  createCompanyExpense,
  deleteCompanyExpense,
  fetchCompanyExpenses,
  updateCompanyExpense
} from "@/lib/company-expenses-api";
import { fetchCompanyTrips } from "@/lib/company-trips-api";
import { companyLabels } from "@/lib/company-labels";

const labels = companyLabels.en;
const paymentModes: PaymentMode[] = ["CASH", "UPI", "CARD", "CREDIT", "OTHER"];
const expenseTypes: Array<ExpenseType | "ALL"> = [
  "ALL",
  "TOLL",
  "REPAIR",
  "CHALLAN",
  "LOADING",
  "UNLOADING",
  "DRIVER_ADVANCE",
  "HELPER",
  "FOOD",
  "PARKING",
  "TYRE",
  "MAINTENANCE",
  "OTHER"
];

function blankExpenseForm(): ExpensePayload {
  return {
    tripId: "",
    vehicleId: "",
    driverId: "",
    expenseDate: toDateInput(new Date()),
    expenseType: "TOLL",
    amount: 0,
    paymentMode: "CASH",
    paidTo: "",
    billNumber: "",
    notes: ""
  };
}

export default function CompanyExpensesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [expenseType, setExpenseType] = React.useState<ExpenseType | "ALL">("ALL");
  const [vehicleId, setVehicleId] = React.useState("");
  const [tripId, setTripId] = React.useState("");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<ExpensePayload>(() => blankExpenseForm());
  const [message, setMessage] = React.useState("");

  const expensesQuery = useQuery({
    queryKey: ["company-expenses", search, expenseType, vehicleId, tripId, fromDate, toDate],
    queryFn: () => fetchCompanyExpenses({ search, expenseType, vehicleId, tripId, fromDate, toDate, limit: 50 })
  });
  const vehiclesQuery = useQuery({ queryKey: ["company-expense-vehicles"], queryFn: () => fetchCompanyVehicles({ limit: 100 }) });
  const tripsQuery = useQuery({ queryKey: ["company-expense-trips"], queryFn: () => fetchCompanyTrips({ limit: 100 }) });
  const driversQuery = useQuery({ queryKey: ["company-expense-drivers"], queryFn: () => fetchCompanyDrivers({ limit: 100 }) });

  const createMutation = useMutation({
    mutationFn: createCompanyExpense,
    onSuccess: async () => {
      setForm(blankExpenseForm());
      setMessage("Expense saved.");
      await queryClient.invalidateQueries({ queryKey: ["company-expenses"] });
    },
    onError: () => setMessage("Expense could not be saved. Check linked trip, vehicle, or driver.")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ExpensePayload }) => updateCompanyExpense(id, payload),
    onSuccess: async () => {
      setEditingId(null);
      setForm(blankExpenseForm());
      setMessage("Expense updated.");
      await queryClient.invalidateQueries({ queryKey: ["company-expenses"] });
    },
    onError: () => setMessage("Expense could not be updated.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyExpense,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["company-expenses"] })
  });

  const expenses = expensesQuery.data?.items ?? [];
  const summary = expensesQuery.data?.summary;
  const vehicles = vehiclesQuery.data?.items ?? [];
  const trips = tripsQuery.data?.items ?? [];
  const drivers = driversQuery.data?.items ?? [];

  function updateForm<K extends keyof ExpensePayload>(key: K, value: ExpensePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const payload = cleanExpensePayload(form);
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }
    createMutation.mutate(payload);
  }

  function startEdit(item: CompanyExpense) {
    setEditingId(item.id);
    setMessage("");
    setForm({
      tripId: item.tripId ?? "",
      vehicleId: item.vehicleId ?? "",
      driverId: item.driverId ?? "",
      expenseDate: toDateInput(item.expenseDate),
      expenseType: item.expenseType,
      amount: Number(item.amount),
      paymentMode: item.paymentMode,
      paidTo: item.paidTo ?? "",
      billNumber: item.billNumber ?? "",
      notes: item.notes ?? ""
    });
  }

  return (
    <CompanyShell>
      <section className="responsive-page">
        <Header />

        <div className="responsive-summary-grid">
          <SummaryCard label="Total Expense Amount" value={money(summary?.totalExpenseAmount)} />
          <SummaryCard label="Trip Expenses" value={money(summary?.tripExpenses)} />
          <SummaryCard label="Vehicle Expenses" value={money(summary?.vehicleExpenses)} />
          <SummaryCard label="Company Expenses" value={money(summary?.companyExpenses)} />
        </div>

        <div className="responsive-workspace-grid">
          <div className="grid gap-4">
            <Card>
              <CardContent className="grid gap-3 pt-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[minmax(0,1fr)_140px_140px_140px_140px_140px]">
                <SearchInput value={search} onChange={setSearch} />
                <EnumSelect label="Type" value={expenseType} options={expenseTypes} onChange={(value) => setExpenseType(value as ExpenseType | "ALL")} />
                <FilterSelect label="Vehicle" value={vehicleId} options={vehicles.map((item) => ({ value: item.id, label: item.vehicleNumber }))} onChange={setVehicleId} />
                <FilterSelect label="Trip" value={tripId} options={trips.map((item) => ({ value: item.id, label: item.tripNumber }))} onChange={setTripId} />
                <input className="h-11 rounded-xl border bg-white/90 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} aria-label="From date" />
                <input className="h-11 rounded-xl border bg-white/90 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} aria-label="To date" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense List</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {expenses.map((item) => (
                  <div key={item.id} className="grid gap-3 premium-record rounded-2xl p-4">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <div>
                        <p className="text-lg font-semibold">{simple(item.expenseType)}</p>
                        <p className="text-sm text-muted-foreground">{item.trip?.tripNumber ?? item.vehicle?.vehicleNumber ?? "General company expense"}</p>
                      </div>
                      <div>
                        <p className="font-medium">{money(item.amount)}</p>
                        <p className="text-sm text-muted-foreground">{simple(item.paymentMode)} / {new Date(item.expenseDate).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Button variant="secondary" size="icon" aria-label="Edit expense" onClick={() => startEdit(item)}>
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <ConfirmDialog
                          title="Remove expense?"
                          description="This will soft delete the expense and remove it from current cost/profit reports."
                          onConfirm={() => deleteMutation.mutate(item.id)}
                        >
                          <Button variant="ghost" size="icon" aria-label="Remove expense">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
                      <Detail label="Paid To" value={item.paidTo || "Not added"} />
                      <Detail label="Bill No." value={item.billNumber || "Not added"} />
                      <Detail label="Driver" value={item.driver?.name || "Not linked"} />
                    </div>
                  </div>
                ))}
                {!expenses.length ? <Empty loading={expensesQuery.isLoading} /> : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <ReceiptText className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>{editingId ? labels.editExpense : labels.createExpense}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleSubmit}>
                <EnumSelect label="Expense Type" value={form.expenseType} options={expenseTypes.filter((item): item is ExpenseType => item !== "ALL")} onChange={(value) => updateForm("expenseType", value as ExpenseType)} />
                <FormInput label="Expense Date" value={form.expenseDate} onChange={(value) => updateForm("expenseDate", value)} type="date" />
                <FormInput label="Amount" value={String(form.amount)} onChange={(value) => updateForm("amount", Number(value))} type="number" />
                <EnumSelect label="Payment Mode" value={form.paymentMode} options={paymentModes} onChange={(value) => updateForm("paymentMode", value as PaymentMode)} />
                <SelectField label="Trip (Optional)" value={form.tripId ?? ""} options={trips.map((item) => ({ value: item.id, label: item.tripNumber }))} onChange={(value) => updateForm("tripId", value)} required={false} />
                <SelectField label="Vehicle (Optional)" value={form.vehicleId ?? ""} options={vehicles.map((item) => ({ value: item.id, label: item.vehicleNumber }))} onChange={(value) => updateForm("vehicleId", value)} required={false} />
                <SelectField label="Driver (Optional)" value={form.driverId ?? ""} options={drivers.map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => updateForm("driverId", value)} required={false} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Paid To" value={form.paidTo ?? ""} onChange={(value) => updateForm("paidTo", value)} required={false} />
                  <FormInput label="Bill No." value={form.billNumber ?? ""} onChange={(value) => updateForm("billNumber", value)} required={false} />
                </div>
                <Notes value={form.notes ?? ""} onChange={(value) => updateForm("notes", value)} />
                {message ? <p className="rounded-md border p-3 text-sm text-muted-foreground">{message}</p> : null}
                <FormActions editing={Boolean(editingId)} disabled={createMutation.isPending || updateMutation.isPending} onCancel={() => { setEditingId(null); setForm(blankExpenseForm()); }} />
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </CompanyShell>
  );
}

function cleanExpensePayload(form: ExpensePayload): ExpensePayload {
  return {
    ...form,
    tripId: form.tripId || undefined,
    vehicleId: form.vehicleId || undefined,
    driverId: form.driverId || undefined,
    paidTo: form.paidTo || undefined,
    billNumber: form.billNumber || undefined,
    notes: form.notes || undefined
  };
}

function Header() {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{labels.companyPanel}</p>
      <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{labels.expenses}</h1>
    </div>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
      <input className="h-11 w-full rounded-xl border bg-white/90 pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-sky-200" placeholder={labels.searchExpenses} value={value} onChange={(event) => onChange(event.target.value)} />
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
        {options.map((item) => <option key={item} value={item}>{item === "ALL" ? labels.all : simple(item)}</option>)}
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
      <Button className="h-11 text-base" disabled={disabled}>{editing ? "Update Expense" : "Save Expense"}</Button>
      {editing ? <Button type="button" variant="secondary" className="h-11 text-base" onClick={onCancel}>Cancel</Button> : null}
    </div>
  );
}

function Empty({ loading }: { loading: boolean }) {
  return <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">{loading ? "Loading expenses" : "No expenses found"}</div>;
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
