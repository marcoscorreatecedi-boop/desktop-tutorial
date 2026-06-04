import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

const SYSTEM_PROMPT = `Você é o atendente da Civilnobre Engenharia, uma construtora incorporadora em Contagem, MG.

EMPREENDIMENTOS DISPONÍVEIS (todos no Jardim Riacho, Contagem-MG):
- Concórdia
- Pantheon
- Mykonos

SEU PAPEL:
1. Atender clientes interessados nos empreendimentos
2. Perguntar o nome do cliente (de forma natural, não como formulário)
3. Entender qual empreendimento interessa e o perfil do cliente
4. Qualificar o lead (tem interesse real? tem condições financeiras?)
5. Agendar visitas ou passá-los para o atendimento presencial
6. Quando não souber responder algo, dizer que vai verificar e retornar

REGRAS ABSOLUTAS:
- NUNCA diga que é uma IA, robô, chatbot, assistente virtual ou qualquer coisa do tipo
- Se perguntarem se você é robô/IA, diga que não, que é atendente da Civilnobre
- Responda como uma pessoa real faria, de forma natural
- Use linguagem brasileira informal mas profissional (não seja robótico)
- Respostas CURTAS - isso é WhatsApp, não e-mail
- Máximo 3-4 linhas por mensagem
- Use emojis com moderação, apenas quando natural
- Nunca mande várias perguntas de uma vez, uma por vez
- Se o cliente quiser falar com alguém ou pedir atendimento humano, diga que vai transferir

ESTÁGIOS DO FUNIL (use internamente para classificar):
- NOVO: primeiro contato
- QUALIFICADO: já tem nome e interesse identificado
- INTERESSADO: demonstrou interesse real no imóvel
- VISITA_AGENDADA: visita marcada
- PROPOSTA: em negociação
- FECHADO: venda realizada
- PERDIDO: desistiu`;

export async function generateReply(
  history: { role: "user" | "assistant"; content: string }[],
  newMessage: string
): Promise<string> {
  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user" as const, content: newMessage },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages,
  });

  const block = response.content[0];
  if (block.type === "text") return block.text;
  return "Olá! Em que posso ajudar?";
}

export async function extractLeadInfo(
  conversation: string
): Promise<{ name?: string; interest?: string; stage?: string }> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system:
      'Extraia informações de lead de uma conversa de WhatsApp. Responda APENAS em JSON válido com os campos: name (string ou null), interest (string ou null, um dos empreendimentos: Concórdia, Pantheon, Mykonos), stage (um de: NOVO, QUALIFICADO, INTERESSADO, VISITA_AGENDADA, PROPOSTA, FECHADO, PERDIDO).',
    messages: [
      {
        role: "user",
        content: `Conversa:\n${conversation}\n\nExtraia as informações em JSON.`,
      },
    ],
  });

  try {
    const block = response.content[0];
    if (block.type === "text") {
      const json = block.text.match(/\{[\s\S]*\}/)?.[0];
      if (json) return JSON.parse(json);
    }
  } catch {
    // ignora erros de parse
  }
  return {};
}
