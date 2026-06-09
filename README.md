# Project Planner App

Este README e voltado para apresentacao do projeto: o que o app faz, quais problemas resolve, como a IA foi integrada e quais arquivos sao mais importantes para entender a implementacao.

Para instrucoes de instalacao e execucao, veja [RUNNING.md](./RUNNING.md).

## Visao geral

O Project Planner App e um aplicativo mobile first para criar, organizar e acompanhar projetos pessoais ou academicos com apoio de IA.

A ideia principal e transformar um tema amplo, como "lavar o carro", "fazer um TCC" ou "desenvolver um site", em um plano pratico com etapas, sub-etapas, acompanhamento de progresso, chat contextual e exportacao em PDF.

O projeto combina:

- React Native com Expo no frontend;
- FastAPI em Python no backend;
- Groq API para IA;
- Google Places API para buscar lojas proximas;
- AsyncStorage para persistencia local;
- geracao de PDF para exportar o projeto.

## Objetivo do projeto

O objetivo e ajudar o usuario a sair de uma ideia vaga e chegar em um plano executavel.

Em vez de apenas criar uma lista manual de tarefas, o app permite que a IA sugira etapas, explique como executar sub-tarefas e ajude o usuario quando ele encontra um bloqueio, como nao ter um produto necessario.

## Funcionalidades

### Dashboard de projetos

A tela inicial lista os projetos cadastrados e mostra o progresso geral de cada um.

Nela o usuario pode:

- criar um novo projeto;
- abrir um projeto existente;
- editar um projeto;
- excluir um projeto;
- visualizar rapidamente o andamento.

Essa tela funciona como o ponto de entrada do app.

### Criacao e edicao de projeto

Na tela de criacao, o usuario pode montar o projeto manualmente ou pedir para a IA gerar um plano.

O usuario informa:

- nome do projeto;
- descricao ou tema;
- etapas;
- sub-etapas;
- descricoes;
- links opcionais.

Quando clica em `Gerar com IA`, o app envia o tema para o backend. O backend monta um prompt e pede para a IA retornar um plano em JSON. Depois o frontend normaliza esse retorno para que o usuario possa revisar e editar antes de salvar.

Essa revisao e importante porque a IA ajuda, mas o usuario continua no controle do plano final.

### Detalhes do projeto

A tela de detalhes e onde o projeto e executado de fato.

Ela mostra:

- categoria;
- progresso em porcentagem;
- etapas;
- sub-etapas;
- status de concluido ou pendente;
- links de apoio;
- botao para abrir o chat da IA;
- botao para exportar PDF.

Sempre que o usuario conclui ou reabre uma etapa/sub-etapa, o progresso e recalculado e salvo.

### Acompanhamento de progresso

A tela de acompanhamento mostra uma visao mais direta do andamento do projeto.

Ela destaca:

- quantas etapas existem;
- quantas ja foram concluidas;
- quantas ainda faltam;
- qual e a etapa atual;
- lista visual do progresso.

Essa tela serve como uma especie de painel de controle para o projeto.

### Chat com IA por sub-tarefa

Cada sub-tarefa possui um chat contextual.

Isso significa que a conversa nao e generica: ela recebe o contexto da sub-tarefa aberta. Por exemplo, se o usuario esta na sub-tarefa "Lavar a lataria", a IA responde considerando esse assunto.

O chat possui:

- historico por projeto e sub-tarefa;
- envio por botao;
- envio por Enter no web;
- layout adaptado para mobile;
- scroll funcional no celular;
- tratamento de erros do backend;
- respostas mais explicaveis.

As respostas da IA seguem a ideia:

```text
O que fazer:
1. ...

Por que isso ajuda:
...

Atencao:
...
```

Esse formato foi escolhido para que a IA nao apenas diga o que fazer, mas tambem explique o motivo da recomendacao.

### Deteccao de produto faltando

Uma funcionalidade interessante do chat e detectar quando o usuario diz que nao tem algum produto.

Exemplos:

- "nao tenho shampoo automotivo";
- "estou sem pano de microfibra";
- "preciso comprar cera";
- "nao encontrei esse produto".

Quando isso acontece, o app mostra um pop-up perguntando se o usuario quer usar a localizacao para encontrar lojas proximas.

Se o usuario aceitar:

1. O app pede permissao de localizacao.
2. Envia latitude, longitude e produto para o backend.
3. O backend consulta o Google Places.
4. O chat mostra cards com lojas proximas.
5. O usuario pode abrir a loja no Google Maps.

Se o usuario negar a localizacao, o app sugere links de compra online.

### Exportacao em PDF

O app permite exportar o projeto em PDF.

O PDF inclui:

- nome do projeto;
- categoria;
- data de geracao;
- progresso;
- etapas;
- sub-etapas;
- status de cada item;
- descricoes;
- links uteis.

No web, o app abre a janela de impressao do navegador. No mobile, usa recursos do Expo para gerar e compartilhar o arquivo.

### Mobile first

O app foi pensado para celular primeiro.

Algumas decisoes de interface:

- no mobile, botoes principais ficam na parte inferior;
- no desktop, acoes ficam no header;
- o chat ocupa melhor a tela;
- a area de mensagens e rolavel;
- `HOME` e `Voltar` ficam sempre acessiveis.

## Dificuldade de integrar IA

Integrar IA foi uma das partes mais importantes e tambem mais delicadas do projeto.

### 1. Fazer a IA devolver dados estruturados

Para gerar um projeto automaticamente, nao basta a IA responder com texto. O frontend precisa de um formato previsivel, com etapas e sub-tarefas.

O desafio foi fazer a IA retornar JSON valido.

Para isso, o backend usa `response_format={"type": "json_object"}` na geracao de planos. Alem disso, existe uma funcao que tenta extrair o JSON caso a resposta venha com markdown ou texto extra.

Arquivo principal:

- `scraper/groq_client.py`

### 2. Separar comportamento de plano e chat

O plano precisa ser JSON. O chat precisa ser texto livre.

Se o mesmo formato fosse usado nos dois casos, o chat ficaria estranho e menos natural. Por isso a aplicacao separa:

- `/plan`: resposta obrigatoriamente estruturada;
- `/chat`: resposta em texto livre.

Essa separacao deixou o sistema mais estavel.

### 3. Criar prompts bons

A qualidade da IA depende muito do prompt.

No plano, o prompt precisa explicar:

- que a resposta deve ser JSON;
- qual estrutura retornar;
- como tratar etapas e sub-tarefas;
- quando incluir links;
- quando nao forcar produtos.

No chat, o prompt precisa explicar:

- o contexto da sub-tarefa;
- o historico da conversa;
- o formato de resposta desejado;
- que a IA deve explicar o motivo da sugestao.

### 4. Lidar com erro de API

Outro desafio foi tratar falhas de forma amigavel.

Podem acontecer erros como:

- backend offline;
- chave da Groq ausente;
- resposta vazia;
- erro de rede;
- endpoint retornando `500`.

O chat foi ajustado para verificar `resp.ok`, ler a resposta do backend e mostrar uma mensagem mais clara para o usuario.

### 5. Transformar conversa em acao

A parte mais interessante foi fazer o chat reagir ao que o usuario escreve.

Quando o usuario diz que nao tem um produto, o app nao apenas responde com texto. Ele abre um fluxo real:

- pede localizacao;
- chama Google Places;
- mostra lojas;
- oferece fallback online.

Isso transforma a IA em uma assistente mais util, conectada a acoes do app.

## Arquivos mais importantes

### `app/App.js`

Arquivo de entrada do frontend.

Por que e importante:

- configura a navegacao;
- registra as telas principais;
- envolve o app com providers globais;
- aplica ajustes globais para web/mobile.

Como funciona:

O `App.js` monta a pilha de navegacao com telas como Dashboard, Criacao, Detalhes, Acompanhamento e Chat. Ele tambem deixa o contexto de projetos disponivel para todas as telas.

### `app/src/context/ProjectContext.js`

Contexto global dos projetos.

Por que e importante:

- centraliza a lista de projetos;
- salva os projetos no AsyncStorage;
- fornece funcoes para adicionar, atualizar e excluir;
- tambem guarda historico dos chats.

Como funciona:

Quando o app inicia, o contexto tenta carregar os projetos salvos. Quando algum projeto muda, ele atualiza o estado e persiste novamente no armazenamento local.

### `app/src/screens/DashboardScreen.js`

Tela inicial do app.

Por que e importante:

- mostra todos os projetos;
- calcula progresso resumido;
- permite navegar para detalhes;
- permite editar e excluir projetos.

Como funciona:

Ela le os projetos do `ProjectContext`, normaliza os dados para exibicao e renderiza cards com as principais acoes.

### `app/src/screens/CreateProjectScreen.js`

Tela de criacao e edicao.

Por que e importante:

- permite criar projeto manualmente;
- chama a IA para gerar etapas;
- normaliza a resposta da IA;
- permite revisar o plano antes de salvar;
- aceita links por sub-tarefa.

Como funciona:

O usuario preenche nome e descricao. Se usar `Gerar com IA`, a tela chama o endpoint `/plan`. A resposta e convertida para o formato interno do app e exibida para edicao. Ao salvar, o projeto vai para o `ProjectContext`.

### `app/src/screens/ProjectDetailScreen.js`

Tela principal de execucao do projeto.

Por que e importante:

- exibe etapas e sub-etapas;
- calcula progresso;
- permite concluir/reabrir tarefas;
- abre o chat da IA;
- exporta PDF.

Como funciona:

A tela recebe projeto e etapas por navegacao, normaliza os dados e renderiza cada etapa. Quando o usuario altera o status de algo, o estado local muda e o projeto salvo e atualizado.

Para exportar PDF, a tela monta um HTML com os dados do projeto e usa ferramentas do Expo ou do navegador para gerar o arquivo.

### `app/src/screens/TrackingScreen.js`

Tela de acompanhamento.

Por que e importante:

- oferece uma visao resumida do progresso;
- mostra etapa atual;
- ajuda o usuario a entender o que falta.

Como funciona:

Ela recebe o projeto e as etapas, calcula concluidas/pendentes e renderiza um painel visual de acompanhamento.

### `app/src/screens/ChatScreen.js`

Tela do chat com IA.

Por que e importante:

- conecta usuario e IA;
- envia contexto para o backend;
- salva historico por sub-tarefa;
- detecta falta de produtos;
- mostra lojas proximas;
- funciona em desktop e mobile.

Como funciona:

Ao abrir, a tela calcula uma chave de historico baseada na etapa/sub-tarefa. Ela carrega mensagens salvas no projeto e, a cada nova mensagem, atualiza esse historico.

Quando o usuario envia uma pergunta, o app chama `/chat`. Se a mensagem indicar falta de produto, a tela abre um modal de localizacao.

### `app/src/utils/chatHelpers.js`

Arquivo de funcoes auxiliares do chat.

Por que e importante:

- deixou o `ChatScreen` mais leve;
- concentra regras de texto;
- detecta produto faltando;
- monta links online;
- cria chave do historico;
- le respostas do backend.

Como funciona:

Ele normaliza texto removendo acentos, procura frases de intencao como "nao tenho" e tenta identificar o produto citado. Tambem oferece funcoes para montar links de compra e links do Google Maps.

### `app/src/services/placesService.js`

Servico de localizacao e lojas.

Por que e importante:

- separa a logica de localizacao da tela;
- usa `navigator.geolocation` no web;
- usa `expo-location` no iOS/Android;
- chama o backend para buscar lojas.

Como funciona:

Primeiro pede localizacao do usuario. Depois envia produto, latitude e longitude para `/places/nearby`. O backend retorna uma lista de lojas, que o chat renderiza como cards.

### `app/src/constants/config.js`

Arquivo de configuracao do frontend.

Por que e importante:

- centraliza o endereco do backend;
- evita espalhar IP/porta em varias telas;
- facilita mudar de ambiente.

Como funciona:

Exporta `API_BASE`, usado pelos servicos e telas que chamam a API.

### `app/src/constants/colors.js`

Arquivo de padrao visual.

Por que e importante:

- centraliza cores;
- centraliza espacamentos;
- centraliza sombras e raios;
- ajuda a manter identidade visual consistente.

### `scraper/app.py`

Arquivo principal do backend FastAPI.

Por que e importante:

- cria a API;
- configura CORS;
- define modelos de entrada;
- registra endpoints;
- conecta scraping, IA e Places.

Endpoints principais:

- `/scrape`: busca conteudo de referencia;
- `/plan`: gera plano com IA;
- `/chat`: responde perguntas;
- `/places/nearby`: busca lojas proximas.

### `scraper/groq_client.py`

Cliente da IA.

Por que e importante:

- centraliza chamada para Groq;
- controla modelo usado;
- implementa modo mock;
- separa plano e chat;
- ajusta prompt do chat para respostas explicaveis.

Como funciona:

`call_groq` faz a chamada HTTP para a API da Groq. `generate_plan_from_prompt` pede JSON estruturado. `generate_chat_response` monta um prompt conversacional com historico e contexto da sub-tarefa.

### `scraper/google_places_client.py`

Cliente da Google Places API.

Por que e importante:

- isola a integracao com Google;
- evita expor chave no frontend;
- normaliza dados para o app.

Como funciona:

Recebe produto e coordenadas, chama a API do Google Places e retorna apenas os dados necessarios para o frontend: nome, endereco, nota, coordenadas e link do Maps.

### `scraper/scrape_service.py`

Servico de busca de contexto.

Por que e importante:

- fornece informacao base para a IA gerar planos melhores;
- separa a coleta de conteudo da logica de IA.

Como funciona:

Recebe um tema, busca conteudo relacionado e devolve texto para ser usado no prompt de geracao de plano.

## Fluxo completo do app

1. Usuario cria um projeto.
2. Usuario informa nome e tema.
3. App pode gerar etapas com IA.
4. Usuario revisa e salva.
5. Projeto aparece no dashboard.
6. Usuario entra nos detalhes.
7. Usuario conclui etapas/sub-etapas.
8. Usuario abre chat para pedir ajuda.
9. IA responde com orientacao explicada.
10. Se faltar produto, app oferece busca por lojas proximas.
11. Usuario pode exportar o projeto em PDF.

## Estrutura resumida

```text
project-planner-app/
  app/
    App.js
    src/
      screens/
        DashboardScreen.js
        CreateProjectScreen.js
        ProjectDetailScreen.js
        TrackingScreen.js
        ChatScreen.js
      context/
        ProjectContext.js
        ToastContext.js
      services/
        placesService.js
        scraperService.js
      utils/
        chatHelpers.js
      constants/
        config.js
        colors.js
  scraper/
    app.py
    groq_client.py
    google_places_client.py
    scrape_service.py
    requirements.txt
```

## Pontos fortes para apresentacao

- O app nao e apenas um CRUD: ele tem fluxo completo de criacao, execucao, ajuda e exportacao.
- A IA e usada em dois momentos diferentes: planejamento e suporte contextual.
- A integracao com localizacao transforma uma resposta do chat em acao real.
- O projeto foi pensado para mobile first.
- O backend protege as chaves sensiveis.
- O historico do chat fica ligado ao projeto e a sub-tarefa.
- O PDF facilita demonstrar o resultado final do planejamento.

## Possiveis melhorias futuras

- Incluir historico do chat no PDF.
- Criar tela de configuracoes para alterar o backend sem mexer no codigo.
- Adicionar login por usuario.
- Salvar dados em banco real no backend.
- Criar testes automatizados para normalizacao de etapas e deteccao de produtos.
- Melhorar a deteccao de produtos com uma classificacao feita pela propria IA.
