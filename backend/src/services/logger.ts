type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const secretKeys = ["password", "token", "authorization", "secret", "hash", "cookie"];

export function logInfo(message: string, context: LogContext = {}) {
  writeLog("info", message, context);
}

export function logWarn(message: string, context: LogContext = {}) {
  writeLog("warn", message, context);
}

export function logError(message: string, context: LogContext = {}) {
  writeLog("error", message, context);
}

function writeLog(level: LogLevel, message: string, context: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(sanitizeForLog(context) as LogContext)
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function sanitizeForLog(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
      key,
      isSecretKey(key) ? "[REDACTED]" : sanitizeForLog(nestedValue)
    ])
  );
}

function isSecretKey(key: string) {
  const normalized = key.toLowerCase();
  return secretKeys.some((secretKey) => normalized.includes(secretKey));
}
