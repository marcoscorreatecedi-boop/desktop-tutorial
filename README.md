# CivilNobre · Pedidos de Granito e Pedras

Aplicativo web para gerenciar os pedidos de granito das obras da CivilNobre Engenharia:
bancadas, peitoris, soleiras, pedras de churrasqueira, portais e mais.

**Acesse o app:** https://marcoscorreatecedi-boop.github.io/desktop-tutorial/

## O que ele faz

- **Ficha completa de cada peça**: tipo de pedra e cor, comprimento, largura, espessura,
  rodabanca (altura e lados), testeira/saia, parte úmida e parte seca, posição do bojo/cuba
  (embutida, sobrepor, esculpida), friso, lados com polimento, pingadeira, transpasse etc.
  O que não tiver, fica zero.
- **Desenho técnico automático**: conforme as medidas são preenchidas, o app gera a vista
  de cima da peça com cotas, cubas, rodabanca, partes úmida/seca e bordas polidas.
- **Status em quadro (kanban)**: A pedir → Pedido → Comprado → Fabricado → Entregue →
  Instalado → Conferido, com histórico de quem mudou e quando.
- **Ficha para impressão**: gera uma folha pronta para entregar ao marmorista.
- **Acompanhamento simultâneo**: a nuvem rápida da equipe (ntfy.sh, sem conta) já vem
  ligada — todos veem as mudanças em tempo real. Opcionalmente, dá para plugar um banco
  Google Firebase (gratuito) para armazenamento mais robusto e privado.
- **Resumo para WhatsApp**: botão 📲 gera o resumo por obra/apartamento com totais,
  pronto para colar no grupo.
- **Sem custo**: hospedado no GitHub Pages (grátis) + banco Firebase no plano gratuito.

## Como ativar a sincronização em tempo real (uma única vez)

1. Entre em https://console.firebase.google.com com uma conta Google e crie um projeto.
2. Menu **Criação → Firestore Database → Criar banco de dados** (modo de teste,
   local `southamerica-east1`).
3. Na tela inicial do projeto, clique no ícone **`</>`** (app da Web) e copie o
   objeto `firebaseConfig`.
4. No app, clique em **⚙️ Sincronização**, cole a configuração e ative.
5. Clique em **🔗 Gerar link para a equipe** e mande no WhatsApp — quem abrir o link
   já entra sincronizado, sem configurar nada.

## Estrutura

- `app/index.html` — o aplicativo completo (HTML + CSS + JS, sem dependências)
- `app/logo.svg` — logomarca CivilNobre em vetor
- `.github/workflows/deploy-pages.yml` — publicação automática no GitHub Pages
