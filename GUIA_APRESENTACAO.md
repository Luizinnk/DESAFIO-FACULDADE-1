# AgendaUNI — Guia completo de apresentação e estudo

> Este guia explica **tudo** o que existe no sistema: o problema, as tecnologias, como o código se conecta
> ao banco, cada rota da API, as regras de negócio, o frontend, a ajuda, a segurança, o roteiro da demo
> de 5 minutos e as perguntas que a banca pode fazer. Leia com o código aberto ao lado.

## Sumário

1. [O sistema em 1 minuto](#1-o-sistema-em-1-minuto)
2. [Linguagens e tecnologias](#2-linguagens-e-tecnologias)
3. [Arquitetura: como as partes conversam](#3-arquitetura-como-as-partes-conversam)
4. [Como rodar o sistema](#4-como-rodar-o-sistema)
5. [Banco de dados: ligação, estrutura e consultas](#5-banco-de-dados-ligação-estrutura-e-consultas)
6. [Backend (Java + Spring Boot) arquivo por arquivo](#6-backend-java--spring-boot-arquivo-por-arquivo)
7. [API REST: todas as rotas](#7-api-rest-todas-as-rotas)
8. [Regras de negócio e onde estão no código](#8-regras-de-negócio-e-onde-estão-no-código)
9. [Segurança](#9-segurança)
10. [Frontend (React + Vite) arquivo por arquivo](#10-frontend-react--vite-arquivo-por-arquivo)
11. [Sistema de ajuda (botão "?")](#11-sistema-de-ajuda-botão-)
12. [Um pedido do clique ao banco (fluxo completo)](#12-um-pedido-do-clique-ao-banco-fluxo-completo)
13. [Usabilidade e acessibilidade](#13-usabilidade-e-acessibilidade)
14. [Roteiro da demonstração (5 minutos)](#14-roteiro-da-demonstração-5-minutos)
15. [Perguntas da banca e respostas](#15-perguntas-da-banca-e-respostas)
16. [Comandos úteis e solução de problemas](#16-comandos-úteis-e-solução-de-problemas)
17. [Uso de IA e honestidade](#17-uso-de-ia-e-honestidade)

---

## 1. O sistema em 1 minuto

**Problema:** o setor de Eventos da Univille recebe pedidos por formulários soltos, sem controle de
aprovação, sem agenda pública única e com risco de dois eventos na mesma sala ao mesmo tempo.

**Solução:** o **AgendaUNI**, uma aplicação web que cobre o ciclo completo:
`pedido → validação → análise (aprovar/rejeitar) → publicação na agenda → relatórios`.

| Perfil | Precisa de login? | O que faz |
|---|---|---|
| **Visitante** | Não | Vê a agenda pública (aprovados do mês atual + 2 meses), busca, abre a página do evento, adiciona ao calendário e compartilha |
| **Solicitante** | Sim | Cria pedido, salva rascunho, envia, acompanha, corrige rejeitados, cancela pendentes, anexa a arte do evento, troca a própria senha |
| **Administrador** | Sim | Painel, aprova/rejeita, edita e cancela aprovados, vê a ocupação das salas, bloqueia locais, mantém cadastros e usuários, emite relatório e CSV |

**Regra central — conflito de agenda:** dois eventos **aprovados** não podem usar o mesmo local, na mesma data,
com horários sobrepostos. É checada **no formulário (antes de enviar)**, **no envio**, **na aprovação** e **na
edição** de um aprovado.

**Ciclo de status:** `RASCUNHO → AGUARDANDO → APROVADO | REJEITADO`, e `CANCELADO`.

---

## 2. Linguagens e tecnologias

| Camada | Linguagem / tecnologia | Versão | Para que serve aqui |
|---|---|---|---|
| Backend | **Java** | 21 | Linguagem da API e das regras de negócio |
| Backend | **Spring Boot** | 3.3.5 | Sobe o servidor web (Tomcat embutido), injeção de dependências, configuração |
| Backend | **Spring Web (MVC)** | — | Controllers REST, JSON automático (Jackson), interceptor de acesso |
| Backend | **Spring Data JPA + Hibernate 6** | — | Mapeia classes Java em tabelas e gera o SQL dos repositórios |
| Backend | **Spring Security Crypto** | — | Só o **BCrypt**, para hash de senhas |
| Backend | **Lombok** | — | Gera getters/setters das entidades (`@Getter @Setter`) |
| Backend | **Maven** (via `mvnw`) | 3.9 | Baixa dependências e compila; o wrapper dispensa instalar o Maven |
| Banco | **PostgreSQL** + **SQL** | 16 | Banco relacional real; estrutura em `schema.sql` |
| Frontend | **JavaScript** (JSX) | ES2022 | Linguagem das telas |
| Frontend | **React** | 18.3 | Componentes de interface e estado da tela |
| Frontend | **React Router** | 6.28 | Navegação entre telas sem recarregar a página |
| Frontend | **HTML** | 5 | `index.html` e a marcação gerada pelo JSX |
| Frontend | **CSS** | 3 | `styles.css`: identidade visual, responsivo, acessibilidade (sem framework de CSS) |
| Execução local | **Vite** | 5.4 | Servidor de desenvolvimento do front e **proxy** de `/api` para o Spring |
| Versionamento | **Git + GitHub** | — | Histórico de commits; repositório público |

**Por que essa combinação?** Java + Spring Boot é padrão de mercado para APIs, com camadas bem definidas.
React deixa a interface rápida e reutilizável. PostgreSQL garante integridade (chaves estrangeiras,
`UNIQUE`, `CHECK`). O Vite roda o front localmente com recarga instantânea. Tudo roda **na máquina local**,
sem depender de serviços externos na demonstração.

---

## 3. Arquitetura: como as partes conversam

```
 ┌────────────────────────── Navegador (http://localhost:5173) ──────────────────────────┐
 │  React (páginas e componentes)                                                        │
 │     │  fetch('/api/...')  via api.js  — envia o cookie de sessão JSESSIONID            │
 └─────┼─────────────────────────────────────────────────────────────────────────────────┘
       ▼
 ┌──────────── Vite (porta 5173) ────────────┐   proxy: tudo que começa com /api
 │  serve o React em desenvolvimento          │ ───────────────────────────────┐
 └────────────────────────────────────────────┘                                ▼
 ┌──────────────────────────── Spring Boot (porta 8080) ─────────────────────────────────┐
 │  ControleDeAcesso (interceptor)  → confere login e perfil antes de cada rota /api      │
 │  Controller  → recebe a requisição HTTP e devolve JSON                                 │
 │  Service     → REGRAS DE NEGÓCIO (validações, conflito, aprovar, histórico)            │
 │  Repository  → Spring Data JPA gera o SQL                                              │
 │  TratadorDeErros → transforma exceções em JSON { "erros": [...] }                      │
 └─────┼──────────────────────────────────────────────────────────────────────────────────┘
       ▼  JDBC (driver PostgreSQL)
 ┌──────────── PostgreSQL 16 (porta 5432, banco "agendauni") ────────────┐
 │  tabelas criadas por schema.sql; dados fictícios por DadosIniciais     │
 └────────────────────────────────────────────────────────────────────────┘
```

- **Camadas do backend:** `controller → service → repository → banco`. O controller nunca acessa o banco
  diretamente para regras; quem decide é o service.
- **Por que o proxy do Vite?** Front e API ficam na **mesma origem** (`localhost:5173`), então o cookie de
  login funciona sem configurar CORS. Arquivo: `frontend/vite.config.js`.
- **Formato de troca:** JSON. Datas como `"2026-10-25"`, horas como `"19:30"`.
- **Erros:** sempre `{ "erros": ["mensagem 1", "mensagem 2"] }` com o código HTTP certo (400, 401, 403, 404, 409).

---

## 4. Como rodar o sistema

**Pré-requisitos:** Java 21, PostgreSQL 16 e Node.js 18+ (no macOS: `brew install openjdk@21 postgresql@16 node`).

1. **Banco ligado:** `brew services start postgresql@16`
2. **Criar o banco (uma vez):**
   `psql -d postgres -c "CREATE ROLE agendauni LOGIN PASSWORD 'agendauni';" -c "CREATE DATABASE agendauni OWNER agendauni;"`
3. **Java 21 em uso** (se a máquina tiver mais de um):
   `export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`
4. **Terminal 1 — API:** `npm run api` (ou `npm run api:reset` para **apagar e recarregar** os dados de demonstração)
5. **Terminal 2 — Front:** `npm run instalar` (uma vez) e depois `npm run web`
6. Abrir **http://localhost:5173**

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@teste.com | admin123 |
| Solicitante | carlos@teste.com | carlos123 |
| Solicitante | bia@teste.com | bia12345 |

Os atalhos `npm run ...` estão no `package.json` da raiz.

---

## 5. Banco de dados: ligação, estrutura e consultas

### 5.1 Como o Java se conecta ao PostgreSQL

Arquivo `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/agendauni}
spring.datasource.username=${DB_USER:agendauni}
spring.datasource.password=${DB_PASSWORD:agendauni}
spring.sql.init.mode=always        # roda o schema.sql toda vez que a API sobe
spring.jpa.hibernate.ddl-auto=none # o Hibernate NÃO cria tabelas: quem manda é o schema.sql
```

- `${DB_URL:...}` = usa a variável de ambiente se existir; senão, o valor padrão (fictício, só local).
- O **driver JDBC** do PostgreSQL vem pelo `pom.xml` (`org.postgresql:postgresql`).
- O Spring Boot cria um **pool de conexões (HikariCP)** automaticamente com esses dados.
- O **Hibernate** traduz as classes `@Entity` para SQL. Nomes Java em camelCase viram snake_case:
  `horaInicio → hora_inicio`, `centroCusto → centro_custo_id`.

### 5.2 Estrutura (arquivo `schema.sql`)

| Tabela | Principais colunas | Observações |
|---|---|---|
| `usuarios` | nome, **email UNIQUE**, senha_hash, perfil (`ADMIN`/`SOLICITANTE`), ativo | Senha só em hash BCrypt |
| `centros_custo` | **codigo UNIQUE**, nome | Ex.: CC-202 - Computação |
| `cursos` | nome UNIQUE, **centro_custo_id → centros_custo** | O centro de custo vem daqui |
| `temas` | nome UNIQUE | Palestra, Workshop... |
| `locais` | nome UNIQUE, capacidade | Ambientes |
| `recursos` | nome UNIQUE | Projetor, Som... |
| `local_recursos` | local_id, recurso_id | **N:N** — recursos de cada local |
| `eventos` | autor_id, solicitante, nome, tema_id, data, hora_inicio, hora_fim, local_id, curso_id, palestrante, publico_alvo, publico_estimado, justificativa, objetivo, cerimonial, inscricoes, declaracoes, observacoes, **status (CHECK)**, motivo_rejeicao, criado_em, atualizado_em | O pedido é o próprio evento |
| `evento_recursos` | evento_id, recurso_id | **N:N** — recursos marcados no pedido |
| `evento_historico` | evento_id, acao, detalhe, usuario_nome, data_hora | Linha do tempo |
| `evento_imagens` | **evento_id (PK)**, tipo, **dados BYTEA**, atualizado_em | Arte do evento, separada para não pesar |
| `bloqueios` | local_id, data_inicio, data_fim, motivo, `CHECK (data_fim >= data_inicio)` | Manutenção, provas |

- **Índice** `idx_eventos_local_data (local_id, data)`: deixa a busca de conflito rápida.
- **Chaves estrangeiras** impedem apagar um cadastro em uso (ex.: tema usado por evento).
- `ON DELETE CASCADE` em `evento_recursos`, `evento_historico` e `evento_imagens`: ao excluir um rascunho, o resto vai junto.
- O `schema.sql` usa `CREATE TABLE IF NOT EXISTS` e `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, por isso pode rodar toda vez sem estragar nada.

### 5.3 Como o código consulta o banco

| Jeito | Exemplo | Onde |
|---|---|---|
| **Método derivado** (o Spring cria o SQL pelo nome) | `findByAutorIdOrderByAtualizadoEmDesc(id)` | `EventoRepository` |
| **JPQL com `@Query`** | busca de conflito (abaixo) | `EventoRepository.buscarConflitos` |
| **JPQL montado com filtros opcionais** | relatório | `RelatorioController.consultar` |
| **Trava de linha** (`SELECT ... FOR UPDATE`) | `@Lock(PESSIMISTIC_WRITE)` | `LocalRepository.travar` |
| **SQL direto** | `TRUNCATE ... RESTART IDENTITY` para o reset | `DadosIniciais` |

A consulta de conflito:

```java
@Query("""
  SELECT e FROM Evento e
  WHERE e.status = APROVADO AND e.local.id = :localId AND e.data = :data
    AND e.id <> :ignorarId
    AND e.horaInicio < :fim AND e.horaFim > :inicio
""")
```

Todas as consultas usam **parâmetros** (`:localId`), nunca texto concatenado → sem SQL injection.

### 5.4 Transações

`@Transactional` nos métodos do `EventoService`: salvar o evento, os recursos e a linha do histórico acontece
**tudo ou nada**. Se algo falhar no meio, o banco desfaz.

### 5.5 Dados de demonstração

`DadosIniciais.java` roda ao iniciar a API: se o banco estiver vazio (ou com `app.reset-dados=true`), cria
3 usuários, 3 centros de custo, 3 cursos, 4 temas, 5 recursos, 4 locais com capacidade, 1 bloqueio (Laboratório 5)
e 7 eventos em todos os status, com histórico e uma **arte gerada em Java** (`BufferedImage`) para a palestra.
As datas são relativas a hoje, para a agenda nunca ficar vazia.

### 5.6 Ver os dados com os próprios olhos (bom para a banca)

```bash
psql postgresql://agendauni:agendauni@localhost:5432/agendauni
\dt                                         -- lista as tabelas
SELECT id, nome, status, data FROM eventos ORDER BY data;
SELECT email, perfil, left(senha_hash, 20) FROM usuarios;  -- mostra que a senha é hash
```

---

## 6. Backend (Java + Spring Boot) arquivo por arquivo

Pasta: `backend/src/main/java/br/univille/agendauni/`

| Pacote / arquivo | O que faz |
|---|---|
| `AgendaUniApplication.java` | Ponto de entrada (`main`). Fixa o fuso America/Sao_Paulo |
| **model/** | Entidades JPA (cada uma = uma tabela) |
| `Usuario`, `Tema`, `Recurso`, `CentroCusto`, `Curso`, `Local`, `Evento` | Tabelas principais; `Local` e `Evento` têm `@ManyToMany` com `Recurso` |
| `EventoHistorico`, `EventoImagem`, `Bloqueio` | Histórico, arte e bloqueio |
| `Status`, `Perfil` | Enums guardados como texto (`@Enumerated(STRING)`) |
| **repository/** | Interfaces Spring Data (o Spring implementa sozinho) |
| `EventoRepository` | Listagens, contagem por status e **consulta de conflito** |
| `LocalRepository` | `travar(id)` → `SELECT ... FOR UPDATE` |
| `BloqueioRepository` | Bloqueio que cobre uma data |
| **service/** | Regras de negócio |
| `EventoService` | `validarRascunho`, `validarEnvio`, `buscarConflito`, `salvar`, `gravarPeloSolicitante`, `aprovar`, `rejeitar`, `cancelar`, `excluirRascunho`, `editarAprovado`, `registrar` (histórico), `paraDto` |
| `ImagemService` | Valida e grava a arte (JPG/PNG/WEBP, até 5 MB) |
| `DadosIniciais` | Dados fictícios da demonstração |
| **controller/** | Rotas HTTP (ver seção 7) |
| **config/** | `ControleDeAcesso` (login/perfil), `UsuarioSessao` (o que fica na sessão), `WebConfig` (registra o interceptor e o BCrypt) |
| **exception/** | `RegraNegocioException` (400), `NaoEncontradoException` (404), `TratadorDeErros` (converte tudo em JSON; 409 para chave estrangeira/duplicado; erros de upload) |
| **dto/** | `EventoForm` (o que chega do formulário), `EventoDto` (o que sai para a tela, com imagem e histórico) |

**Por que DTO?** Para não expor a entidade inteira (ex.: hash de senha do autor) e mandar só o que a tela usa.

---

## 7. API REST: todas as rotas

Base: `http://localhost:8080/api` (pelo front, `/api`). Corpo e respostas em JSON.

### Públicas (sem login)

| Método | Rota | O que faz |
|---|---|---|
| GET | `/publico/agenda` | Eventos **aprovados** do mês atual + 2 (`{ inicio, fim, eventos[] }`) |
| GET | `/publico/eventos/{id}` | Página pública de um evento aprovado |
| GET | `/publico/eventos/{id}/imagem` | Arte do evento (pública se aprovado; antes disso só autor/admin) |
| POST | `/auth/login` | `{ email, senha }` → cria a sessão e devolve `{ id, nome, email, perfil }` |
| POST | `/auth/logout` | Encerra a sessão |
| GET | `/auth/eu` | Quem está logado (o front chama ao abrir) |
| PUT | `/auth/senha` | `{ senhaAtual, novaSenha }` — troca a própria senha (exige sessão) |

### Usuário logado (solicitante ou admin)

| Método | Rota | O que faz |
|---|---|---|
| GET | `/opcoes` | Temas, locais (com recursos) e cursos (com centro de custo) para o formulário |
| GET | `/disponibilidade?localId=&data=&ignorarId=` | Ocupação do local no dia, bloqueio e capacidade (antes de enviar) |
| GET | `/solicitacoes` | Meus pedidos |
| GET | `/solicitacoes/{id}` | Detalhe com histórico (só se eu for o autor) |
| POST | `/solicitacoes?acao=salvar\|enviar` | Cria rascunho ou envia |
| PUT | `/solicitacoes/{id}?acao=salvar\|enviar` | Edita rascunho/pendente/rejeitado |
| DELETE | `/solicitacoes/{id}` | Exclui **rascunho** |
| POST | `/solicitacoes/{id}/cancelar` | Cancela pedido **aguardando** |
| POST / DELETE | `/solicitacoes/{id}/imagem` | Anexa (multipart, campo `arquivo`) ou remove a arte |

### Administrador (`/admin/**` — o interceptor bloqueia os outros perfis com 403)

| Método | Rota | O que faz |
|---|---|---|
| GET | `/admin/painel` | Números do painel, urgentes e próximos 7 dias |
| GET | `/admin/solicitacoes?status=` | Lista por status, com conflito já calculado e dias de espera |
| GET | `/admin/solicitacoes/contagem` | Quantidade por status (abas e menu) |
| GET | `/admin/solicitacoes/{id}` | Detalhe + aviso de conflito |
| POST | `/admin/solicitacoes/{id}/aprovar` | Revalida tudo (com trava do local) e publica |
| POST | `/admin/solicitacoes/{id}/rejeitar` | `{ motivo }` obrigatório |
| PUT | `/admin/solicitacoes/{id}` | Edita evento aprovado (checa conflito de novo) |
| POST | `/admin/solicitacoes/{id}/cancelar` | Cancela aprovado (sai da agenda) |
| POST / DELETE | `/admin/solicitacoes/{id}/imagem` | Arte do evento |
| GET | `/admin/ocupacao?data=` | Grade do dia: uma linha por local |
| GET / POST / DELETE | `/admin/bloqueios[/{id}]` | Lista, cria e remove bloqueios |
| GET / POST / PUT / DELETE | `/admin/cadastros/{tipo}[/{id}]` | `tipo` = `temas`, `recursos`, `locais`, `cursos`, `centros-custo` |
| GET / POST / PUT | `/admin/usuarios[/{id}]` | Lista, cria e edita usuários |
| POST | `/admin/usuarios/{id}/ativo` | Ativa/desativa (não pode desativar a si mesmo) |
| GET | `/admin/relatorio?dataInicio=&dataFim=&cursoId=&temaId=&localId=&status=` | Relatório com filtros combináveis |
| GET | `/admin/relatorio/csv?...` | Mesmo resultado em CSV (`;` + BOM para o Excel) |

**Exemplo — enviar um pedido:**

```http
POST /api/solicitacoes?acao=enviar
Content-Type: application/json
Cookie: JSESSIONID=...

{ "nome": "Palestra X", "temaId": 1, "data": "2026-11-20", "horaInicio": "19:00", "horaFim": "20:00",
  "localId": 1, "cursoId": 1, "solicitante": "Prof. Ana", "palestrante": "Dr. Y", "publicoAlvo": "Alunos",
  "publicoEstimado": 80, "justificativa": "...", "objetivo": "...", "cerimonial": true,
  "inscricoes": false, "declaracoes": false, "recursoIds": [1, 2] }
```

Resposta de erro típica (HTTP 400):

```json
{ "erros": ["Conflito de agenda: Auditório A já está reservado para \"Palestra: IA na Engenharia\" das 19:00 às 20:00 nessa data."] }
```

**Códigos HTTP usados:** 200 ok · 204 sem conteúdo · 400 regra/validação · 401 sem login · 403 sem permissão ·
404 não encontrado (também quando é pedido de outra pessoa) · 409 cadastro em uso ou duplicado.

---

## 8. Regras de negócio e onde estão no código

| Regra | Onde |
|---|---|
| Rascunho aceita incompleto (só o nome) | `EventoService.validarRascunho` |
| Envio exige 15 campos obrigatórios | `EventoService.validarEnvio` |
| Data de hoje em diante; término depois do início (um dia só) | `validarEnvio` (+ aviso imediato no `FormularioEvento.jsx`) |
| Recursos precisam ser do local escolhido | `validarRecursosDoLocal` |
| Público estimado ≤ capacidade do local | `validarEnvio` |
| Local bloqueado na data não aceita pedido | `validarEnvio` + `BloqueioRepository` |
| **Conflito de agenda** (só contra aprovados, mesmo local e data, horários sobrepostos) | `EventoRepository.buscarConflitos` |
| Aprovação revalida tudo e **trava o local** contra aprovação simultânea | `EventoService.aprovar` + `LocalRepository.travar` |
| Rejeição exige motivo, visível ao autor | `EventoService.rejeitar` |
| Autor edita só Rascunho/Aguardando/Rejeitado; aprovado só o admin | `EDITAVEIS_PELO_AUTOR` + `editarAprovado` |
| Excluir só rascunho; cancelar mantém o registro | `excluirRascunho`, `cancelar` |
| Centro de custo vem do curso | Relação `cursos.centro_custo_id` |
| "Solicitante" (texto livre) ≠ autor (usuário logado) | `eventos.solicitante` × `eventos.autor_id` |
| Cadastro em uso não é excluído | Chave estrangeira + `TratadorDeErros` (409) |
| Nome duplicado mesmo com acento/maiúscula ("AUDITORIO A") | `CadastroController.normalizar` |
| E-mail único, senha forte (8+ com letras e números), usuário desativado não entra | `UsuarioController`, `AuthController` |
| Agenda pública só mostra aprovados do mês atual + 2 | `PublicoController.agenda` |
| Toda ação relevante vira histórico | `EventoService.registrar` |

**A regra do conflito explicada:** dois intervalos se sobrepõem quando `inícioA < fimB` **e** `fimA > inícioB`.
- Aprovado 19:00–20:00 × pedido 19:30–21:00 → 19:00 < 21:00 e 20:00 > 19:30 → **conflita**
- Aprovado 19:00–20:00 × pedido 20:00–21:00 → 20:00 > 20:00 é falso → **não conflita** (encostar pode)

---

## 9. Segurança

| Ponto | Como foi resolvido |
|---|---|
| Senhas | Hash **BCrypt** com salt (`BCryptPasswordEncoder`); nunca guardadas puras |
| Sessão | Cookie `JSESSIONID` **HttpOnly** (JavaScript não lê), expira em 8h; nova sessão a cada login |
| Login | Mesma mensagem para e-mail ou senha errados (não revela qual falhou); usuário desativado é barrado |
| Permissões | `ControleDeAcesso` roda antes de toda rota `/api`: sem login → 401; `/api/admin` sem ADMIN → 403 |
| Dados de outra pessoa | `doAutor()` devolve 404 se o pedido não for de quem está logado |
| SQL injection | Somente consultas parametrizadas (JPA); nomes de tabela vêm de lista fixa |
| Upload | Só JPG/PNG/WEBP, até 5 MB, checado no servidor; arte de pedido não aprovado só para autor/admin |
| Corrida na aprovação | Trava pessimista no local (`FOR UPDATE`) |
| Segredos | Nenhuma credencial real no GitHub; dados fictícios; `.gitignore` para `ACESSO_LOCAL.txt` |
| Validação dupla | Tudo que a tela valida, o servidor valida de novo (a tela pode ser burlada) |

---

## 10. Frontend (React + Vite) arquivo por arquivo

Pasta: `frontend/`

| Arquivo | O que faz |
|---|---|
| `index.html` | Página base, fontes Inter/Montserrat, ícone |
| `vite.config.js` | Porta 5173 e **proxy `/api → localhost:8080`** |
| `src/main.jsx` | Liga o React: `BrowserRouter` → `AuthProvider` → `AvisosProvider` → `AjudaProvider` → `App` |
| `src/App.jsx` | Todas as rotas; `Protegida` exige login (e perfil admin quando pedido); rola para o topo a cada tela |
| `src/api.js` | `api()` — única função que chama o backend (JSON, cookie, erros); `enviarArquivo()` para a arte |
| `src/auth.jsx` | Contexto de login: `usuario`, `entrar`, `sair` (consulta `/auth/eu` ao abrir) |
| `src/util.js` | Textos de status, datas (`dataBR`, `partesData`), regra de sobreposição no front, iniciais |
| `src/ajuda.js` | **Conteúdo da ajuda**: tutoriais por perfil e dúvidas frequentes |
| `src/styles.css` | Identidade visual (variáveis de cor), componentes, versão celular, acessibilidade |
| **components/** | |
| `Logo` | Símbolo da Univille + "Agenda**UNI**" |
| `Cabecalho` | Menu por perfil, contador de pendentes, botão Ajuda, avatar com menu (trocar senha, sair); no celular, **menu inferior** |
| `Campo` | Campo acessível: `label`↔`id`, `aria-invalid`, `aria-describedby`, erro com `role="alert"`, "?" opcional |
| `Disponibilidade` | Ocupação do local no dia, alertas vermelho/amarelo/verde e **horários livres clicáveis** |
| `Ajuda` | Botão "?", painel de ajuda e perguntas em sanfona |
| `Avisos` | Mensagens rápidas (toast) de sucesso/erro |
| `Confirmar` | Janela de confirmação para ações sem volta |
| `TrocarSenha` | Janela para trocar a própria senha |
| `Comuns` | Selo de status, título de página, carregando, esqueleto, vazio, caixa de erros |
| `Icone` | Ícones SVG desenhados no projeto (sem biblioteca) |
| **pages/** | |
| `Agenda` | Agenda pública: busca, filtro por tema, cartões por mês, selos "Hoje/Esta semana" |
| `EventoPublico` | Página do evento: arte, .ics, Google Agenda, WhatsApp, copiar link |
| `Login` | Entrar, mostrar senha, "Esqueci minha senha" |
| `MinhasSolicitacoes` | Meus pedidos com abas e contadores |
| `FormularioEvento` | Pedido em 4 etapas + arte; validação imediata; ✓ por etapa; contador clicável |
| `DetalheEvento` | Detalhe, aviso único de status, histórico, ações por perfil, ocupação lateral (admin) |
| `Ajuda` | Central de ajuda com busca |
| `admin/Painel` | Indicadores, urgentes, próximos 7 dias |
| `admin/Solicitacoes` | Abas com contador, conflito no cartão, tempo de espera, busca |
| `admin/Ocupacao` | Grade do dia por local + bloqueios |
| `admin/Cadastros` | Cinco cadastros com a mesma tela |
| `admin/Usuarios` | Lista, busca, filtro e formulário em janela |
| `admin/Relatorio` | Atalhos de período, filtros automáticos, indicadores, tabela (computador) e cartões (celular), CSV |

**Como uma tela busca dados:** `useEffect(() => { api('/admin/painel').then(setPainel) }, [])` → o React
redesenha quando o estado muda. **Como envia:** `api('/solicitacoes?acao=enviar', { metodo: 'POST', corpo })`.

---

## 11. Sistema de ajuda (botão "?")

- **Botão "?"** (`BotaoAjuda`) ao lado de títulos e campos que geram dúvida: Agenda, "Quero solicitar um evento",
  Login, Meus pedidos, formulário (tema, público estimado, "Quando e onde", recursos, responsável, centro de custo,
  perguntas Sim/Não, arte), ocupação do local, status do pedido e todas as telas do admin.
- **Ao clicar**, abre um **painel** (lateral no computador, de baixo para cima no celular) com:
  - **Passo a passo** da ação, **com os passos do perfil de quem está usando** (o visitante vê "Clique em Entrar";
    o solicitante vê "Toque em Novo pedido"), e um botão **"Fazer agora"** que leva direto à tela certa;
  - **Dúvidas relacionadas** em sanfona;
  - **Outras ajudas** do mesmo perfil e o link para a central.
- **Dúvidas frequentes** que só explicam um conceito (sem ação): centro de custo, status, conflito, pedido em análise,
  bloqueio, público estimado, rascunho × envio, responsável × registrado por, recursos, cerimonial/inscrições/declarações,
  acesso e senha, perfis, cancelar × excluir, cadastro em uso, quem vê a arte, período da agenda, tema.
- **Menu Ajuda** no cabeçalho (para todos, inclusive visitantes) e no menu da conta → página `/ajuda` com **busca**
  que ignora acentos.
- **Onde editar os textos:** `frontend/src/ajuda.js` (sem mexer em código de tela).
- Acessível: o botão tem nome para leitor de tela ("Ajuda: O que é centro de custo?"), o painel é `role="dialog"`,
  fecha com **Esc** e recebe o foco ao abrir.

---

## 12. Um pedido do clique ao banco (fluxo completo)

1. O solicitante preenche a etapa 2. O componente `Disponibilidade` chama `GET /api/disponibilidade` e mostra, **antes de
   enviar**, se o horário conflita (vermelho) ou se há outro pedido em análise (amarelo).
2. Ele toca em **Enviar pedido** → `FormularioEvento.gravar('enviar')` → `paraApi()` converte os campos (vazio vira `null`)
   → `POST /api/solicitacoes?acao=enviar`.
3. O Vite repassa para o Spring. O `ControleDeAcesso` confere a sessão.
4. `SolicitacaoController.criar` → `EventoService.gravarPeloSolicitante`:
   `validarEnvio` (obrigatórios, data, horário, recursos, capacidade, bloqueio) → `buscarConflito` (JPQL) → `salvar`
   (INSERT em `eventos` e `evento_recursos`) → `registrar` (INSERT em `evento_historico`: CRIADO, ENVIADO). Tudo numa transação.
5. Se houver arte, o front envia depois `POST /api/solicitacoes/{id}/imagem` (multipart) → `ImagemService` → `evento_imagens`.
6. O front mostra o aviso "Pedido enviado!" e abre o detalhe.
7. O admin abre o pedido (`GET /api/admin/solicitacoes/{id}` já traz o conflito) e aprova →
   `EventoService.aprovar`: **trava o local**, revalida tudo, muda para APROVADO, grava no histórico.
8. A agenda pública (`GET /api/publico/agenda`) passa a mostrar o evento, com a arte.

---

## 13. Usabilidade e acessibilidade

- Linguagem do dia a dia ("Meus pedidos", "Começa às", "Precisa emitir declarações?").
- Botões e campos de **48px** ou mais; menu **inferior** no celular, ao alcance do polegar.
- Formulário em 4 etapas com **✓** por etapa e contador "faltam N campos · ir para o próximo".
- Erros **embaixo do campo, na hora**; uma frase curta em vez de listas longas.
- Cada status com uma frase de "o que acontece agora", escrita diferente para solicitante e admin.
- Confirmação antes de excluir, cancelar, aprovar e rejeitar; motivos rápidos de rejeição.
- Esqueletos de carregamento; avisos que somem sozinhos; ajuda contextual com "?".
- Acessibilidade: rótulos ligados aos campos, `aria-invalid`, `role="alert"`, foco visível, contraste adequado,
  `prefers-reduced-motion` (menos animação para quem pede).
- Identidade Univille: verde-escuro `#00653a` e verde-claro `#8cc63f`, Montserrat nos títulos, Inter no texto.

---

## 14. Roteiro da demonstração (5 minutos)

> Antes: `npm run api:reset` e `npm run web`. Deixe uma janela anônima para o segundo usuário.

| Tempo | Ação | Fala |
|---|---|---|
| 0:00–0:30 | Agenda pública: busca, cartão com arte, abrir evento → "Adicionar ao calendário" | "Visitante vê só aprovados, mês atual mais dois, e leva o evento para o calendário." |
| 0:30–1:45 | Entrar como **carlos@teste.com** → Meus pedidos → "Bate-papo com egressos" → Editar | Na etapa 2 o sistema **já avisa em vermelho** o conflito com 19:00–20:00. Tocar em **20:00–23:00** → "Horário livre" → **Enviar**. Mostrar o "?" do centro de custo. |
| 1:45–2:45 | Entrar como **admin@teste.com** → Painel → Solicitações → abrir o pedido (ocupação ao lado) → **Aprovar** | "Na aprovação o sistema confere de novo e trava o local." Voltar à agenda: o evento está lá. |
| 2:45–3:15 | Abrir "Congresso de Mecânica" → Rejeitar com motivo rápido | "Motivo obrigatório; o solicitante corrige e reenvia; tudo fica no histórico." |
| 3:15–4:00 | **Persistência:** Cadastros → criar tema "Mesa redonda" → **F5** → continua → tentar excluir "Palestra" | "Está no PostgreSQL; o próprio banco recusa excluir tema em uso." (Opcional: `SELECT` no `psql`.) |
| 4:00–4:40 | Ocupação (bloqueio do Laboratório 5) → Relatório → filtrar → **Exportar CSV** | "Bloqueio impede pedidos; o CSV é a mesma consulta da tela." |
| 4:40–5:00 | Mostrar no celular (menu inferior) e a página Ajuda | "Pensado para qualquer pessoa usar sem treinamento." |

---

## 15. Perguntas da banca e respostas

**1. Por que Spring Boot + React + PostgreSQL?** Separação clara: tela (React), regras (Spring), dados (PostgreSQL).
São tecnologias de mercado, e o PostgreSQL protege os dados com chaves estrangeiras e restrições.

**2. Onde está a estrutura do banco?** `backend/src/main/resources/schema.sql`. Roda a cada inicialização com `IF NOT EXISTS`.

**3. Como o Java conversa com o banco?** Spring Data JPA + Hibernate, pelo driver JDBC do PostgreSQL, com a URL em
`application.properties`. Os repositórios são interfaces; o Spring gera o SQL.

**4. Por que `ddl-auto=none`?** Para o `schema.sql` ser a única fonte da estrutura: fica explícito e versionado no Git.

**5. Como funciona o conflito?** Ver seção 8. Consulta JPQL com `inícioExistente < fimNovo AND fimExistente > inícioNovo`,
mesmo local e data, só aprovados, ignorando o próprio evento.

**6. E se dois admins aprovarem ao mesmo tempo?** `LocalRepository.travar` faz `SELECT ... FOR UPDATE` na linha do local.
O segundo espera o primeiro terminar e então enxerga o conflito.

**7. Por que checar o conflito no envio e na aprovação?** Dois pedidos podem ser enviados enquanto nenhum está aprovado.
Quando o primeiro é aprovado, o segundo passa a conflitar.

**8. Como a senha é guardada?** Hash BCrypt com salt. No login, `encoder.matches()` compara.

**9. Como o sistema sabe o perfil?** No login, `{ id, nome, email, perfil }` vai para a sessão. O `ControleDeAcesso`
lê a sessão antes de cada rota.

**10. O solicitante consegue ver o pedido de outra pessoa?** Não: `doAutor()` responde 404.

**11. Por que 404 e não 403 nesse caso?** Para não revelar que o pedido existe.

**12. Onde fica a imagem?** Tabela `evento_imagens` (BYTEA), separada de `eventos`. Validada no `ImagemService`.

**13. Como o front chama a API?** Sempre por `api.js` (`fetch` com JSON e cookie). O Vite repassa `/api` para a porta 8080.

**14. O que é DTO?** Objeto de transferência: entra `EventoForm`, sai `EventoDto`. Evita expor a entidade inteira.

**15. Como o relatório e o CSV batem?** Os dois chamam o mesmo `RelatorioController.consultar`.

**16. Por que não há recuperação de senha por e-mail?** O caderno diz que não é obrigatória e exigiria servidor de e-mail.
Cada usuário troca a própria senha; o admin redefine se necessário.

**17. Como o "?" mostra passos diferentes?** `ajuda.js` define `passos(perfil)`; o painel lê o perfil do usuário logado.

**18. Como provar que o banco é real?** Criar algo, apertar F5 e ver que continua; ou mostrar no `psql`.

**19. Como é a acessibilidade?** Seção 13: rótulos ligados, erros anunciados, foco visível, contraste, menos animação.

**20. Quantas rotas tem a API?** 41 rotas em 9 controllers.

---

## 16. Comandos úteis e solução de problemas

| Situação | O que fazer |
|---|---|
| Voltar os dados ao estado inicial | `npm run api:reset` |
| "Unable to locate a Java Runtime" / erro de Lombok | Exportar `JAVA_HOME` do Java 21 (seção 4) |
| API não conecta no banco | `brew services start postgresql@16` e conferir se o banco `agendauni` existe |
| Porta 8080 ou 5173 ocupada | Fechar o processo antigo ou reiniciar o terminal |
| Login falha com a senha certa | Conferir se o Chrome não preencheu outra senha; usar "Mostrar" |
| Ver os dados | `psql postgresql://agendauni:agendauni@localhost:5432/agendauni` |
| Compilar sem rodar | `cd backend && ./mvnw -DskipTests package` e `cd frontend && npx vite build` |

---

## 17. Uso de IA e honestidade

O regulamento permite assistentes de IA com transparência. O projeto foi desenvolvido com apoio do **Claude
(Anthropic), via Claude Code**, declarado no README. Na apresentação, diga isso com naturalidade e mostre que vocês
entendem o código: as seções 5, 7, 8 e 12 deste guia são as mais perguntadas. Estude-as com o código aberto.
