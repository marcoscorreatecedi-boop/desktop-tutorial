# CivilNobre - Diário de Obra Inteligente

App para mapear fotos e áudios de diário de obra, gerando automaticamente **caminho crítico (CPM)** e **cronograma físico** com análise de IA.

## Funcionalidades

- **Diário de Obra**: Upload de fotos e áudios de cada etapa da construção
- **Análise por IA (Claude)**: Identifica etapa construtiva, progresso, problemas e recomendações automaticamente
- **Cronograma Físico**: Gráfico de Gantt com progresso planejado vs. real
- **Caminho Crítico (CPM)**: Cálculo automático com passagem direta/reversa (ES, EF, LS, LF, Folga)
- **Dashboard**: Visão geral do projeto com estatísticas

## Etapas Construtivas

O sistema gerencia 11 etapas com dependências pré-configuradas:

1. Terraplanagem e Fundação
2. Estrutura (pilares, vigas, laje)
3. Alvenaria e Vedação
4. Cobertura
5. Instalações Elétricas
6. Instalações Hidráulicas
7. Revestimentos Externos
8. Revestimentos Internos
9. Esquadrias (portas e janelas)
10. Acabamentos e Pintura
11. Limpeza e Entrega

## Tecnologias

- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **IA**: Claude (Anthropic) para análise de imagens e áudios
- **Algoritmo CPM**: Passagem direta e reversa para cálculo de folgas e caminho crítico

## Como Rodar

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- Chave da API Anthropic

### Instalação

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Inicialização

```bash
# Configurar API key
export ANTHROPIC_API_KEY="sua-chave-aqui"

# Iniciar tudo
./start.sh
```

Acesse: **http://localhost:5173**

API docs: **http://localhost:8000/docs**

## Estrutura do Projeto

```
.
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── database.py          # SQLite + SQLAlchemy
│   │   ├── models/models.py     # ORM models
│   │   ├── routers/             # Endpoints REST
│   │   └── services/
│   │       ├── ai_service.py    # Integração Claude + CPM
│   │       └── schedule_service.py  # Cronograma e seeds
│   └── uploads/                 # Fotos e áudios enviados
├── frontend/
│   └── src/
│       ├── pages/               # Dashboard, Diário, Cronograma, Caminho Crítico
│       ├── components/          # Sidebar, ProgressBar, StatusBadge
│       ├── lib/api.ts           # Cliente HTTP
│       └── types/index.ts       # TypeScript types
└── start.sh                     # Script de inicialização
```
