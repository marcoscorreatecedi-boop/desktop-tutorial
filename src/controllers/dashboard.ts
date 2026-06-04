import { Request, Response } from "express";
import { db } from "../database/client";

export async function getLeads(req: Request, res: Response): Promise<void> {
  const { stage, search } = req.query;

  const leads = await db.lead.findMany({
    where: {
      ...(stage ? { stage: String(stage) } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: String(search) } },
              { phone: { contains: String(search) } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      phone: true,
      name: true,
      interest: true,
      stage: true,
      isHuman: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });

  res.json(leads);
}

export async function getLeadMessages(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!lead) {
    res.status(404).json({ error: "Lead não encontrado" });
    return;
  }

  res.json(lead);
}

export async function updateLead(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { stage, notes, isHuman, name } = req.body;

  const lead = await db.lead.update({
    where: { id },
    data: {
      ...(stage !== undefined ? { stage } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(isHuman !== undefined ? { isHuman } : {}),
      ...(name !== undefined ? { name } : {}),
    },
  });

  res.json(lead);
}

export async function getFunnelStats(req: Request, res: Response): Promise<void> {
  const stages = ["NOVO", "QUALIFICADO", "INTERESSADO", "VISITA_AGENDADA", "PROPOSTA", "FECHADO", "PERDIDO"];

  const counts = await Promise.all(
    stages.map(async (stage) => ({
      stage,
      count: await db.lead.count({ where: { stage } }),
    }))
  );

  const total = await db.lead.count();
  const humanQueue = await db.lead.count({ where: { isHuman: true, stage: { not: "FECHADO" } } });

  res.json({ total, humanQueue, funnel: counts });
}
