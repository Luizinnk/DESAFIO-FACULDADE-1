# Guia de estudo e apresentação (5 minutos)

## Antes de apresentar

1. Terminal 1: `npm run api:reset` (sobe a API e volta os dados ao estado inicial).
2. Terminal 2: `npm run web` e abra http://localhost:5173.
3. Deixe uma aba anônima pronta para o segundo usuário (solicitante e admin ao mesmo tempo).

## Roteiro da demo (cronometrado)

| Tempo | O que mostrar | O que falar |
|---|---|---|
| 0:00–0:30 | Agenda pública | "Visitante sem login vê só eventos aprovados, do mês atual mais dois, em ordem de data." |
| 0:30–1:45 | Entrar como **carlos@teste.com** → Meus pedidos → "Bate-papo com egressos" → Editar pedido | Na etapa 2 o sistema **já avisa em vermelho** que 19:30 bate com 19:00–20:00 no Auditório A, antes de enviar. Tocar no horário livre **20:00–23:00** → "Horário livre" → anexar uma arte → **Enviar**. |
| 1:45–2:45 | Entrar como **admin@teste.com** → cai no **Painel** → Solicitações → abrir o pedido (ocupação da sala ao lado) → **Aprovar** | "Na aprovação o sistema checa o conflito de novo e trava o local." Abrir a Agenda: o evento apareceu com a arte; clicar mostra a página pública com "Adicionar ao calendário". |
| 2:45–3:15 | Abrir "Congresso de Mecânica" → Rejeitar → tentar sem motivo → com motivo | "O motivo é obrigatório e o solicitante vê; ele pode corrigir e reenviar." |
| 3:15–4:00 | **Persistência**: Cadastros → Temas → criar "Mesa redonda" → **F5** → continua → tentar excluir "Palestra" | "Está no PostgreSQL. E o próprio banco recusa excluir tema em uso (chave estrangeira)." |
| 4:00–4:40 | **Ocupação** (grade do dia por sala, bloqueio do Laboratório 5) → Relatório → filtrar → **Exportar CSV** | "Bloqueio impede pedidos na manutenção. Filtros combináveis; o CSV usa a mesma consulta." |
| 4:40–5:00 | Mostrar no celular (ou reduzir a janela) | "Pensado para qualquer pessoa: botões grandes, menu embaixo como em aplicativo, linguagem simples." |

---

## Arquitetura em uma frase

**React (tela) → API REST em Spring Boot (regras) → PostgreSQL (dados).**
O Vite serve o React em desenvolvimento e repassa `/api` para o Spring Boot na porta 8080.

## Perguntas prováveis da banca (e respostas)

**Por que essas tecnologias?**
Java + Spring Boot é padrão de mercado para APIs, com injeção de dependências e JPA prontos.
React separa a tela da regra e permite uma interface mais fluida. PostgreSQL é um banco relacional
robusto, com chaves estrangeiras e restrições que protegem os dados. O Vite deixa o front rápido em desenvolvimento.

**Onde está a estrutura do banco?**
`backend/src/main/resources/schema.sql`. Roda a cada inicialização com `CREATE TABLE IF NOT EXISTS`.
Dá para abrir no terminal: `psql postgresql://agendauni:agendauni@localhost:5432/agendauni` e `\dt`.

**Como funciona a regra de conflito?** (`EventoRepository.buscarConflitos`)
Busca evento **APROVADO**, mesmo **local**, mesma **data**, com
`horaInicio_existente < horaFim_nova` **E** `horaFim_existente > horaInicio_nova`.
- 19:00–20:00 vs 19:30–21:00 → 19:00 < 21:00 e 20:00 > 19:30 → **conflita**
- 19:00–20:00 vs 20:00–21:00 → 20:00 > 20:00 é falso → **não conflita**
Ignora o próprio evento (`e.id <> :ignorarId`) para o admin poder editar um aprovado.

**Por que checar de novo na aprovação?** (`EventoService.aprovar`)
Dois pedidos podem ser enviados para o mesmo horário enquanto nenhum está aprovado.
Aprovado o primeiro, o segundo passa a conflitar, então a aprovação revalida.

**Onde ficam as regras de negócio?**
Em `EventoService.java`: `validarRascunho`, `validarEnvio`, `aprovar`, `rejeitar`, `cancelar`, `excluirRascunho`.
Os controllers só recebem a requisição e chamam o serviço (camadas: controller → service → repository).

**Como funciona o login e as permissões?**
`AuthController` confere a senha com `BCryptPasswordEncoder.matches` e guarda `{id, nome, perfil}` na sessão
(cookie `HttpOnly`). O `ControleDeAcesso` roda antes de toda rota `/api`: sem login → 401; rota `/api/admin` sem
perfil ADMIN → 403. No `SolicitacaoController`, `doAutor()` garante que o solicitante só abre os próprios pedidos.

**A senha é guardada como?**
Hash BCrypt (com salt). Nunca a senha pura.

**Rascunho x envio?**
O mesmo formulário chama a API com `?acao=salvar` ou `?acao=enviar`. Salvar só exige o nome.
Enviar roda `validarEnvio` (obrigatórios, data, horário, recursos do local, conflito) e muda para AGUARDANDO.

**Como os recursos dependem do local?**
Tabela `local_recursos` (N:N). O React mostra só os recursos do local escolhido e desmarca ao trocar de local;
o backend valida de novo (`validarRecursosDoLocal`), porque a tela pode ser burlada.

**E o centro de custo automático?**
`cursos.centro_custo_id`. A tela mostra o centro ao escolher o curso; o relatório pega via relacionamento.

**Excluir cadastro em uso?**
O PostgreSQL recusa por chave estrangeira; o `TratadorDeErros` transforma em mensagem amigável (HTTP 409).

**Como o relatório e o CSV batem?**
`RelatorioController.consultar` monta o JPQL só com os filtros preenchidos; a tela e o CSV chamam a mesma função.
CSV com `;` e BOM UTF-8 para abrir certo no Excel em português.

**SQL injection?**
Consultas com parâmetros nomeados (`:localId`) via JPA. Nenhum valor digitado é concatenado no SQL.

**Usabilidade para leigos?**
Menu inferior no celular, botões grandes, formulário em 4 passos com contador do que falta, campos em vermelho,
frase explicando cada status, confirmação antes de ações sem volta.

**O que mudou depois da auditoria de UX?**
Aviso de conflito antes do envio (`GET /api/disponibilidade` + componente `Disponibilidade.jsx`), validação na hora,
painel e grade de ocupação para o admin, bloqueio de sala, capacidade, histórico (`evento_historico`), troca de senha,
arte do evento (`evento_imagens`, BYTEA no PostgreSQL), página pública com .ics e acessibilidade (`Campo.jsx`).

**Por que não tem recuperação de senha por e-mail?**
O caderno diz que não é obrigatória e ela exige um servidor de e-mail. Em troca, cada usuário troca a própria senha
e o admin pode redefinir; a regra de senha ficou mais forte (8+ com letras e números).

**Como evitam que dois admins aprovem horários conflitantes ao mesmo tempo?**
`LocalRepository.travar` faz `SELECT ... FOR UPDATE` na linha do local dentro da transação de aprovação.
O segundo admin espera o primeiro terminar e então vê o conflito.

**Onde fica a imagem?**
Na tabela `evento_imagens` (BYTEA), separada de `eventos` para não carregar bytes à toa. `ImagemService` aceita só
JPG/PNG/WEBP até 5 MB. Antes da aprovação só o autor e o admin conseguem ver a imagem.

**Usaram IA?**
Sim, declarado no README (o regulamento permite com transparência). Seja honesto aqui.

---

## Mapa rápido "onde está cada coisa"

| Requisito | Arquivo |
|---|---|
| Tabelas | `backend/src/main/resources/schema.sql` |
| Conflito de agenda | `backend/.../repository/EventoRepository.java` |
| Validações, aprovar, rejeitar | `backend/.../service/EventoService.java` |
| Login e permissões | `controller/AuthController.java`, `config/ControleDeAcesso.java` |
| Agenda pública | `controller/PublicoController.java` + `frontend/src/pages/Agenda.jsx` |
| Pedido (rascunho/envio) | `controller/SolicitacaoController.java` + `pages/FormularioEvento.jsx` |
| Análise do admin | `controller/AdminSolicitacaoController.java` + `pages/DetalheEvento.jsx` |
| Cadastros | `controller/CadastroController.java` + `pages/admin/Cadastros.jsx` |
| Usuários | `controller/UsuarioController.java` + `pages/admin/Usuarios.jsx` |
| Relatório e CSV | `controller/RelatorioController.java` + `pages/admin/Relatorio.jsx` |
| Dados fictícios | `service/DadosIniciais.java` |
| Visual e celular | `frontend/src/styles.css`, `components/Cabecalho.jsx` |
| Disponibilidade antes do envio | `controller/OcupacaoController.java` + `components/Disponibilidade.jsx` |
| Painel e grade de ocupação | `OcupacaoController.java` + `pages/admin/Painel.jsx`, `pages/admin/Ocupacao.jsx` |
| Arte do evento | `service/ImagemService.java` + etapa "Arte do evento" em `FormularioEvento.jsx` |
| Página pública do evento | `PublicoController.java` + `pages/EventoPublico.jsx` |
| Histórico | `EventoService.registrar` + tabela `evento_historico` |
