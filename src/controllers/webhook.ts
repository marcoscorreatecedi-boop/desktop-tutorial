import { Request, Response } from "express";
import { handleIncomingMessage } from "../services/crm";

export async function webhookHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body;

    // Evolution API envia o evento dentro de "data"
    const event = body.event || body.type;
    if (event !== "messages.upsert" && event !== "MESSAGES_UPSERT") {
      res.sendStatus(200);
      return;
    }

    const message = body.data?.message || body.message;
    if (!message) {
      res.sendStatus(200);
      return;
    }

    // Ignora mensagens enviadas pelo próprio bot
    if (message.key?.fromMe) {
      res.sendStatus(200);
      return;
    }

    const phone = message.key?.remoteJid?.replace("@s.whatsapp.net", "");
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;

    if (!phone || !text) {
      res.sendStatus(200);
      return;
    }

    // Responde 200 imediatamente para não deixar a Evolution API esperando
    res.sendStatus(200);

    await handleIncomingMessage(phone, text);
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.sendStatus(200);
  }
}
