# Como Rodar o Projeto

Este guia explica apenas como instalar, configurar e executar o projeto localmente.

Para a explicacao das funcionalidades e dos arquivos principais, veja [README.md](./README.md).

## Requisitos

- Node.js instalado
- npm instalado
- Python 3.10+
- Git Bash, PowerShell ou terminal equivalente
- Expo Go no celular, caso queira testar em dispositivo fisico

## Estrutura

```text
project-planner-app/
  app/       # Frontend Expo
  scraper/   # Backend FastAPI
```

## Configurar backend

Entre na pasta do backend:

```bash
cd scraper
```

Crie ou ative o ambiente virtual.

No Git Bash:

```bash
source .venv/Scripts/activate
```

Se a venv ainda nao existir:

```bash
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
```

No PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Ou rode direto com o Python da venv:

```bash
./.venv/Scripts/python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Variaveis de ambiente

Crie ou edite o arquivo:

```text
scraper/.env
```

Exemplo:

```env
GROQ_API_KEY=sua_chave_groq
GOOGLE_MAPS_API_KEY=sua_chave_google
```

Para testar sem chave real da Groq:

```env
GROQ_API_KEY=mock
```

Importante:

- nao comite o `.env`;
- a chave do Google deve ficar apenas no backend;
- o frontend nao precisa conhecer a chave do Google Places.

## Rodar backend

Com a venv ativada:

```bash
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Ou direto:

```bash
./.venv/Scripts/python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

O backend deve ficar em:

```text
http://SEU_IP:8000
```

Para testar no navegador da propria maquina:

```text
http://127.0.0.1:8000/docs
```

## Configurar frontend

Em outro terminal:

```bash
cd app
npm install
```

O frontend usa o backend definido em:

```text
app/src/constants/config.js
```

Exemplo:

```js
export const API_BASE = "http://192.168.0.106:8000";
```

Se for testar no celular, esse IP deve ser o IP da maquina onde o backend esta rodando, e o celular precisa estar na mesma rede.

## Rodar frontend

Para iniciar o Expo com cache limpo:

```bash
npx expo start -c
```

Para web:

```bash
npm run web
```

Para abrir no celular:

1. Rode `npx expo start -c`.
2. Abra o Expo Go.
3. Escaneie o QR Code.
4. Garanta que backend e celular estao na mesma rede.

## Testar backend

### Testar `/chat`

```bash
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d "{\"subtask\":\"Lavar a lataria\",\"message\":\"Como faco sem riscar?\",\"history\":[]}"
```

### Testar `/plan`

```bash
curl -X POST http://127.0.0.1:8000/plan \
  -H "Content-Type: application/json" \
  -d "{\"theme\":\"lavar o carro corretamente\"}"
```

### Testar `/places/nearby`

```bash
curl -X POST http://127.0.0.1:8000/places/nearby \
  -H "Content-Type: application/json" \
  -d "{\"product\":\"shampoo automotivo\",\"lat\":-9.55,\"lng\":-35.72,\"radius_meters\":5000,\"max_results\":3}"
```

## Fluxo recomendado de teste no app

1. Abra o app.
2. Crie um projeto.
3. Use `Gerar com IA`.
4. Salve o projeto.
5. Abra os detalhes.
6. Marque uma etapa como concluida.
7. Abra o chat de uma sub-tarefa.
8. Pergunte algo para a IA.
9. Digite algo como `nao tenho shampoo automotivo`.
10. Toque em `Lojas proximas`.
11. Permita localizacao.
12. Veja os cards de lojas.
13. Volte para o mesmo chat e confirme que o historico foi mantido.
14. Exporte o projeto em PDF.

## Problemas comuns

### `bash: .venvScriptspython.exe: command not found`

No Git Bash, use barras normais:

```bash
./.venv/Scripts/python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Ou ative a venv:

```bash
source .venv/Scripts/activate
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Porta 8000 bloqueada

Tente outra porta:

```bash
python -m uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

Depois atualize `API_BASE` no frontend.

### Celular nao conecta no backend

Verifique:

- celular e computador estao na mesma rede;
- backend rodando com `--host 0.0.0.0`;
- `API_BASE` usa o IP correto da maquina;
- firewall nao esta bloqueando a porta.

### iOS nao pede localizacao

Reinicie o Expo com cache limpo:

```bash
npx expo start -c
```

Feche o Expo Go completamente e abra de novo pelo QR Code.

### AsyncStorage com erro no iOS

Garanta que as dependencias foram instaladas novamente:

```bash
cd app
npm install
npx expo start -c
```

## Comandos uteis

Backend:

```bash
cd scraper
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Frontend:

```bash
cd app
npx expo start -c
```

Web:

```bash
cd app
npm run web
```
