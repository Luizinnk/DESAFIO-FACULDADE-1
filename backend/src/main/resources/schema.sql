-- Estrutura do banco AgendaUNI (PostgreSQL).
-- Executado a cada inicialização; IF NOT EXISTS evita recriar o que já existe.

CREATE TABLE IF NOT EXISTS usuarios (
  id          BIGSERIAL PRIMARY KEY,
  nome        VARCHAR(120) NOT NULL,
  email       VARCHAR(160) NOT NULL UNIQUE,      -- e-mail é o login
  senha_hash  VARCHAR(100) NOT NULL,             -- senha nunca é salva pura (BCrypt)
  perfil      VARCHAR(20)  NOT NULL CHECK (perfil IN ('ADMIN', 'SOLICITANTE')),
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE -- desativar em vez de apagar
);

CREATE TABLE IF NOT EXISTS centros_custo (
  id     BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(30)  NOT NULL UNIQUE,
  nome   VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS cursos (
  id              BIGSERIAL PRIMARY KEY,
  nome            VARCHAR(120) NOT NULL UNIQUE,
  centro_custo_id BIGINT NOT NULL REFERENCES centros_custo(id)
);

CREATE TABLE IF NOT EXISTS temas (
  id   BIGSERIAL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS locais (
  id   BIGSERIAL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS recursos (
  id   BIGSERIAL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE
);

-- Recursos que cada local oferece (N para N)
CREATE TABLE IF NOT EXISTS local_recursos (
  local_id   BIGINT NOT NULL REFERENCES locais(id),
  recurso_id BIGINT NOT NULL REFERENCES recursos(id),
  PRIMARY KEY (local_id, recurso_id)
);

CREATE TABLE IF NOT EXISTS eventos (
  id              BIGSERIAL PRIMARY KEY,
  autor_id        BIGINT NOT NULL REFERENCES usuarios(id), -- usuário logado que registrou
  solicitante     VARCHAR(120),                            -- nome livre digitado no formulário
  nome            VARCHAR(150) NOT NULL,
  tema_id         BIGINT REFERENCES temas(id),
  data            DATE,
  hora_inicio     TIME,
  hora_fim        TIME,
  local_id        BIGINT REFERENCES locais(id),
  curso_id        BIGINT REFERENCES cursos(id),
  palestrante     VARCHAR(120),
  publico_alvo    VARCHAR(200),
  justificativa   TEXT,
  objetivo        TEXT,
  cerimonial      BOOLEAN,   -- NULL = ainda não respondido (rascunho)
  inscricoes      BOOLEAN,
  declaracoes     BOOLEAN,
  observacoes     TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO'
                  CHECK (status IN ('RASCUNHO','AGUARDANDO','APROVADO','REJEITADO','CANCELADO')),
  motivo_rejeicao TEXT,
  criado_em       TIMESTAMP NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMP NOT NULL DEFAULT now()
);

-- Recursos marcados em cada evento
CREATE TABLE IF NOT EXISTS evento_recursos (
  evento_id  BIGINT NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  recurso_id BIGINT NOT NULL REFERENCES recursos(id),
  PRIMARY KEY (evento_id, recurso_id)
);

-- Índice que acelera a busca de conflito de agenda (local + data)
CREATE INDEX IF NOT EXISTS idx_eventos_local_data ON eventos (local_id, data);

-- ===== Melhorias da auditoria de UX =====

-- Capacidade do local e público estimado do evento (o envio confere se cabe)
ALTER TABLE locais  ADD COLUMN IF NOT EXISTS capacidade INTEGER;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS publico_estimado INTEGER;

-- Histórico de cada solicitação: quem fez o quê e quando (linha do tempo no detalhe)
CREATE TABLE IF NOT EXISTS evento_historico (
  id           BIGSERIAL PRIMARY KEY,
  evento_id    BIGINT NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  acao         VARCHAR(30)  NOT NULL,   -- CRIADO, ENVIADO, APROVADO, REJEITADO, EDITADO, CANCELADO...
  detalhe      TEXT,
  usuario_nome VARCHAR(120) NOT NULL,
  data_hora    TIMESTAMP    NOT NULL DEFAULT now()
);

-- Imagem (arte/cartaz) opcional do evento, guardada no próprio banco
CREATE TABLE IF NOT EXISTS evento_imagens (
  evento_id     BIGINT PRIMARY KEY REFERENCES eventos(id) ON DELETE CASCADE,
  tipo          VARCHAR(50) NOT NULL,   -- image/png, image/jpeg, image/webp
  dados         BYTEA       NOT NULL,
  atualizado_em TIMESTAMP   NOT NULL DEFAULT now()
);

-- Bloqueio de local por período (manutenção, provas): impede pedidos nesses dias
CREATE TABLE IF NOT EXISTS bloqueios (
  id          BIGSERIAL PRIMARY KEY,
  local_id    BIGINT NOT NULL REFERENCES locais(id),
  data_inicio DATE   NOT NULL,
  data_fim    DATE   NOT NULL,
  motivo      VARCHAR(200) NOT NULL,
  CHECK (data_fim >= data_inicio)
);
