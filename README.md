# 📋 Project Planner App

Sistema mobile para planejamento, acompanhamento e execução de projetos de longa duração.  
Desenvolvido em React Native (Expo) com backend de Web Scraping em Node.js.

**Status:** 🚧 MVP em desenvolvimento — Navegação base implementada, dados mockados

---

## 🗂️ Estrutura do Repositório

```
project-planner-app/
├── app/                  # Aplicativo React Native (Expo)
│   ├── assets/
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis de UI
│   │   ├── screens/      # 📱 Telas da aplicação (4 telas)
│   │   ├── constants/    # Constantes (cores, etc)
│   │   ├── services/     # Lógica de negócio e integração com scraper
│   │   ├── storage/      # Camada de persistência (AsyncStorage)
│   │   ├── context/      # Gerenciamento de estado global
│   │   ├── utils/        # Funções utilitárias
│   │   └── models/       # Tipos e estruturas de dados
│   ├── App.js            # Stack Navigator configurado
│   ├── index.js
│   └── package.json
│
├── scraper/              # Backend Node.js + Express (em desenvolvimento)
│   ├── scrapers/         # Módulos de scraping por fonte
│   ├── routes/
│   │   └── scrape.js     # Endpoint POST /scrape
│   ├── parser.js         # Transforma HTML em etapas estruturadas
│   ├── index.js          # Servidor Express
│   └── package.json
│
└── README.md
```

---

## 📱 Telas Implementadas (MVP)

### 1. **Dashboard Screen** — Listagem de Projetos

- Lista de 2 projetos mockados
- Exibe: nome, descrição e percentual de progresso
- Barra de progresso visual para cada projeto
- Botão "Ver Detalhes" → navega para ProjectDetail
- Botão flutuante "+" → navega para CreateProject
- Header com título "Meus Projetos"

### 2. **Create Project Screen** — Formulário

- Campos do formulário:
  - **Nome do Projeto** (max 50 caracteres, com contador)
  - **Descrição** (max 200 caracteres, com contador)
  - **Categoria** (Picker com 4 opções: Aprendizado, TCC, Desenvolvimento de Software, Empreendedorismo)
- Validação: Nome é obrigatório
- Botões: "Cancelar" e "Criar Projeto"
- Card informativo com dica

### 3. **Project Detail Screen** — Detalhes do Projeto

- Header com nome do projeto
- **Barra de progresso** dinâmica (calcula % de etapas concluídas)
- Lista de 3 etapas mockadas com:
  - ☑️ Checkbox de conclusão (interativo)
  - Título e descrição da etapa
  - Badge de status: "Concluído" (verde) ou "Pendente" (cinza)
- Botão "Acompanhar Progresso" → navega para Tracking

### 4. **Tracking Screen** — Acompanhamento

- **Destaque:** Próximo passo pendente em card visual com ícone 📍
- Card de conclusão com 🎉 se todos os passos estão feitos
- **Seção Informações:**
  - Nome do projeto
  - Total de etapas
  - Etapas concluídas
  - Etapas pendentes
- **Progresso Geral:**
  - Círculo com percentual
  - Barra de progresso vertical
  - Estatísticas com boletas de cor (verde para concluído, cinza para pendente)
- **Lista Completa:** Todas as etapas com status

---

## 🎨 Design System

### Paleta de Cores

```javascript
// src/constants/colors.js
Fundo:        #0F172A  (Azul escuro)
Primário:     #1A56DB  (Azul)
Texto:        #F8FAFC  (Branco)
Secundário:   #CBD5E1  (Cinza claro)
Borda:        #334155  (Cinza médio)
Card BG:      #1E293B  (Cinza escuro)
Sucesso:      #10B981  (Verde)
Aviso:        #F59E0B  (Laranja)
Erro:         #EF4444  (Vermelho)
```

### Componentes

- **Stack Navigator** para navegação entre telas
- **StyleSheet** puro do React Native (sem bibliotecas externas de UI)
- **Headers personalizados** em cada tela com botão voltar
- **Cards com bordas e espaçamento** consistente
- **Barras de progresso** horizontal e vertical
- **Checkboxes e Badges** para status visual
- **Picker** para seleção de categoria

---

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter instalado na sua máquina:

- [Node.js](https://nodejs.org/) (versão 18+)
- [Git](https://git-scm.com/)
- [VSCode](https://code.visualstudio.com/) (recomendado)
- [Expo Go](https://expo.dev/go) no celular (Android ou iOS)

---

## 🚀 Como rodar o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/PauloHenriqueJunio/project-planner-app.git
cd project-planner-app
```

### 2. Configure e rode o app (React Native)

```bash
cd app
npm install --legacy-peer-deps
npx expo start
```

Um QR code vai aparecer no terminal.  
Abra o **Expo Go** no celular e escaneie o QR code **de dentro do app** para visualizar o projeto.

> ⚠️ Seu celular e computador precisam estar na **mesma rede Wi-Fi**.

### 3. Backend de scraping (em desenvolvimento)

Abra um **novo terminal** e rode:

```bash
cd scraper
npm install
# node index.js (ainda em construção)
```

---

## 📱 Como visualizar o app no celular

1. Instale o **Expo Go** — [App Store](https://apps.apple.com/app/expo-go/id982107779) ou [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Com `npx expo start` rodando, abra o Expo Go
3. Escaneie o QR code exibido no terminal **de dentro do Expo Go** (não pela câmera nativa do celular)

---

## 🔗 Comunicação App ↔ Backend

O app será conectado com o backend de scraping via REST API. O endpoint será:

```
POST http://localhost:3000/scrape
Content-Type: application/json

{
  "titulo": "Aprender React Native",
  "categoria": "Aprendizado"
}
```

**Nota:** Backend ainda em desenvolvimento.

---

## 🛠️ Tecnologias Utilizadas

| Camada           | Tecnologia                   |
| ---------------- | ---------------------------- |
| Front-end Mobile | React Native 0.81.5          |
| Framework        | Expo SDK 54.0.33             |
| Navegação        | React Navigation 7.2.4       |
| Gestos           | React Native Gesture Handler |
| Estado Global    | Context API                  |
| Persistência     | AsyncStorage                 |
| Backend          | Node.js + Express            |
| Parsing          | Cheerio                      |
| HTTP Client      | Axios                        |

---

## 📦 Dependências Instaladas

### App (`/app`)

```json
{
  "@react-navigation/native": "^7.2.4",
  "@react-navigation/stack": "^7.9.2",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-screens": "~4.16.0",
  "react-native-safe-area-context": "~5.6.0",
  "expo": "~54.0.33",
  "react": "19.1.0",
  "react-native": "0.81.5"
}
```

### Scraper (`/scraper`)

```json
{
  "express": "^5.2.1",
  "cheerio": "^1.2.0",
  "axios": "^1.16.1",
  "cors": "^2.8.6"
}
```

---

## 📋 Roadmap

- [ ] **MVP 0.2:** Integração com AsyncStorage (persistência local de projetos)
- [ ] **MVP 0.3:** Context API para estado global (substituir dados mockados)
- [ ] **MVP 0.4:** Backend funcional (scraping e parsing)
- [ ] **MVP 0.5:** Integração app ↔ backend
- [ ] **v1.0:** Testes, autenticação, deploy

---

## 🤝 Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feat/nome-da-feature`
2. Faça seus commits com mensagens descritivas: `git commit -m "feat: descrição"`
3. Suba a branch: `git push origin feat/nome-da-feature`
4. Abra um Pull Request

---

## 📞 Contato & Suporte

Dúvidas ou sugestões? Abra uma [issue](https://github.com/PauloHenriqueJunio/project-planner-app/issues) no repositório!

---

**Desenvolvido com ❤️ por Paulo Henrique**
