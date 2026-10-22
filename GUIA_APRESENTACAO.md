# Guia de estudo e apresentação (5 minutos)

## Roteiro da demo (cronometrado)

| Tempo | O que mostrar | O que falar |
|---|---|---|
| 0:00–0:30 | Página inicial | "Visitante sem login vê só eventos aprovados, mês atual + 2, em ordem de data." |
| 0:30–1:45 | Login **carlos@teste.com** → Minhas solicitações → abrir "Bate-papo com egressos" → Editar → **Enviar** | Aparece o **erro de conflito** (19:30 bate com 19:00–20:00 no Auditório A). Trocar para **20:00** → Enviar → passa. "Encostar no horário pode, sobrepor não." |
| 1:45–2:45 | Sair → login **admin@teste.com** → Analisar → abrir o pedido → **Aprovar** | "Na aprovação o sistema checa o conflito de novo, porque outro evento pode ter sido aprovado depois do envio." Voltar na página inicial: o evento apareceu. |
| 2:45–3:15 | Abrir outro pendente → Rejeitar **sem** motivo (erro) → com motivo | "Justificativa obrigatória; o solicitante vê o motivo e pode corrigir e reenviar." |
| 3:15–4:00 | **Persistência**: Cadastros → Temas → criar "Mesa redonda" → **F5** → continua lá → tentar excluir "Palestra" | "Está no banco SQLite. E o banco recusa excluir tema em uso (chave estrangeira)." |
| 4:00–4:40 | Relatório → filtrar por curso → **Exportar CSV** | "Filtros combináveis; o CSV é a mesma consulta." |
| 4:40–5:00 | Fechar | "Node + Express + SQLite, senha com hash, código separado em rotas e regras." |

> Antes de apresentar: `npm run seed` para voltar os dados ao estado inicial.

---

## Perguntas prováveis da banca (e respostas)

**Por que essas tecnologias?**
Node/Express é simples e a equipe conhece JavaScript. EJS gera o HTML no servidor, então não
precisa de API separada nem React. SQLite é um banco SQL real em arquivo: não precisa instalar
servidor, e o `node:sqlite` já vem no Node.

**Onde está o banco? É real?**
Arquivo `data/agenda.db`. As tabelas estão em `src/db.js`. Dá para abrir com qualquer cliente SQLite
(ex.: DB Browser for SQLite) e ver os registros mudando.

**Como funciona a regra de conflito?** (`src/regras.js`, função `buscarConflito`)
Busca evento **APROVADO**, no **mesmo local**, na **mesma data**, com
`hora_inicio_existente < hora_fim_nova` **E** `hora_fim_existente > hora_inicio_nova`.
- 19:00–20:00 vs 19:30–21:00 → 19:00 < 21:00 e 20:00 > 19:30 → **conflita**
- 19:00–20:00 vs 20:00–21:00 → 20:00 > 20:00 é falso → **não conflita**
Ignora o próprio evento (`e.id <> ?`) para o admin poder editar um aprovado sem conflitar com ele mesmo.

**Por que checar de novo na aprovação?**
Dois pedidos podem ser enviados para o mesmo horário (nenhum aprovado ainda). Ao aprovar o primeiro,
o segundo passa a conflitar — então a aprovação revalida.

**Por que comparar horário como texto funciona?**
Porque sempre está no formato `HH:MM` com 2 dígitos: "09:00" < "10:30" em ordem alfabética também.

**Como a senha é guardada?**
Com **bcrypt** (hash com salt). No login usamos `bcrypt.compareSync` contra o hash. A senha pura
nunca é salva.

**Como o sistema sabe quem pode o quê?** (`src/middlewares.js`)
Na sessão fica `{ id, nome, perfil }`. `exigirLogin` protege a área do solicitante e `exigirAdmin`
protege tudo em `/admin`. Além disso, o solicitante só abre eventos onde `autor_id` é o dele (senão 404).

**Qual a diferença entre "Solicitante" e "autor"?**
"Solicitante" é texto livre digitado no formulário (ex.: "Prof. Carlos Lima"). O `autor_id` é o
usuário logado que registrou. São campos separados, como pede o caderno.

**Como funciona rascunho vs envio?**
O formulário tem dois botões com o mesmo `name="acao"`: `salvar` ou `enviar`. Salvar só exige o nome.
Enviar roda `validarEnvio` (obrigatórios, data, horário, recursos do local, conflito) e muda para AGUARDANDO.

**Como o local filtra os recursos?**
Tabela `local_recursos` (N:N). O formulário recebe a lista e um JavaScript pequeno mostra só os recursos
do local escolhido. O servidor **valida de novo** (`validarRecursosDoLocal`), porque o navegador pode ser burlado.

**E o centro de custo automático?**
O curso tem `centro_custo_id`. O formulário mostra o centro ao escolher o curso, e relatórios
pegam o centro via JOIN — não é digitado pelo usuário.

**Como funciona a exclusão de cadastros com vínculo?**
`PRAGMA foreign_keys = ON`. Se o tema está em algum evento, o `DELETE` falha com erro de chave
estrangeira e mostramos uma mensagem amigável. Usuários não são apagados, são **desativados**.

**Como o CSV é gerado?**
A função `consultaRelatorio` monta o `WHERE` só com os filtros preenchidos. A tela e o CSV usam a
**mesma função**, então sempre batem. Separador `;` e BOM UTF-8 para abrir certo no Excel brasileiro.

**Proteção contra SQL injection?**
Todas as consultas usam `prepare(...)` com `?` (parâmetros), nunca concatenam valor digitado.
Os nomes de tabela nos cadastros vêm de uma lista fixa (`CADASTROS`), não do usuário.

**Usaram IA?**
Sim, declarado no README (o regulamento permite com transparência). Seja honesto aqui.

---

## Mapa rápido "onde está cada coisa"

| Requisito | Arquivo |
|---|---|
| Grade pública (mês atual + 2) | `src/routes/publico.js` |
| Login / hash | `src/routes/auth.js` |
| Rascunho, envio, editar, excluir, cancelar | `src/routes/solicitante.js` |
| Validações e conflito | `src/regras.js` |
| Aprovar / rejeitar / editar aprovado | `src/routes/admin.js` (seção SOLICITAÇÕES) |
| Cadastros auxiliares | `src/routes/admin.js` (seção CADASTROS) + `views/admin/cadastro.ejs` |
| Usuários | `src/routes/admin.js` (seção USUÁRIOS) |
| Relatório e CSV | `src/routes/admin.js` (seção RELATÓRIO) |
| Tabelas | `src/db.js` |
