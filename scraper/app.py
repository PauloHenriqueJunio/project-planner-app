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
composto por etapas e sub-tarefas no formato JSON.
O objetivo é entender o contexto e orientar a execução de cada etapa.
Quando fizer sentido, cite produtos dentro da descrição da etapa ou da sub-tarefa,
de forma natural e contextualizada, sem criar uma seção separada de recomendações.
    Responda com um único objeto JSON válido, sem explicações, sem markdown e sem cercas de código.
Receba o conteúdo abaixo e gere um JSON com a estrutura:

Exemplo de formato desejado (apenas para referência):
{{
  "title": "Título do projeto",
  "steps": [
    {{
      "title": "Etapa 1",
            "description": "Como executar a etapa, incluindo produtos úteis se necessário",
            "subtasks": [
                {{
                    "title": "Sub-tarefa A",
                    "description": "Como fazer esta sub-tarefa e quais itens usar, se aplicável",
                    "links": [
                        {{"label": "Produto 1", "url": "https://exemplo.com/item", "reason": "Útil para esta sub-tarefa"}}
                    ]
                }},
                {{
                    "title": "Sub-tarefa B",
                    "description": "Orientação prática desta sub-tarefa"
                }}
            ]
    }}
  ]
}}

Conteúdo de referência:
{scraped}

Regras importantes:
- Em vez de retornar listas separadas de produtos, inclua os itens diretamente nas descrições.
- O campo "links" é opcional e deve aparecer por sub-tarefa apenas quando realmente agregar valor.
- Se usar "links", limite a no máximo 3 por sub-tarefa, com URLs completas (https://...).
- Prefira links curados e contextualizados; evite listas grandes de compra.
- Não dependa de pedido explícito do usuário sobre links: sempre avalie automaticamente se a sub-tarefa envolve compra/uso de produto.
- Quando houver produto relevante para executar a sub-tarefa, inclua links de forma automática no campo "links".
- Se o tema não exigir compras, descreva o processo sem forçar indicação de produtos.
- Considere o contexto e as fontes coletadas para decidir os itens.
- Mantenha as recomendações práticas, realistas e relacionadas ao contexto.

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
