import express from "express";
import {
  getLatestMeasurement,
  getMeasurementByTimestamp,
  getMeasurementsBetween,
} from "../dataLinkLayer/temp.js";
import { assertIsoDate, assertIsoDateTime, parseHiveId } from "../busLayer/utils.js";
import { pingDatabase } from "../dataLinkLayer/dbutils.js";

function toApiRow(row) {
  return {
    timestamp: row.timestamp,
    temperatureC: Number(row.temperatureC),
    humidity: Number(row.humidity),
  };
}

function sendBadRequest(res, message) {
  return res.status(400).json({ error: message });
}

function buildMeasurementStore(measurementStore) {
  return measurementStore ?? {
    getLatestMeasurement,
    getMeasurementByTimestamp,
    getMeasurementsBetween,
  };
}

export function createHandlers(measurementStore) {
  const store = buildMeasurementStore(measurementStore);

  return {
    healthHandler: async (_req, res) => {
      try {
        await pingDatabase();
        return res.status(200).json({ status: "ok" });
      } catch (error) {
        return res.status(503).json({
          status: "degraded",
          error: error instanceof Error ? error.message : "Database unavailable",
        });
      }
    },
    latestMeasurementHandler: async (req, res) => {
      try {
        const hiveId = parseHiveId(req.query.hiveId);
        const row = await store.getLatestMeasurement(hiveId);

        if (!row) {
          return res.status(404).json({ error: "No measurements found" });
        }

        return res.status(200).json(toApiRow(row));
      } catch (error) {
        return sendBadRequest(res, error.message);
      }
    },
    measurementHandler: async (req, res) => {
      try {
        const hiveId = parseHiveId(req.query.hiveId);
        const timestamp = assertIsoDateTime(req.params.datetime, "datetime");
        const row = await store.getMeasurementByTimestamp(hiveId, timestamp);

        if (!row) {
          return res.status(404).json({ error: "Measurement not found" });
        }

        return res.status(200).json(toApiRow(row));
      } catch (error) {
        return sendBadRequest(res, error.message);
      }
    },
    dayHandler: async (req, res) => {
      try {
        const hiveId = parseHiveId(req.query.hiveId);
        const date = assertIsoDate(req.params.date, "date");
        const start = `${date}T00:00:00Z`;
        const end = `${date}T23:59:59Z`;
        const rows = await store.getMeasurementsBetween(hiveId, start, end);

        return res.status(200).json({
          date,
          data: rows.map((row) => [row.timestamp, String(row.temperatureC), String(row.humidity)]),
        });
      } catch (error) {
        return sendBadRequest(res, error.message);
      }
    },
    twoWeeksHandler: async (req, res) => {
      try {
        const hiveId = parseHiveId(req.query.hiveId);
        const latest = await store.getLatestMeasurement(hiveId);

        if (!latest) {
          return res.status(200).json({ data: [] });
        }

        const endDate = new Date(latest.timestamp);
        const startDate = new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000);
        const rows = await store.getMeasurementsBetween(
          hiveId,
          startDate.toISOString(),
          endDate.toISOString(),
        );

        return res.status(200).json({
          data: rows.map((row) => [row.timestamp, String(row.temperatureC), String(row.humidity)]),
        });
      } catch (error) {
        return sendBadRequest(res, error.message);
      }
    },
  };
}

export function createApp(measurementStore = {
  getLatestMeasurement,
  getMeasurementByTimestamp,
  getMeasurementsBetween,
}) {
  const app = express();
  const handlers = createHandlers(measurementStore);

  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  app.get("/health", handlers.healthHandler);
  app.get("/measurement/latest", handlers.latestMeasurementHandler);
  app.get("/measurement/:datetime", handlers.measurementHandler);
  app.get("/day/:date", handlers.dayHandler);
  app.get("/two-weeks", handlers.twoWeeksHandler);

  return app;
}

export async function startServer() {
  const app = createApp();
  const port = Number(process.env.PORT ?? 3001);

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
      resolve(server);
    });
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  startServer().catch((error) => {
    console.error("Failed to start backend:", error);
    process.exit(1);
  });
}
