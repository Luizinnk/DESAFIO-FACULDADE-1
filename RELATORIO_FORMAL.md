# Relatório formal de apresentação — versão para escrever à mão

> **Como usar:** a Parte A é o texto formal para a folha A4 (cabe em uma página se escrito com
> letra média). A Parte B traz ideias extras para enriquecer a folha ou a fala na apresentação.
> Escreva com suas palavras; os trechos entre colchetes são para preencher.

---

## PARTE A — Texto da folha A4

**UNIVILLE — Software Engineering Challenge 2026**
**Sistema de Gestão de Eventos Institucionais**

**Equipe:** [nome da equipe]  **Representante:** [nome] — WhatsApp [número]
**Integrantes:** [nome 1], [nome 2], [nome 3], [nome 4]
**Data:** 22 de outubro de 2026

### 1. Apresentação da solução

A equipe propõe o desenvolvimento do **agendaUNI**, uma aplicação web destinada a consolidar,
em um único ambiente, o recebimento, a análise, a aprovação e a divulgação dos eventos
institucionais da Univille, substituindo o atual processo baseado em formulários dispersos.

O sistema contempla três perfis de acesso:

- **Visitante:** consulta pública, sem autenticação, da grade de eventos aprovados referentes
  ao mês corrente e aos dois meses subsequentes, em ordem cronológica.
- **Solicitante:** registra solicitações, podendo salvá-las como rascunho ou enviá-las para
  análise, e acompanha sua situação em "Minhas Solicitações".
- **Administrador:** mantém os cadastros auxiliares e os usuários, aprova ou rejeita as
  solicitações mediante justificativa e emite relatórios com exportação em CSV.

Cada solicitação percorre o seguinte ciclo de estados:
**Rascunho → Aguardando aprovação → Aprovado ou Rejeitado**, podendo ainda ser **Cancelada**.
Os eventos aprovados são publicados automaticamente na página inicial.

**Regra central:** o sistema impede a sobreposição de horários de eventos aprovados no mesmo
ambiente e na mesma data. A verificação é realizada no envio e novamente na aprovação.
Exemplo: com o Auditório A reservado das 19h às 20h, uma solicitação das 19h30 às 21h é
bloqueada, enquanto uma das 20h às 21h é aceita.

### 2. Esboço das telas principais

*(desenhar em caixas simples, uma abaixo da outra ou em duas colunas)*

1. **Página inicial:** tabela com Data, Evento, Tema, Horário, Local, Palestrante e Realização;
   botão "Entrar".
2. **Login:** campos de e-mail e senha.
3. **Minhas Solicitações:** lista com status identificado por cor e botão "Nova solicitação".
4. **Formulário de solicitação:** campos obrigatórios do caderno; recursos exibidos conforme o
   local escolhido; centro de custo preenchido pelo curso; botões "Salvar rascunho" e "Enviar".
5. **Análise (Administrador):** filtro por status, detalhamento e ações "Aprovar" e "Rejeitar".
6. **Cadastros (Administrador):** temas, locais e recursos, cursos e centros de custo, usuários.
7. **Relatório (Administrador):** filtros por período, curso e tema; botão "Exportar CSV".

### 3. Tecnologias adotadas

| Camada | Tecnologia |
|---|---|
| Backend (API) | Java com Spring Boot |
| Interface | React, JavaScript, HTML e CSS, executados com Vite |
| Banco de dados | PostgreSQL (persistência real) |
| Autenticação | Sessão por cookie e senhas com hash (BCrypt) |
| Versionamento | Git e GitHub (repositório público) |
| Apoio | Assistente de IA (Claude), declarado no README |

**Justificativa:** são tecnologias consolidadas no mercado, que separam com clareza a interface (React),
as regras de negócio (Spring Boot) e os dados (PostgreSQL), e que rodam inteiramente na máquina local,
sem depender de serviços externos durante a demonstração.

### 4. Distribuição de responsabilidades

| Integrante | Responsabilidade |
|---|---|
| [Nome 1] | Modelagem e implementação do banco de dados; regra de conflito de agenda |
| [Nome 2] | Área do solicitante: formulário, rascunho, envio e acompanhamento |
| [Nome 3] | Área administrativa: cadastros, aprovação/rejeição e relatórios |
| [Nome 4] | Página pública, interface visual, documentação (README) e roteiro da apresentação |

*O planejamento poderá ser ajustado ao longo do desenvolvimento.*

---

## PARTE B — Ideias extras para enriquecer

### B.1 Frases curtas de abertura para a apresentação oral

- "Hoje o setor de Eventos recebe pedidos por formulários soltos; nossa solução organiza todo
  o ciclo, da solicitação à divulgação, em um só lugar."
- "A regra mais crítica, o conflito de agenda, é validada duas vezes: no envio e na aprovação."
- "Priorizamos uma arquitetura simples e confiável, com banco real e regras centralizadas
  em um único arquivo do código."

### B.2 Diferenciais que já estão prontos no sistema (vale citar)

1. O administrador recebe um **alerta de conflito** ao abrir uma solicitação pendente, antes
   mesmo de tentar aprovar.
2. O **próprio banco de dados** impede excluir cadastros que estão em uso (chaves estrangeiras).
3. Os usuários são **desativados**, e não apagados, para preservar o histórico de autoria.
4. O CSV abre corretamente no Excel em português (separador ";" e acentuação preservada).
5. O servidor **revalida tudo**, inclusive os recursos do local, mesmo que alguém tente burlar
   o formulário pelo navegador.
6. As consultas ao banco usam parâmetros, o que **protege contra SQL injection**.

### B.3 Diagrama simples para desenhar na folha (opcional)

```
 [Solicitante] --cria--> (Rascunho) --envia--> (Aguardando) --aprova--> (Aprovado) --> [Grade pública]
                                                    |                        |
                                                 rejeita                  cancela
                                                    v                        v
                                              (Rejeitado)              (Cancelado)
                                                    |
                                          corrige e reenvia --> (Aguardando)
```

### B.4 Melhorias futuras (citar só se perguntarem; não fazem parte do MVP)

- Visualização da agenda em formato de calendário mensal.
- Envio de e-mail ao solicitante quando o pedido for aprovado ou rejeitado.
- Histórico de alterações (quem mudou o quê e quando) para fins de auditoria.
- Gráficos no relatório (eventos por curso, por tema, por mês).
- Hospedagem em nuvem para acesso fora da rede da universidade.

### B.5 Encerramento formal (fala final)

"Em síntese, o agendaUNI atende aos três perfis definidos no caderno, aplica as regras de
negócio exigidas e mantém os dados em um banco real. Agradecemos a atenção da banca e
estamos à disposição para perguntas."
