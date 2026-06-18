const Anthropic = require('@anthropic-ai/sdk');
const { STAGES } = require('./stages');

let client = null;
function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const tools = [
  {
    name: 'set_funnel_stage',
    description: 'Atualiza o estágio do funil de vendas do contato com base no andamento da conversa.',
    input_schema: {
      type: 'object',
      properties: {
        stage: { type: 'string', enum: STAGES },
      },
      required: ['stage'],
    },
  },
];

function buildSystemPrompt({ stage, contactName }) {
  return [
    'Você é um assistente de vendas que conversa com leads pelo WhatsApp em nome de uma empresa.',
    `Estágios possíveis do funil: ${STAGES.join(', ')}.`,
    'Responda sempre em português, de forma natural, curta e útil, conduzindo o lead para o próximo estágio do funil quando fizer sentido.',
    'Sempre que perceber, pela conversa, que o estágio do lead deve mudar, chame a ferramenta "set_funnel_stage" com o novo estágio.',
    `Contato atual: ${contactName || 'sem nome informado'}. Estágio atual: ${stage}.`,
  ].join('\n');
}

async function generateReply({ history, stage, contactName }) {
  const messages = history
    .filter((entry) => entry.content)
    .map((entry) => ({
      role: entry.role === 'assistant' ? 'assistant' : 'user',
      content: entry.content,
    }));

  const response = await getClient().messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: buildSystemPrompt({ stage, contactName }),
    tools,
    messages,
  });

  let reply = '';
  let newStage = null;

  for (const block of response.content) {
    if (block.type === 'text') {
      reply += block.text;
    } else if (block.type === 'tool_use' && block.name === 'set_funnel_stage') {
      newStage = block.input?.stage;
    }
  }

  if (!reply) {
    reply = 'Obrigado pela sua mensagem! Em breve alguém da nossa equipe continua essa conversa.';
  }

  return { reply, newStage };
}

module.exports = { generateReply };
