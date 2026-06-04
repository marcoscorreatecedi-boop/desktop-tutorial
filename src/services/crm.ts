import { db } from "../database/client";
import { generateReply, extractLeadInfo } from "./ai";
import { sendMessage, notifyHuman } from "./whatsapp";

const HUMAN_TRIGGERS = [
  "falar com atendente",
  "falar com pessoa",
  "falar com humano",
  "atendimento humano",
  "quero falar com alguém",
  "transferir",
  "corretor",
];

function wantsHuman(text: string): boolean {
  const lower = text.toLowerCase();
  return HUMAN_TRIGGERS.some((t) => lower.includes(t));
}

export async function handleIncomingMessage(
  phone: string,
  text: string
): Promise<void> {
  let lead = await db.lead.findUnique({ where: { phone } });

  if (!lead) {
    lead = await db.lead.create({ data: { phone } });
  }

  await db.message.create({
    data: { leadId: lead.id, from: "client", content: text },
  });

  if (lead.isHuman) {
    await notifyHuman(phone, lead.name || phone, text);
    return;
  }

  if (wantsHuman(text)) {
    await db.lead.update({ where: { id: lead.id }, data: { isHuman: true } });
    const reply =
      "Claro! Vou te passar para um dos nossos atendentes agora. Em instantes alguém vai entrar em contato com você. 👍";
    await sendMessage(phone, reply);
    await db.message.create({
      data: { leadId: lead.id, from: "bot", content: reply },
    });
    await notifyHuman(phone, lead.name || phone, text);
    return;
  }

  const history = await db.message.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const formattedHistory = history.slice(0, -1).map((m) => ({
    role: (m.from === "client" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));

  const reply = await generateReply(formattedHistory, text);

  await sendMessage(phone, reply);
  await db.message.create({
    data: { leadId: lead.id, from: "bot", content: reply },
  });

  // Atualiza info do lead a cada 5 mensagens
  if (history.length % 5 === 0) {
    const fullConversation = history
      .map((m) => `${m.from === "client" ? "Cliente" : "Atendente"}: ${m.content}`)
      .join("\n");

    const info = await extractLeadInfo(fullConversation);
    await db.lead.update({
      where: { id: lead.id },
      data: {
        name: info.name ?? lead.name ?? undefined,
        interest: info.interest ?? lead.interest ?? undefined,
        stage: info.stage ?? lead.stage,
      },
    });
  }
}
