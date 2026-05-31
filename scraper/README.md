# Scraper + Groq backend

Como usar (local):

1. Crie um virtualenv e instale dependências:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# se usar playwright:
playwright install
```

2. Exporte sua chave Groq e (opcional) ajuste base/model:

```bash
export GROQ_API_KEY="sua_chave_aqui"
export GROQ_API_BASE="https://api.groq.ai"
export GROQ_MODEL="llama-3"
```

Você também pode criar um arquivo local `.env` na pasta `scraper` com a chave
para facilitar testes em grupo (EX.: `scraper/.env`). Há um exemplo em
`scraper/.env.example`. O `.env` é ignorado pelo Git — não o comite.

3. Rode a app:

```bash
uvicorn app:app --reload --port 8000
```

Endpoints:
- `POST /scrape` {"theme": "..."} -> retorna texto raspado (stub)
- `POST /plan` {"theme": "..."} -> realiza raspagem stub + chama Groq para gerar plano JSON

Substitua o stub de raspagem em `scrape_service.py` por implementações reais com
Requests/BeautifulSoup e Playwright quando necessário.
