"use client";

import { Edit, Handshake, Search, Trash2 } from "lucide-react";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CompanyShell } from "@/components/company/company-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/premium/data-table";
import {
  type ClientPayload,
  type ClientStatus,
  type CompanyClient,
  createCompanyClient,
  deleteCompanyClient,
  fetchCompanyClients,
  updateCompanyClient,
  updateCompanyClientStatus
} from "@/lib/company-directory-api";
import { companyLabels } from "@/lib/company-labels";

const labels = companyLabels.en;
const statuses: Array<ClientStatus | "ALL"> = ["ALL", "ACTIVE", "INACTIVE", "BLOCKED"];

function blankClientForm(): ClientPayload {
  return {
    clientName: "",
    contactPerson: "",
    phone: "",
    alternatePhone: "",
    email: "",
    gstNumber: "",
    billingAddress: "",
    city: "",
    state: "",
    paymentTerms: "",
    status: "ACTIVE",
    notes: ""
  };
}

export default function CompanyClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<ClientStatus | "ALL">("ALL");
  const [form, setForm] = React.useState<ClientPayload>(() => blankClientForm());
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");

  const clientsQuery = useQuery({
    queryKey: ["company-clients", search, status],
    queryFn: () => fetchCompanyClients({ search, status, limit: 50 })
  });

  const createMutation = useMutation({
    mutationFn: createCompanyClient,
    onSuccess: async () => {
      setForm(blankClientForm());
      setMessage("Client added.");
      await queryClient.invalidateQueries({ queryKey: ["company-clients"] });
    },
    onError: () => setMessage("Client could not be added. Check phone and GST number.")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClientPayload }) => updateCompanyClient(id, payload),
    onSuccess: async () => {
      setEditingId(null);
      setForm(blankClientForm());
      setMessage("Client updated.");
      await queryClient.invalidateQueries({ queryKey: ["company-clients"] });
    },
    onError: () => setMessage("Client could not be updated.")
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: ClientStatus }) => updateCompanyClientStatus(id, nextStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company-clients"] })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company-clients"] })
  });

  const clients = clientsQuery.data?.items ?? [];
  const summary = clientsQuery.data?.summary;

  function updateForm<K extends keyof ClientPayload>(key: K, value: ClientPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const payload = removeEmptyOptionalFields(form);

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }

    createMutation.mutate(payload);
  }

  function startEdit(client: CompanyClient) {
    setEditingId(client.id);
    setMessage("");
    setForm({
      clientName: client.clientName,
      contactPerson: client.contactPerson ?? "",
      phone: client.phone ?? "",
      alternatePhone: client.alternatePhone ?? "",
      email: client.email ?? "",
      gstNumber: client.gstNumber ?? "",
      billingAddress: client.billingAddress ?? "",
      city: client.city ?? "",
      state: client.state ?? "",
      paymentTerms: client.paymentTerms ?? "",
      status: client.status,
      notes: client.notes ?? ""
    });
  }

  return (
    <CompanyShell>
      <section className="grid gap-6">
        <Header title={labels.clients} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Clients" value={summary?.totalClients ?? 0} />
          <SummaryCard label="Active" value={summary?.activeClients ?? 0} />
          <SummaryCard label="Inactive" value={summary?.inactiveClients ?? 0} />
          <SummaryCard label="Blocked" value={summary?.blockedClients ?? 0} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <div className="grid gap-4">
            <Card>
              <CardContent className="grid gap-3 pt-5 md:grid-cols-[1fr_180px]">
                <SearchInput value={search} onChange={setSearch} placeholder={labels.searchClients} />
                <StatusFilter value={status} onChange={(value) => setStatus(value as ClientStatus | "ALL")} options={statuses} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client List</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {clients.map((client) => (
                  <div key={client.id} className="grid gap-3 premium-record rounded-2xl p-4 md:grid-cols-[1fr_auto]">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-lg font-semibold">{client.clientName}</p>
                        <p className="text-sm text-muted-foreground">{client.phone}</p>
                      </div>
                      <div>
                        <p className="font-medium">{client.contactPerson || "Contact pending"}</p>
                        <p className="text-sm text-muted-foreground">{client.city || client.state ? `${client.city ?? ""} ${client.state ?? ""}` : "Location pending"}</p>
                      </div>
                      <div>
                        <StatusBadge status={client.status} />
                        <p className="mt-2 text-xs text-muted-foreground">{client.gstNumber || "GST not added"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button variant="secondary" size="icon" aria-label="Edit client" onClick={() => startEdit(client)}>
                        <Edit className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <select
                        className="h-10 rounded-xl border bg-white/90 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                        value={client.status}
                        onChange={(event) =>
                          statusMutation.mutate({ id: client.id, nextStatus: event.target.value as ClientStatus })
                        }
                        aria-label="Update client status"
                      >
                        {statuses
                          .filter((item): item is ClientStatus => item !== "ALL")
                          .map((item) => (
                            <option key={item} value={item}>
                              {pretty(item)}
                            </option>
                          ))}
                      </select>
                      <ConfirmDialog
                        title="Remove client?"
                        description={`This will soft delete ${client.clientName}. Ledger and trip history remain available.`}
                        onConfirm={() => deleteMutation.mutate(client.id)}
                      >
                        <Button variant="ghost" size="icon" aria-label="Remove client">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </div>
                ))}
                {!clients.length ? (
                  <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
                    {clientsQuery.isLoading ? "Loading clients" : "No clients found"}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Handshake className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>{editingId ? labels.editClient : labels.createClient}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleSubmit}>
                <FormInput label="Client Name" value={form.clientName} onChange={(value) => updateForm("clientName", value)} />
                <FormInput
                  label="Contact Person"
                  value={form.contactPerson ?? ""}
                  onChange={(value) => updateForm("contactPerson", value)}
                  required={false}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Phone" value={form.phone} onChange={(value) => updateForm("phone", value)} />
                  <FormInput
                    label="Alternate Phone"
                    value={form.alternatePhone ?? ""}
                    onChange={(value) => updateForm("alternatePhone", value)}
                    required={false}
                  />
                </div>
                <FormInput label="Email" value={form.email ?? ""} onChange={(value) => updateForm("email", value)} type="email" required={false} />
                <FormInput label="GST Number" value={form.gstNumber ?? ""} onChange={(value) => updateForm("gstNumber", value)} required={false} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="City" value={form.city ?? ""} onChange={(value) => updateForm("city", value)} required={false} />
                  <FormInput label="State" value={form.state ?? ""} onChange={(value) => updateForm("state", value)} required={false} />
                </div>
                <FormInput
                  label="Payment Terms"
                  value={form.paymentTerms ?? ""}
                  onChange={(value) => updateForm("paymentTerms", value)}
                  required={false}
                />
                <SelectField
                  label="Status"
                  value={form.status}
                  options={statuses.filter((item): item is ClientStatus => item !== "ALL")}
                  onChange={(value) => updateForm("status", value as ClientStatus)}
                />
                <TextArea label="Billing Address" value={form.billingAddress ?? ""} onChange={(value) => updateForm("billingAddress", value)} />
                <TextArea label="Notes" value={form.notes ?? ""} onChange={(value) => updateForm("notes", value)} />
                {message ? <p className="rounded-md border p-3 text-sm text-muted-foreground">{message}</p> : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button className="h-11 text-base" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? "Update Client" : "Add Client"}
                  </Button>
                  {editingId ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 text-base"
                      onClick={() => {
                        setEditingId(null);
                        setForm(blankClientForm());
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

function removeEmptyOptionalFields(form: ClientPayload): ClientPayload {
  return {
    ...form,
    contactPerson: form.contactPerson || undefined,
    alternatePhone: form.alternatePhone || undefined,
    email: form.email || undefined,
    gstNumber: form.gstNumber || undefined,
    billingAddress: form.billingAddress || undefined,
    city: form.city || undefined,
    state: form.state || undefined,
    paymentTerms: form.paymentTerms || undefined,
    notes: form.notes || undefined
  };
}

function Header({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{labels.companyPanel}</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{title}</h1>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary">English</Button>
        <Button variant="secondary">Hindi Ready</Button>
      </div>
    </div>
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

function StatusBadge({ status }: { status: ClientStatus }) {
  const className =
    status === "ACTIVE"
      ? "border-primary/30 bg-primary/10 text-primary"
      : status === "BLOCKED"
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
