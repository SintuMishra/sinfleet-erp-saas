import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { logError, logInfo } from "./services/logger.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logInfo("api_started", { port: env.PORT, environment: env.NODE_ENV });
});

async function shutdown(signal: string) {
  logInfo("api_shutdown_started", { signal });

  server.close(async (error) => {
    if (error) {
      logError("api_shutdown_error", { message: error.message });
      process.exit(1);
    }

    await prisma.$disconnect();
    logInfo("api_shutdown_complete", { signal });
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
