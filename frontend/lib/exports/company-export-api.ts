import { apiClient } from "@/lib/api-client";

export type ExportParams = Record<string, string | number | undefined>;

export async function downloadCompanyExport(path: string, fallbackFilename: string, params?: ExportParams) {
  const response = await apiClient.get<Blob>(path, {
    params: cleanParams(params ?? {}),
    responseType: "blob"
  });

  const filename = filenameFromDisposition(response.headers["content-disposition"]) ?? fallbackFilename;
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function cleanParams(params: ExportParams) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));
}

function filenameFromDisposition(value?: string) {
  if (!value) return null;
  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return value.match(/filename="([^"]+)"/i)?.[1] ?? null;
}
