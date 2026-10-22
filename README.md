# AgendaUni — Sistema de Gestão de Eventos Institucionais

Projeto do **Software Engineering Challenge 2026 — Univille (Campus São Bento do Sul)**.

**Equipe:** _NOME DA EQUIPE_
**Integrantes:** _Nome 1 (representante)_, _Nome 2_, _Nome 3_, _Nome 4_

## Resumo

Aplicação web que centraliza as solicitações de eventos do setor de Eventos da Univille:

- **Visitante** (sem login): vê a grade pública com os eventos **aprovados** do mês atual e dos dois meses seguintes, em ordem cronológica.
- **Solicitante**: cria a solicitação, salva **rascunho** ou **envia**, acompanha em *Minhas solicitações*, edita rascunhos/pendentes, corrige e reenvia rejeitados, exclui rascunhos e cancela pendentes.
- **Administrador**: cadastra usuários, temas, locais (com seus recursos), recursos, cursos/coordenações e centros de custo; aprova ou rejeita (com justificativa); edita/cancela aprovados; emite relatório com filtros e exporta CSV.

Regra central: **conflito de agenda** — o sistema impede que dois eventos aprovados usem o mesmo local, na mesma data, com horários sobrepostos. A checagem acontece no **envio**, na **aprovação** e na **edição** de um aprovado.

## Tecnologias

| Camada | Tecnologia | Por quê |
|---|---|---|
| Servidor | Node.js 22.13+ e Express 5 | Simples, conhecido, poucas linhas para criar rotas |
| Telas | EJS (HTML gerado no servidor) + CSS próprio | Sem framework de front-end; fácil de ler |
| Banco | SQLite via `node:sqlite` (nativo do Node) | Banco real em arquivo, sem instalar servidor |
| Login | `express-session` + `bcryptjs` | Sessão por cookie e senha guardada como hash |

## Como executar

Pré-requisito: **Node.js 22.13 ou superior** (`node -v`).

```bash
npm install      # instala as dependências
npm run seed     # cria o banco data/agenda.db com dados fictícios
npm start        # abre em http://localhost:3000
```

Para desenvolver com recarga automática: `npm run dev`.

## Configuração do banco

- O banco é um arquivo **SQLite** em `data/agenda.db`, criado automaticamente na primeira execução.
- As tabelas são criadas em [`src/db.js`](src/db.js) (`CREATE TABLE IF NOT EXISTS`).
- `npm run seed` **apaga e recria** os dados fictícios ([`src/seed.js`](src/seed.js)).
- Variáveis opcionais: `PORT` (padrão 3000), `DB_PATH` (outro arquivo de banco) e `SESSION_SECRET`.

### Modelo de dados

```
usuarios (id, nome, email UNIQUE, senha_hash, perfil, ativo)
centros_custo (id, codigo, nome)
cursos (id, nome, centro_custo_id → centros_custo)
temas (id, nome)        locais (id, nome)        recursos (id, nome)
local_recursos (local_id → locais, recurso_id → recursos)          -- N:N
eventos (id, autor_id → usuarios, solicitante (texto livre), nome, tema_id, data,
         hora_inicio, hora_fim, local_id, curso_id, palestrante, publico_alvo,
         justificativa, objetivo, cerimonial, inscricoes, declaracoes, observacoes,
         status, motivo_rejeicao, criado_em, atualizado_em)
evento_recursos (evento_id → eventos, recurso_id → recursos)       -- N:N
```

As chaves estrangeiras estão ativadas (`PRAGMA foreign_keys = ON`), então o próprio banco
impede excluir um cadastro que ainda está em uso.

## Usuários de teste (fictícios)

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@teste.com | admin123 |
| Solicitante | carlos@teste.com | carlos123 |
| Solicitante | bia@teste.com | bia123 |

O seed também cria eventos em todos os estados (aprovado, aguardando, rascunho, rejeitado, cancelado).
O rascunho **"Bate-papo com egressos"** (Carlos) foi feito para demonstrar o conflito: tente enviá-lo
com 19:30–21:00 (bloqueia) e depois com 20:00–21:00 (passa).

## Estrutura do código

```
src/
  server.js          configura o Express, sessão e registra as rotas
  db.js              conexão SQLite + criação das tabelas
  seed.js            dados fictícios
  regras.js          REGRAS DE NEGÓCIO: validações, conflito de agenda, salvar evento
  middlewares.js     controle de acesso (login/admin) e mensagens
  routes/
    publico.js       página inicial (grade pública)
    auth.js          login / logout
    solicitante.js   minhas solicitações, formulário, rascunho, envio, excluir, cancelar
    admin.js         análise, cadastros, usuários, relatório e CSV
views/               telas EJS (partials = topo e rodapé)
public/style.css     visual
```

## Regras de negócio implementadas

- **Estados:** `RASCUNHO → AGUARDANDO → APROVADO | REJEITADO`, e `CANCELADO`.
  - Rascunho: pode estar incompleto (só o nome é exigido); autor edita ou exclui.
  - Aguardando: autor edita ou cancela; admin aprova ou rejeita.
  - Rejeitado: justificativa obrigatória, visível ao autor; pode corrigir e reenviar.
  - Aprovado: aparece na página pública; só o admin edita ou cancela.
  - Cancelado: não aparece na página pública; registro mantido.
- **Envio:** todos os campos obrigatórios, data hoje ou futura, horário final maior que o inicial
  (um único dia), recursos precisam pertencer ao local escolhido e checagem de conflito.
- **Conflito:** `inicio_novo < fim_existente` **e** `fim_novo > inicio_existente`, mesmo local e data,
  apenas contra eventos **aprovados**. Locais diferentes no mesmo horário são permitidos.
- **Centro de custo:** definido automaticamente pelo curso/coordenação.
- **Solicitante x autor:** o campo "Solicitante" é texto livre; o usuário logado é gravado separadamente em `autor_id`.
- **Cadastros:** exclusão só sem vínculos (chave estrangeira); usuários são desativados, não apagados; e-mail único.
- **Relatório:** filtros por período, curso, tema (e status), combináveis; o CSV exporta exatamente o mesmo resultado.
- **Segurança:** senha com hash bcrypt, sem autocadastro, rotas de admin protegidas, solicitante só vê os próprios pedidos.

## Componentes reutilizados

Não foram usados templates nem componentes prontos de interface. Bibliotecas de terceiros: Express,
express-session, EJS e bcryptjs (npm). Todo o código do sistema de eventos foi escrito durante o desafio.

## Ferramentas de IA utilizadas

- **Claude (Anthropic) — Claude Code**: apoio na estruturação do projeto, geração de partes do código,
  revisão e testes. Todo o código foi revisado e testado pela equipe.

_(Ajuste esta seção com as ferramentas que a equipe realmente usou.)_
