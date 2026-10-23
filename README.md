# AgendaUNI — Sistema de Gestão de Eventos Institucionais

Projeto do **Software Engineering Challenge 2026 — Univille (Campus São Bento do Sul)**.

**Equipe:** _NOME DA EQUIPE_
**Integrantes:** _Nome 1 (representante)_, _Nome 2_, _Nome 3_, _Nome 4_

## Resumo

Aplicação web que reúne, em um só lugar, o pedido, a análise, a aprovação e a divulgação dos
eventos institucionais da Univille.

| Perfil | O que faz |
|---|---|
| **Visitante** (sem login) | Vê a agenda pública: eventos **aprovados** do mês atual e dos 2 meses seguintes, em ordem de data. |
| **Solicitante** | Faz o pedido, salva **rascunho** ou **envia**, acompanha em *Meus pedidos*, edita rascunhos e pendentes, corrige e reenvia os rejeitados, exclui rascunhos e cancela pendentes. |
| **Administrador** | Tem um painel inicial, aprova ou rejeita (com motivo), edita e cancela aprovados, vê a ocupação de cada sala por dia, bloqueia salas, mantém cadastros (temas, locais com capacidade e recursos, cursos, centros de custo), usuários e emite relatório com CSV. |

**Regra central — conflito de agenda:** dois eventos aprovados não podem ocupar o mesmo local, na
mesma data, com horários sobrepostos. A checagem acontece no **envio**, na **aprovação** e na
**edição** de um aprovado. Ex.: Auditório A 19h–20h aprovado → 19h30–21h é bloqueado; 20h–21h é aceito.

## Melhorias feitas após a auditoria de UX

| Problema apontado | Solução |
|---|---|
| Conflito só aparecia depois de enviar | O formulário mostra a **ocupação do local no dia** antes do envio: vermelho se conflita com aprovado, amarelo se há outro pedido em análise, e **horários livres clicáveis** |
| Data e hora sem validação imediata | Data mínima = hoje; término antes do início e público acima da capacidade aparecem **na hora**, embaixo do campo |
| Texto sumia no hover do filtro ativo | Corrigido (o estado ativo mantém o texto branco) |
| Sem visão de ocupação por sala | Nova tela **Ocupação**: grade do dia com uma linha por local (aprovado sólido, pendente tracejado, bloqueio listrado) |
| Admin define senha e não há "Esqueci a senha" | Cada usuário **troca a própria senha** (menu com as iniciais); senha forte (8+ com letras e números); "Esqueci minha senha" explica como pedir a redefinição |
| Relatório cortado | Tabela compacta com coluna **Status fixa**; no celular vira **cartões**; indicadores no topo, filtro por local e atalhos de período |
| Admin caía na agenda pública | Novo **Painel**: pedidos aguardando, conflitos, eventos da semana, urgentes (até 7 dias) |
| Faltava histórico | **Linha do tempo** em cada pedido (criado, enviado, aprovado, rejeitado, editado — quem e quando) |
| Sala em manutenção ainda recebia pedidos | **Bloqueio de local** por período; o envio é recusado nessas datas |
| Locais sem capacidade | Campo **capacidade** no local e **público estimado** no pedido |
| Duplicados como "AUDITORIO A" | Cadastro recusa nomes iguais ignorando acento e maiúsculas |
| Visitante não podia fazer nada com o evento | **Página pública do evento** com "Adicionar ao calendário" (.ics e Google Agenda), compartilhar no WhatsApp e copiar link; busca e filtro por tema na agenda |
| Acessibilidade | Rótulos ligados aos campos (`htmlFor`/`id`), `aria-invalid`, erros anunciados (`role="alert"`), foco visível, `prefers-reduced-motion` |
| Visual | Um só aviso por status (motivo + ação juntos), avatar com nome no celular, contador de pendentes no menu, cartões "esqueleto" ao carregar |

**Arte do evento (imagem):** o pedido aceita uma imagem opcional (JPG, PNG ou WEBP até 5 MB), guardada no
PostgreSQL (`evento_imagens`). Ela aparece no cartão da agenda e na página do evento depois da aprovação;
antes disso, só o autor e o administrador conseguem vê-la.

**Fora do escopo, de propósito:** recuperação de senha por e-mail, convites e notificações por e-mail (o caderno
diz que não são obrigatórios e exigiriam servidor de e-mail); login institucional; eventos de vários dias (o caderno
define um único dia e um único local por evento); exportação XLSX/PDF (o caderno pede CSV).

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend (API REST) | **Java 21** + **Spring Boot 3.3** (Spring Web, Spring Data JPA) |
| Banco de dados | **PostgreSQL 16** |
| Frontend | **React 18** + **JavaScript** + **HTML** + **CSS** (sem framework de UI) |
| Execução local do front | **Vite 5** (servidor de desenvolvimento com proxy para a API) |
| Segurança | Senhas com hash **BCrypt**, sessão por cookie `HttpOnly`, controle de acesso por perfil |

## Como executar (local)

### 1. Pré-requisitos

- Java 21, PostgreSQL 16 e Node.js 18+ instalados. No macOS, com Homebrew:

```bash
brew install openjdk@21 postgresql@16 node
```

```bash
brew services start postgresql@16
```

- Se a máquina tiver mais de um Java, aponte para o 21 antes de rodar o backend:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null || echo /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home)
```

### 2. Criar o banco (uma vez)

```bash
psql -d postgres -c "CREATE ROLE agendauni LOGIN PASSWORD 'agendauni';" -c "CREATE DATABASE agendauni OWNER agendauni;"
```

As credenciais acima são **fictícias, só para desenvolvimento local**. Para usar outras, defina
`DB_URL`, `DB_USER` e `DB_PASSWORD` antes de iniciar o backend.

### 3. Subir o backend (terminal 1)

```bash
npm run api
```

Na primeira execução o Maven Wrapper baixa as dependências. A API fica em `http://localhost:8080`.
As tabelas são criadas pelo `schema.sql` e, se o banco estiver vazio, os dados fictícios são carregados.

Para **apagar tudo e recarregar os dados de demonstração** (antes de apresentar):

```bash
npm run api:reset
```

### 4. Subir o frontend (terminal 2)

```bash
npm run instalar
```

```bash
npm run web
```

Abra **http://localhost:5173**. O Vite repassa as chamadas `/api` para o Spring Boot.

## Usuários de teste (fictícios)

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@teste.com | admin123 |
| Solicitante | carlos@teste.com | carlos123 |
| Solicitante | bia@teste.com | bia12345 |

Os dados de demonstração trazem eventos em todos os estados. O rascunho **"Bate-papo com egressos"**
(Carlos) existe para mostrar o conflito: enviar com 19:30–21:00 é bloqueado; com 20:00–21:00 é aceito.

## Estrutura do projeto

```
backend/                                   API Java + Spring Boot
  src/main/resources/
    application.properties                 conexão com o banco e configurações
    schema.sql                             ESTRUTURA DO BANCO (tabelas, chaves, índices)
  src/main/java/br/univille/agendauni/
    model/          entidades JPA (Usuario, Evento, Local, Recurso, Tema, Curso, CentroCusto)
    repository/     acesso ao banco (EventoRepository tem a consulta de CONFLITO)
    service/
      EventoService.java     REGRAS DE NEGÓCIO: validações, conflito, aprovar, rejeitar, cancelar
      DadosIniciais.java     dados fictícios da demonstração
    controller/     rotas da API (auth, público, solicitações, admin, cadastros, usuários, relatório)
    config/         ControleDeAcesso (login e perfil), BCrypt
    exception/      erros viram JSON { "erros": [...] }
    dto/            formatos de entrada e saída da API

frontend/                                  React + Vite
  public/logo-univille.png                 símbolo da Univille
  src/
    api.js          única função que conversa com a API
    auth.jsx        quem está logado (contexto)
    App.jsx         rotas e proteção por perfil
    components/     Logo, Cabecalho (menu de cima e menu inferior no celular), Avisos, Confirmar...
    pages/          Agenda, Login, MinhasSolicitacoes, FormularioEvento, DetalheEvento
    pages/admin/    Solicitacoes, Cadastros, Usuarios, Relatorio
    styles.css      identidade visual (verdes da Univille) e versão para celular
```

## Principais rotas da API

| Método e rota | Quem | O que faz |
|---|---|---|
| `GET /api/publico/agenda` | todos | eventos aprovados do mês atual + 2 |
| `POST /api/auth/login` / `logout`, `GET /api/auth/eu` | todos | login por sessão |
| `GET /api/publico/eventos/{id}` e `.../imagem` | todos | página pública do evento e arte |
| `GET /api/opcoes` | logado | temas, locais (com recursos) e cursos (com centro de custo) |
| `GET /api/disponibilidade?localId=&data=` | logado | ocupação do local no dia (antes de enviar) |
| `PUT /api/auth/senha` | logado | trocar a própria senha |
| `POST/DELETE /api/solicitacoes/{id}/imagem` | solicitante | anexar ou remover a arte do evento |
| `GET/POST/PUT/DELETE /api/solicitacoes` (`?acao=salvar\|enviar`) | solicitante | próprios pedidos |
| `POST /api/solicitacoes/{id}/cancelar` | solicitante | cancela pendente |
| `GET /api/admin/solicitacoes?status=` | admin | lista por status |
| `POST /api/admin/solicitacoes/{id}/aprovar` \| `rejeitar` \| `cancelar`, `PUT .../{id}` | admin | análise e edição |
| `/api/admin/cadastros/{temas\|recursos\|locais\|cursos\|centros-custo}` | admin | CRUD dos cadastros |
| `/api/admin/usuarios` (+ `/{id}/ativo`) | admin | usuários |
| `GET /api/admin/painel`, `GET /api/admin/ocupacao?data=` | admin | painel inicial e grade do dia |
| `/api/admin/bloqueios` | admin | bloquear e desbloquear locais |
| `GET /api/admin/relatorio` e `/api/admin/relatorio/csv` | admin | relatório e CSV |

## Regras de negócio implementadas

- **Estados:** Rascunho → Aguardando aprovação → Aprovado ou Rejeitado; e Cancelado.
- **Rascunho** aceita dados incompletos (só exige o nome). **Envio** exige todos os campos obrigatórios.
- Data de hoje em diante; término depois do início (um único dia, um único local).
- Os recursos que podem ser marcados dependem do local; o servidor confere de novo.
- O centro de custo vem automaticamente do curso/coordenação.
- O nome livre "Solicitante" é diferente do usuário logado (`autor_id`), e os dois ficam gravados.
- Rejeição exige motivo, que aparece para o autor. Aprovação revalida tudo, inclusive o conflito.
- Cancelado não aparece na agenda pública; o registro é mantido.
- Cadastros em uso não podem ser excluídos (chave estrangeira no banco). Usuários são desativados, não apagados.
- E-mail único; senha com hash BCrypt (8+ caracteres, letras e números); sem autocadastro.
- Público estimado não pode passar da capacidade do local; local bloqueado não aceita pedidos na data.
- A aprovação trava a linha do local (`SELECT ... FOR UPDATE`): se dois administradores aprovarem ao mesmo
  tempo, o segundo espera e enxerga o primeiro na checagem de conflito.
- Solicitante só vê os próprios pedidos; rotas `/api/admin` só para administradores.
- Relatório com filtros combináveis (período, curso, tema, status); o CSV sai com os mesmos filtros e campos.

## Usabilidade (pensada para quem não é da área de tecnologia)

- Linguagem simples ("Meus pedidos", "Começa às", "Precisa emitir declarações?").
- Botões e campos grandes (mínimo de 48px), fáceis de tocar no celular.
- No celular, o menu vira uma **barra fixa embaixo**, como nos aplicativos.
- Formulário em **4 passos numerados**, com contador de campos que faltam e barra de ações sempre visível.
- Campos que faltam ficam **marcados em vermelho** com a explicação logo abaixo.
- Cada status vem com uma frase explicando **o que acontece agora**.
- Confirmação antes de ações sem volta (excluir, cancelar, aprovar, rejeitar).
- Mensagens de sucesso e erro aparecem e somem sozinhas.
- **Ajuda contextual:** botão "?" ao lado das ações e campos que geram dúvida abre um passo a passo
  com os passos do perfil de quem está usando (e um botão "Fazer agora") e as dúvidas frequentes relacionadas.
  O menu **Ajuda** reúne tudo com busca. Os textos ficam em `frontend/src/ajuda.js`.
- Guia completo de código, banco, API e apresentação: [GUIA_APRESENTACAO.md](GUIA_APRESENTACAO.md).

## Componentes reutilizados

Nenhum template ou kit de interface pronto. Bibliotecas de terceiros: Spring Boot, Spring Data JPA,
driver PostgreSQL, Spring Security Crypto (só BCrypt), Lombok, React, React Router e Vite.
Ícones desenhados em SVG no próprio projeto. Fontes Inter e Montserrat (Google Fonts).
Todo o código do sistema de eventos foi escrito durante o desafio.

## Ferramentas de IA utilizadas

- **Claude (Anthropic) — Claude Code**: apoio na estruturação do projeto, geração de partes do código,
  revisão e testes. Todo o código foi revisado e testado pela equipe.

_(Ajuste esta seção com as ferramentas que a equipe realmente usou.)_
