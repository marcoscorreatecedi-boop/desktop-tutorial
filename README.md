# Painel de Atendimento WhatsApp

Painel para organizar o atendimento via WhatsApp: classificação de conversas (categoria + status),
métricas (tempo de resposta, volume, taxa de resolução, SLA) e atribuição automática de agentes
(round-robin) + respostas rápidas.

## Como funciona

- Recebe mensagens do WhatsApp via webhook do **WhatsApp Cloud API** (Meta).
- Guarda contatos, conversas e mensagens em SQLite (`data/atendimento.db`).
- Classifica automaticamente por palavra-chave (vendas/suporte/financeiro) e permite reclassificar manualmente.
- Distribui novas conversas entre agentes ativos (round-robin pelo volume em aberto).
- Calcula métricas em `/api/metrics` e exibe no painel.

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

## Cadastrando agentes

Use a API para cadastrar atendentes (ainda sem tela própria):

```bash
curl -X POST http://localhost:3000/api/agents -H "Content-Type: application/json" -d '{"name":"Maria"}'
```

## Estrutura

- `src/server.js` — servidor Express, webhook e rotas da API.
- `src/db.js` — schema SQLite (contacts, conversations, messages, agents, quick_replies).
- `src/whatsapp.js` — envio de mensagens via Graph API.
- `src/classify.js` — classificação automática por palavra-chave.
- `public/index.html` — painel (lista de conversas, chat, métricas).
