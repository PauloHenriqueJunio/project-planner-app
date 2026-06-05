# Project Planner App

Aplicativo para planejamento e acompanhamento de projetos pessoais/acadêmicos com:

- geracao de etapas e sub-etapas por IA
- raspagem web para contexto do tema
- chat por sub-tarefa ("Como fazer?")
- progresso de tarefas e sub-tarefas

Frontend: React Native + Expo (web/mobile)
Backend: Python + FastAPI (scraping + IA)

## Status Atual

- Dashboard com projetos persistidos
- Criacao de projeto com etapas/sub-etapas manuais
- Opcao de preencher etapas via IA (`/plan`)
- Edicao e exclusao de projetos na tela inicial
- Detalhe do projeto com concluir/reabrir etapa e sub-etapa
- Chat de IA por sub-tarefa (`/chat`)

## Estrutura do Repositorio

```text
project-planner-app/
├── app/                      # Frontend Expo/React Native
│   ├── App.js
│   ├── package.json
│   └── src/
│       ├── constants/
│       ├── context/
│       └── screens/
├── scraper/                  # Backend FastAPI + scraping + IA
│   ├── app.py
│   ├── scrape_service.py
│   ├── groq_client.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
└── README.md
```

## Requisitos

- Node.js 20+ (recomendado para Expo SDK 54)
- Python 3.10+
- pip

## Como Rodar

### 1) Backend (FastAPI)

```bash
cd scraper
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
playwright install
cp .env.example .env
```

Edite `scraper/.env` e configure sua chave:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_API_BASE=https://api.groq.ai
GROQ_MODEL=llama-3
```

Suba a API:

```bash
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

### 2) Frontend (Expo)

```bash
cd app
npm install
npx expo install react-dom react-native-web
npm run web
```

## Endpoints da API

### POST `/scrape`

Entrada:

```json
{ "theme": "empreendedorismo" }
```

Saida:

```json
{ "theme": "empreendedorismo", "scraped": "..." }
```

### POST `/plan`

Gera plano estruturado com etapas/sub-etapas.

Entrada:

```json
{ "theme": "abrir loja de camisetas" }
```

Saida (exemplo):

```json
{
  "theme": "abrir loja de camisetas",
  "plan": {
    "title": "Projeto Exemplo",
    "steps": [
      { "title": "Planejamento", "subtasks": ["A", "B"] },
      { "title": "Execucao", "subtasks": ["C", "D"] }
    ]
  }
}
```

### POST `/chat`

Resposta contextual para uma sub-tarefa.

Entrada:

```json
{ "subtask": "Validar publico-alvo", "message": "Como faco isso?" }
```

Saida:

```json
{ "response": "..." }
```

## Fluxo no App

1. Criar projeto na tela inicial.
2. Preencher tema/descricao.
3. Preencher etapas manualmente OU usar "Gerar com IA".
4. Criar projeto.
5. Em detalhes, concluir/reabrir etapas e sub-etapas.
6. Em cada sub-etapa, usar "Como fazer?" para abrir o chat.

## Edicao e Exclusao de Projeto

- Na tela inicial, cada card possui:
  - botao de editar (lapis)
  - botao de excluir (lixeira)

## Modo Mock de IA

Para testar sem chave real:

```bash
export GROQ_API_KEY=test_key_for_local
```

Nesse modo, `/plan` e `/chat` retornam respostas de exemplo.

## Testes Rapidos com curl

```bash
curl -s -X POST http://127.0.0.1:8000/scrape -H 'Content-Type: application/json' -d '{"theme":"horta"}'
curl -s -X POST http://127.0.0.1:8000/plan   -H 'Content-Type: application/json' -d '{"theme":"horta"}'
curl -s -X POST http://127.0.0.1:8000/chat   -H 'Content-Type: application/json' -d '{"subtask":"Regar plantas","message":"Como faco?"}'
```

## Observacoes

- No web (Firefox), a tela de criacao usa area rolavel nativa.
- O progresso exibido no dashboard e atualizado conforme conclusao de etapas/sub-etapas.

## Roadmap

- Integrar Google Places (opcional)
- Melhorar UX da tela de criacao
- Documentacao de deploy
