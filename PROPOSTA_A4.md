# Proposta para a folha A4 (copiar à mão)

> Dica: escreva com suas palavras, em tópicos curtos. Desenhe as telas como caixinhas simples.
> A folha não vale nota — o objetivo é mostrar que a equipe entendeu o problema.

---

## Cabeçalho
**Equipe:** ____________  **Representante:** ____________ (WhatsApp: ________)

## 1. Ideia geral da solução
Hoje o setor de Eventos recebe pedidos por formulários soltos. Vamos criar o **AgendaUNI**:
um sistema web onde:
- o **visitante** vê a grade pública de eventos aprovados (mês atual + 2 meses);
- o **solicitante** faz login, preenche o pedido, salva rascunho ou envia;
- o **administrador** cadastra temas/locais/recursos/cursos, aprova ou rejeita (com motivo)
  e tira relatórios com exportação CSV.

Regra principal: **o sistema bloqueia conflito de agenda** — mesmo local, mesmo dia e
horários que se sobrepõem. Checa no ENVIO e de novo na APROVAÇÃO.
(Ex.: Auditório A 19h–20h aprovado → 19h30–21h bloqueia; 20h–21h pode.)

Ciclo da solicitação:
`RASCUNHO → AGUARDANDO → APROVADO (aparece na grade) / REJEITADO (corrige e reenvia) / CANCELADO`

## 2. Esboço das telas (desenhar caixinhas)
1. **Página inicial** – tabela: Data | Evento | Tema | Início | Local | Palestrante | Curso + botão "Entrar".
2. **Login** – e-mail + senha.
3. **Minhas solicitações** – lista com status colorido + botão "Nova solicitação".
4. **Formulário do evento** – campos do caderno; ao escolher o local aparecem os recursos
   dele; ao escolher o curso aparece o centro de custo. Botões: [Salvar rascunho] [Enviar].
5. **Admin – Solicitações** – filtro por status, abrir detalhe, [Aprovar] / [Rejeitar + motivo].
6. **Admin – Cadastros** – Temas, Locais (+recursos), Recursos, Cursos/Centro de custo, Usuários.
7. **Admin – Relatório** – filtros data início/fim, curso, tema → tabela + [Exportar CSV].

## 3. Tecnologias
- **Java + Spring Boot** (API REST com as regras de negócio)
- **PostgreSQL** (banco de dados relacional real)
- **React + JavaScript + HTML + CSS** (telas), rodando localmente com **Vite**
- **BCrypt** (senha com hash) + sessão por cookie (login)
- GitHub para versionamento; IA (Claude) como assistente, declarada no README.

## 4. Divisão de responsabilidades (ajuste aos nomes da equipe)
- **Integrante A:** banco de dados (tabelas, seed) e regra de conflito.
- **Integrante B:** área do solicitante (formulário, rascunho, envio, minhas solicitações).
- **Integrante C:** área do admin (cadastros, aprovação, relatório/CSV).
- **Integrante D:** página pública, visual (CSS), README e roteiro da apresentação.
