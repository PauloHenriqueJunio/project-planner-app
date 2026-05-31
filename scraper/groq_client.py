import os
import requests
import json
from dotenv import load_dotenv

# Carrega .env local na pasta `scraper` se existir (permite que cada pessoa
# coloque sua chave em scraper/.env durante testes). Não comite o arquivo .env.
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_BASE = os.getenv("GROQ_API_BASE", "https://api.groq.ai")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3")


def call_groq(prompt: str, max_tokens: int = 512) -> dict:
    # modo mock para facilitar testes locais quando a chave for 'mock' ou começar com 'test'
    if GROQ_API_KEY and (GROQ_API_KEY == "mock" or GROQ_API_KEY.startswith("test")):
        return {"mock": True, "prompt": prompt}

    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY environment variable is not set")

    url = f"{GROQ_API_BASE}/v1/models/{GROQ_MODEL}/outputs"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {"input": prompt, "max_output_tokens": max_tokens}

    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json()


def generate_plan_from_prompt(prompt: str) -> str:
    data = call_groq(prompt)

    # modo mock -> retornar plano de exemplo para testes locais
    if isinstance(data, dict) and data.get("mock"):
        sample = {
            "title": "Projeto Exemplo",
            "steps": [
                {"title": "Planejamento", "subtasks": ["Definir objetivos", "Listar materiais"]},
                {"title": "Execução", "subtasks": ["Preparar solo", "Plantar sementes", "Regar regularmente"]},
            ],
        }
        return json.dumps(sample)

    # tentativas comuns de extrair texto dependendo da API
    if isinstance(data, dict):
        # Groq-like responses may include 'outputs' or 'choices'
        if "outputs" in data and isinstance(data["outputs"], list) and data["outputs"]:
            first = data["outputs"][0]
            if isinstance(first, dict) and "content" in first:
                return first["content"]
            return json.dumps(first)
        if "choices" in data and isinstance(data["choices"], list) and data["choices"]:
            c = data["choices"][0]
            return c.get("text") or json.dumps(c)

    # fallback: return raw text
    return json.dumps(data)


def generate_chat_response(subtask: str, message: str, history: list | None = None, max_tokens: int = 256) -> str:
    """Gera resposta de chat baseada na sub-tarefa, mensagem do usuário e histórico.

    Em modo mock (GROQ_API_KEY == 'mock' ou começa com 'test'), retorna resposta exemplar.
    """
    # modo mock
    if GROQ_API_KEY and (GROQ_API_KEY == "mock" or GROQ_API_KEY.startswith("test")):
        return (
            f"Mock assistant: Para a sub-tarefa '{subtask}', aqui vai uma orientação prática sobre '{message}'.\n"
            "1) Verifique o material necessário\n2) Execute o passo inicial\n3) Teste e ajuste conforme necessário."
        )

    # construir prompt conversacional em português
    history_text = "\n".join([f"Usuário: {h.get('text')}\nAssistente: {h.get('response', '')}" for h in (history or [])])
    prompt = (
        "Você é um assistente prático que ajuda um usuário a executar sub-tarefas de um projeto. "
        "Receba o contexto da sub-tarefa e a mensagem do usuário e responda em português com passos práticos, exemplos e esclarecimentos quando necessário.\n\n"
        f"Contexto da sub-tarefa:\n{subtask}\n\n"
        f"Histórico:\n{history_text}\n\n"
        f"Mensagem do usuário:\n{message}\n\n"
        "Responda de forma clara e prática, com passos numerados quando apropriado."
    )

    data = call_groq(prompt, max_tokens=max_tokens)

    if isinstance(data, dict):
        if "outputs" in data and isinstance(data["outputs"], list) and data["outputs"]:
            first = data["outputs"][0]
            if isinstance(first, dict) and "content" in first:
                return first["content"]
            return json.dumps(first)
        if "choices" in data and isinstance(data["choices"], list) and data["choices"]:
            c = data["choices"][0]
            return c.get("text") or json.dumps(c)

    return json.dumps(data)
