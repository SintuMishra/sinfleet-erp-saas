export function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function formatCurrency(value?: unknown) {
  return `Rs. ${Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatNumber(value?: unknown) {
  return Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function safeText(value?: unknown) {
  const text = String(value ?? "").trim();
  return text || "-";
}

export function safeFilename(parts: Array<string | number | Date | null | undefined>, extension: "pdf" | "xlsx") {
  const base = parts
    .map((part) => {
      if (part instanceof Date) return part.toISOString().slice(0, 10);
      return String(part ?? "");
    })
    .join("-")
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 120);

  return `${base || "export"}.${extension}`;
}

export function contentDisposition(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "").replace(/["\\]/g, "");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
