import app from "./app";
import { database } from "./config/database";

const PORT = 3000;

const logInfo = (message: string): void => {
  console.info(`[secure-fortress-api] ${new Date().toISOString()} ${message}`);
};

const logError = (message: string, error: unknown): void => {
  console.error(`[secure-fortress-api] ${new Date().toISOString()} ${message}`, error);
};

const server = app.listen(PORT, () => {
  logInfo(`Server started on port ${PORT}`);
});

process.on("unhandledRejection", (reason) => {
  logError("Unhandled rejection detected.", reason);
});

process.on("uncaughtException", (error) => {
  logError("Uncaught exception detected. Shutting down server.", error);
  server.close(() => {
    void database.destroy();
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  logInfo("SIGTERM received. Closing server.");
  server.close(() => {
    void database.destroy();
    process.exit(0);
  });
});
