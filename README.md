# WhatsApp Funnel AI

Bot de WhatsApp que usa a **API oficial do WhatsApp Business (Cloud API)** para:

- Organizar automaticamente os contatos em um **funil de vendas** (novo → qualificando → interessado → negociação → fechado/perdido).
- Responder mensagens automaticamente usando **Claude (Anthropic)**.
- Mostrar o funil em um **dashboard** simples (`/dashboard`).

> Não existe um "plugin" que rode dentro do app oficial do WhatsApp — a Meta não permite isso. Este projeto usa a API oficial (WhatsApp Cloud API): seu número de WhatsApp Business passa a ser controlado por este servidor, que recebe e envia mensagens em seu nome.

## 1. Pré-requisitos

- Uma conta no [Meta for Developers](https://developers.facebook.com/).
- Um número de telefone que possa ser registrado no WhatsApp Business (não pode estar em uso normal no app comum ao mesmo tempo).
- Uma chave de API da [Anthropic Console](https://console.anthropic.com/).
- Node.js 18+ instalado.

## 2. Configurar o WhatsApp Business (Cloud API)

1. Crie um app em [developers.facebook.com/apps](https://developers.facebook.com/apps) do tipo "Business".
2. Adicione o produto **WhatsApp** ao app.
3. Em **WhatsApp > Configuração da API**, anote:
   - `Phone Number ID`
   - O **token de acesso temporário** (ou gere um token permanente via System User, para produção).
4. Em **WhatsApp > Configuração**, configure o **Webhook**:
   - URL: `https://SEU_DOMINIO/webhook`
   - Verify Token: o mesmo valor que você colocar em `WHATSAPP_VERIFY_TOKEN` no `.env`.
   - Inscreva-se no campo `messages`.

   Para testar localmente antes de ter um domínio público, use o [ngrok](https://ngrok.com/) (`ngrok http 3000`) e use a URL gerada por ele.

## 3. Configurar o projeto

```bash
cp .env.example .env
# edite o .env com os valores obtidos nos passos anteriores
npm install
npm start
```

O servidor inicia em `http://localhost:3000` (ou na porta definida em `PORT`).

## 4. Testar

1. Envie uma mensagem de WhatsApp para o número configurado no Meta for Developers.
2. O servidor deve responder automaticamente usando o Claude.
3. Acesse `http://localhost:3000/dashboard` para ver os contatos organizados por estágio do funil.

## 5. Como funciona o funil

Os estágios estão definidos em `src/stages.js`:

`novo → qualificando → interessado → negociacao → fechado/perdido`

A cada mensagem recebida, o histórico da conversa e o estágio atual do contato são enviados ao Claude, que:

1. Gera uma resposta natural para o lead.
2. Opcionalmente chama a ferramenta `set_funnel_stage` para mover o contato para outro estágio do funil, quando percebe que a conversa avançou (ou regrediu).

Para mudar o texto/comportamento do agente de vendas, edite o prompt em `src/claude.js` (`buildSystemPrompt`).

## 6. Deploy 100% pelo celular (sem usar computador)

Este repositório já inclui um `render.yaml`, então você pode publicar direto pelo navegador do celular, sem instalar nada:

1. Acesse [render.com](https://render.com) no navegador do celular e crie uma conta (pode ser com login do GitHub).
2. Toque em **New > Blueprint** e conecte sua conta do GitHub, escolhendo o repositório `desktop-tutorial` (branch `claude/whatsapp-funnel-ai-plugin-cimhkj`).
3. O Render vai detectar o `render.yaml` automaticamente e pedir para preencher as variáveis de ambiente:
   - `WHATSAPP_VERIFY_TOKEN` — invente uma senha
   - `WHATSAPP_TOKEN` — token copiado no Meta for Developers
   - `WHATSAPP_PHONE_NUMBER_ID` — id copiado no Meta for Developers
   - `ANTHROPIC_API_KEY` — sua chave da Anthropic
4. Toque em **Apply/Deploy**. Em alguns minutos o Render gera uma URL pública, tipo `https://whatsapp-funnel-ai.onrender.com`.
5. Volte no Meta for Developers (também pelo navegador do celular) e configure o Webhook com:
   - URL: `https://whatsapp-funnel-ai.onrender.com/webhook`
   - Verify Token: o mesmo que você colocou em `WHATSAPP_VERIFY_TOKEN`
6. Pronto — não precisa de computador, ngrok nem nada rodando localmente. O dashboard fica em `https://whatsapp-funnel-ai.onrender.com/dashboard`.

> No plano free do Render o serviço "dorme" depois de um tempo sem uso e demora alguns segundos para acordar na próxima mensagem. Se isso for um problema, dá para trocar para um plano pago ou usar o Railway (também tem importação de blueprint similar).

## 7. Produção

- Use um **token de acesso permanente** (via System User no Business Manager), não o temporário de 24h.
- Hospede o servidor em qualquer provedor com HTTPS (Render, Railway, Fly.io, VPS, etc.).
- Os dados dos contatos ficam em `data/store.json` (arquivo local). Para uso em produção com volume maior, troque `src/store.js` por um banco de dados real (Postgres, etc.).
