"use client";

import { CircleDollarSign, Edit, Search, Trash2 } from "lucide-react";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CompanyShell } from "@/components/company/company-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/premium/data-table";
import { fetchCompanyClients } from "@/lib/company-directory-api";
import {
  type CompanyPayment,
  type CompanyPaymentMode,
  type PaymentPayload,
  createCompanyPayment,
  deleteCompanyPayment,
  fetchCompanyPayments,
  updateCompanyPayment
} from "@/lib/company-payments-api";
import { fetchCompanyTrips } from "@/lib/company-trips-api";
import { companyLabels } from "@/lib/company-labels";

const labels = companyLabels.en;
const paymentModes: Array<CompanyPaymentMode | "ALL"> = ["ALL", "CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE", "CREDIT", "OTHER"];

function blankPaymentForm(): PaymentPayload {
  return {
    clientId: "",
    tripId: "",
    paymentDate: toDateInput(new Date()),
    amount: 0,
    paymentMode: "CASH",
    referenceNumber: "",
    notes: ""
  };
}

export default function CompanyPaymentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [tripId, setTripId] = React.useState("");
  const [paymentMode, setPaymentMode] = React.useState<CompanyPaymentMode | "ALL">("ALL");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<PaymentPayload>(() => blankPaymentForm());
  const [message, setMessage] = React.useState("");

  const paymentsQuery = useQuery({
    queryKey: ["company-payments", search, clientId, tripId, paymentMode, fromDate, toDate],
    queryFn: () => fetchCompanyPayments({ search, clientId, tripId, paymentMode, fromDate, toDate, limit: 50 })
  });
  const clientsQuery = useQuery({ queryKey: ["company-payment-clients"], queryFn: () => fetchCompanyClients({ limit: 100 }) });
  const tripsQuery = useQuery({ queryKey: ["company-payment-trips"], queryFn: () => fetchCompanyTrips({ limit: 100 }) });

  const createMutation = useMutation({
    mutationFn: createCompanyPayment,
    onSuccess: async () => {
      setForm(blankPaymentForm());
      setMessage("Payment saved.");
      await invalidatePaymentData(queryClient);
    },
    onError: () => setMessage("Payment could not be saved. Check client, trip, and pending balance.")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PaymentPayload }) => updateCompanyPayment(id, payload),
    onSuccess: async () => {
      setEditingId(null);
      setForm(blankPaymentForm());
      setMessage("Payment updated.");
      await invalidatePaymentData(queryClient);
    },
    onError: () => setMessage("Payment could not be updated.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyPayment,
    onSuccess: async () => invalidatePaymentData(queryClient)
  });

  const payments = paymentsQuery.data?.items ?? [];
  const summary = paymentsQuery.data?.summary;
  const clients = clientsQuery.data?.items ?? [];
  const trips = tripsQuery.data?.items ?? [];
  const selectedTrip = trips.find((trip) => trip.id === form.tripId);

  function updateForm<K extends keyof PaymentPayload>(key: K, value: PaymentPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const payload = cleanPaymentPayload(form);

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }

    createMutation.mutate(payload);
  }

  function startEdit(payment: CompanyPayment) {
    setEditingId(payment.id);
    setMessage("");
    setForm({
      clientId: payment.clientId,
      tripId: payment.tripId ?? "",
      paymentDate: toDateInput(payment.paymentDate),
      amount: Number(payment.amount),
      paymentMode: payment.paymentMode,
      referenceNumber: payment.referenceNumber ?? "",
      notes: payment.notes ?? ""
    });
  }

  return (
    <CompanyShell>
      <section className="grid gap-6">
        <Header />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Received" value={money(summary?.totalReceived)} />
          <SummaryCard label="Pending Outstanding" value={money(summary?.pendingOutstanding)} />
          <SummaryCard label="Today Received" value={money(summary?.todayReceived)} />
          <SummaryCard label="Payment Count" value={String(summary?.paymentCount ?? 0)} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <div className="grid gap-4">
            <Card>
              <CardContent className="grid gap-3 pt-5 md:grid-cols-[1fr_150px_150px] xl:grid-cols-[1fr_140px_140px_140px_140px_140px]">
                <SearchInput value={search} onChange={setSearch} />
                <FilterSelect label="Client" value={clientId} options={clients.map((item) => ({ value: item.id, label: item.clientName }))} onChange={setClientId} />
                <FilterSelect label="Trip" value={tripId} options={trips.map((item) => ({ value: item.id, label: item.tripNumber }))} onChange={setTripId} />
                <EnumSelect label="Mode" value={paymentMode} options={paymentModes} onChange={(value) => setPaymentMode(value as CompanyPaymentMode | "ALL")} />
                <input className="h-11 rounded-xl border bg-white/90 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} aria-label="From date" />
                <input className="h-11 rounded-xl border bg-white/90 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} aria-label="To date" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment List</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="grid gap-3 premium-record rounded-2xl p-4">
                    <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                      <div>
                        <p className="text-lg font-semibold">{payment.client.clientName}</p>
                        <p className="text-sm text-muted-foreground">{payment.trip?.tripNumber ?? "Client-level payment"}</p>
                      </div>
                      <div>
                        <p className="font-medium">{money(payment.amount)}</p>
                        <p className="text-sm text-muted-foreground">{simple(payment.paymentMode)} / {new Date(payment.paymentDate).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="flex gap-2 lg:justify-end">
                        <Button variant="secondary" size="icon" aria-label="Edit payment" onClick={() => startEdit(payment)}>
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <ConfirmDialog
                          title="Remove payment?"
                          description="This will soft delete the payment and recalculate the linked trip balance."
                          onConfirm={() => deleteMutation.mutate(payment.id)}
                        >
                          <Button variant="ghost" size="icon" aria-label="Remove payment">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-3">
                      <Detail label="Reference" value={payment.referenceNumber || "Not added"} />
                      <Detail label="Trip Balance" value={payment.trip ? money(payment.trip.balanceAmount) : "Not linked"} />
                      <Detail label="Notes" value={payment.notes || "Not added"} />
                    </div>
                  </div>
                ))}
                {!payments.length ? <Empty loading={paymentsQuery.isLoading} /> : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <CircleDollarSign className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>{editingId ? labels.editPayment : labels.createPayment}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleSubmit}>
                <SelectField label="Client" value={form.clientId} options={clients.map((item) => ({ value: item.id, label: item.clientName }))} onChange={(value) => updateForm("clientId", value)} />
                <SelectField
                  label="Trip (Optional)"
                  value={form.tripId ?? ""}
                  options={trips.map((item) => ({ value: item.id, label: `${item.tripNumber} / ${item.client.clientName}` }))}
                  onChange={(value) => {
                    const trip = trips.find((item) => item.id === value);
                    setForm((current) => ({ ...current, tripId: value, clientId: trip?.clientId ?? current.clientId }));
                  }}
                  required={false}
                />
                {selectedTrip ? <Detail label="Current Trip Balance" value={money(selectedTrip.balanceAmount)} /> : null}
                <FormInput label="Payment Date" value={form.paymentDate} onChange={(value) => updateForm("paymentDate", value)} type="date" />
                <FormInput label="Amount" value={String(form.amount)} onChange={(value) => updateForm("amount", Number(value))} type="number" />
                <EnumSelect label="Payment Mode" value={form.paymentMode} options={paymentModes.filter((item): item is CompanyPaymentMode => item !== "ALL")} onChange={(value) => updateForm("paymentMode", value as CompanyPaymentMode)} />
                <FormInput label="Reference No." value={form.referenceNumber ?? ""} onChange={(value) => updateForm("referenceNumber", value)} required={false} />
                <Notes value={form.notes ?? ""} onChange={(value) => updateForm("notes", value)} />
                {message ? <p className="rounded-md border p-3 text-sm text-muted-foreground">{message}</p> : null}
                <FormActions editing={Boolean(editingId)} disabled={createMutation.isPending || updateMutation.isPending} onCancel={() => { setEditingId(null); setForm(blankPaymentForm()); }} />
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </CompanyShell>
  );
}

async function invalidatePaymentData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["company-payments"] }),
    queryClient.invalidateQueries({ queryKey: ["company-trips"] }),
    queryClient.invalidateQueries({ queryKey: ["company-outstanding"] })
  ]);
}

function cleanPaymentPayload(form: PaymentPayload): PaymentPayload {
  return {
    ...form,
    tripId: form.tripId || undefined,
    referenceNumber: form.referenceNumber || undefined,
    notes: form.notes || undefined
  };
}

function Header() {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{labels.companyPanel}</p>
      <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{labels.payments}</h1>
    </div>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
      <input className="h-11 w-full rounded-xl border bg-white/90 pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-sky-200" placeholder={labels.searchPayments} value={value} onChange={(event) => onChange(event.target.value)} />
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
      <Button className="h-11 text-base" disabled={disabled}>{editing ? "Update Payment" : "Save Payment"}</Button>
      {editing ? <Button type="button" variant="secondary" className="h-11 text-base" onClick={onCancel}>Cancel</Button> : null}
    </div>
  );
}

function Empty({ loading }: { loading: boolean }) {
  return <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">{loading ? "Loading payments" : "No payments found"}</div>;
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
