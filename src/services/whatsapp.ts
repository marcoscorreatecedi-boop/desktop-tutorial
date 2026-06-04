import axios from "axios";
import { config } from "../config";

const api = axios.create({
  baseURL: config.evolutionApi.url,
  headers: {
    apikey: config.evolutionApi.key,
    "Content-Type": "application/json",
  },
});

export async function sendMessage(phone: string, text: string): Promise<void> {
  await api.post(`/message/sendText/${config.evolutionApi.instance}`, {
    number: phone,
    text,
  });
}

export async function notifyHuman(
  clientPhone: string,
  clientName: string,
  lastMessage: string
): Promise<void> {
  if (!config.humanPhone) return;

  const text =
    `🔔 *Novo lead para atendimento humano*\n\n` +
    `👤 Cliente: ${clientName || "Desconhecido"}\n` +
    `📱 Número: ${clientPhone}\n\n` +
    `💬 Última mensagem:\n"${lastMessage}"\n\n` +
    `_Acesse o painel para ver o histórico completo._`;

  await sendMessage(config.humanPhone, text);
}
