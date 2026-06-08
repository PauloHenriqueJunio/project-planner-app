import json
import os

import requests
from dotenv import load_dotenv

# Carrega .env local na pasta `scraper` se existir (permite que cada pessoa
# coloque sua chave em scraper/.env durante testes). Não comite o arquivo .env.
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_BASE = os.getenv("GROQ_API_BASE", "https://api.groq.com/openai/v1")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def _extract_json_text(text: str) -> str:
    if not isinstance(text, str):
        return text

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```json").removeprefix("```").strip()
        if cleaned.endswith("```"):
          cleaned = cleaned.removesuffix("```").strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        return cleaned[start : end + 1]

    return cleaned


def call_groq(prompt: str, max_tokens: int = 1200, response_format: dict | None = None) -> dict:
    # modo mock para facilitar testes locais quando a chave for 'mock' ou começar com 'test'
    if GROQ_API_KEY and (GROQ_API_KEY == "mock" or GROQ_API_KEY.startswith("test")):
        return {"mock": True, "prompt": prompt}

    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY environment variable is not set")

    url = f"{GROQ_API_BASE}/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": "Você responde de forma objetiva e prática."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.2,
    }
    if response_format:
        payload["response_format"] = response_format

    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json()


def generate_plan_from_prompt(prompt: str) -> str:
    data = call_groq(prompt, response_format={"type": "json_object"})

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

    # resposta no formato OpenAI-compatible
    if isinstance(data, dict):
        if "choices" in data and isinstance(data["choices"], list) and data["choices"]:
            c = data["choices"][0]
            message = c.get("message") if isinstance(c, dict) else None
            if isinstance(message, dict) and message.get("content"):
                return _extract_json_text(message["content"])
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
            "O que fazer:\n"
            f"1. Para a sub-tarefa '{subtask}', comece organizando o que voce ja tem.\n"
            f"2. Depois execute o primeiro passo relacionado a: '{message}'.\n"
            "3. Confira o resultado e ajuste antes de seguir.\n\n"
            "Por que isso ajuda:\n"
            "Esse caminho reduz tentativa e erro, deixa a tarefa mais controlada e evita pular uma etapa importante."
        )

    # construir prompt conversacional em português
    history_lines = []
    for item in history or []:
        if not isinstance(item, dict):
            continue
        author = "Assistente" if item.get("from") == "assistant" else "Usuário"
        text = item.get("text") or item.get("response") or ""
        if text:
            history_lines.append(f"{author}: {text}")
    history_text = "\n".join(history_lines)
    prompt = (
        "Você é um assistente prático que ajuda um usuário a executar sub-tarefas de um projeto. "
        "Receba o contexto da sub-tarefa e a mensagem do usuário e responda em português com passos práticos, exemplos e esclarecimentos quando necessário. "
        "A resposta deve ser explicável: além de dizer o que fazer, diga de forma curta por que a sugestão faz sentido para aquela sub-tarefa.\n\n"
        f"Contexto da sub-tarefa:\n{subtask}\n\n"
        f"Histórico:\n{history_text}\n\n"
        f"Mensagem do usuário:\n{message}\n\n"
        "Formato desejado:\n"
        "O que fazer:\n"
        "- Dê de 1 a 4 orientações objetivas, com passos numerados quando apropriado.\n\n"
        "Por que isso ajuda:\n"
        "- Explique em 1 ou 2 frases o motivo da recomendação.\n\n"
        "Atenção:\n"
        "- Inclua esta seção apenas se houver risco, erro comum, custo desnecessário, privacidade ou segurança envolvida.\n\n"
        "Não use markdown pesado. Seja direto, amigável e específico ao contexto."
    )

    data = call_groq(prompt, max_tokens=max_tokens)

    if isinstance(data, dict):
        if "choices" in data and isinstance(data["choices"], list) and data["choices"]:
            c = data["choices"][0]
            message = c.get("message") if isinstance(c, dict) else None
            if isinstance(message, dict) and message.get("content"):
                return message["content"]
            return c.get("text") or json.dumps(c)

    return json.dumps(data)
