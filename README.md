# Painel de Atendimento WhatsApp + CRM de Leads

Painel para organizar o atendimento via WhatsApp e gerir leads: chatbot de triagem, funil de vendas
por empreendimento, classificação de conversas (categoria + status), origem do lead, métricas
completas (tempo de resposta, volume, taxa de resolução/conversão, SLA) e atribuição automática
de agentes (round-robin) + respostas rápidas.

## Como funciona

- Recebe mensagens do WhatsApp via webhook do **WhatsApp Cloud API** (Meta).
- Guarda contatos, conversas, mensagens, empreendimentos e leads em SQLite (`data/atendimento.db`).
- **Chatbot de triagem**: na primeira mensagem de um contato, envia automaticamente uma lista com
  os empreendimentos cadastrados e pergunta qual interessa. A resposta vira o lead já vinculado
  ao empreendimento certo, sem precisar de atendente humano nessa etapa.
- **Funil de vendas**: cada conversa tem uma etapa (`novo_lead` → `qualificação` → `visita/proposta`
  → `negociação` → `ganho`/`perdido`), editável manualmente ou via Kanban no painel.
- **Origem do lead**: capturada automaticamente quando o cliente vem de um anúncio clique-para-WhatsApp
  (Facebook/Instagram Ads, via campo `referral` do webhook) ou definida manualmente.
- Classifica automaticamente por palavra-chave (vendas/suporte/financeiro) e permite reclassificar manualmente.
- Distribui novas conversas entre agentes ativos (round-robin pelo volume em aberto).
- Calcula métricas em `/api/metrics` (tempo de resposta, conversão do funil, leads por origem/empreendimento)
  e exibe no painel, em abas: Conversas, Funil (Kanban), Métricas, Empreendimentos.

## Pré-requisitos: migrar o número atual para o Cloud API

O app comum do WhatsApp Business não tem API. Para automatizar sem perder o número atual:

1. Crie uma conta em https://developers.facebook.com e um App do tipo "Business".
2. Adicione o produto **WhatsApp** ao app.
3. Em "Configuração da API", use o **Embedded Signup** para conectar seu número de telefone atual
   (a Meta oferece um modo de coexistência que mantém o app do celular funcionando junto com a API,
   dependendo da região/conta — confirme a disponibilidade na sua conta).
4. Anote: `WHATSAPP_TOKEN` (token de acesso), `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_BUSINESS_ACCOUNT_ID`.
5. Configure o Webhook do app apontando para `https://SEU_DOMINIO/webhook`, usando o mesmo valor de
   `WHATSAPP_VERIFY_TOKEN` definido no seu `.env`. Inscreva-se no campo `messages`.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com suas credenciais
npm start
```

Acesse `http://localhost:3000`.

Para receber webhooks da Meta em desenvolvimento local, exponha a porta com um túnel (ex: ngrok)
e registre a URL pública no painel do app da Meta.

## Cadastrando agentes e empreendimentos

Agentes ainda não têm tela própria, cadastre via API:

```bash
curl -X POST http://localhost:3000/api/agents -H "Content-Type: application/json" -d '{"name":"Maria"}'
```

Empreendimentos têm tela própria no painel (aba "Empreendimentos"), mas também dá pra usar a API:

```bash
curl -X POST http://localhost:3000/api/empreendimentos -H "Content-Type: application/json" -d '{"nome":"Residencial Bela Vista"}'
```

Cadastre os empreendimentos **antes** de divulgar o número — é a lista que o chatbot oferece
automaticamente para o lead escolher na primeira mensagem.

## Estrutura

- `src/server.js` — servidor Express, webhook e rotas da API.
- `src/db.js` — schema SQLite (contacts, conversations, messages, agents, empreendimentos, quick_replies).
- `src/constants.js` — etapas do funil e origens de lead.
- `src/whatsapp.js` — envio de mensagens (texto e listas interativas) via Graph API.
- `src/bot.js` — chatbot de triagem (pergunta o empreendimento e captura o lead).
- `src/classify.js` — classificação automática por palavra-chave.
- `public/index.html` — painel (conversas, funil Kanban, métricas, empreendimentos).
