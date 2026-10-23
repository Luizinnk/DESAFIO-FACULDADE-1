# Componentes de cada tela

> Formato para a folha: **número e nome da tela → objetivo → componentes, de cima para baixo**.
> Itens de **cabeçalho** e **rodapé** se repetem em todas as telas e estão descritos uma vez só no final.

---

## Tela 1 — Agenda de eventos (pública)

**Quem acessa:** qualquer visitante, sem login.
**Objetivo:** divulgar os eventos aprovados.

1. **Título:** "Agenda de eventos".
2. **Subtítulo com o período:** "Eventos aprovados de 01/10 até 31/12" (mês atual + 2 meses, calculado automaticamente).
3. **Separador de mês:** "OUTUBRO DE 2026", "NOVEMBRO DE 2026"… agrupa os eventos.
4. **Cartão de evento** (um para cada evento aprovado, em ordem de data e horário):
   - Dia em destaque (ex.: **25**) e dia da semana (ex.: DOM);
   - Nome do evento;
   - Linha de informações: tema · local · palestrante · curso que realiza;
   - Horário de início e término (ex.: 19:00 – 20:00).
5. **Mensagem vazia:** "Nenhum evento aprovado neste período" (quando não há eventos).

---

## Tela 2 — Login

**Quem acessa:** solicitante e administrador.
**Objetivo:** entrar na área restrita.

1. **Título:** "Entrar".
2. **Campo E-mail** (é o login).
3. **Campo Senha** (escondida).
4. **Botão "Entrar".**
5. **Mensagem de erro:** "E-mail ou senha inválidos" ou "Usuário desativado".
6. **Observação:** "Contas são criadas pelo setor de Eventos" (não existe autocadastro).

**Depois do login:** o solicitante vai para *Minhas solicitações*; o administrador vai para *Solicitações*.

---

## Tela 3 — Minhas solicitações

**Quem acessa:** solicitante.
**Objetivo:** acompanhar os próprios pedidos.

1. **Título:** "Minhas solicitações".
2. **Botão "Nova solicitação"** → abre a Tela 4.
3. **Lista de solicitações**, com três colunas:
   - **Evento:** nome (clicável) e local embaixo;
   - **Quando:** data e horário;
   - **Status:** ponto colorido + texto (Rascunho, Aguardando aprovação, Aprovado, Rejeitado, Cancelado).
4. **Mensagem de aviso** no topo após uma ação (ex.: "Solicitação enviada para aprovação!").

---

## Tela 4 — Formulário de solicitação

**Quem acessa:** solicitante (o admin usa a mesma tela para editar um evento aprovado).
**Objetivo:** cadastrar ou corrigir um pedido de evento.

1. **Título:** "Nova solicitação de evento" ou "Editar solicitação #N".
2. **Caixa de erros** (aparece se a validação falhar, ex.: conflito de agenda).
3. **Caixa do motivo da rejeição** (só quando o pedido foi rejeitado).
4. **Seção EVENTO:** nome do evento, tema (lista), palestrante, público-alvo.
5. **Seção DATA E LOCAL:** data, horário de início, horário de término, local (lista),
   recursos para marcar (**mudam conforme o local escolhido**).
6. **Seção RESPONSÁVEIS:** solicitante (nome livre), curso/coordenação (lista),
   centro de custo (**preenchido automaticamente pelo curso**, só leitura).
7. **Seção DETALHES:** justificativa, objetivo, três perguntas Sim/Não
   (cerimonial, haverá inscrições, declarações) e observações (opcional).
8. **Barra de ações:**
   - Link "Voltar";
   - Botão **"Salvar rascunho"** (aceita incompleto);
   - Botão **"Enviar"** (valida tudo e verifica conflito).

---

## Tela 5 — Detalhe da solicitação

**Quem acessa:** o autor do pedido e o administrador.
**Objetivo:** ver o pedido completo e agir sobre ele.

1. **Título:** nome do evento + **status** ao lado.
2. **Linha de resumo:** data · horário · local · tema.
3. **Aviso de conflito** (só para o admin, se já existir evento aprovado no mesmo local e horário).
4. **Aviso do motivo da rejeição** (se rejeitado).
5. **Bloco RESPONSÁVEIS:** solicitante, palestrante, curso, centro de custo.
6. **Bloco DETALHES:** público-alvo, justificativa, objetivo, cerimonial, inscrições,
   declarações, recursos, observações.
7. **Rodapé do cartão:** "Registrado por [usuário] · última alteração em [data]".
8. **Botões, conforme perfil e status:**

| Status | Solicitante vê | Administrador vê |
|---|---|---|
| Rascunho | Editar, Excluir | (não vê rascunhos) |
| Aguardando | Editar, Cancelar solicitação | Campo de motivo + Rejeitar, Aprovar |
| Rejeitado | Corrigir e reenviar | — |
| Aprovado | — | Editar, Cancelar evento |
| Cancelado | — | — |

---

## Tela 6 — Solicitações (painel do administrador)

**Quem acessa:** administrador.
**Objetivo:** encontrar os pedidos para analisar.

1. **Título:** "Solicitações".
2. **Abas de status:** Aguardando aprovação (padrão) · Aprovado · Rejeitado · Cancelado.
3. **Lista** com: evento (clicável) + local, data + horário, solicitante.
4. **Mensagem vazia** quando não há pedidos naquele status.

---

## Tela 7 — Cadastros

**Quem acessa:** administrador.
**Objetivo:** manter as listas usadas no formulário.

1. **Título:** "Cadastros".
2. **Abas:** Temas · Recursos · Centros de custo · Cursos/coordenações · Locais.
3. **Formulário à esquerda** ("Novo cadastro" ou "Editar"):
   - Nome (todos);
   - Código (centros de custo);
   - Centro de custo (lista, nos cursos);
   - Recursos disponíveis para marcar (nos locais);
   - Botão "Cadastrar" / "Salvar".
4. **Lista à direita** com os itens e os links **Editar** e **Excluir**.
5. **Mensagem de erro** se tentar excluir algo em uso ou cadastrar nome repetido.

---

## Tela 8 — Usuários

**Quem acessa:** administrador.
**Objetivo:** controlar quem acessa o sistema.

1. **Título:** "Usuários".
2. **Formulário à esquerda:** nome completo, e-mail (login), senha
   (na edição: "deixe vazio para manter"), perfil (Solicitante / Administrador), botão salvar.
3. **Lista à direita:** nome + e-mail, perfil, situação (Ativo/Desativado),
   links **Editar** e **Desativar/Reativar**.

---

## Tela 9 — Relatório

**Quem acessa:** administrador.
**Objetivo:** consultar e exportar eventos.

1. **Título:** "Relatório de eventos".
2. **Filtros** (combináveis): data inicial, data final, curso, tema, status.
3. **Botões:** "Filtrar", "Exportar CSV" e link "Limpar".
4. **Contador:** "N evento(s) encontrado(s)".
5. **Tabela de resultado:** evento, data, início, fim, tema, curso, centro de custo,
   local, solicitante, status.

---

## Componentes comuns (todas as telas)

**Cabeçalho**
- Logo "AgendaUNI" (volta para a agenda);
- Menu, que muda conforme o perfil:
  - Visitante: Agenda;
  - Solicitante: Agenda · Minhas solicitações;
  - Administrador: Agenda · Solicitações · Cadastros · Usuários · Relatório;
- À direita: botão "Entrar" (visitante) ou nome do usuário + "Sair" (logado).

**Mensagem de aviso:** faixa no topo do conteúdo, verde (sucesso) ou vermelha (erro).

**Rodapé:** "Univille · Software Engineering Challenge 2026 · Dados fictícios".
