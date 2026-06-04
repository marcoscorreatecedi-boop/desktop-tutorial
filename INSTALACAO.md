# Guia de Instalação — Civilnobre CRM

## O que você vai precisar

1. **VPS na Hostinger** (plano KVM 1 em diante)
2. **Chave da API Anthropic** (Claude) — https://console.anthropic.com
3. **Número de WhatsApp** dedicado para o sistema

---

## Passo 1 — Contratar VPS

1. Acesse https://hostinger.com.br
2. Vá em **VPS Hosting**
3. Escolha o plano **KVM 1** (~R$ 30/mês)
4. Sistema operacional: **Ubuntu 22.04**
5. Anote o **IP do servidor** e a **senha root** que vai receber por e-mail

---

## Passo 2 — Acessar o servidor

No Windows, baixe o **PuTTY** (putty.org) e conecte com:
- Host: `SEU_IP`
- Porta: `22`
- Login: `root`
- Senha: a que veio no e-mail

---

## Passo 3 — Instalar Docker

Cole esses comandos um por um no terminal:

```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
apt install docker-compose -y
```

---

## Passo 4 — Subir o sistema

```bash
git clone https://github.com/SEU_USUARIO/desktop-tutorial.git civilnobre
cd civilnobre
```

Edite o arquivo `docker-compose.yml` e substitua:
- `SUA_CHAVE_EVOLUTION_AQUI` → qualquer senha que você inventar (ex: `CivilnobreWhats2024`)
- `SUA_CHAVE_ANTHROPIC_AQUI` → sua chave do site console.anthropic.com
- `5531999999999` → seu número com código do país + DDD (sem + ou espaços)
- `SUA_SENHA_AQUI` → senha para acessar o painel (ex: `CivilnobreAdmin`)

Depois rode:

```bash
docker-compose up -d
```

---

## Passo 5 — Conectar o WhatsApp

1. Abra no navegador: `http://SEU_IP:8080`
2. Faça login com a chave que você definiu
3. Crie uma instância chamada `civilnobre`
4. Escaneie o QR code com o WhatsApp do número dedicado
5. Pronto! O WhatsApp está conectado.

---

## Passo 6 — Configurar o Webhook

Na interface da Evolution API:
1. Vá em **Webhook** da instância `civilnobre`
2. URL: `http://SEU_IP:3000/webhook`
3. Eventos: marque `MESSAGES_UPSERT`
4. Salve

---

## Passo 7 — Testar

Mande uma mensagem para o número conectado e veja a resposta automática!

---

## Acessar o Painel de Leads

No navegador:
```
http://SEU_IP:3000/leads?key=SUA_SENHA
http://SEU_IP:3000/stats?key=SUA_SENHA
```

---

## Suporte

Se travar em algum passo, anote a mensagem de erro e peça ajuda.
