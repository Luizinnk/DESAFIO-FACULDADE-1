// Conexão com o banco SQLite e criação das tabelas.
// Usamos o módulo nativo do Node (node:sqlite), então não precisa instalar servidor de banco:
// o banco fica no arquivo data/agenda.db e os dados persistem entre reinicializações.
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const pastaDados = path.join(__dirname, '..', 'data');
fs.mkdirSync(pastaDados, { recursive: true });

const db = new DatabaseSync(process.env.DB_PATH || path.join(pastaDados, 'agenda.db'));

// Liga a verificação de chave estrangeira: o próprio banco impede excluir
// um cadastro que ainda está sendo usado (ex.: tema usado por um evento).
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,          -- e-mail é o login, não pode repetir
  senha_hash  TEXT NOT NULL,                 -- nunca guardamos a senha pura
  perfil      TEXT NOT NULL CHECK (perfil IN ('ADMIN', 'SOLICITANTE')),
  ativo       INTEGER NOT NULL DEFAULT 1     -- desativar em vez de apagar
);

CREATE TABLE IF NOT EXISTS centros_custo (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  nome   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cursos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT NOT NULL UNIQUE,
  centro_custo_id INTEGER NOT NULL REFERENCES centros_custo(id)
);

CREATE TABLE IF NOT EXISTS temas (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS locais (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS recursos (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE
);

-- Quais recursos cada local oferece (relação N para N)
CREATE TABLE IF NOT EXISTS local_recursos (
  local_id   INTEGER NOT NULL REFERENCES locais(id),
  recurso_id INTEGER NOT NULL REFERENCES recursos(id),
  PRIMARY KEY (local_id, recurso_id)
);

CREATE TABLE IF NOT EXISTS eventos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  autor_id        INTEGER NOT NULL REFERENCES usuarios(id), -- quem está logado
  solicitante     TEXT,                                     -- nome livre digitado no form
  nome            TEXT NOT NULL,
  tema_id         INTEGER REFERENCES temas(id),
  data            TEXT,          -- 'AAAA-MM-DD'
  hora_inicio     TEXT,          -- 'HH:MM'
  hora_fim        TEXT,
  local_id        INTEGER REFERENCES locais(id),
  curso_id        INTEGER REFERENCES cursos(id),
  palestrante     TEXT,
  publico_alvo    TEXT,
  justificativa   TEXT,
  objetivo        TEXT,
  cerimonial      INTEGER,       -- 1 = sim, 0 = não, NULL = não respondido (rascunho)
  inscricoes      INTEGER,
  declaracoes     INTEGER,
  observacoes     TEXT,
  status          TEXT NOT NULL DEFAULT 'RASCUNHO'
                  CHECK (status IN ('RASCUNHO','AGUARDANDO','APROVADO','REJEITADO','CANCELADO')),
  motivo_rejeicao TEXT,
  criado_em       TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  atualizado_em   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Recursos marcados em cada evento
CREATE TABLE IF NOT EXISTS evento_recursos (
  evento_id  INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  recurso_id INTEGER NOT NULL REFERENCES recursos(id),
  PRIMARY KEY (evento_id, recurso_id)
);
`);

module.exports = db;
