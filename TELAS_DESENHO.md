# Esboço das telas — para copiar à mão na folha

> **Dica para desenhar:** use régua para as caixas. Caixa = campo ou área; `[ Botão ]` = botão;
> `( )` = opção sim/não; `[x]` = caixa de marcar; `▼` = lista de escolha.
> Na folha A4, desenhe 2 telas por linha (fica 3 linhas = 6 telas) ou escolha as 4 principais (★).

---

## ★ Tela 1 — Página inicial (pública, sem login)

```
+------------------------------------------------------------+
| AgendaUNI     Agenda                            [ Entrar ] |
+------------------------------------------------------------+
|                                                            |
|  Agenda de eventos                                         |
|  Eventos aprovados de 01/10 a 31/12                        |
|                                                            |
|  OUTUBRO DE 2026                                           |
|  +------------------------------------------------------+  |
|  |  25  | Palestra: IA na Engenharia     | 19:00-20:00  |  |
|  |  DOM | Palestra · Auditório A ·       |              |  |
|  |      | Dra. Marina · Eng. Software    |              |  |
|  +------------------------------------------------------+  |
|                                                            |
|  NOVEMBRO DE 2026                                          |
|  +------------------------------------------------------+  |
|  |  01  | Semana da Enfermagem           | 08:00-12:00  |  |
|  |  SEG | Semana Acad. · Miniauditório   |              |  |
|  +------------------------------------------------------+  |
|  +------------------------------------------------------+  |
|  |  11  | Workshop de Git                | 14:00-17:00  |  |
|  +------------------------------------------------------+  |
+------------------------------------------------------------+
  → Só eventos APROVADOS, mês atual + 2 meses, em ordem de data
```

---

## Tela 2 — Login

```
+----------------------------------+
| AgendaUNI   Agenda    [ Entrar ] |
+----------------------------------+
|                                  |
|        +--------------------+    |
|        | Entrar             |    |
|        |                    |    |
|        | E-mail             |    |
|        | [________________] |    |
|        | Senha              |    |
|        | [________________] |    |
|        |                    |    |
|        | [     Entrar     ] |    |
|        |                    |    |
|        | Contas criadas pelo|    |
|        | setor de Eventos   |    |
|        +--------------------+    |
+----------------------------------+
  → Sem autocadastro. Senha com hash.
```

---

## ★ Tela 3 — Minhas solicitações (solicitante)

```
+------------------------------------------------------------+
| AgendaUNI   Agenda   Minhas solicitações      Carlos  Sair |
+------------------------------------------------------------+
|  Minhas solicitações                [ Nova solicitação ]   |
|                                                            |
|  +------------------------------------------------------+  |
|  | EVENTO              | QUANDO        | STATUS         |  |
|  |---------------------+---------------+----------------|  |
|  | Palestra IA         | 25/10/2026    | ● Aprovado     |  |
|  |   Auditório A       | 19:00-20:00   |                |  |
|  |---------------------+---------------+----------------|  |
|  | Bate-papo egressos  | 25/10/2026    | ● Rascunho     |  |
|  |---------------------+---------------+----------------|  |
|  | Hackathon interno   | 06/11/2026    | ● Rejeitado    |  |
|  +------------------------------------------------------+  |
+------------------------------------------------------------+
  → Clicar no nome abre o detalhe (editar / excluir / cancelar)
```

---

## ★ Tela 4 — Formulário de solicitação

```
+------------------------------------------------------------+
| Nova solicitação de evento                                 |
+------------------------------------------------------------+
| EVENTO                                                     |
| Nome do evento *  [______________________________________] |
| Tema *  [ Palestra ▼]  Palestrante * [______]  Público * [_]|
|------------------------------------------------------------|
| DATA E LOCAL                                               |
| Data * [__/__/____]   Início * [__:__]   Término * [__:__] |
| Local * [ Auditório A ▼]                                   |
| Recursos: [x] Projetor [x] Microfone [ ] Som [ ] Coffee    |
|           (aparecem conforme o local escolhido)            |
|------------------------------------------------------------|
| RESPONSÁVEIS                                               |
| Solicitante * [________]  Curso * [ Eng. Software ▼]       |
| Centro de custo [ CC-202 Computação ]  ← automático        |
|------------------------------------------------------------|
| DETALHES                                                   |
| Justificativa * [_________]   Objetivo * [_________]       |
| Cerimonial *  ( ) Sim ( ) Não                              |
| Inscrições *  ( ) Sim ( ) Não                              |
| Declarações * ( ) Sim ( ) Não                              |
| Observações   [________________________________________]   |
|------------------------------------------------------------|
| Voltar          [ Salvar rascunho ]   [ Enviar ]           |
+------------------------------------------------------------+
  → Salvar = rascunho (pode ficar incompleto)
  → Enviar = valida tudo + verifica CONFLITO de agenda
```

---

## ★ Tela 5 — Análise da solicitação (administrador)

```
+------------------------------------------------------------+
| AgendaUNI  Agenda  Solicitações  Cadastros  Usuários  Rel. |
+------------------------------------------------------------+
|  Solicitações                                              |
|  [Aguardando]  Aprovado   Rejeitado   Cancelado            |
|  ‾‾‾‾‾‾‾‾‾‾‾‾                                              |
|  Congresso de Mecânica              ● Aguardando aprovação |
|  27/10/2026   19:00-22:00   Auditório A   Congresso        |
|                                                            |
|  +------------------------------------------------------+  |
|  | ! Conflita com "Palestra X" (19:00-20:00)            |  |
|  +------------------------------------------------------+  |
|  | RESPONSÁVEIS                                         |  |
|  | Solicitante   Palestrante   Curso   Centro de custo  |  |
|  | DETALHES                                             |  |
|  | Público · Justificativa · Objetivo · Sim/Não         |  |
|  +------------------------------------------------------+  |
|                                                            |
|  Voltar  [ Motivo da rejeição ______ ] [Rejeitar] [Aprovar]|
+------------------------------------------------------------+
  → Aprovar: checa conflito DE NOVO → publica na página inicial
  → Rejeitar: motivo obrigatório (o solicitante vê)
```

---

## Tela 6 — Cadastros (administrador)

```
+------------------------------------------------------------+
|  Cadastros                                                 |
|  Temas  Recursos  Centros de custo  Cursos  [Locais]       |
|                                           ‾‾‾‾‾‾‾‾         |
|  +----------------------+  +----------------------------+  |
|  | NOVO CADASTRO        |  | NOME        | RECURSOS     |  |
|  | Nome                 |  |-------------+--------------|  |
|  | [__________________] |  | Auditório A | Projetor,Som |  |
|  | Recursos do local:   |  |             | Editar Excluir| |
|  | [x] Projetor         |  |-------------+--------------|  |
|  | [ ] Som              |  | Sala 213    | Projetor     |  |
|  | [ Cadastrar ]        |  |             | Editar Excluir| |
|  +----------------------+  +----------------------------+  |
+------------------------------------------------------------+
  → Não exclui cadastro em uso por evento
```

---

## Tela 7 — Relatório (administrador)

```
+------------------------------------------------------------+
|  Relatório de eventos                                      |
|  +------------------------------------------------------+  |
|  | Data inicial [____]  Data final [____]               |  |
|  | Curso [ Todos ▼]  Tema [ Todos ▼]  Status [ Todos ▼] |  |
|  | [ Filtrar ]  [ Exportar CSV ]  Limpar                |  |
|  +------------------------------------------------------+  |
|  6 evento(s) encontrado(s)                                 |
|  +------------------------------------------------------+  |
|  |Evento|Data|Início|Fim|Tema|Curso|C.Custo|Local|Status|  |
|  |------+----+------+---+----+-----+-------+-----+------|  |
|  |  ... |    |      |   |    |     |       |     |      |  |
|  +------------------------------------------------------+  |
+------------------------------------------------------------+
  → CSV exporta exatamente o resultado filtrado
```

---

## Fluxo entre as telas (desenhar embaixo, se sobrar espaço)

```
   [Página inicial] --Entrar--> [Login]
                                  |
              +-------------------+-------------------+
              |                                       |
        (Solicitante)                          (Administrador)
              |                                       |
   [Minhas solicitações]               [Solicitações] [Cadastros]
              |                         [Usuários]    [Relatório]
     [Formulário] --Enviar-->  [Análise] --Aprovar--> [Página inicial]
              ^                     |
              +---- Rejeitar -------+
              (corrige e reenvia)
```
