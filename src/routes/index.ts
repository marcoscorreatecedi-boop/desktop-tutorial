import { Router, Request, Response, NextFunction } from "express";
import { webhookHandler } from "../controllers/webhook";
import { getLeads, getLeadMessages, updateLead, getFunnelStats } from "../controllers/dashboard";
import { config } from "../config";

const router = Router();

// Webhook da Evolution API (sem autenticação)
router.post("/webhook", webhookHandler);

// Middleware de autenticação do painel
function auth(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["x-api-key"] || req.query.key;
  if (key !== config.dashboardSecret) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }
  next();
}

// Rotas do painel CRM
router.get("/leads", auth, getLeads);
router.get("/leads/:id", auth, getLeadMessages);
router.patch("/leads/:id", auth, updateLead);
router.get("/stats", auth, getFunnelStats);

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", empresa: "Civilnobre Engenharia" });
});

export default router;
