import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

from scrape_service import scrape_web
from groq_client import generate_plan_from_prompt, generate_chat_response

app = FastAPI(title="Project Planner Scraper + Groq")

# Para desenvolvimento, permitir CORS do expo web/localhost. Ajuste para produção.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ThemeRequest(BaseModel):
    theme: str


class ChatRequest(BaseModel):
    subtask: str
    message: str
    history: Optional[List[dict]] = None


@app.post("/scrape")
async def scrape(request: ThemeRequest):
    try:
        content = scrape_web(request.theme)
        return {"theme": request.theme, "scraped": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/plan")
async def plan(request: ThemeRequest):
    try:
        scraped = scrape_web(request.theme)
        prompt = f"""
Você é um assistente que converte conteúdo e pesquisas sobre um tema em um plano estruturado
composto por etapas e sub-tarefas no formato JSON. Receba o conteúdo abaixo e gere um JSON com a estrutura:

Exemplo de formato desejado (apenas para referência):
{{
  "title": "Título do projeto",
  "steps": [
    {{
      "title": "Etapa 1",
      "subtasks": ["Sub-tarefa A", "Sub-tarefa B"]
    }}
  ]
}}

Conteúdo de referência:
{scraped}

Retorne apenas JSON válido.
"""

        resp = generate_plan_from_prompt(prompt)

        # tentar parsear JSON retornado
        try:
            parsed = json.loads(resp)
            return {"theme": request.theme, "plan": parsed}
        except Exception:
            # se não for JSON, devolve o texto bruto
            return {"theme": request.theme, "plan_text": resp}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        resp = generate_chat_response(request.subtask, request.message, request.history)
        return {"response": resp}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
