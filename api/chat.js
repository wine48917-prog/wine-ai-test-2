import { maintenanceGuard } from '../src/lib/site-control.js';
import { chat, streamChat } from "../src/lib/api-handler.js";
import { applyCORS, isOriginAllowed } from "../src/lib/cors.js";

export const config = {
  api: { bodyParser: { sizeLimit: "8mb" } }
};

export default async function handler(req, res) {
  applyCORS(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (await maintenanceGuard(req, res)) return;
  if (!isOriginAllowed(req)) return res.status(403).json({ success: false, error: "Origin not allowed" });

  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
    if (url.searchParams.get("stream") === "1" || req.headers.accept?.includes("text/event-stream")) {
      return streamChat(req, res);
    }
    return chat(req, res);
  } catch (error) {
    console.error("[FATAL CRASH]", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }
}
